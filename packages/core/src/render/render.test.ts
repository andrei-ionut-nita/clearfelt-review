import { describe, expect, it } from 'vitest';
import { makeValidReview } from '../testing/factory.ts';
import { makeWorkedExample } from '../testing/worked-example.ts';
import { renderBrief } from './brief.ts';
import { renderJson } from './json.ts';
import { renderPlan } from './plan.ts';
import { ID_IN_TEXT, allIds, buildView } from './view.ts';

const view = buildView(makeWorkedExample());

/**
 * The completeness guard. Applied to every renderer, because a renderer that
 * invents a reference produces a report whose traceability silently does not
 * resolve, which is worse than one that omits the reference entirely.
 */
function assertNoInventedIds(output: string): void {
  const known = allIds(view.review);
  const found = output.match(ID_IN_TEXT) ?? [];
  const invented = [...new Set(found)].filter((id) => !known.has(id));
  expect(invented).toEqual([]);
}

describe('every renderer', () => {
  const outputs: [string, string][] = [
    ['json', renderJson(view)],
    ['brief', renderBrief(view)],
    ['plan', renderPlan(view)],
  ];

  for (const [name, output] of outputs) {
    it(`${name} contains no id absent from the model`, () => {
      assertNoInventedIds(output);
    });

    it(`${name} uses no em-dash or arrow characters`, () => {
      // Escaped, not literal, so this assertion does not itself violate the
      // repository rule it exists to enforce.
      expect(output).not.toMatch(/[\u2014\u2192\u2190]/);
    });

    it(`${name} produces output for an empty run without throwing`, () => {
      const empty = buildView({
        ...makeValidReview(),
        findings: [],
        recommendations: [],
        actions: [],
        opportunities: [],
        evidence: [],
      });
      expect(() => {
        if (name === 'json') renderJson(empty);
        if (name === 'brief') renderBrief(empty);
        if (name === 'plan') renderPlan(empty);
      }).not.toThrow();
    });
  }
});

describe('renderJson', () => {
  it('carries the derived values, so a consumer cannot compute a different priority', () => {
    const parsed = JSON.parse(renderJson(view));
    expect(parsed.derived.priorities[0].id).toBe('R-0001');
    expect(parsed.derived.priorities[0].priority).toBe('P0');
    expect(parsed.derived.change_tree.roots.length).toBeGreaterThan(0);
    expect(parsed.derived.coverage.totals.questions).toBe(5);
  });

  it('round-trips the model unchanged', () => {
    const parsed = JSON.parse(renderJson(view));
    expect(parsed.model.findings).toEqual(view.review.findings);
  });
});

describe('renderBrief', () => {
  const brief = renderBrief(view);

  it('leads with the decision the review exists to support', () => {
    expect(brief).toContain('The decision this supports');
    expect(brief).toContain(
      'What should change on the site and its positioning over the next 90 days?',
    );
  });

  it('marks an inferred finding as inferred, even when skimming', () => {
    // A reader who reads only the brief still needs to see which conclusions
    // go beyond the evidence.
    expect(brief).toMatch(/Seniority is claimed but not evidenced.*_\(inferred\)_/);
  });

  it('marks a contested finding as contested', () => {
    expect(brief).toMatch(/The proposition leads on capability.*_\(contested\)_/);
  });

  it('surfaces an unvalidated assumption on the recommendation that rests on it', () => {
    expect(brief).toContain('Depends on an unvalidated assumption');
    expect(brief).toContain('ASM-0001');
  });

  it('states what could not be established rather than omitting it', () => {
    expect(brief).toContain('What we could not establish');
    expect(brief).toContain('UNK-0001');
    expect(brief).toContain('no_evidence_available');
  });
});

describe('renderPlan', () => {
  const plan = renderPlan(view);

  it('groups the to-do list by computed priority', () => {
    expect(plan).toContain('## To-do list');
    expect(plan).toMatch(/### P0[\s\S]*R-0001/);
  });

  it('explains why a recommendation has the priority it has', () => {
    // Specification section 25: the user must be able to understand why
    // something is P0, so the arithmetic travels into the output.
    expect(plan).toMatch(
      /\*\*Priority P0\.\*\* impact high, urgency high, confidence high, effort medium scores \d+/,
    );
  });

  it('shows the falsifier for every recommendation', () => {
    const falsifiers = plan.match(/Would be proved wrong by:/g) ?? [];
    expect(falsifiers).toHaveLength(view.review.recommendations.length);
  });

  it('carries contradicting evidence next to the finding, not in a footnote', () => {
    expect(plan).toMatch(/\*\*Contradicted by\.\*\* E-0005/);
  });

  it('keeps the search scope attached to an absence observation', () => {
    expect(plan).toContain('Absence.');
    expect(plan).toMatch(/Searched: \/, \/about, \/writing/);
  });

  it('records why a comparison was rejected', () => {
    expect(plan).toContain('COMP-0003');
    expect(plan).toMatch(/Rejected: A consultancy is bought instead of a hire/);
  });

  it('lists change tree nodes with the chain that produced them', () => {
    expect(plan).toMatch(/`WEBSITE\/index\/hero`: A-0001 from R-0001, supported by F-0001, F-0002/);
  });

  it('reports assessment by area with confidence, not one overall score', () => {
    expect(plan).toContain('## Assessment by area');
    expect(plan).not.toMatch(/overall score/i);
  });

  it('separates what was inferred from what was observed', () => {
    expect(plan).toContain('### What we inferred rather than observed');
    expect(plan).toContain('F-0003');
  });

  it('reports research that did not succeed', () => {
    expect(plan).toContain('### Research that did not succeed');
    expect(plan).toContain('Search result pages could not be retrieved programmatically.');
    expect(plan).toContain('No analytics access was available');
  });

  it('explains why a question stopped, not just that it did', () => {
    // "insufficient evidence" as a bare label tells a reader nothing they can
    // act on or disagree with. The detail is the part that does.
    expect(plan).toMatch(/Stopped because: no_evidence_available\.\n {2}No analytics access/);
  });

  it('shows which findings use each evidence item', () => {
    expect(plan).toMatch(/\*\*Used by\.\*\* F-0001, F-0003/);
    expect(plan).toMatch(/F-0001 \(contradicts\)/);
  });
});
