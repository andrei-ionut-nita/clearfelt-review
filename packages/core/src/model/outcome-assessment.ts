import type { Identified } from './common.ts';

/**
 * What a later run concludes about an earlier run's recommendation.
 *
 * The roadmap names the gap this closes: a later run's finding could already
 * `supersede` an earlier recommendation and say in prose whether its falsifier
 * held, but nothing gave that verdict a dedicated, checkable, renderable shape.
 * `measured` and `rationale` are kept apart on purpose, mirroring the
 * Evidence/Finding split elsewhere in this model: "we measured X" is a fact
 * about what was observed, "the recommendation worked" is the conclusion drawn
 * from it, and collapsing the two would let a conclusion pass for an
 * observation.
 */
export type OutcomeVerdict = 'achieved' | 'failed' | 'inconclusive' | 'not_implemented';

export const OUTCOME_VERDICTS: readonly OutcomeVerdict[] = [
  'achieved',
  'failed',
  'inconclusive',
  'not_implemented',
] as const;

/**
 * Written into the newer run, never the older one: ADR 0005 leaves a
 * `complete` run with nothing writable, so an outcome verdict about its
 * recommendations has to live here instead. `recommendation_run_id` makes the
 * cross-run pointer checkable without requiring the older run's directory to
 * still exist on disk, per ADR 0001: this run must validate standalone.
 */
export interface OutcomeAssessment extends Identified {
  /** The id of the recommendation being assessed, in the run named below. */
  recommendation_id: string;
  /** Which run recommendation_id belongs to. Not resolved against anything in
   *  this run; see docs/decisions/0012-outcome-assessment.md. */
  recommendation_run_id: string;
  verdict: OutcomeVerdict;
  /** Grounded in this run's own evidence.json, never the older run's. */
  evidence_ids: string[];
  /** "We measured X." The observation, kept apart from the conclusion below. */
  measured: string;
  /** "The recommendation worked." The conclusion, not the observation. */
  rationale: string;
  /** Whether the original measurement.falsifier held. Absent for
   *  not_implemented: there is nothing to falsify if nothing happened. */
  falsifier_held?: boolean;
}
