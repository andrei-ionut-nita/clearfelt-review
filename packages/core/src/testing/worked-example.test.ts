import { describe, expect, it } from 'vitest';
import { formatIssues, validateReview } from '../validate/index.ts';
import { makeWorkedExample } from './worked-example.ts';

describe('the worked example fixture', () => {
  it('validates with no errors', () => {
    // Every renderer test reads this fixture. If it stopped validating, those
    // tests would be rendering something the product would refuse to render.
    const result = validateReview(makeWorkedExample());
    expect(formatIssues(result.errors)).toBe('');
  });

  it('exercises the awkward cases a clean fixture would miss', () => {
    const review = makeWorkedExample();
    expect(review.observations.some((o) => o.observation_type === 'absence')).toBe(true);
    expect(review.findings.some((f) => f.contradicted_by.length > 0)).toBe(true);
    expect(review.findings.some((f) => f.claim_type === 'inferred')).toBe(true);
    expect(review.assumptions.some((a) => a.status === 'unvalidated')).toBe(true);
    expect(review.user_assertions.some((a) => a.status === 'contradicted')).toBe(true);
    expect(review.comparisons.some((c) => c.status === 'rejected')).toBe(true);
    expect(review.research_questions.some((q) => q.stop_reason === 'no_evidence_available')).toBe(
      true,
    );
    expect(review.research_questions.some((q) => q.stop_reason === 'blocked')).toBe(true);
    expect(review.research_log.events.some((e) => e.outcome !== 'succeeded')).toBe(true);
  });

  it('names no real entity, so the fixture does not become the ontology', () => {
    const serialised = JSON.stringify(makeWorkedExample());
    expect(serialised).not.toMatch(/andreinita/i);
  });
});
