import type { IsoDateTime } from './common.ts';

/**
 * The run lifecycle. The filesystem is the state machine: store.ts refuses a
 * write that the current stage does not permit, so a reasoning stage cannot
 * write findings before the research plan is approved, or recommendations
 * before the findings are. Skills agreeing to respect gates is not enforcement.
 */
export type RunStage =
  | 'initialized'
  | 'scope_pending'
  | 'research_plan_pending'
  | 'researching'
  | 'findings_pending'
  | 'recommending'
  | 'complete'
  | 'blocked';

export const RUN_STAGES: readonly RunStage[] = [
  'initialized',
  'scope_pending',
  'research_plan_pending',
  'researching',
  'findings_pending',
  'recommending',
  'complete',
  'blocked',
] as const;

/** The three human approval gates from spec section 55. */
export type GateName = 'scope' | 'research_plan' | 'findings';

export const GATE_NAMES: readonly GateName[] = ['scope', 'research_plan', 'findings'] as const;

/**
 * What is actually measurable from inside a Claude Code session.
 *
 * Token count and monetary cost are deliberately absent. A skill cannot read its
 * own spend, and a field holding a guessed number is worse than no field at all,
 * because it would be reported as though it were measured. See docs/ROADMAP.md.
 */
export interface RunObservability {
  started_at: IsoDateTime;
  finished_at?: IsoDateTime;
  sources_discovered: number;
  sources_retrieved: number;
  retrieval_failures: number;
  search_iterations: number;
}

export interface ReviewRun {
  id: string;
  slug: string;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  stage: RunStage;
  /** Set when this run supersedes an earlier analysis of the same subject. */
  previous_run_id?: string;
  /**
   * Timestamped on approval. An unapproved gate is therefore visible in the
   * data rather than remembered in a conversation that has since been compacted.
   */
  approved_gates: Partial<Record<GateName, IsoDateTime>>;
  /** Set when stage is 'blocked', explaining what stopped the run. */
  blocked_reason?: string;
  observability: RunObservability;
}
