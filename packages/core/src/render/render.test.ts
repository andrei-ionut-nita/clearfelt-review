import { describe, expect, it } from 'vitest';
import { buildAdversarial } from '../testing/adversarial.ts';
import { makeOutcomeAssessment, makeValidReview } from '../testing/factory.ts';
import { makeWorkedExample } from '../testing/worked-example.ts';
import { renderBrief } from './brief.ts';
import { renderHtml } from './html/index.ts';
import { renderJson } from './json.ts';
import { renderPlan } from './plan.ts';
import { ID_IN_TEXT, allIds, buildView } from './view.ts';

const view = buildView(makeWorkedExample());

/**
 * The completeness guard. Applied to every renderer, because a renderer that
 * invents a reference produces a report whose traceability silently does not
 * resolve, which is worse than one that omits the reference entirely.
 */
function assertNoInventedIds(output: string, forView: typeof view = view): void {
  const known = allIds(forView.review);
  const found = output.match(ID_IN_TEXT) ?? [];
  const invented = [...new Set(found)].filter((id) => !known.has(id));
  expect(invented).toEqual([]);
}

describe('every renderer', () => {
  const outputs: [string, string][] = [
    ['json', renderJson(view)],
    ['brief', renderBrief(view)],
    ['plan', renderPlan(view)],
    ['html', renderHtml(view)],
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
        if (name === 'html') renderHtml(empty);
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

describe('renderHtml', () => {
  const html = renderHtml(view);

  it('is a single self-contained file with no external resources', () => {
    // The report has to keep working offline, emailed, or from a USB stick.
    expect(html).not.toMatch(/<link[^>]+href=["']https?:/);
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toMatch(/https?:\/\/(cdn|unpkg|fonts\.googleapis)/);
  });

  it('embeds the model so the drill-down can walk it in the browser', () => {
    expect(html).toContain('id="review-data"');
    const island = html.split('id="review-data">')[1]?.split('</script>')[0] ?? '';
    const parsed = JSON.parse(island.replace(/\\u003c/g, '<'));
    expect(parsed.findings).toHaveLength(view.review.findings.length);
    expect(parsed.priorities[0].priority).toBe('P0');
  });

  it('escapes the closing script sequence so the island cannot break out', () => {
    const hostile = buildView({
      ...makeWorkedExample(),
      unknowns: [
        {
          id: 'UNK-0009',
          statement: 'A value containing </script><script>alert(1)</script>',
          why_unknown: 'Testing escaping.',
          blocks_finding_ids: [],
        },
      ],
    });
    const output = renderHtml(hostile);
    const island = output.split('id="review-data">')[1]?.split('</script>')[0] ?? '';
    // If the island terminated early, this would not parse.
    expect(() => JSON.parse(island.replace(/\\u003c/g, '<'))).not.toThrow();
  });

  it('escapes model text rendered into markup', () => {
    const hostile = buildView({
      ...makeWorkedExample(),
      unknowns: [
        {
          id: 'UNK-0009',
          statement: '<img src=x onerror=alert(1)>',
          why_unknown: 'Testing escaping.',
          blocks_finding_ids: [],
        },
      ],
    });
    expect(renderHtml(hostile)).not.toContain('<img src=x onerror=');
  });

  it('marks an inferred finding distinctly from a derived one', () => {
    expect(html).toMatch(/class="tag inferred"/);
  });

  it('marks a contested finding and shows what contradicts it', () => {
    expect(html).toMatch(/class="tag contested"/);
    expect(html).toContain('Contradicted by.');
  });

  it('renders an absence observation as an absence, with its search scope', () => {
    expect(html).toMatch(/class="tag absence"/);
    expect(html).toContain('Searched:');
  });

  it('shows the unvalidated assumption on the recommendation that rests on it', () => {
    expect(html).toContain('Rests on an unvalidated assumption');
    expect(html).toContain('ASM-0001');
  });

  it('plots every recommendation on the opportunity map', () => {
    const quadrantItems = html.split('class="matrix"')[1]?.split('</section>')[0] ?? '';
    for (const rec of view.review.recommendations) {
      expect(quadrantItems).toContain(rec.id);
    }
  });

  it('makes every id a drill-down chip', () => {
    expect(html).toMatch(/class="chip" data-id="R-0001"/);
    expect(html).toMatch(/class="chip" data-id="S-0001"/);
  });

  it('centres content via an inner wrapper, not by sizing the grid item', () => {
    // Regression: max-width plus justify-self on <main> switched it to
    // fit-content sizing, so on a narrow viewport it sized to its content and
    // the whole page scrolled sideways. Verified in a browser at 390px.
    expect(html).toContain('<div class="wrap">');
    expect(html).toContain('main > .wrap { max-width: 1200px; margin: 0 auto; }');
    expect(html).not.toMatch(/main \{[^}]*justify-self/);
  });

  it('carries the search scope of an absence into the drill-down panel', () => {
    // An absence must not read as a bare claim anywhere it surfaces, including
    // one click away on the evidence item built from it.
    expect(html).toContain("row('Searched', (obs.search_scope || []).join(', '))");
  });

  it('wraps every wide table so the page never scrolls sideways', () => {
    const tables = html.match(/<table>/g) ?? [];
    const wrapped = html.match(/<div class="scroll-x">/g) ?? [];
    expect(tables.length).toBeGreaterThan(0);
    expect(wrapped.length).toBeGreaterThan(0);
  });

  it('keeps a rejected comparison visible with its reason', () => {
    expect(html).toContain('COMP-0003');
    expect(html).toContain('was rejected');
  });

  it('marks a card with its kind, so a reader can tell what it is while scrolling', () => {
    expect(html).toMatch(/data-kind="finding"/);
    expect(html).toMatch(/data-kind="recommendation"/);
    expect(html).toMatch(/data-kind="evidence"/);
  });

  it('leads a recommendation with the change it asks for, before the rationale', () => {
    const section = html.split('<section id="recommendations">')[1] ?? '';
    const askIndex = section.indexOf('class="ask"');
    const rationaleIndex = section.indexOf('Problem and rationale');
    expect(askIndex).toBeGreaterThan(-1);
    expect(rationaleIndex).toBeGreaterThan(-1);
    expect(askIndex).toBeLessThan(rationaleIndex);
  });

  it('offers a filter on every long list, not only findings and recommendations', () => {
    expect(html).toMatch(/data-filter-target="evidence-list"/);
    expect(html).toMatch(/data-filter-target="opportunities-list"/);
    expect(html).toMatch(/data-filter-target="roadmap-list"/);
  });

  it('shows a P0 shortcut and a reading-progress indicator', () => {
    expect(html).toContain('id="jump-p0"');
    expect(html).toContain('id="progress-fill"');
  });
});

describe('the report criticising itself', () => {
  const bad = buildView(buildAdversarial('generic-language'));

  it('prints the section even when the run is clean', () => {
    // If this section only appeared on a bad run, its presence would be the
    // warning and its absence would be unverifiable. A clean run has to make
    // the claim out loud so a reader can check it.
    expect(renderPlan(view)).toContain('## How this review checks out');
    expect(renderHtml(view)).toContain('id="quality"');
  });

  it('names the defect in the plan rather than rendering a confident change', () => {
    const output = renderPlan(bad);
    expect(output).toContain('recommendation_generic');
    expect(output).toContain('R-0001');
  });

  it('names the defect in the HTML report too', () => {
    const output = renderHtml(bad);
    expect(output).toContain('recommendation generic');
    expect(output).toContain('generic advice');
  });

  it('carries the quality report in the JSON, so no consumer has to recompute it', () => {
    const parsed = JSON.parse(renderJson(bad));
    expect(parsed.derived.quality.findings[0].code).toBe('recommendation.generic_language');
  });

  it('says what only a reader can judge, rather than implying the checks suffice', () => {
    expect(renderPlan(view)).toContain('judgments only a reader can make');
    expect(renderHtml(view)).toContain('judgments only a reader can make');
  });
});

describe('a rerun that assessed outcomes without proposing new recommendations', () => {
  // The real shape a rerun takes when nothing has been implemented yet: no
  // new recommendations, but the run is not empty. See ADR 0012.
  const rerunView = buildView(
    makeValidReview({
      recommendations: [],
      actions: [],
      outcome_assessments: [
        makeOutcomeAssessment({ verdict: 'not_implemented' }),
        makeOutcomeAssessment({ id: 'OA-0002', verdict: 'failed', falsifier_held: true }),
      ],
    }),
  );

  it('leads the brief with outcome assessments, before the empty priorities section', () => {
    const brief = renderBrief(rerunView);
    expect(brief.indexOf('## Outcome assessments')).toBeGreaterThan(-1);
    expect(brief.indexOf('## Outcome assessments')).toBeLessThan(
      brief.indexOf('## Top priorities'),
    );
  });

  it('does not claim no recommendations were produced without saying what was', () => {
    const brief = renderBrief(rerunView);
    expect(brief).toContain('No recommendations were produced.');
    expect(brief).toContain('not_implemented');
  });

  it('leads the plan body with outcome assessments, before the to-do list', () => {
    const plan = renderPlan(rerunView);
    const bodyStart = plan.indexOf('---');
    const outcomeIndex = plan.indexOf('## Outcome assessments', bodyStart);
    const todoIndex = plan.indexOf('## To-do list');
    expect(outcomeIndex).toBeGreaterThan(-1);
    expect(outcomeIndex).toBeLessThan(todoIndex);
  });

  it('leads the HTML hero with what the run assessed, not a bare empty state', () => {
    const html = renderHtml(rerunView);
    expect(html).toContain('prior recommendation');
    expect(html).not.toContain('No recommendations have been produced yet.');
  });

  it('places the outcomes section before context in both nav and body', () => {
    const html = renderHtml(rerunView);
    expect(html.indexOf('href="#outcomes"')).toBeLessThan(html.indexOf('href="#context"'));
    expect(html.indexOf('id="outcomes"')).toBeLessThan(html.indexOf('id="context"'));
  });

  // Not covered by assertNoInventedIds here: OA-0001's recommendation_id
  // deliberately names an id from a different run (recommendation_run_id),
  // which this run's own allIds() correctly does not know about. That is the
  // point, not a bug the completeness guard should catch. See ADR 0012.
});
