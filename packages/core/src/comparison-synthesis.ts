import type { Comparison, ComparisonType, Level, Review } from './model/index.ts';

/**
 * Cross-landscape synthesis over the comparison set: specification section 19's
 * saturation table and section 20's white space, computed rather than asserted.
 *
 * Spec section 19 gives a worked example with a four-value saturation column
 * ("Very high" alongside High, Medium, Low) and a four-value opportunity
 * column. Three-valued Level does not stretch that far, so this module carries
 * its own four-valued scale rather than overloading Level everywhere else in
 * the model. See docs/decisions/0009-computed-saturation.md.
 */
export type Intensity = 'very_high' | 'high' | 'medium' | 'low';

export const INTENSITIES: readonly Intensity[] = ['very_high', 'high', 'medium', 'low'] as const;

/**
 * A single-word read of the territory, for a table column and for a renderer
 * to key a visual treatment off. Emerging threats and benchmark strengths from
 * spec section 19's bullet list are deliberately not modelled here: both need
 * trend or benchmark-relationship evidence the model does not yet carry, and
 * a classification pretending to detect them from two static axes would be
 * manufacturing a signal rather than computing one. Recorded as a known
 * limitation in docs/ROADMAP.md rather than faked.
 */
export type TerritoryClassification =
  | 'white_space'
  | 'differentiation_opportunity'
  | 'contested'
  | 'weak_spot'
  | 'table_stakes'
  | 'underoccupied';

export interface TerritoryOccupant {
  comparison_id: string;
  name: string;
  type: ComparisonType;
  relevance: Level;
}

export interface TerritoryRow {
  territory: string;
  saturation: Intensity;
  /** How the saturation score was reached, so a reader can check the count. */
  saturation_rationale: string;
  /**
   * The subject's own standing in this territory. 'unknown' when no opportunity
   * declared a current_position for it: the territory is visible only because
   * comparisons contest it, and nobody has yet judged where the subject stands.
   * Rendering that as a Level would assert a position nobody assessed.
   */
  current_position: Level | 'unknown';
  opportunity: Intensity;
  classification: TerritoryClassification;
  occupants: TerritoryOccupant[];
  /** Opportunities that named this territory, for click-through. */
  opportunity_ids: string[];
}

export interface SaturationTable {
  rows: TerritoryRow[];
}

const LEVEL_WEIGHT: Record<Level, number> = { high: 3, medium: 2, low: 1 };

/**
 * Saturation as a weighted count of qualified occupants.
 *
 * Only 'qualified' comparisons count. A 'proposed' comparison has not survived
 * qualification and asserting it crowds a territory would let an unvetted
 * candidate shape a strategic conclusion; a 'rejected' one was found not to
 * belong here at all. Weighted by relevance rather than counted flatly,
 * because three barely-relevant entrants should not read as more crowded than
 * one squarely-positioned direct competitor.
 */
function computeSaturation(
  territory: string,
  comparisons: readonly Comparison[],
): { level: Intensity; rationale: string; occupants: TerritoryOccupant[] } {
  const occupants = comparisons
    .filter((c) => c.status === 'qualified' && c.positioning_territories.includes(territory))
    .map((c) => ({ comparison_id: c.id, name: c.name, type: c.type, relevance: c.relevance }));

  const score = occupants.reduce((sum, o) => sum + LEVEL_WEIGHT[o.relevance], 0);
  const level: Intensity =
    score >= 6 ? 'very_high' : score >= 3 ? 'high' : score >= 1 ? 'medium' : 'low';

  const rationale =
    occupants.length === 0
      ? 'No qualified comparison contests this territory.'
      : `${occupants.length} qualified comparison(s) contest this territory (weighted score ${score}): ${occupants
          .map((o) => `${o.name} (${o.relevance})`)
          .join(', ')}.`;

  return { level, rationale, occupants };
}

/**
 * Opportunity as a function of saturation and position.
 *
 * A lookup table rather than a formula, so every cell can be read and argued
 * with directly. Two properties hold by construction and are the properties
 * worth trusting rather than the exact cell values: opportunity never falls as
 * position rises for a fixed saturation, and never rises as saturation
 * increases for a fixed position. This is one reasonable operationalisation of
 * section 19's worked example, not a reproduction of its exact figures: the
 * illustrative table there appears to draw on judgement beyond these two axes,
 * and pretending otherwise would be manufacturing precision section 40 forbids.
 */
const OPPORTUNITY_MATRIX: Record<Intensity, Record<Level, Intensity>> = {
  low: { low: 'medium', medium: 'high', high: 'very_high' },
  medium: { low: 'medium', medium: 'medium', high: 'high' },
  high: { low: 'low', medium: 'medium', high: 'medium' },
  very_high: { low: 'low', medium: 'low', high: 'medium' },
};

function classify(saturation: Intensity, position: Level | 'unknown'): TerritoryClassification {
  const crowded = saturation === 'high' || saturation === 'very_high';
  if (position === 'unknown') return crowded ? 'contested' : 'underoccupied';
  if (saturation === 'low') return position === 'high' ? 'white_space' : 'underoccupied';
  if (crowded) return position === 'high' ? 'table_stakes' : 'weak_spot';
  // medium saturation
  return position === 'low'
    ? 'weak_spot'
    : position === 'high'
      ? 'differentiation_opportunity'
      : 'contested';
}

/** Every territory named by a qualified comparison or by an opportunity's white space, in first-seen order. */
function collectTerritories(review: Review): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  const add = (territory: string | undefined): void => {
    if (!territory || seen.has(territory)) return;
    seen.add(territory);
    ordered.push(territory);
  };
  for (const comparison of review.comparisons) {
    if (comparison.status !== 'qualified') continue;
    for (const territory of comparison.positioning_territories) add(territory);
  }
  for (const opportunity of review.opportunities) add(opportunity.white_space?.territory);
  return ordered;
}

export function buildSaturationTable(review: Review): SaturationTable {
  const territories = collectTerritories(review);

  const rows: TerritoryRow[] = territories.map((territory) => {
    const {
      level: saturation,
      rationale,
      occupants,
    } = computeSaturation(territory, review.comparisons);

    const namingOpportunities = review.opportunities.filter(
      (o) => o.white_space?.territory === territory,
    );
    // First-declared position wins, named in the rationale so a conflicting
    // second claim is visible rather than silently overwritten.
    const currentPosition: Level | 'unknown' = namingOpportunities[0]?.white_space
      ? namingOpportunities[0].white_space.current_position
      : 'unknown';

    return {
      territory,
      saturation,
      saturation_rationale: rationale,
      current_position: currentPosition,
      opportunity:
        OPPORTUNITY_MATRIX[saturation][currentPosition === 'unknown' ? 'medium' : currentPosition],
      classification: classify(saturation, currentPosition),
      occupants,
      opportunity_ids: namingOpportunities.map((o) => o.id),
    };
  });

  return { rows };
}

/** Territories with no qualified occupant at all: open by construction. */
export function underoccupiedTerritories(table: SaturationTable): TerritoryRow[] {
  return table.rows.filter((row) => row.occupants.length === 0);
}

/** Territories at least two qualified comparisons are contesting. */
export function crowdedTerritories(table: SaturationTable): TerritoryRow[] {
  return table.rows.filter((row) => row.saturation === 'high' || row.saturation === 'very_high');
}
