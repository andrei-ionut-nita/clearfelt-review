import type { Assumption, Recommendation, Review } from '../model/index.ts';

/**
 * The output contract: the whole promise of the product as one deterministic
 * completeness test.
 *
 * This is not schema validation. `{"title": "Improve messaging", "finding_ids":
 * ["F-0001"]}` can be perfectly valid, fully traceable, and useless. Validation
 * proves a recommendation is well formed. The contract asks whether a reader
 * could actually act on it, and every question is answered against real fields
 * and real references rather than against prose length, because prose length is
 * exactly what an eloquent reasoning layer will produce when it has nothing to
 * say. See docs/decisions/0008-validation-is-not-evaluation.md.
 */

export type ContractQuestionKey =
  | 'what_is_wrong'
  | 'why_it_matters'
  | 'what_evidence'
  | 'what_uncertainty'
  | 'what_changes'
  | 'where_it_changes'
  | 'who_is_affected'
  | 'success_looks_like'
  | 'how_we_will_know'
  | 'what_would_disprove';

export interface ContractQuestion {
  key: ContractQuestionKey;
  question: string;
  /** Which part of the model has to answer it, for the failure message. */
  answered_by: string;
}

export const CONTRACT_QUESTIONS: readonly ContractQuestion[] = [
  { key: 'what_is_wrong', question: 'What is wrong?', answered_by: 'problem' },
  { key: 'why_it_matters', question: 'Why does it matter?', answered_by: 'why_it_matters' },
  {
    key: 'what_evidence',
    question: 'What evidence proves it?',
    answered_by: 'finding_ids resolving through evidence to observations and sources',
  },
  {
    key: 'what_uncertainty',
    question: 'What uncertainty remains?',
    answered_by: 'confidence, plus every assumption the supporting findings rest on',
  },
  { key: 'what_changes', question: 'What should change?', answered_by: 'recommended_change' },
  {
    key: 'where_it_changes',
    question: 'Where should it change?',
    answered_by: 'an action whose affected_assets resolve to real or proposed assets',
  },
  {
    key: 'who_is_affected',
    question: 'Who or what is affected?',
    answered_by: 'audience_relevance on at least one supporting finding',
  },
  {
    key: 'success_looks_like',
    question: 'What will success look like?',
    answered_by: 'expected_outcome and measurement.success_metric',
  },
  {
    key: 'how_we_will_know',
    question: 'How will we know?',
    answered_by: 'measurement.validation_method',
  },
  {
    key: 'what_would_disprove',
    question: 'What would prove it wrong?',
    answered_by: 'measurement.falsifier',
  },
] as const;

export interface ContractAnswer {
  key: ContractQuestionKey;
  question: string;
  answered: boolean;
  /** What was found, or what was missing. Always populated. */
  detail: string;
}

export interface RecommendationContract {
  recommendation_id: string;
  title: string;
  answers: ContractAnswer[];
  unanswered: ContractQuestionKey[];
  complete: boolean;
}

export interface ContractReport {
  recommendations: RecommendationContract[];
  /** Recommendations answering all ten, over the total. */
  complete_count: number;
  total: number;
  ok: boolean;
}

function has(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Assumptions a recommendation inherits from the findings underneath it.
 *
 * Uncertainty is supposed to travel. A finding that says "this rests on an
 * assumption we never validated" and a recommendation built on that finding
 * which says nothing is the failure mode where a report launders a caveat out
 * of existence between two adjacent sections.
 */
export function inheritedAssumptions(review: Review, rec: Recommendation): Assumption[] {
  const byId = new Map(review.assumptions.map((a) => [a.id, a]));
  const ids = new Set<string>();
  for (const findingId of rec.finding_ids ?? []) {
    const finding = review.findings.find((f) => f.id === findingId);
    for (const id of finding?.assumption_ids ?? []) ids.add(id);
  }
  return [...ids].map((id) => byId.get(id)).filter((a): a is Assumption => a !== undefined);
}

/** Assumptions the findings declare that the recommendation fails to carry. */
export function droppedAssumptions(review: Review, rec: Recommendation): Assumption[] {
  const carried = new Set(rec.assumption_ids ?? []);
  return inheritedAssumptions(review, rec).filter((a) => !carried.has(a.id));
}

function answerEvidence(review: Review, rec: Recommendation): ContractAnswer {
  const question = CONTRACT_QUESTIONS[2] as ContractQuestion;
  const findings = (rec.finding_ids ?? [])
    .map((id) => review.findings.find((f) => f.id === id))
    .filter((f) => f !== undefined);
  const evidenceIds = new Set(findings.flatMap((f) => f.evidence_ids ?? []));
  const evidence = [...evidenceIds]
    .map((id) => review.evidence.find((e) => e.id === id))
    .filter((e) => e !== undefined);
  const observationIds = new Set(evidence.flatMap((e) => e.observation_ids ?? []));
  const sourceIds = new Set(evidence.flatMap((e) => e.source_ids ?? []));
  // The chain has to reach a source. Stopping at evidence would let a claim
  // that nobody ever observed pass as proven.
  const answered =
    findings.length > 0 && evidence.length > 0 && observationIds.size > 0 && sourceIds.size > 0;
  return {
    key: question.key,
    question: question.question,
    answered,
    detail: answered
      ? `${findings.length} finding(s), ${evidence.length} evidence item(s), ${observationIds.size} observation(s), ${sourceIds.size} source(s)`
      : `the chain stops early: ${findings.length} finding(s), ${evidence.length} evidence item(s), ${observationIds.size} observation(s), ${sourceIds.size} source(s)`,
  };
}

function answerWhere(review: Review, rec: Recommendation): ContractAnswer {
  const question = CONTRACT_QUESTIONS[5] as ContractQuestion;
  const actions = review.actions.filter((a) => a.recommendation_id === rec.id);
  const assetIds = new Set(review.assets.map((a) => a.id));
  const landed = actions.flatMap((action) =>
    (action.affected_assets ?? []).filter(
      (target) =>
        (has(target.asset_id) && assetIds.has(target.asset_id)) || has(target.proposed?.path),
    ),
  );
  const answered = landed.length > 0;
  return {
    key: question.key,
    question: question.question,
    answered,
    detail: answered
      ? `${actions.length} action(s) landing on ${landed.length} asset target(s)`
      : actions.length === 0
        ? 'no action carries this recommendation, so it names no place to change'
        : 'the actions name no asset that exists and propose no new one',
  };
}

function answerUncertainty(review: Review, rec: Recommendation): ContractAnswer {
  const question = CONTRACT_QUESTIONS[3] as ContractQuestion;
  const dropped = droppedAssumptions(review, rec);
  const answered = has(rec.confidence) && dropped.length === 0;
  return {
    key: question.key,
    question: question.question,
    answered,
    detail: answered
      ? `confidence ${rec.confidence}, ${(rec.assumption_ids ?? []).length} assumption(s) declared`
      : dropped.length > 0
        ? `supporting findings rest on ${dropped.map((a) => a.id).join(', ')}, which this recommendation does not declare`
        : 'no confidence stated',
  };
}

function answerAudience(review: Review, rec: Recommendation): ContractAnswer {
  const question = CONTRACT_QUESTIONS[6] as ContractQuestion;
  const relevant = (rec.finding_ids ?? [])
    .map((id) => review.findings.find((f) => f.id === id))
    .filter((f) => has(f?.audience_relevance));
  const answered = relevant.length > 0;
  return {
    key: question.key,
    question: question.question,
    answered,
    detail: answered
      ? `${relevant.map((f) => f?.id).join(', ')} state who this bears on`
      : 'no supporting finding states which audience this bears on',
  };
}

/** A simple presence answer, for the questions a single field settles. */
function presence(index: number, present: boolean, found: string, missing: string): ContractAnswer {
  const question = CONTRACT_QUESTIONS[index] as ContractQuestion;
  return {
    key: question.key,
    question: question.question,
    answered: present,
    detail: present ? found : missing,
  };
}

export function checkRecommendation(review: Review, rec: Recommendation): RecommendationContract {
  const m = rec.measurement;
  const answers: ContractAnswer[] = [
    presence(0, has(rec.problem), 'stated', 'problem is empty'),
    presence(1, has(rec.why_it_matters), 'stated', 'why_it_matters is empty'),
    answerEvidence(review, rec),
    answerUncertainty(review, rec),
    presence(4, has(rec.recommended_change), 'stated', 'recommended_change is empty'),
    answerWhere(review, rec),
    answerAudience(review, rec),
    presence(
      7,
      has(rec.expected_outcome) && has(m?.success_metric),
      `metric: ${m?.success_metric ?? ''}`,
      'expected_outcome or measurement.success_metric is missing',
    ),
    presence(
      8,
      has(m?.validation_method),
      `method: ${m?.validation_method ?? ''}`,
      'measurement.validation_method is missing',
    ),
    presence(
      9,
      has(m?.falsifier),
      `falsifier: ${m?.falsifier ?? ''}`,
      'measurement.falsifier is missing',
    ),
  ];

  const unanswered = answers.filter((a) => !a.answered).map((a) => a.key);
  return {
    recommendation_id: rec.id,
    title: rec.title,
    answers,
    unanswered,
    complete: unanswered.length === 0,
  };
}

export function checkContract(review: Review): ContractReport {
  const recommendations = review.recommendations.map((rec) => checkRecommendation(review, rec));
  const complete = recommendations.filter((r) => r.complete).length;
  return {
    recommendations,
    complete_count: complete,
    total: recommendations.length,
    // A run with no recommendations has not failed the contract, it has not
    // reached it. The quality command says so rather than printing a green tick.
    ok: complete === recommendations.length,
  };
}
