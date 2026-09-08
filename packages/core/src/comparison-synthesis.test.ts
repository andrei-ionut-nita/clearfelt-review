import { describe, expect, it } from 'vitest';
import {
  INTENSITIES,
  buildSaturationTable,
  crowdedTerritories,
  underoccupiedTerritories,
} from './comparison-synthesis.ts';
import { LEVELS } from './model/index.ts';
import { makeComparison, makeOpportunity, makeValidReview } from './testing/factory.ts';
import { makeWorkedExample } from './testing/worked-example.ts';

describe('buildSaturationTable', () => {
  it('produces no rows when nothing names a territory', () => {
    expect(buildSaturationTable(makeValidReview()).rows).toEqual([]);
  });

  it('rates an uncontested territory low saturation with no occupants', () => {
    const review = makeValidReview({
      opportunities: [
        makeOpportunity({
          white_space: { territory: 'Technology economics', current_position: 'high' },
        }),
      ],
    });
    const [row] = buildSaturationTable(review).rows;
    expect(row?.saturation).toBe('low');
    expect(row?.occupants).toEqual([]);
    // The flagship case from specification section 19: nobody there, and the
    // subject already stands there. That is the whole point of white space.
    expect(row?.classification).toBe('white_space');
    expect(row?.opportunity).toBe('very_high');
  });

  it('only counts qualified comparisons toward saturation', () => {
    const review = makeValidReview({
      comparisons: [
        makeComparison({ id: 'COMP-0001', status: 'proposed', relevance: 'high' }),
        makeComparison({ id: 'COMP-0002', status: 'rejected', relevance: 'high' }),
        makeComparison({ id: 'COMP-0003', status: 'qualified', relevance: 'low' }),
      ],
    });
    const [row] = buildSaturationTable(review).rows;
    // A proposed or rejected comparison has not survived qualification, so it
    // must not be able to make a territory look crowded before anyone checked.
    // Only the qualified entry, weight 1, should appear.
    expect(row?.occupants.map((o) => o.comparison_id)).toEqual(['COMP-0003']);
    expect(row?.saturation).toBe('medium');
  });

  it('does not even surface a territory that only an unqualified comparison names', () => {
    const review = makeValidReview({
      comparisons: [
        makeComparison({ status: 'proposed', positioning_territories: ['Unqualified only'] }),
      ],
    });
    // A territory nobody qualified is not yet a real signal about the
    // landscape; it should not appear in the table at all.
    expect(buildSaturationTable(review).rows).toEqual([]);
  });

  it('weights saturation by relevance rather than counting flatly', () => {
    const review = makeValidReview({
      comparisons: [
        makeComparison({ id: 'COMP-0001', status: 'qualified', relevance: 'low' }),
        makeComparison({ id: 'COMP-0002', status: 'qualified', relevance: 'low' }),
      ],
    });
    const [row] = buildSaturationTable(review).rows;
    // Two barely-relevant entrants (weight 1 each, score 2) read as medium, not
    // as crowded as one squarely-positioned high-relevance competitor would.
    expect(row?.saturation).toBe('medium');
  });

  it('reports current_position as unknown when no opportunity named the territory', () => {
    const review = makeValidReview({
      comparisons: [makeComparison({ positioning_territories: ['Some territory'] })],
    });
    const [row] = buildSaturationTable(review).rows;
    expect(row?.current_position).toBe('unknown');
  });

  it('does not let saturation rise as fewer, less relevant comparisons occupy a territory', () => {
    // The property that matters more than any individual band boundary.
    for (const position of LEVELS) {
      const low = buildSaturationTable(
        makeValidReview({
          comparisons: [makeComparison({ relevance: 'low' })],
          opportunities: [
            makeOpportunity({
              white_space: { territory: 'Technical leadership', current_position: position },
            }),
          ],
        }),
      ).rows[0];
      const high = buildSaturationTable(
        makeValidReview({
          comparisons: [
            makeComparison({ id: 'COMP-0001', relevance: 'high' }),
            makeComparison({ id: 'COMP-0002', relevance: 'high' }),
          ],
          opportunities: [
            makeOpportunity({
              white_space: { territory: 'Technical leadership', current_position: position },
            }),
          ],
        }),
      ).rows[0];
      const rank = (level: (typeof INTENSITIES)[number]) =>
        INTENSITIES.length - INTENSITIES.indexOf(level);
      expect(rank(high?.saturation ?? 'low')).toBeGreaterThanOrEqual(
        rank(low?.saturation ?? 'low'),
      );
    }
  });

  it('never lets opportunity fall as position improves at fixed saturation', () => {
    const rank = (level: (typeof INTENSITIES)[number]) =>
      INTENSITIES.length - INTENSITIES.indexOf(level);
    for (const saturationComparisons of [[], [makeComparison({ relevance: 'high' })]]) {
      const byPosition = LEVELS.map(
        (position) =>
          buildSaturationTable(
            makeValidReview({
              comparisons: saturationComparisons,
              opportunities: [
                makeOpportunity({ white_space: { territory: 'T', current_position: position } }),
              ],
            }),
          ).rows[0],
      );
      const low = byPosition.find((r) => r?.current_position === 'low');
      const med = byPosition.find((r) => r?.current_position === 'medium');
      const high = byPosition.find((r) => r?.current_position === 'high');
      expect(rank(med?.opportunity ?? 'low')).toBeGreaterThanOrEqual(
        rank(low?.opportunity ?? 'low'),
      );
      expect(rank(high?.opportunity ?? 'low')).toBeGreaterThanOrEqual(
        rank(med?.opportunity ?? 'low'),
      );
    }
  });

  it('never lets opportunity rise as saturation worsens at fixed position', () => {
    const rank = (level: (typeof INTENSITIES)[number]) =>
      INTENSITIES.length - INTENSITIES.indexOf(level);
    const uncontested = buildSaturationTable(
      makeValidReview({
        comparisons: [],
        opportunities: [
          makeOpportunity({ white_space: { territory: 'T', current_position: 'high' } }),
        ],
      }),
    ).rows[0];
    const crowded = buildSaturationTable(
      makeValidReview({
        comparisons: [
          makeComparison({ id: 'COMP-0001', relevance: 'high' }),
          makeComparison({ id: 'COMP-0002', relevance: 'high' }),
        ],
        opportunities: [
          makeOpportunity({ white_space: { territory: 'T', current_position: 'high' } }),
        ],
      }),
    ).rows[0];
    expect(rank(crowded?.opportunity ?? 'low')).toBeLessThanOrEqual(
      rank(uncontested?.opportunity ?? 'low'),
    );
  });

  it('takes the first opportunity naming a territory when more than one does', () => {
    const review = makeValidReview({
      opportunities: [
        makeOpportunity({ id: 'O-0001', white_space: { territory: 'T', current_position: 'low' } }),
        makeOpportunity({
          id: 'O-0002',
          supporting_finding_ids: ['F-0001'],
          white_space: { territory: 'T', current_position: 'high' },
        }),
      ],
    });
    const [row] = buildSaturationTable(review).rows;
    expect(row?.current_position).toBe('low');
    expect(row?.opportunity_ids).toEqual(['O-0001', 'O-0002']);
  });
});

describe('crowdedTerritories and underoccupiedTerritories', () => {
  it('separate the two halves of the table', () => {
    const review = makeValidReview({
      comparisons: [
        makeComparison({
          id: 'COMP-0001',
          relevance: 'high',
          positioning_territories: ['Crowded'],
        }),
        makeComparison({
          id: 'COMP-0002',
          relevance: 'high',
          positioning_territories: ['Crowded'],
        }),
      ],
      opportunities: [
        makeOpportunity({ white_space: { territory: 'Open', current_position: 'high' } }),
      ],
    });
    const table = buildSaturationTable(review);
    expect(crowdedTerritories(table).map((r) => r.territory)).toEqual(['Crowded']);
    expect(underoccupiedTerritories(table).map((r) => r.territory)).toEqual(['Open']);
  });
});

describe('possible_duplicate_territories', () => {
  it('flags two qualified comparisons naming near-duplicate territory names', () => {
    const review = makeValidReview({
      comparisons: [
        makeComparison({ id: 'COMP-0001', positioning_territories: ['Technical leadership'] }),
        makeComparison({
          id: 'COMP-0002',
          positioning_territories: ['Technical thought leadership'],
        }),
      ],
    });
    const { possible_duplicate_territories: duplicates } = buildSaturationTable(review);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toMatchObject({
      territory_a: 'Technical leadership',
      territory_b: 'Technical thought leadership',
      comparison_ids_a: ['COMP-0001'],
      comparison_ids_b: ['COMP-0002'],
    });
    expect(duplicates[0]?.similarity).toBeGreaterThanOrEqual(0.4);
  });

  it('does not flag two unrelated territory names', () => {
    const review = makeValidReview({
      comparisons: [
        makeComparison({ id: 'COMP-0001', positioning_territories: ['Technical leadership'] }),
        makeComparison({ id: 'COMP-0002', positioning_territories: ['Pricing transparency'] }),
      ],
    });
    expect(buildSaturationTable(review).possible_duplicate_territories).toEqual([]);
  });

  it('excludes a territory named only by an opportunity, with no qualified occupant', () => {
    const review = makeValidReview({
      comparisons: [
        makeComparison({ id: 'COMP-0001', positioning_territories: ['Technical leadership'] }),
      ],
      opportunities: [
        makeOpportunity({
          white_space: { territory: 'Technical thought leadership', current_position: 'high' },
        }),
      ],
    });
    // A territory named only by an opportunity's white_space has no comparison
    // id to point at, so it must never appear on either side of a caution.
    expect(buildSaturationTable(review).possible_duplicate_territories).toEqual([]);
  });

  it('is empty when nothing names more than one territory', () => {
    expect(buildSaturationTable(makeValidReview()).possible_duplicate_territories).toEqual([]);
  });
});

describe('the worked example', () => {
  it('produces a saturation table that validates and demonstrates every classification', () => {
    const table = buildSaturationTable(makeWorkedExample());
    const classifications = new Set(table.rows.map((r) => r.classification));
    // Deliberately exercises more than the happy path, the same discipline the
    // rest of the fixture follows: a crowded territory nobody has judged the
    // subject's position in, and the flagship uncontested white space.
    expect(classifications.has('white_space')).toBe(true);
    expect(classifications.has('contested')).toBe(true);
  });
});
