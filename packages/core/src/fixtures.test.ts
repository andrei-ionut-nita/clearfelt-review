import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLLECTIONS, type Review } from './model/index.ts';
import { MODULE_KEYS } from './modules/registry.ts';
import { evaluateQuality } from './quality/index.ts';
import { ADVERSARIAL_CASES } from './testing/adversarial.ts';
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
