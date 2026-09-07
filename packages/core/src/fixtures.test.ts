import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLLECTIONS, type Review } from './model/index.ts';
import { evaluateQuality } from './quality/index.ts';
import { ADVERSARIAL_CASES } from './testing/adversarial.ts';
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
