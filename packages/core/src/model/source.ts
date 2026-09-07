import type { Identified, IsoDateTime, Level } from './common.ts';

export type RetrievalMethod = 'fetch' | 'search' | 'user_supplied' | 'manual';

export const RETRIEVAL_METHODS: readonly RetrievalMethod[] = [
  'fetch',
  'search',
  'user_supplied',
  'manual',
] as const;

/**
 * How a source relates to other sources.
 *
 * Two outlets reprinting one press release are not two independent sources.
 * Without this distinction "three sources agree" becomes an actively misleading
 * quality signal, and corroboration counts inflate exactly where the underlying
 * evidence is weakest. coverage.ts counts independent corroboration only.
 */
export type IndependenceType =
  | 'independent'
  | 'republished'
  | 'derived_from'
  | 'same_organisation'
  | 'unknown';

export const INDEPENDENCE_TYPES: readonly IndependenceType[] = [
  'independent',
  'republished',
  'derived_from',
  'same_organisation',
  'unknown',
] as const;

export interface SourceIndependence {
  type: IndependenceType;
  /** The source this one derives from, when type is not 'independent'. */
  of_source_id?: string;
}

export interface Source extends Identified {
  url?: string;
  title?: string;
  publisher?: string;
  author?: string;
  source_type: string;
  published_at?: IsoDateTime;
  updated_at?: IsoDateTime;
  /** Required. When we looked, which is not when the source was written. */
  accessed_at: IsoDateTime;
  retrieval_method: RetrievalMethod;
  /**
   * Where the retrieved content is stored, relative to the run directory, and
   * its hash. The distinction between "this URL exists" and "this is what we
   * actually saw" is what makes a review reproducible after a competitor
   * rewrites their pricing page or a social post is deleted.
   *
   * Required for retrieval_method 'fetch'; integrity.ts enforces that.
   */
  snapshot_path?: string;
  content_hash?: string;
  /** Source tiering per spec section 66. Not all sources are equal. */
  authority: Level;
  independence: SourceIndependence;
  geographic_scope?: string[];
  language?: string;
  entity_id?: string;
}

/**
 * 'absence' is a real research result and a different thing from a conclusion.
 *
 * "No pricing found after checking /pricing, /product and /faq" is an
 * observation we can defend. "They do not publish pricing" is a claim we cannot.
 * Absence observations must carry the scope searched, or the distinction
 * collapses back into the unsupported version.
 */
export type ObservationType = 'positive' | 'negative' | 'absence';

export const OBSERVATION_TYPES: readonly ObservationType[] = [
  'positive',
  'negative',
  'absence',
] as const;

/**
 * Something directly observed. Carries no interpretation.
 *
 * Splitting this from Evidence is what stops the reasoning layer collapsing
 * observation into conclusion, which spec section 5 identifies as the failure
 * that makes an entire report undefendable.
 */
export interface Observation extends Identified {
  source_id: string;
  observation_type: ObservationType;
  statement: string;
  /** Required when observation_type is 'absence'. Where we actually looked. */
  search_scope?: string[];
  /** Selector, quote anchor, page path or timestamp. Makes it checkable. */
  locator: string;
  observed_at: IsoDateTime;
}
