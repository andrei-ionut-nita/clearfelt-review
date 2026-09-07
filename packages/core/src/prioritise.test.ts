import { describe, expect, it } from 'vitest';
import { LEVELS } from './model/index.ts';
import { prioritise, prioritiseOne, quadrantFor, scoreOf } from './prioritise.ts';
import { makeRecommendation, makeValidReview } from './testing/factory.ts';

describe('scoreOf', () => {
  it('weights impact above urgency and confidence, and effort least', () => {
    const base = { impact: 'low', urgency: 'low', confidence: 'low', effort: 'low' } as const;
    const lifted = (field: 'impact' | 'urgency' | 'confidence') =>
      scoreOf({ ...base, [field]: 'high' }) - scoreOf(base);
    expect(lifted('impact')).toBeGreaterThan(lifted('urgency'));
    expect(lifted('urgency')).toBe(lifted('confidence'));
  });

  it('treats effort as a penalty, not a blocker', () => {
    const easy = scoreOf({ impact: 'high', urgency: 'high', confidence: 'high', effort: 'low' });
    const hard = scoreOf({ impact: 'high', urgency: 'high', confidence: 'high', effort: 'high' });
    expect(hard).toBeLessThan(easy);
    // A hard change worth making is still worth making: both remain P0.
    expect(prioritiseOne(makeRecommendation({ effort: 'high' })).priority).toBe('P0');
  });
});

describe('bands', () => {
  it('makes an urgent, high impact, confident recommendation P0', () => {
    const rec = makeRecommendation({ impact: 'high', urgency: 'high', confidence: 'high' });
    expect(prioritiseOne(rec).priority).toBe('P0');
  });

  it('makes an all medium recommendation P2', () => {
    const rec = makeRecommendation({
      impact: 'medium',
      urgency: 'medium',
      confidence: 'medium',
      effort: 'medium',
    });
    expect(prioritiseOne(rec).priority).toBe('P2');
  });
});

describe('caps', () => {
  it('never lets low impact reach P1, however urgent', () => {
    const rec = makeRecommendation({
      impact: 'low',
      urgency: 'high',
      confidence: 'high',
      effort: 'low',
    });
    const result = prioritiseOne(rec);
    expect(result.priority).toBe('P2');
    expect(result.rationale).toContain('impact is low');
  });

  it('never lets low confidence reach P0, across every combination', () => {
    // Asserted exhaustively rather than on one example. With the current
    // weights low confidence cannot reach 18 anyway, so the cap is a guarantee
    // rather than an active constraint. Testing the property means a later
    // weight change that quietly makes P0 reachable fails here instead of
    // shipping a confident-looking recommendation built on weak evidence.
    for (const impact of LEVELS) {
      for (const urgency of LEVELS) {
        for (const effort of LEVELS) {
          const result = prioritiseOne(
            makeRecommendation({ impact, urgency, effort, confidence: 'low' }),
          );
          expect(result.priority).not.toBe('P0');
        }
      }
    }
  });

  it('never lets low impact reach P0 or P1, across every combination', () => {
    for (const urgency of LEVELS) {
      for (const confidence of LEVELS) {
        for (const effort of LEVELS) {
          const result = prioritiseOne(
            makeRecommendation({ impact: 'low', urgency, confidence, effort }),
          );
          expect(['P2', 'P3']).toContain(result.priority);
        }
      }
    }
  });
});

describe('rationale', () => {
  it('always explains the band, so a user can ask why something is P0', () => {
    const result = prioritiseOne(makeRecommendation());
    expect(result.rationale).toMatch(/impact high/);
    expect(result.rationale).toMatch(/scores \d+/);
  });
});

describe('quadrantFor', () => {
  it('maps the spec section 26 opportunity map', () => {
    expect(quadrantFor('high', 'low')).toBe('do_now');
    expect(quadrantFor('high', 'high')).toBe('strategic_bet');
    expect(quadrantFor('low', 'low')).toBe('quick_win');
    expect(quadrantFor('low', 'high')).toBe('defer');
  });
});

describe('prioritise', () => {
  it('sorts most important first and stays stable for equal scores', () => {
    const review = makeValidReview({
      recommendations: [
        makeRecommendation({ id: 'R-0002', impact: 'low', urgency: 'low', confidence: 'low' }),
        makeRecommendation({ id: 'R-0001' }),
        makeRecommendation({
          id: 'R-0003',
          impact: 'high',
          urgency: 'high',
          confidence: 'high',
          effort: 'low',
        }),
      ],
    });
    expect(prioritise(review).map((r) => r.id)).toEqual(['R-0003', 'R-0001', 'R-0002']);
  });
});
