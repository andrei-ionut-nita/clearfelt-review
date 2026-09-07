import type { ClaimType, Identified, Level, TemporalScope } from './common.ts';

/**
 * A meaningful conclusion drawn from evidence.
 *
 * claim_type is what makes the leap from evidence to conclusion visible. A
 * finding that merely restates what the evidence shows is 'derived'. One that
 * goes beyond it is 'inferred' and must say so, because unjustified inference
 * survives every provenance check: the sources are real, the observations are
 * real, and the conclusion still does not follow.
 */
export interface Finding extends Identified {
  /** A module key from the registry. Keeps findings groupable by analysis area. */
  category: string;
  title: string;
  statement: string;
  claim_type: ClaimType;
  /** Non-empty, enforced. A finding with no evidence is an opinion. */
  evidence_ids: string[];
  /**
   * Analytical confidence: how strongly the evidence supports this conclusion.
   * Not the reliability of any single evidence item underneath it.
   */
  confidence: Level;
  importance: Level;
  implication: string;
  temporal_scope: TemporalScope;
  /** Evidence cutting against this finding, kept rather than resolved away. */
  contradicted_by: string[];
  assumption_ids: string[];
  competitive_relevance?: string;
  audience_relevance?: string;
}

/**
 * A strategically useful possibility, which is not the same as a weakness.
 * Spec section 23: an opportunity has to be worth pursuing, not merely a gap.
 */
export interface Opportunity extends Identified {
  title: string;
  description: string;
  supporting_finding_ids: string[];
  supporting_evidence_ids: string[];
  strategic_value: Level;
  audience_value: Level;
  competitive_context?: string;
  confidence: Level;
  /**
   * Set when this opportunity is a white-space claim, per spec section 20.
   *
   * saturation is deliberately absent here: comparison-synthesis.ts computes it
   * from how many qualified comparisons contest this territory, per ADR 0009.
   * current_position stays authored, because it is a judgement about the
   * subject's own standing that only the evidence behind the finding can make,
   * the same way Finding.importance is authored rather than derived.
   */
  white_space?: {
    territory: string;
    current_position: Level;
  };
}

export type AssumptionStatus = 'unvalidated' | 'validated' | 'invalidated';

export const ASSUMPTION_STATUSES: readonly AssumptionStatus[] = [
  'unvalidated',
  'validated',
  'invalidated',
] as const;

/**
 * An interpretation we are relying on because the evidence is incomplete.
 *
 * Tracked as its own entity so a recommendation can declare a dependency on it.
 * A recommendation quietly resting on an unvalidated assumption is one of the
 * easiest ways for a confident-looking plan to be wrong.
 */
export interface Assumption extends Identified {
  statement: string;
  why_assumed: string;
  status: AssumptionStatus;
  validation_method?: string;
  evidence_ids: string[];
}

/** Something the research could not establish. Never rendered as a fact. */
export interface Unknown extends Identified {
  statement: string;
  why_unknown: string;
  /** What it would take to find out, where that is knowable. */
  how_to_resolve?: string;
  blocks_finding_ids: string[];
}

/** A candidate explanation awaiting validation. Explicitly not a conclusion. */
export interface Hypothesis extends Identified {
  statement: string;
  based_on_evidence_ids: string[];
  validation_method: string;
  confidence: Level;
}
