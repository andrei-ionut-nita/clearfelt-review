import type { Identified, IsoDateTime } from './common.ts';

export type FeedbackType = 'accept' | 'reject' | 'correct' | 'amend' | 'add';

export const FEEDBACK_TYPES: readonly FeedbackType[] = [
  'accept',
  'reject',
  'correct',
  'amend',
  'add',
] as const;

/**
 * A user correction, recorded rather than applied silently.
 *
 * feedback.json is append-only and is carried into a rerun, so "COMP-004 is not
 * actually a competitor" stays true the second time. Applying a correction
 * without recording it would make the next run rediscover the same rejected
 * competitor, which is what turns a review tool into a one-shot report.
 */
export interface Feedback extends Identified {
  /** Any entity id in the run. */
  target_id: string;
  type: FeedbackType;
  reason?: string;
  user_input?: string;
  at: IsoDateTime;
}
