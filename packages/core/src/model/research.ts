import type { Identified, IsoDateTime, Level } from './common.ts';

/** Spec section 14. The research system must know what it is trying to answer. */
export type QuestionState =
  | 'OPEN'
  | 'SEARCHING'
  | 'PARTIALLY_ANSWERED'
  | 'ANSWERED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'BLOCKED';

export const QUESTION_STATES: readonly QuestionState[] = [
  'OPEN',
  'SEARCHING',
  'PARTIALLY_ANSWERED',
  'ANSWERED',
  'INSUFFICIENT_EVIDENCE',
  'BLOCKED',
] as const;

/**
 * Why we stopped. These are not interchangeable, and rendering them the same
 * way is how a research system manufactures false confidence: "researched
 * sufficiently" and "could not obtain evidence" produce identical-looking
 * silence in a report unless the model insists on the difference.
 */
export type StopReason =
  | 'sufficient'
  | 'diminishing_returns'
  | 'budget_exhausted'
  | 'blocked'
  | 'no_evidence_available'
  | 'contradictory';

export const STOP_REASONS: readonly StopReason[] = [
  'sufficient',
  'diminishing_returns',
  'budget_exhausted',
  'blocked',
  'no_evidence_available',
  'contradictory',
] as const;

export interface ResearchQuestion extends Identified {
  question: string;
  /** The analysis module this question serves. Drives coverage reporting. */
  module: string;
  state: QuestionState;
  stop_reason?: StopReason;
  stop_detail?: string;
  evidence_ids: string[];
  source_ids: string[];
  /** Confidence that the question is actually answered, not that it was asked. */
  confidence?: Level;
  priority: number;
}

/**
 * What we intended to do next, and why.
 *
 * Recording intent alongside outcome is what makes the process auditable rather
 * than merely leaving an audit trail. A log of events tells you what happened;
 * rationale tells you why that was the sensible next move given what was
 * already known, which is the part a reader needs to judge the research.
 */
export interface ResearchAction extends Identified {
  research_question_id: string;
  action: 'search' | 'retrieve' | 'inspect' | 'compare' | 'verify';
  rationale: string;
  target?: string;
  result_event_ids: string[];
}

export const RESEARCH_ACTION_KINDS = [
  'search',
  'retrieve',
  'inspect',
  'compare',
  'verify',
] as const;

/**
 * What actually happened, including the failures. The agent may not silently
 * move on from a paywall, a robots.txt block, a dead link or a contradiction:
 * coverage and the report both read from this, so a gap in the evidence appears
 * as a gap rather than as silence.
 */
export interface ResearchEvent extends Identified {
  action_id: string;
  outcome: 'succeeded' | 'failed' | 'blocked' | 'insufficient' | 'contradicted';
  detail: string;
  at: IsoDateTime;
}

export const RESEARCH_OUTCOMES = [
  'succeeded',
  'failed',
  'blocked',
  'insufficient',
  'contradicted',
] as const;

/** The two halves of the ledger, stored together. */
export interface ResearchLog {
  actions: ResearchAction[];
  events: ResearchEvent[];
}
