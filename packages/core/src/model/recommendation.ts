import type { Identified, Level } from './common.ts';

export type MeasurementKind = 'quantitative' | 'qualitative' | 'binary' | 'proxy';

export const MEASUREMENT_KINDS: readonly MeasurementKind[] = [
  'quantitative',
  'qualitative',
  'binary',
  'proxy',
] as const;

/**
 * How we will know whether the recommendation worked.
 *
 * hypothesis and falsifier live here rather than in a separate rationale block,
 * because a separate block would duplicate validation_method and the two would
 * drift apart. Together these turn "AI recommends things" into "AI proposes
 * testable interventions", which is the difference between advice and a plan.
 *
 * baseline of 'unknown' is legitimate and honest. Inventing a baseline to make
 * the block look complete is the failure this field exists to avoid.
 */
export interface Measurement {
  kind: MeasurementKind;
  /** What we expect this change to cause. */
  hypothesis: string;
  success_metric: string;
  baseline?: string;
  target?: string;
  validation_method: string;
  /** What result would prove this recommendation wrong. Required. */
  falsifier: string;
  review_period?: string;
}

/**
 * What should be done.
 *
 * priority is deliberately absent. prioritise.ts computes it from impact,
 * effort, confidence and urgency, so the reasoning layer cannot assert a P0 it
 * has not earned. Spec section 25 wants independent dimensions rather than one
 * arbitrary score, and a computed priority is the only way that stays true.
 */
export interface Recommendation extends Identified {
  title: string;
  problem: string;
  why_it_matters: string;
  /** Non-empty, enforced. A recommendation with no finding is a guess. */
  finding_ids: string[];
  opportunity_ids: string[];
  strategic_rationale: string;
  recommended_change: string;
  expected_outcome: string;
  impact: Level;
  effort: Level;
  /**
   * Recommendation confidence: that this action follows from the analysis.
   * The third and last confidence axis, distinct from evidence reliability and
   * from a finding's analytical confidence.
   */
  confidence: Level;
  urgency: Level;
  dependencies: string[];
  /**
   * Assumptions this recommendation rests on. Surfaced in every renderer, so a
   * reader can see that a confident-looking recommendation depends on something
   * we never established.
   */
  assumption_ids: string[];
  measurement: Measurement;
}

/** Computed by prioritise.ts, never authored. */
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export const PRIORITIES: readonly Priority[] = ['P0', 'P1', 'P2', 'P3'] as const;

export type AssetOperation = 'new' | 'edit' | 'remove' | 'move';

export const ASSET_OPERATIONS: readonly AssetOperation[] = [
  'new',
  'edit',
  'remove',
  'move',
] as const;

/**
 * Where a change lands.
 *
 * For edit, remove and move, asset_id must name an asset we established exists.
 * For new, proposed describes something that does not exist yet. Requiring one
 * or the other is what keeps the change tree a view of the real subject rather
 * than a second place for the reasoning layer to invent structure.
 */
export interface AffectedAsset {
  asset_id?: string;
  proposed?: { type: string; path: string; title?: string };
  target?: string;
  operation: AssetOperation;
  /** Destination, for operation 'move'. */
  to?: string;
}

export type ActionStatus = 'todo' | 'in_progress' | 'done' | 'dropped';

export const ACTION_STATUSES: readonly ActionStatus[] = [
  'todo',
  'in_progress',
  'done',
  'dropped',
] as const;

export type ActionHorizon = 'now' | 'next' | 'later';

export const ACTION_HORIZONS: readonly ActionHorizon[] = ['now', 'next', 'later'] as const;

export interface Action extends Identified {
  /** Exactly one, which is what keeps the change tree derivable. */
  recommendation_id: string;
  description: string;
  affected_assets: AffectedAsset[];
  owner?: string;
  effort: Level;
  dependencies: string[];
  status: ActionStatus;
  validation: string;
  horizon?: ActionHorizon;
}
