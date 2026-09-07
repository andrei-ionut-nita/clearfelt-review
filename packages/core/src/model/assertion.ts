import type { Identified, IsoDateTime } from './common.ts';

/**
 * What the user told us, held separately from what we established.
 *
 * This closes the worst contamination route in the system. During onboarding a
 * user says "our main competitor is McKinsey" or "our customers care mainly
 * about price". Neither is evidence. Written straight into findings.json they
 * poison the entire chain while passing every referential integrity check,
 * because the references are all real.
 *
 * The chain is therefore: user says -> UserAssertion -> research question ->
 * research -> evidence -> finding. A finding may cite an assertion only once
 * its status is 'corroborated', and integrity.ts enforces that.
 */
export type AssertionStatus =
  | 'to_validate'
  | 'corroborated'
  | 'contradicted'
  /** Kept because it is useful context, but explicitly never tested. */
  | 'accepted_untested'
  | 'rejected';

export const ASSERTION_STATUSES: readonly AssertionStatus[] = [
  'to_validate',
  'corroborated',
  'contradicted',
  'accepted_untested',
  'rejected',
] as const;

export interface UserAssertion extends Identified {
  statement: string;
  /** The entity, comparison or audience this assertion concerns, if any. */
  about_id?: string;
  status: AssertionStatus;
  /** The questions opened to test it. Empty while status is 'to_validate'. */
  research_question_ids: string[];
  /** What we found, whichever way it went. */
  evidence_ids: string[];
  created_at: IsoDateTime;
}
