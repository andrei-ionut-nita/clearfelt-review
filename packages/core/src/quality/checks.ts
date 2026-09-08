import type { Review } from '../model/index.ts';
import { droppedAssumptions } from './contract.ts';
import {
  NEGATION_MARKERS,
  genericPhrasesIn,
  novelTerms,
  similarity,
  statesAFailureCondition,
} from './text.ts';

/**
 * Mechanical quality checks: deterministic, no LLM.
 *
 * These catch the failures that have a mechanical signature. They do not catch
 * a well-written recommendation that is simply wrong, and pretending otherwise
 * would make this file the same unfalsifiable theatre it exists to detect. The
 * judgments that only a person can make are named in quality/rubric.md, and
 * every category below appears there so a machine finding and a human review
 * speak the same vocabulary.
 */

/**
 * Named failure categories. No score.
 *
 * Specification section 40 rejects "overall score: 73/100", and the same
 * reasoning applies to the review of the review: a number invites comparison
 * between runs that were never comparable. A named category tells you what to
 * go and fix.
 */
export type QualityCategory =
  | 'evidence_thin'
  | 'inference_unjustified'
  | 'temporal_confusion'
  | 'corroboration_illusory'
  | 'research_overclaimed'
  | 'recommendation_generic'
  | 'recommendation_circular'
  | 'recommendation_untestable'
  | 'recommendation_duplicated'
  | 'uncertainty_dropped'
  | 'outcome_unaddressed';

/**
 * 'defect' means the output is not fit to ship. 'caution' means the finding is
 * sometimes correct and sometimes the honest answer, so a human decides. A
 * single source really can be the only source that exists.
 */
export type QualitySeverity = 'defect' | 'caution';

export interface QualityFinding {
  code: string;
  category: QualityCategory;
  severity: QualitySeverity;
  collection: string;
  id: string;
  message: string;
  /** What to do about it. A check with no remedy is a complaint. */
  remedy: string;
}

/**
 * Similarity at or above which two pieces of text are treated as saying the
 * same thing. Tuned to catch copies and heavy paraphrase while leaving room for
 * a recommendation that legitimately uses its finding's vocabulary, which most
 * good ones do.
 */
export const SAME_TEXT = 0.7;

/** Novel-term count at which a 'derived' finding stops looking derived. */
export const NOVEL_TERM_LIMIT = 5;

/**
 * How many terms a falsifier must add beyond its own hypothesis before it
 * counts as naming a testable condition rather than negating a prediction.
 */
export const NEW_CONDITION_TERMS = 2;

function add(
  out: QualityFinding[],
  finding: Omit<QualityFinding, 'severity'> & { severity?: QualitySeverity },
): void {
  out.push({ severity: 'defect', ...finding });
}

/**
 * A recommendation whose change merely restates the finding beneath it.
 *
 * "Finding: the homepage does not name the audience. Recommendation: name the
 * audience on the homepage." Every reference resolves, the contract passes, and
 * no analysis has taken place: the recommendation is the finding with an
 * imperative verb. This is the single most common way an evidence pipeline
 * produces output that adds nothing.
 */
function checkRestatement(review: Review, out: QualityFinding[]): void {
  for (const rec of review.recommendations) {
    for (const findingId of rec.finding_ids ?? []) {
      const finding = review.findings.find((f) => f.id === findingId);
      if (!finding) continue;
      const score = similarity(rec.recommended_change ?? '', finding.statement ?? '');
      if (score >= SAME_TEXT) {
        add(out, {
          code: 'recommendation.restates_finding',
          category: 'recommendation_circular',
          collection: 'recommendations',
          id: rec.id,
          message: `recommended_change restates ${finding.id} rather than proposing an intervention`,
          remedy: 'State what specifically changes, where, and why that addresses the finding.',
        });
        break;
      }
    }
  }
}

/**
 * A falsifier that cannot fail.
 *
 * Two shapes. One restates the hypothesis or the expected outcome, so observing
 * it confirms rather than refutes. The other describes a success, "enquiries
 * increase", which no result can contradict because it was never a prediction
 * of failure. Both leave a recommendation that looks testable and is not.
 */
function checkFalsifiers(review: Review, out: QualityFinding[]): void {
  for (const rec of review.recommendations) {
    const falsifier = rec.measurement?.falsifier ?? '';
    if (falsifier.trim() === '') continue;

    const reference = [rec.measurement?.hypothesis ?? '', rec.expected_outcome ?? ''].filter(
      (text) => text.trim() !== '',
    );
    if (reference.length === 0) continue;

    // A falsifier has to name something observable that the hypothesis did not
    // already contain. "Framing does not raise enquiries" as the falsifier for
    // "framing raises enquiries" adds no window, no threshold and no measurable
    // condition: it is the hypothesis with a negation in front, and it is
    // refuted by exactly the evidence that would confirm the hypothesis.
    // Negation words are discounted so that the negation itself does not count
    // as the new condition.
    const novel = novelTerms(falsifier, reference).filter((term) => !NEGATION_MARKERS.has(term));
    if (novel.length < NEW_CONDITION_TERMS) {
      add(out, {
        code: 'recommendation.circular_falsifier',
        category: 'recommendation_untestable',
        collection: 'recommendations',
        id: rec.id,
        message:
          'measurement.falsifier adds no observable condition the hypothesis did not already contain',
        remedy: 'Name the measurement, the threshold and the window that would count as failure.',
      });
      continue;
    }

    if (!statesAFailureCondition(falsifier)) {
      add(out, {
        code: 'recommendation.falsifier_states_success',
        category: 'recommendation_untestable',
        severity: 'caution',
        collection: 'recommendations',
        id: rec.id,
        message: 'measurement.falsifier describes an outcome rather than a failure condition',
        remedy:
          'Say what result would count as the change having failed, not what success looks like.',
      });
    }
  }
}

/** Specification section 78, the consultant-theatre phrase list. */
function checkGenericLanguage(review: Review, out: QualityFinding[]): void {
  for (const rec of review.recommendations) {
    const phrases = genericPhrasesIn(rec.recommended_change ?? '');
    if (phrases.length === 0) continue;
    add(out, {
      code: 'recommendation.generic_language',
      category: 'recommendation_generic',
      collection: 'recommendations',
      id: rec.id,
      message: `recommended_change relies on generic advice: ${phrases.join('; ')}`,
      remedy: 'Replace the phrase with the specific change, the place it lands and the reason.',
    });
  }
}

/**
 * Two recommendations that are one recommendation.
 *
 * Duplication inflates a plan: a reader counts six things to do and there are
 * four. Identical supporting findings is the stronger signal, because two
 * genuinely different interventions rarely rest on exactly the same analysis.
 */
function checkDuplication(review: Review, out: QualityFinding[]): void {
  const recs = review.recommendations;
  for (let i = 0; i < recs.length; i += 1) {
    for (let j = i + 1; j < recs.length; j += 1) {
      const a = recs[i];
      const b = recs[j];
      if (!a || !b) continue;
      const aFindings = [...(a.finding_ids ?? [])].sort().join(',');
      const bFindings = [...(b.finding_ids ?? [])].sort().join(',');
      const sameFindings = aFindings !== '' && aFindings === bFindings;
      const sameChange =
        similarity(a.recommended_change ?? '', b.recommended_change ?? '') >= SAME_TEXT;
      if (!sameFindings && !sameChange) continue;
      add(out, {
        code: 'recommendation.near_duplicate',
        category: 'recommendation_duplicated',
        severity: sameChange ? 'defect' : 'caution',
        collection: 'recommendations',
        id: b.id,
        message: sameChange
          ? `recommended_change is a near duplicate of ${a.id}`
          : `rests on exactly the same findings as ${a.id}`,
        remedy: 'Merge them, or state what makes them different interventions.',
      });
    }
  }
}

/**
 * Uncertainty that stopped travelling.
 *
 * A finding declaring an unvalidated assumption, and a recommendation built on
 * it declaring nothing, is how a caveat gets laundered out of existence between
 * two adjacent sections of the same report.
 */
function checkUncertainty(review: Review, out: QualityFinding[]): void {
  const byId = new Map(review.assumptions.map((a) => [a.id, a]));
  for (const rec of review.recommendations) {
    const dropped = droppedAssumptions(review, rec);
    if (dropped.length > 0) {
      add(out, {
        code: 'recommendation.drops_assumption',
        category: 'uncertainty_dropped',
        collection: 'recommendations',
        id: rec.id,
        message: `supporting findings rest on ${dropped.map((a) => a.id).join(', ')}, which this recommendation does not declare`,
        remedy: 'Add the assumption ids, or explain why they no longer bear on the recommendation.',
      });
    }
    const unvalidated = (rec.assumption_ids ?? [])
      .map((id) => byId.get(id))
      .filter((a) => a?.status === 'unvalidated');
    if (unvalidated.length > 0) {
      add(out, {
        code: 'recommendation.rests_on_unvalidated_assumption',
        category: 'uncertainty_dropped',
        severity: 'caution',
        collection: 'recommendations',
        id: rec.id,
        message: `depends on unvalidated ${unvalidated.map((a) => a?.id).join(', ')}`,
        remedy: 'Validate the assumption, or state the risk on the recommendation itself.',
      });
    }
  }
}

/**
 * Corroboration that is not corroboration.
 *
 * Counted through Source.independence rather than by counting sources, because
 * three outlets reprinting one press release read as three sources and are one.
 */
function checkCorroboration(review: Review, out: QualityFinding[]): void {
  const sources = new Map(review.sources.map((s) => [s.id, s]));
  for (const finding of review.findings) {
    const sourceIds = new Set<string>();
    for (const evidenceId of finding.evidence_ids ?? []) {
      const evidence = review.evidence.find((e) => e.id === evidenceId);
      for (const id of evidence?.source_ids ?? []) sourceIds.add(id);
    }
    if (sourceIds.size === 0) continue;
    const independent = [...sourceIds].filter(
      (id) => sources.get(id)?.independence?.type === 'independent',
    );
    if (independent.length > 0) continue;
    add(out, {
      code: 'finding.no_independent_corroboration',
      category: 'corroboration_illusory',
      severity: 'caution',
      collection: 'findings',
      id: finding.id,
      message: `rests on ${sourceIds.size} source(s), none of them independent`,
      remedy: 'Find an independent source, or state on the finding that none exists.',
    });
  }
}

/**
 * A 'derived' finding that is not derived.
 *
 * claim_type makes the leap from evidence to conclusion declarable; this is the
 * mechanical half of checking the declaration is true. If the statement
 * introduces concepts that appear nowhere in the evidence it cites, the finding
 * went somewhere the evidence did not, and it should say 'inferred'.
 *
 * Approximate by construction: a finding can introduce no new vocabulary and
 * still make an unjustified leap. This catches the blatant cases only.
 */
function checkDerivedFindings(review: Review, out: QualityFinding[]): void {
  for (const finding of review.findings) {
    if (finding.claim_type !== 'derived') continue;
    const corpus: string[] = [];
    for (const evidenceId of finding.evidence_ids ?? []) {
      const evidence = review.evidence.find((e) => e.id === evidenceId);
      if (!evidence) continue;
      corpus.push(evidence.claim ?? '');
      for (const observationId of evidence.observation_ids ?? []) {
        const observation = review.observations.find((o) => o.id === observationId);
        if (observation) corpus.push(observation.statement ?? '');
      }
    }
    if (corpus.length === 0) continue;
    const novel = novelTerms(finding.statement ?? '', corpus);
    if (novel.length < NOVEL_TERM_LIMIT) continue;
    add(out, {
      code: 'finding.derived_introduces_concepts',
      category: 'inference_unjustified',
      severity: 'caution',
      collection: 'findings',
      id: finding.id,
      message: `claims to be derived but introduces terms absent from its evidence: ${novel.join(', ')}`,
      remedy: "Reword to what the evidence shows, or change claim_type to 'inferred'.",
    });
  }
}

/**
 * A claim about now, resting entirely on evidence about then.
 *
 * Without temporal_scope this is invisible: 2023 market data and today's
 * homepage read as contemporaneous, and a stale finding looks exactly like a
 * current one.
 */
function checkTemporal(review: Review, out: QualityFinding[]): void {
  for (const finding of review.findings) {
    if (finding.temporal_scope !== 'current') continue;
    const evidence = (finding.evidence_ids ?? [])
      .map((id) => review.evidence.find((e) => e.id === id))
      .filter((e) => e !== undefined);
    if (evidence.length === 0) continue;
    if (!evidence.every((e) => e.temporal_scope === 'historical')) continue;
    add(out, {
      code: 'finding.current_from_historical_evidence',
      category: 'temporal_confusion',
      collection: 'findings',
      id: finding.id,
      message: 'stated as current, but every supporting evidence item is historical',
      remedy: "Re-check the claim against current evidence, or set temporal_scope to 'historical'.",
    });
  }
}

/**
 * Research that claimed more than it found, and research that stopped without
 * saying why.
 *
 * That a closed question states a stop reason at all is validate's job, not
 * this file's: it is a well-formedness rule and nothing renders without it.
 * What is left here is the judgment validation cannot make. A question closed
 * as sufficient on less evidence than the budget demanded, and a question
 * closed for want of evidence that nonetheless produced a finding, are both
 * coherent runs that overclaim what the research established.
 */
function checkResearchDiscipline(review: Review, out: QualityFinding[]): void {
  const floor = review.scope?.budget?.min_evidence_per_question ?? 0;
  for (const question of review.research_questions) {
    if (question.stop_reason === 'sufficient') {
      const count = (question.evidence_ids ?? []).length;
      if (count < floor) {
        add(out, {
          code: 'question.sufficient_below_evidence_floor',
          category: 'evidence_thin',
          collection: 'research_questions',
          id: question.id,
          message: `closed as sufficient on ${count} evidence item(s), below the budget floor of ${floor}`,
          remedy: 'Gather more evidence, or close with a stop_reason that matches what happened.',
        });
      }
    }

    const inadequate =
      question.state === 'INSUFFICIENT_EVIDENCE' ||
      question.stop_reason === 'no_evidence_available';
    if (!inadequate) continue;
    const evidenceIds = new Set(question.evidence_ids ?? []);
    const built = review.findings.filter((finding) =>
      (finding.evidence_ids ?? []).some((id) => evidenceIds.has(id)),
    );
    if (built.length === 0) continue;
    add(out, {
      code: 'question.insufficient_but_produced_findings',
      category: 'research_overclaimed',
      collection: 'research_questions',
      id: question.id,
      message: `closed for want of evidence, yet ${built.map((f) => f.id).join(', ')} rest on it`,
      remedy: 'Either the question was answerable after all, or the findings are overclaimed.',
    });
  }
}

/**
 * A failed hypothesis with no recorded follow-up decision.
 *
 * Deliberately a caution, never a defect, and never anything that mutates or
 * supersedes the assessed recommendation itself: ADR 0011 Phase 7 rejected
 * making 'acknowledge' feedback mandatory for exactly this reason, a required
 * field a reasoning layer fills in reflexively degrades to the boolean the
 * design exists to avoid. This surfaces the gap for a human to close, it does
 * not close it. See docs/decisions/0012-outcome-assessment.md.
 */
function checkOutcomeAssessments(review: Review, out: QualityFinding[]): void {
  const supersededIds = new Set(
    review.recommendations.map((r) => r.supersedes).filter((id): id is string => Boolean(id)),
  );
  for (const assessment of review.outcome_assessments) {
    if (assessment.verdict !== 'failed' || assessment.falsifier_held !== true) continue;
    if (supersededIds.has(assessment.recommendation_id)) continue;
    add(out, {
      code: 'outcome_assessment.failed_without_followup',
      category: 'outcome_unaddressed',
      severity: 'caution',
      collection: 'outcome_assessments',
      id: assessment.id,
      message: `${assessment.recommendation_id} is assessed as failed, and its falsifier held, but no recommendation in this run supersedes it`,
      remedy:
        'Decide whether this needs a new recommendation, or state on the assessment why none follows.',
    });
  }
}

export function runChecks(review: Review): QualityFinding[] {
  const out: QualityFinding[] = [];
  checkRestatement(review, out);
  checkFalsifiers(review, out);
  checkGenericLanguage(review, out);
  checkDuplication(review, out);
  checkUncertainty(review, out);
  checkCorroboration(review, out);
  checkDerivedFindings(review, out);
  checkTemporal(review, out);
  checkResearchDiscipline(review, out);
  checkOutcomeAssessments(review, out);
  return out;
}
