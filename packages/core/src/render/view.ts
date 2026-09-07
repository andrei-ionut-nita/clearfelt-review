import { buildChangeTree } from '../change-tree.ts';
import { type SaturationTable, buildSaturationTable } from '../comparison-synthesis.ts';
import { type CoverageReport, computeCoverage } from '../coverage.ts';
import type {
  Action,
  Assumption,
  ChangeTree,
  Evidence,
  Finding,
  Observation,
  Opportunity,
  Recommendation,
  Review,
  Source,
} from '../model/index.ts';
import { type PriorityResult, prioritise } from '../prioritise.ts';
import { type QualityReport, evaluateQuality } from '../quality/index.ts';

/**
 * The single derived view every renderer reads.
 *
 * This is what makes "one canonical model, multiple renderers" literal rather
 * than aspirational. Each renderer takes a ReviewView and may read nothing
 * else: no renderer computes its own priorities, builds its own tree, or calls
 * an LLM. A renderer that diverges from the model is the failure specification
 * section 77 names, where the report looks impressive and quietly stops being
 * a view of the evidence.
 */
export interface ReviewView {
  review: Review;
  priorities: PriorityResult[];
  changeTree: ChangeTree;
  coverage: CoverageReport;
  /**
   * The review's own assessment of itself. Carried on the view so a renderer
   * cannot show a confident plan while the quality report says the
   * recommendations are untestable: both come off the same object.
   */
  quality: QualityReport;
  /** Specification section 19's saturation table, computed from the comparison set. */
  saturation: SaturationTable;

  priorityOf(id: string): PriorityResult | undefined;
  findingOf(id: string): Finding | undefined;
  evidenceOf(id: string): Evidence | undefined;
  observationOf(id: string): Observation | undefined;
  sourceOf(id: string): Source | undefined;
  opportunityOf(id: string): Opportunity | undefined;
  assumptionOf(id: string): Assumption | undefined;
  recommendationOf(id: string): Recommendation | undefined;

  /** Actions belonging to a recommendation, in id order. */
  actionsFor(id: string): Action[];
  /** Every source a finding ultimately rests on, deduplicated. */
  sourcesBehind(finding: Finding): Source[];
  /** Assumptions a recommendation depends on that nobody has validated. */
  unvalidatedAssumptions(rec: Recommendation): Assumption[];
}

function indexBy<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function buildView(review: Review): ReviewView {
  const priorities = prioritise(review);
  const priorityIndex = new Map(priorities.map((p) => [p.id, p]));
  const findings = indexBy(review.findings);
  const evidence = indexBy(review.evidence);
  const observations = indexBy(review.observations);
  const sources = indexBy(review.sources);
  const opportunities = indexBy(review.opportunities);
  const assumptions = indexBy(review.assumptions);
  const recommendations = indexBy(review.recommendations);

  return {
    review,
    priorities,
    changeTree: buildChangeTree(review),
    coverage: computeCoverage(review),
    quality: evaluateQuality(review),
    saturation: buildSaturationTable(review),

    priorityOf: (id) => priorityIndex.get(id),
    findingOf: (id) => findings.get(id),
    evidenceOf: (id) => evidence.get(id),
    observationOf: (id) => observations.get(id),
    sourceOf: (id) => sources.get(id),
    opportunityOf: (id) => opportunities.get(id),
    assumptionOf: (id) => assumptions.get(id),
    recommendationOf: (id) => recommendations.get(id),

    actionsFor: (id) =>
      review.actions
        .filter((a) => a.recommendation_id === id)
        .sort((a, b) => a.id.localeCompare(b.id)),

    sourcesBehind: (finding) => {
      const ids = new Set<string>();
      for (const evidenceId of finding.evidence_ids ?? []) {
        for (const sourceId of evidence.get(evidenceId)?.source_ids ?? []) ids.add(sourceId);
      }
      return [...ids].map((id) => sources.get(id)).filter((s): s is Source => s !== undefined);
    },

    unvalidatedAssumptions: (rec) =>
      (rec.assumption_ids ?? [])
        .map((id) => assumptions.get(id))
        .filter((a): a is Assumption => a !== undefined && a.status === 'unvalidated'),
  };
}

/**
 * Every id the model contains.
 *
 * Used by the renderer completeness test: any id appearing in rendered output
 * must be in here. It is the cheapest available guard against a renderer
 * inventing a reference that resolves to nothing.
 */
export function allIds(review: Review): Set<string> {
  const ids = new Set<string>();
  const push = (items: { id: string }[]) => {
    for (const item of items) ids.add(item.id);
  };
  push(review.entities);
  push(review.assets);
  push(review.user_assertions);
  push(review.research_questions);
  push(review.sources);
  push(review.observations);
  push(review.evidence);
  push(review.comparisons);
  push(review.findings);
  push(review.opportunities);
  push(review.recommendations);
  push(review.actions);
  push(review.assumptions);
  push(review.unknowns);
  push(review.hypotheses);
  push(review.feedback);
  if (review.scope) ids.add(review.scope.id);
  if (review.plan) ids.add(review.plan.id);
  return ids;
}

/** Matches any canonical id, for scanning rendered output. */
export const ID_IN_TEXT = /\b(ENT|AST|UA|RQ|S|OBS|E|COMP|F|O|R|A|ASM|UNK|HYP|FB)-\d{4,}\b/g;
