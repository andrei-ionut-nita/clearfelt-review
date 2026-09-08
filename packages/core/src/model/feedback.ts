import type { Identified, IsoDateTime } from './common.ts';

export type FeedbackType = 'accept' | 'reject' | 'correct' | 'amend' | 'add' | 'acknowledge';

export const FEEDBACK_TYPES: readonly FeedbackType[] = [
  'accept',
  'reject',
  'correct',
  'amend',
  'add',
  'acknowledge',
] as const;

/**
 * A user correction, recorded rather than applied silently.
 *
 * feedback.json is append-only and is carried into a rerun, so "COMP-004 is not
 * actually a competitor" stays true the second time. Applying a correction
 * without recording it would make the next run rediscover the same rejected
 * competitor, which is what turns a review tool into a one-shot report.
 *
 * `acknowledge` is different in kind from the other types: its `target_id`
 * names an earlier `Feedback` entry, not the original target that entry
 * corrected. It is how a rerun records "I saw this still-open item and am
 * deliberately leaving it unaddressed" without mutating the entry it is
 * about. `reason` is required for this type: see
 * docs/decisions/0011-cross-run-identity-is-supersedes-only.md, Update Phase
 * 7, for why this is safe under the supersedes-only identity rule (the
 * earlier entry's id is carried into this run verbatim by
 * `carryForwardFeedback`, so referencing it is a real in-run reference, not
 * identity-by-coincidence).
 */
export interface Feedback extends Identified {
  /** Any entity id in the run, or another Feedback's id when type is 'acknowledge'. */
  target_id: string;
  type: FeedbackType;
  reason?: string;
  user_input?: string;
  at: IsoDateTime;
}
