import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLLECTIONS, type Review } from './model/index.ts';
import { makeWorkedExample } from './testing/worked-example.ts';
import { formatIssues, validateReview } from './validate/index.ts';

/**
 * The committed fixtures are run directories, so they can drift from the code
 * that generated them. This asserts they have not, and that they still pass the
 * validator every real run has to pass.
 */

const FIXTURES = join(import.meta.dirname, '..', '..', '..', 'fixtures');

function loadFixture(name: string): Review {
  const dir = join(FIXTURES, name);
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
