/**
 * Shared primitives for the canonical intelligence model.
 *
 * Every type in this directory is a plain interface with no runtime behaviour.
 * The reasoning layer writes JSON that must satisfy these shapes; validate/
 * checks that it actually does. Nothing here throws, because the model is data.
 */

/**
 * Qualitative levels. Spec section 65 forbids manufacturing numerical precision
 * where none is justified, so confidence, impact, effort and urgency are all
 * three-valued rather than scored 0-100.
 */
export type Level = 'high' | 'medium' | 'low';

export const LEVELS: readonly Level[] = ['high', 'medium', 'low'] as const;

/**
 * When a claim is true of, which is not the same as when we observed it.
 * Without this, 2023 market data, 2026 competitor pricing and today's homepage
 * all read as contemporaneous, and a stale finding is indistinguishable from a
 * current one.
 */
export type TemporalScope = 'current' | 'historical' | 'trend' | 'forecast';

export const TEMPORAL_SCOPES: readonly TemporalScope[] = [
  'current',
  'historical',
  'trend',
  'forecast',
] as const;

/**
 * The distance travelled from evidence to conclusion, stated rather than implied.
 *
 * This exists because the most dangerous analytical failure is not a fabricated
 * source, which provenance checks catch, but real evidence supporting an
 * unjustified leap, which they do not. "Competitor X raised prices 15%" is
 * derived. "Customers will pay more" is inferred, and must say so.
 */
export type ClaimType = 'derived' | 'inferred' | 'hypothesis';

export const CLAIM_TYPES: readonly ClaimType[] = ['derived', 'inferred', 'hypothesis'] as const;

/**
 * Carried by every entity so a later run can supersede an earlier one without a
 * migration. The diff engine that reads these ships in a later phase; the fields
 * exist from the start because adding them across eighteen collections
 * afterwards is a migration rather than an addition.
 */
export interface Versioned {
  supersedes?: string;
  superseded_by?: string;
}

/** Every persisted entity has an id and may participate in versioning. */
export interface Identified extends Versioned {
  id: string;
}

/** A date-time in ISO 8601. Stored as a string so the model stays plain JSON. */
export type IsoDateTime = string;
