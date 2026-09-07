import type { ReviewView } from './view.ts';

/**
 * The canonical model plus everything derived from it.
 *
 * This is the machine-readable output and the contract every other renderer is
 * a lossy view of. Derived values are included rather than left for the
 * consumer to recompute, so a downstream reader cannot arrive at a different
 * priority or a different change tree than the report shows.
 */
export function renderJson(view: ReviewView): string {
  const { review } = view;
  return `${JSON.stringify(
    {
      run: review.run,
      scope: review.scope,
      plan: review.plan,
      model: {
        entities: review.entities,
        assets: review.assets,
        user_assertions: review.user_assertions,
        research_questions: review.research_questions,
        sources: review.sources,
        observations: review.observations,
        evidence: review.evidence,
        comparisons: review.comparisons,
        findings: review.findings,
        opportunities: review.opportunities,
        recommendations: review.recommendations,
        actions: review.actions,
        assumptions: review.assumptions,
        unknowns: review.unknowns,
        hypotheses: review.hypotheses,
        feedback: review.feedback,
        research_log: review.research_log,
      },
      derived: {
        priorities: view.priorities,
        change_tree: view.changeTree,
        coverage: view.coverage,
      },
    },
    null,
    2,
  )}\n`;
}
