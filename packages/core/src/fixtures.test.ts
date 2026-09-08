import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLLECTIONS, type Review } from './model/index.ts';
import { MODULE_KEYS } from './modules/registry.ts';
import { evaluateQuality } from './quality/index.ts';
import { ADVERSARIAL_CASES } from './testing/adversarial.ts';
import { makeCharityExample } from './testing/worked-example-charity.ts';
import { makeGovernmentExample } from './testing/worked-example-government.ts';
import { makeNgoExample } from './testing/worked-example-ngo.ts';
import { makeProductExample } from './testing/worked-example-product.ts';
import { makeProfessionalServicesExample } from './testing/worked-example-professional-services.ts';
import { makeCommercialSaasExample } from './testing/worked-example-saas.ts';
import { makeWorkedExample } from './testing/worked-example.ts';
import { formatIssues, validateReview } from './validate/index.ts';

/**
 * The committed fixtures are run directories, so they can drift from the code
 * that generated them. This asserts they have not, and that they still pass the
 * validator every real run has to pass.
 *
 * Regenerate with: pnpm run fixtures:write
 */

const FIXTURES = join(import.meta.dirname, '..', '..', '..', 'fixtures');

function loadFixture(...segments: string[]): Review {
  const dir = join(FIXTURES, ...segments);
  const review = {} as Record<string, unknown>;
  for (const spec of COLLECTIONS) {
    review[spec.key] = JSON.parse(readFileSync(join(dir, spec.file), 'utf8'));
  }
  return review as unknown as Review;
}

describe('fixtures/personal-brand', () => {
  it('exists as a real run directory', () => {
    expect(existsSync(join(FIXTURES, 'personal-brand', 'run.json'))).toBe(true);
  });

  it('validates, like any real run must', () => {
    expect(formatIssues(validateReview(loadFixture('personal-brand')).errors)).toBe('');
  });

  it('matches the source it was generated from', () => {
    // If these diverge, the fixture is stale and every test reading it is
    // testing something the code no longer produces.
    expect(loadFixture('personal-brand')).toEqual(makeWorkedExample());
  });
});

describe('fixtures/commercial-saas', () => {
  it('exists as a real run directory', () => {
    expect(existsSync(join(FIXTURES, 'commercial-saas', 'run.json'))).toBe(true);
  });

  it('validates, like any real run must', () => {
    expect(formatIssues(validateReview(loadFixture('commercial-saas')).errors)).toBe('');
  });

  it('matches the source it was generated from', () => {
    expect(loadFixture('commercial-saas')).toEqual(makeCommercialSaasExample());
  });

  it('activates a genuinely different module set than personal-brand', () => {
    // The point of a second archetype: not a second demo, proof the registry
    // actually tracks the review rather than defaulting to one shape.
    const saas = loadFixture('commercial-saas').plan?.activated_modules.map((m) => m.key) ?? [];
    const brand = loadFixture('personal-brand').plan?.activated_modules.map((m) => m.key) ?? [];
    expect(saas).toEqual(expect.arrayContaining(['pricing', 'acquisition', 'offer']));
    expect(brand).not.toEqual(expect.arrayContaining(['pricing', 'acquisition', 'offer']));
    expect(brand).toEqual(expect.arrayContaining(['content', 'credibility', 'discoverability']));
    expect(saas).not.toEqual(expect.arrayContaining(['content', 'credibility', 'discoverability']));
  });

  it('classifies every registry module, same as every other fixture must', () => {
    const plan = loadFixture('commercial-saas').plan;
    const decided = new Set([
      ...(plan?.activated_modules.map((m) => m.key) ?? []),
      ...(plan?.dormant_modules.map((m) => m.key) ?? []),
    ]);
    expect([...decided].sort()).toEqual([...MODULE_KEYS].sort());
  });

  it('produces a different saturation reading than personal-brand for the same mechanism', () => {
    // personal-brand's flagship territory is uncontested; this fixture's is
    // deliberately crowded by two qualified comparisons, which is the other
    // half of proving comparison-synthesis.ts is not producing one fixed shape.
    const saas = loadFixture('commercial-saas');
    const crowded = saas.comparisons.filter((c) =>
      c.positioning_territories.includes('Usage-based pricing for scaling teams'),
    );
    expect(crowded.length).toBe(2);
  });
});

/**
 * Four more archetypes, added in Phase 6 to close the gap between the
 * original plan's seven named archetypes and the two built by the end of
 * Phase 4. Each block below checks the same three basics every fixture must
 * pass, plus one assertion proving this archetype's module set is not just
 * a relabelled copy of an existing one.
 */
function decidedModuleKeys(review: Review): string[] {
  const plan = review.plan;
  return [
    ...(plan?.activated_modules.map((m) => m.key) ?? []),
    ...(plan?.dormant_modules.map((m) => m.key) ?? []),
  ].sort();
}

describe('fixtures/charity', () => {
  it('exists as a real run directory', () => {
    expect(existsSync(join(FIXTURES, 'charity', 'run.json'))).toBe(true);
  });

  it('validates, like any real run must', () => {
    expect(formatIssues(validateReview(loadFixture('charity')).errors)).toBe('');
  });

  it('matches the source it was generated from', () => {
    expect(loadFixture('charity')).toEqual(makeCharityExample());
  });

  it('classifies every registry module', () => {
    expect(decidedModuleKeys(loadFixture('charity'))).toEqual([...MODULE_KEYS].sort());
  });

  it('activates trust, unlike personal-brand or commercial-saas', () => {
    const charity = loadFixture('charity').plan?.activated_modules.map((m) => m.key) ?? [];
    const brand = loadFixture('personal-brand').plan?.activated_modules.map((m) => m.key) ?? [];
    const saas = loadFixture('commercial-saas').plan?.activated_modules.map((m) => m.key) ?? [];
    expect(charity).toEqual(expect.arrayContaining(['trust']));
    expect(brand).not.toEqual(expect.arrayContaining(['trust']));
    expect(saas).not.toEqual(expect.arrayContaining(['trust']));
  });
});

describe('fixtures/charity-rerun', () => {
  // The first genuinely sequential two-run fixture in the repository, built by
  // clearfelt-review rerun against fixtures/charity. See
  // docs/decisions/0012-outcome-assessment.md and fixtures/charity-rerun/README.md.
  it('exists as a real run directory', () => {
    expect(existsSync(join(FIXTURES, 'charity-rerun', 'run.json'))).toBe(true);
  });

  it('validates standalone, without fixtures/charity present, per ADR 0001', () => {
    expect(formatIssues(validateReview(loadFixture('charity-rerun')).errors)).toBe('');
  });

  it('names fixtures/charity as its previous run', () => {
    expect(loadFixture('charity-rerun').run.previous_run_id).toBe(loadFixture('charity').run.id);
  });

  it('assesses an outcome as achieved and one as failed, unresolved', () => {
    const review = loadFixture('charity-rerun');
    const verdicts = review.outcome_assessments.map((oa) => oa.verdict);
    expect(verdicts.sort()).toEqual(['achieved', 'failed']);
  });

  it('surfaces the failed, unaddressed verdict as a quality caution, not a defect', () => {
    const report = evaluateQuality(loadFixture('charity-rerun'));
    expect(report.defects).toEqual([]);
    expect(report.cautions.map((c) => c.code)).toContain(
      'outcome_assessment.failed_without_followup',
    );
  });
});

describe('fixtures/ngo', () => {
  it('exists as a real run directory', () => {
    expect(existsSync(join(FIXTURES, 'ngo', 'run.json'))).toBe(true);
  });

  it('validates, like any real run must', () => {
    expect(formatIssues(validateReview(loadFixture('ngo')).errors)).toBe('');
  });

  it('matches the source it was generated from', () => {
    expect(loadFixture('ngo')).toEqual(makeNgoExample());
  });

  it('classifies every registry module', () => {
    expect(decidedModuleKeys(loadFixture('ngo'))).toEqual([...MODULE_KEYS].sort());
  });

  it('records comparison as explicitly not applicable, the one fixture that does', () => {
    const ngo = loadFixture('ngo');
    expect(ngo.scope?.comparison_applicable).toBe(false);
    expect(ngo.scope?.comparison_not_applicable_reason).toBeTruthy();
    expect(ngo.comparisons).toEqual([]);
  });

  it('leaves competitive_landscape dormant because comparison does not apply, not for lack of keywords', () => {
    const dormant = loadFixture('ngo').plan?.dormant_modules.map((m) => m.key) ?? [];
    expect(dormant).toEqual(
      expect.arrayContaining(['competitive_landscape', 'digital_experience']),
    );
  });
});

describe('fixtures/government', () => {
  it('exists as a real run directory', () => {
    expect(existsSync(join(FIXTURES, 'government', 'run.json'))).toBe(true);
  });

  it('validates, like any real run must', () => {
    expect(formatIssues(validateReview(loadFixture('government')).errors)).toBe('');
  });

  it('matches the source it was generated from', () => {
    expect(loadFixture('government')).toEqual(makeGovernmentExample());
  });

  it('classifies every registry module', () => {
    expect(decidedModuleKeys(loadFixture('government'))).toEqual([...MODULE_KEYS].sort());
  });

  it('activates accessibility and discoverability together, unlike any other fixture', () => {
    const government = loadFixture('government').plan?.activated_modules.map((m) => m.key) ?? [];
    const saas = loadFixture('commercial-saas').plan?.activated_modules.map((m) => m.key) ?? [];
    expect(government).toEqual(
      expect.arrayContaining(['accessibility', 'discoverability', 'trust']),
    );
    expect(saas).not.toEqual(expect.arrayContaining(['accessibility']));
  });
});

describe('fixtures/product', () => {
  it('exists as a real run directory', () => {
    expect(existsSync(join(FIXTURES, 'product', 'run.json'))).toBe(true);
  });

  it('validates, like any real run must', () => {
    expect(formatIssues(validateReview(loadFixture('product')).errors)).toBe('');
  });

  it('matches the source it was generated from', () => {
    expect(loadFixture('product')).toEqual(makeProductExample());
  });

  it('classifies every registry module', () => {
    expect(decidedModuleKeys(loadFixture('product'))).toEqual([...MODULE_KEYS].sort());
  });

  it('activates operations, unlike any other fixture', () => {
    const product = loadFixture('product').plan?.activated_modules.map((m) => m.key) ?? [];
    const saas = loadFixture('commercial-saas').plan?.activated_modules.map((m) => m.key) ?? [];
    const charity = loadFixture('charity').plan?.activated_modules.map((m) => m.key) ?? [];
    expect(product).toEqual(expect.arrayContaining(['operations', 'reputation']));
    expect(saas).not.toEqual(expect.arrayContaining(['operations']));
    expect(charity).not.toEqual(expect.arrayContaining(['operations']));
  });
});

describe('fixtures/professional-services', () => {
  it('exists as a real run directory', () => {
    expect(existsSync(join(FIXTURES, 'professional-services', 'run.json'))).toBe(true);
  });

  it('validates, like any real run must', () => {
    expect(formatIssues(validateReview(loadFixture('professional-services')).errors)).toBe('');
  });

  it('matches the source it was generated from', () => {
    expect(loadFixture('professional-services')).toEqual(makeProfessionalServicesExample());
  });

  it('classifies every registry module', () => {
    expect(decidedModuleKeys(loadFixture('professional-services'))).toEqual(
      [...MODULE_KEYS].sort(),
    );
  });

  it('activates content and credibility but leaves pricing dormant, unlike product or commercial-saas', () => {
    const services = loadFixture('professional-services').plan;
    const activated = services?.activated_modules.map((m) => m.key) ?? [];
    const dormant = services?.dormant_modules.map((m) => m.key) ?? [];
    expect(activated).toEqual(expect.arrayContaining(['content', 'credibility', 'reputation']));
    expect(dormant).toEqual(expect.arrayContaining(['pricing']));
  });
});

describe('fixtures/adversarial', () => {
  for (const testCase of ADVERSARIAL_CASES) {
    describe(testCase.name, () => {
      it('is committed as a run directory the CLI can be pointed at', () => {
        expect(existsSync(join(FIXTURES, 'adversarial', testCase.name, 'run.json'))).toBe(true);
        expect(existsSync(join(FIXTURES, 'adversarial', testCase.name, 'README.md'))).toBe(true);
      });

      it('matches the case it was generated from', () => {
        expect(loadFixture('adversarial', testCase.name)).toEqual(testCase.build());
      });

      it(`still trips ${testCase.expect} when read back off disk`, () => {
        // Read back rather than rebuilt, because a check that only fires on an
        // in-memory object would not fire on the JSON a real run produces.
        const report = evaluateQuality(loadFixture('adversarial', testCase.name));
        expect(report.findings.map((f) => f.code)).toEqual([testCase.expect]);
      });
    });
  }
});
