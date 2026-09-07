import { describe, expect, it } from 'vitest';
import {
  makeAssumption,
  makeEvidence,
  makeFinding,
  makeRecommendation,
  makeValidReview,
} from './testing/factory.ts';
import { TraceError, idsIn, renderTraceAscii, trace } from './trace.ts';

describe('forward trace', () => {
  it('answers "why are you telling me this" all the way to a source', () => {
    // Spec section 79: if this walk cannot be performed, the pipeline is
    // incomplete however good the report looks.
    const result = trace(makeValidReview(), 'R-0001', 'forward');
    // The spine that matters: recommendation, finding, evidence, observation,
    // source. Asserted as a path rather than a flat list, because a
    // recommendation supported through an opportunity as well reaches the same
    // source by more than one route.
    const spine = [result.id, result.children[0]?.id];
    expect(spine).toEqual(['R-0001', 'F-0001']);
    const finding = result.children[0];
    expect(finding?.children[0]?.id).toBe('E-0001');
    expect(finding?.children[0]?.children[0]?.id).toBe('OBS-0001');
    expect(finding?.children[0]?.children[0]?.children[0]?.id).toBe('S-0001');
  });

  it('starts from an action and reaches the recommendation behind it', () => {
    const result = trace(makeValidReview(), 'A-0001', 'forward');
    expect(idsIn(result)).toContain('R-0001');
    expect(idsIn(result)).toContain('S-0001');
  });

  it('includes contradicting evidence, which is part of the answer', () => {
    const review = makeValidReview({
      evidence: [
        makeEvidence({ supports: ['F-0001'] }),
        makeEvidence({ id: 'E-0002', claim: 'The About page leads on capability instead.' }),
      ],
      findings: [makeFinding({ contradicted_by: ['E-0002'] })],
    });
    expect(idsIn(trace(review, 'F-0001', 'forward'))).toContain('E-0002');
  });

  it('surfaces an assumption a recommendation rests on', () => {
    const review = makeValidReview({
      assumptions: [makeAssumption()],
      recommendations: [makeRecommendation({ assumption_ids: ['ASM-0001'] })],
    });
    const result = trace(review, 'R-0001', 'forward');
    expect(idsIn(result)).toContain('ASM-0001');
  });
});

describe('reverse trace', () => {
  it('answers "what did this source actually change"', () => {
    const result = trace(makeValidReview(), 'S-0001', 'reverse');
    expect(idsIn(result)).toContain('A-0001');
    expect(result.children[0]?.children[0]?.id).toBe('E-0001');
  });

  it('shows both routes when a recommendation is reached two ways', () => {
    // The graph is a DAG rendered as a tree, so a recommendation supported both
    // directly by a finding and through an opportunity appears on both paths.
    // Collapsing that would hide that the support is doubled, which is exactly
    // what a reader checking the reasoning wants to see.
    const result = trace(makeValidReview(), 'F-0001', 'reverse');
    const routes = result.children.map((c) => c.id);
    expect(routes).toEqual(['O-0001', 'R-0001']);
    expect(result.children[0]?.children[0]?.id).toBe('R-0001');
  });
});

describe('labels', () => {
  it('marks a finding with its claim type, so an inference is visible in the walk', () => {
    const review = makeValidReview({ findings: [makeFinding({ claim_type: 'inferred' })] });
    const result = trace(review, 'F-0001', 'forward');
    expect(result.label).toContain('[inferred]');
  });

  it('marks an absence observation as an absence', () => {
    const review = makeValidReview({
      observations: [
        {
          id: 'OBS-0001',
          source_id: 'S-0001',
          observation_type: 'absence',
          statement: 'No pricing information found.',
          search_scope: ['/pricing'],
          locator: 'site search',
          observed_at: '2026-09-07T12:00:00.000Z',
        },
      ],
    });
    const result = trace(review, 'OBS-0001', 'forward');
    expect(result.label).toContain('[absence]');
  });
});

describe('errors', () => {
  it('refuses to trace an id that does not exist', () => {
    expect(() => trace(makeValidReview(), 'R-9999')).toThrow(TraceError);
  });
});

describe('renderTraceAscii', () => {
  it('renders the chain with ids first', () => {
    const output = renderTraceAscii(trace(makeValidReview(), 'R-0001', 'forward'));
    expect(output.split('\n')[0]).toMatch(/^R-0001 /);
    expect(output).toContain('S-0001');
    // Escaped rather than literal so the repository's em-dash check does not
    // flag this assertion as a violation of the rule it exists to enforce.
    expect(output).not.toMatch(/[\u2014\u2192]/);
  });
});
