import type { Level, QuestionState, Review, StopReason } from './model/index.ts';

/**
 * Research coverage: spec section 16.
 *
 * The point of this module is to let a report say "we have high confidence in
 * positioning but insufficient evidence to assess conversion", which spec
 * section 16 calls preferable to inventing certainty. That sentence is only
 * possible if the arithmetic behind it is deterministic, so none of this is left
 * to the reasoning layer.
 */

export interface ModuleCoverage {
  module: string;
  questions: number;
  by_state: Record<QuestionState, number>;
  evidence_count: number;
  /** Distinct sources, and how many of those are independent of each other. */
  source_count: number;
  independent_source_count: number;
  /** Questions closed without an answer, which is a gap and not a silence. */
  unresolved: { id: string; question: string; stop_reason?: StopReason; stop_detail?: string }[];
  confidence: Level | 'none';
}

export interface CoverageReport {
  modules: ModuleCoverage[];
  totals: {
    questions: number;
    answered: number;
    unresolved: number;
    evidence: number;
    sources: number;
    independent_sources: number;
  };
  /** Budget consumption, so "we stopped" can be distinguished from "we ran out". */
  budget: {
    max_sources: number | null;
    sources_used: number;
    max_search_iterations: number | null;
    search_iterations_used: number;
    exhausted: boolean;
  };
  stop_reasons: Record<StopReason, number>;
  /** Failures pulled from the research ledger, so a gap appears as a gap. */
  failures: { research_question_id: string; outcome: string; detail: string }[];
  /**
   * Findings whose supporting evidence never reaches an independent source.
   * Not an error, but a reader deciding how much weight to place on a
   * conclusion needs to know it stands on one leg.
   */
  uncorroborated_findings: string[];
}

const EMPTY_STATES: Record<QuestionState, number> = {
  OPEN: 0,
  SEARCHING: 0,
  PARTIALLY_ANSWERED: 0,
  ANSWERED: 0,
  INSUFFICIENT_EVIDENCE: 0,
  BLOCKED: 0,
};

const EMPTY_STOP_REASONS: Record<StopReason, number> = {
  sufficient: 0,
  diminishing_returns: 0,
  budget_exhausted: 0,
  blocked: 0,
  no_evidence_available: 0,
  contradictory: 0,
};

const LEVEL_ORDER: Level[] = ['low', 'medium', 'high'];

/** The weakest confidence across a module's answered questions, not the mean. */
function weakestConfidence(levels: Level[]): Level | 'none' {
  if (levels.length === 0) return 'none';
  return levels.reduce((worst, current) =>
    LEVEL_ORDER.indexOf(current) < LEVEL_ORDER.indexOf(worst) ? current : worst,
  );
}

export function computeCoverage(review: Review): CoverageReport {
  const byModule = new Map<string, ModuleCoverage>();
  const evidenceById = new Map(review.evidence.map((e) => [e.id, e]));
  const sourceById = new Map(review.sources.map((s) => [s.id, s]));

  for (const question of review.research_questions) {
    let entry = byModule.get(question.module);
    if (!entry) {
      entry = {
        module: question.module,
        questions: 0,
        by_state: { ...EMPTY_STATES },
        evidence_count: 0,
        source_count: 0,
        independent_source_count: 0,
        unresolved: [],
        confidence: 'none',
      };
      byModule.set(question.module, entry);
    }
    entry.questions += 1;
    entry.by_state[question.state] = (entry.by_state[question.state] ?? 0) + 1;
    entry.evidence_count += question.evidence_ids?.length ?? 0;
    if (question.state === 'INSUFFICIENT_EVIDENCE' || question.state === 'BLOCKED') {
      entry.unresolved.push({
        id: question.id,
        question: question.question,
        stop_reason: question.stop_reason,
        // The detail is what turns "insufficient evidence" from a label into
        // something a reader can act on or disagree with.
        stop_detail: question.stop_detail,
      });
    }
  }

  // Source counting is done per module over the evidence actually cited, rather
  // than over everything retrieved, so a module does not get credit for sources
  // that answered a different question.
  for (const [module, entry] of byModule) {
    const sourceIds = new Set<string>();
    for (const question of review.research_questions.filter((q) => q.module === module)) {
      for (const evidenceId of question.evidence_ids ?? []) {
        for (const sourceId of evidenceById.get(evidenceId)?.source_ids ?? []) {
          sourceIds.add(sourceId);
        }
      }
    }
    entry.source_count = sourceIds.size;
    entry.independent_source_count = [...sourceIds].filter(
      (id) => sourceById.get(id)?.independence?.type === 'independent',
    ).length;
    entry.confidence = weakestConfidence(
      review.research_questions
        .filter((q) => q.module === module && q.confidence)
        .map((q) => q.confidence as Level),
    );
  }

  const stopReasons = { ...EMPTY_STOP_REASONS };
  for (const question of review.research_questions) {
    if (question.stop_reason) stopReasons[question.stop_reason] += 1;
  }

  const uncorroborated: string[] = [];
  for (const finding of review.findings) {
    const sources = new Set<string>();
    for (const evidenceId of finding.evidence_ids ?? []) {
      for (const sourceId of evidenceById.get(evidenceId)?.source_ids ?? []) sources.add(sourceId);
    }
    const independent = [...sources].filter(
      (id) => sourceById.get(id)?.independence?.type === 'independent',
    );
    if (independent.length < 2) uncorroborated.push(finding.id);
  }

  const modules = [...byModule.values()].sort((a, b) => a.module.localeCompare(b.module));
  const allSources = new Set(review.sources.map((s) => s.id));
  const budgetMaxSources = review.scope?.budget?.max_sources ?? null;
  const budgetMaxIterations = review.scope?.budget?.max_search_iterations ?? null;
  const iterationsUsed = review.run.observability?.search_iterations ?? 0;

  return {
    modules,
    totals: {
      questions: review.research_questions.length,
      answered: review.research_questions.filter((q) => q.state === 'ANSWERED').length,
      unresolved: modules.reduce((sum, m) => sum + m.unresolved.length, 0),
      evidence: review.evidence.length,
      sources: allSources.size,
      independent_sources: review.sources.filter((s) => s.independence?.type === 'independent')
        .length,
    },
    budget: {
      max_sources: budgetMaxSources,
      sources_used: allSources.size,
      max_search_iterations: budgetMaxIterations,
      search_iterations_used: iterationsUsed,
      exhausted:
        (budgetMaxSources !== null && allSources.size >= budgetMaxSources) ||
        (budgetMaxIterations !== null && iterationsUsed >= budgetMaxIterations),
    },
    stop_reasons: stopReasons,
    failures: review.research_log.events
      .filter((e) => e.outcome !== 'succeeded')
      .map((event) => {
        const action = review.research_log.actions.find((a) => a.id === event.action_id);
        return {
          research_question_id: action?.research_question_id ?? 'unknown',
          outcome: event.outcome,
          detail: event.detail,
        };
      }),
    uncorroborated_findings: uncorroborated,
  };
}
