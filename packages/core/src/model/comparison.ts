import type { Identified, Level } from './common.ts';

/**
 * Not everything is a competitor. Spec section 17 requires the relationship to
 * be classified, because "compared with 11 alternatives" only means something
 * if we can say what kind of alternatives they were.
 */
export type ComparisonType =
  | 'direct_competitor'
  | 'indirect_competitor'
  | 'alternative'
  | 'substitute'
  | 'benchmark'
  | 'aspirational';

export const COMPARISON_TYPES: readonly ComparisonType[] = [
  'direct_competitor',
  'indirect_competitor',
  'alternative',
  'substitute',
  'benchmark',
  'aspirational',
] as const;

/**
 * A user naming a competitor is a proposal to investigate, not an established
 * fact. Qualification is what moves it from proposed to qualified, and a
 * rejected proposal stays visible so the same name is not rediscovered next run.
 */
export type ComparisonStatus = 'proposed' | 'qualified' | 'rejected';

export const COMPARISON_STATUSES: readonly ComparisonStatus[] = [
  'proposed',
  'qualified',
  'rejected',
] as const;

export interface Comparison extends Identified {
  entity_id: string;
  name: string;
  type: ComparisonType;
  status: ComparisonStatus;
  /** 'user' proposals arrive via a UserAssertion, never as settled fact. */
  proposed_by: 'user' | 'system';
  user_assertion_id?: string;
  /** Why this belongs in the landscape. Spec section 18 forbids silent additions. */
  why_included: string;
  why_rejected?: string;
  audience_overlap: Level;
  objective_overlap: Level;
  decision_overlap: Level;
  relevance: Level;
  confidence: Level;
  source_ids: string[];
}
