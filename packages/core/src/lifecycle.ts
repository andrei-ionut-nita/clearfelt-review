import type { GateName, Review, RunStage } from './model/index.ts';

/**
 * The run state machine.
 *
 * The filesystem is the state machine. store.ts consults this module before
 * every write, so a reasoning stage cannot write findings before the research
 * plan is approved, or recommendations before the findings are. A skill
 * agreeing in its prompt to respect the gates is not enforcement: prompts drift,
 * get compacted, and get edited by whoever is in a hurry.
 */

/** The linear path a healthy run takes. 'blocked' sits outside it. */
export const STAGE_ORDER: readonly RunStage[] = [
  'initialized',
  'scope_pending',
  'research_plan_pending',
  'researching',
  'findings_pending',
  'recommending',
  'complete',
] as const;

/**
 * Which collections may be written in which stage.
 *
 * 'run' and 'feedback' are omitted here and allowed everywhere: 'run' is how the
 * stage itself advances, and a user must be able to record a correction at any
 * point without first rewinding the run.
 */
const ALWAYS_WRITABLE: readonly (keyof Review)[] = ['run', 'feedback'] as const;

const WRITABLE_BY_STAGE: Record<RunStage, readonly (keyof Review)[]> = {
  initialized: ['scope', 'entities', 'assets', 'user_assertions'],
  scope_pending: ['scope', 'entities', 'assets', 'user_assertions'],
  research_plan_pending: [
    'plan',
    'research_questions',
    'comparisons',
    'entities',
    'assets',
    'user_assertions',
  ],
  researching: [
    'sources',
    'observations',
    'evidence',
    'comparisons',
    'research_questions',
    'research_log',
    'user_assertions',
    'entities',
    'assets',
  ],
  findings_pending: ['findings', 'opportunities', 'assumptions', 'unknowns', 'hypotheses'],
  // outcome_assessments lives here, not findings_pending: review-recommend is
  // the skill with whole-run visibility (ADR 0011 Phase 7 made the same call
  // for 'acknowledge' feedback, for the same reason), and evidence written
  // during researching is still readable regardless of which later stage the
  // run is in.
  recommending: ['recommendations', 'actions', 'outcome_assessments'],
  complete: [],
  blocked: [],
};

/** Which gate, if any, must be approved to leave a stage. */
const GATE_FOR_STAGE: Partial<Record<RunStage, GateName>> = {
  scope_pending: 'scope',
  research_plan_pending: 'research_plan',
  findings_pending: 'findings',
};

export function gateForStage(stage: RunStage): GateName | null {
  return GATE_FOR_STAGE[stage] ?? null;
}

export function stageForGate(gate: GateName): RunStage {
  const entry = Object.entries(GATE_FOR_STAGE).find(([, g]) => g === gate);
  if (!entry) throw new Error(`Unknown gate: ${gate}`);
  return entry[0] as RunStage;
}

export function canWrite(stage: RunStage, key: keyof Review): boolean {
  if (ALWAYS_WRITABLE.includes(key)) return true;
  return (WRITABLE_BY_STAGE[stage] ?? []).includes(key);
}

export function writableIn(stage: RunStage): readonly (keyof Review)[] {
  return [...ALWAYS_WRITABLE, ...(WRITABLE_BY_STAGE[stage] ?? [])];
}

/**
 * The stage in which a collection becomes writable, used to explain a refusal.
 * Returns null for collections writable everywhere.
 */
export function stageThatAllows(key: keyof Review): RunStage | null {
  if (ALWAYS_WRITABLE.includes(key)) return null;
  return STAGE_ORDER.find((stage) => canWrite(stage, key)) ?? null;
}

export function isLegalTransition(from: RunStage, to: RunStage): boolean {
  if (from === to) return true;
  // Anything can be blocked, and a blocked run can resume anywhere short of
  // being declared complete, since resuming is a human decision about what
  // still needs doing rather than a position on the happy path.
  if (to === 'blocked') return true;
  if (from === 'blocked') return to !== 'complete';
  const fromIndex = STAGE_ORDER.indexOf(from);
  const toIndex = STAGE_ORDER.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return false;
  return toIndex === fromIndex + 1;
}

export class LifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LifecycleError';
  }
}

export function assertTransition(from: RunStage, to: RunStage): void {
  if (!isLegalTransition(from, to)) {
    throw new LifecycleError(
      `Illegal stage transition ${from} -> ${to}. Legal next stages: ${STAGE_ORDER.filter((s) =>
        isLegalTransition(from, s),
      ).join(', ')}, blocked.`,
    );
  }
}

export function assertWritable(stage: RunStage, key: keyof Review): void {
  if (canWrite(stage, key)) return;
  const allowed = stageThatAllows(key);
  const detail = allowed
    ? `'${String(key)}' becomes writable in stage '${allowed}'.`
    : `'${String(key)}' is not writable in any stage.`;
  throw new LifecycleError(
    `Refusing to write '${String(key)}' while the run is in stage '${stage}'. ${detail}`,
  );
}
