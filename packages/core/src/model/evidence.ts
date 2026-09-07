import type { Identified, IsoDateTime, Level, TemporalScope } from './common.ts';

/**
 * An observation with provenance, used to support or undercut a claim.
 *
 * Evidence never stands alone: observation_ids must be non-empty, which means
 * every evidence item is anchored to something someone could go and check.
 */
export interface Evidence extends Identified {
  /** Non-empty, enforced by integrity.ts. No observation, no evidence. */
  observation_ids: string[];
  source_ids: string[];
  /** What the observations are being used to assert. */
  claim: string;
  research_question_ids: string[];
  /** User assertions this evidence bears on, whichever way it cuts. */
  user_assertion_ids: string[];
  relevance: Level;
  /**
   * Evidence confidence: how trustworthy the source and observation are.
   * Deliberately distinct from a Finding's analytical confidence. Spec section
   * 65 forbids conflating the two, because a reliable source can still support
   * a weak conclusion.
   */
  reliability: Level;
  /**
   * Other evidence saying the same thing. coverage.ts only counts entries whose
   * source independence is 'independent', so republished agreement does not
   * inflate the corroboration count.
   */
  corroborated_by: string[];
  supports: string[];
  /**
   * Findings this evidence cuts against. Spec section 64 requires contradictory
   * evidence to be representable rather than resolved away, because the
   * contradiction is often the most interesting finding available.
   */
  contradicts: string[];
  evidence_period?: { from?: IsoDateTime; to?: IsoDateTime };
  temporal_scope: TemporalScope;
}
