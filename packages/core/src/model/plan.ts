import type { Identified, IsoDateTime } from './common.ts';

/**
 * Why a module was activated. Recorded so the user can correct the framing at
 * gate 2, and so a rerun is reproducible rather than depending on whatever the
 * reasoning layer happened to decide that day.
 */
export interface ActivatedModule {
  key: string;
  reason: string;
  /** Research question ids generated for this module. */
  research_question_ids: string[];
}

/**
 * The transparent research plan from spec section 13, shown to the user before
 * any retrieval happens.
 *
 * Spec section 13 is explicit that the system should infer as much as possible
 * while still giving the user a chance to correct the framing. Persisting the
 * plan rather than narrating it is what makes that correction possible: the
 * user is editing a file, not interrupting a monologue.
 */
export interface ResearchPlan extends Identified {
  created_at: IsoDateTime;
  /** How the system understood the objective, in its own words. */
  objective_interpretation: string;
  activated_modules: ActivatedModule[];
  /** Modules considered and rejected, so the omission is visible. */
  dormant_modules: { key: string; reason: string }[];
  comparison_plan: {
    supplied_count: number;
    to_discover: boolean;
    rationale: string;
  };
  /** Areas the plan expects to be weak on, stated up front. */
  anticipated_gaps: string[];
}
