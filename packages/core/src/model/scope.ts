import type { Identified, IsoDateTime } from './common.ts';

/**
 * A review exists because someone must make a decision. The decision determines
 * what evidence is required, which is what keeps research from wandering and
 * what stops the output degenerating into "here are 47 interesting things".
 */
export interface Decision {
  statement: string;
  decision_maker?: string;
  horizon?: string;
  /** What would have to be true to decide well. Seeds the research questions. */
  evidence_required: string[];
}

export interface Audience {
  name: string;
  description?: string;
  priority?: number;
  decision_role?: string;
}

/**
 * A research agent can always find another competitor, another article, another
 * signal. The budget is what turns "enough" into a decision rather than a drift.
 */
export interface ResearchBudget {
  max_sources: number;
  max_search_iterations: number;
  max_depth: number;
  min_evidence_per_question: number;
  /**
   * Corroboration is counted over independent sources only. Two outlets
   * reprinting one press release are one source, not two.
   */
  min_independent_corroboration: number;
  priority_question_ids: string[];
}

export type ReviewDepth = 'quick' | 'standard' | 'deep';

export const REVIEW_DEPTHS: readonly ReviewDepth[] = ['quick', 'standard', 'deep'] as const;

/**
 * What is being reviewed, and just as importantly what is not. Without stated
 * exclusions the research universe expands on every iteration, which shows up
 * as inconsistent reviews rather than as an obvious failure.
 */
export interface ReviewScope extends Identified {
  entity_ids: string[];
  asset_ids: string[];
  decision: Decision;
  audiences: Audience[];
  geography?: string[];
  languages?: string[];
  channels?: string[];
  time_period?: { from?: IsoDateTime; to?: IsoDateTime };
  exclusions: string[];
  depth: ReviewDepth;
  budget: ResearchBudget;
  /**
   * Spec section 51 requires comparison unless the objective genuinely does not
   * need it. Recording the reason makes its absence a visible decision rather
   * than an accidental omission.
   */
  comparison_applicable: boolean;
  comparison_not_applicable_reason?: string;
  objective: string;
}
