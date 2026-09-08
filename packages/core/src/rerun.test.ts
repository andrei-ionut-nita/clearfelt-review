import { describe, expect, it } from 'vitest';
import { rerunSummary } from './rerun.ts';
import { makeRecommendation, makeValidReview } from './testing/factory.ts';

describe('rerunSummary', () => {
  it('names the previous run and lists each recommendation with its falsifier', () => {
    const summary = rerunSummary(makeValidReview());
    expect(summary).toContain('acme/r-001');
    expect(summary).toContain('R-0001');
    expect(summary).toContain('Lead the homepage with the economics framing');
    expect(summary).toContain(
      'No change in qualified enquiry rate after eight weeks of comparable traffic.',
    );
    expect(summary).toContain('8 weeks');
  });

  it('says plainly when there is nothing to assess yet', () => {
    const summary = rerunSummary(makeValidReview({ recommendations: [] }));
    expect(summary).toContain('produced no recommendations');
    expect(summary).not.toContain('R-0001');
  });

  it('lists every recommendation, not just the first', () => {
    const summary = rerunSummary(
      makeValidReview({
        recommendations: [
          makeRecommendation({ id: 'R-0001', title: 'First' }),
          makeRecommendation({ id: 'R-0002', title: 'Second' }),
        ],
      }),
    );
    expect(summary).toContain('R-0001');
    expect(summary).toContain('First');
    expect(summary).toContain('R-0002');
    expect(summary).toContain('Second');
  });
});
