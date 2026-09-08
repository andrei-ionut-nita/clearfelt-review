import { describe, expect, it } from 'vitest';
import { ARCHETYPE_EXPECTATIONS, checkArchetypeExpectations } from './archetype-expectations.ts';

describe('archetype expectations', () => {
  for (const expectation of ARCHETYPE_EXPECTATIONS) {
    it(`${expectation.archetype} discovers what a good review of this archetype should`, () => {
      const failures = checkArchetypeExpectations(expectation);
      expect(failures, failures.map((f) => `${f.property}: ${f.detail}`).join('\n')).toEqual([]);
    });
  }

  it('covers every committed archetype fixture', () => {
    // fixtures/README.md and write-fixtures.ts are the source of truth for
    // which archetypes are shipped; this list has to track both rather than
    // silently falling behind as an eighth archetype is added.
    const archetypes = ARCHETYPE_EXPECTATIONS.map((e) => e.archetype).sort();
    expect(archetypes).toEqual(
      [
        'charity',
        'commercial-saas',
        'government',
        'ngo',
        'personal-brand',
        'product',
        'professional-services',
      ].sort(),
    );
  });

  it('is honest when a property genuinely fails, not just when the fixture is broken', () => {
    // A harness that only ever passes is not testing anything. Point one real
    // expectation at another archetype's fixture and confirm it actually
    // reports the mismatch, on both a module property and a comparison
    // property, rather than silently agreeing with whatever it is given.
    const saas = ARCHETYPE_EXPECTATIONS.find((e) => e.archetype === 'commercial-saas');
    const ngo = ARCHETYPE_EXPECTATIONS.find((e) => e.archetype === 'ngo');
    if (!saas || !ngo) throw new Error('fixture missing from the table above');

    const failures = checkArchetypeExpectations({ ...saas, make: ngo.make });
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((f) => f.property === 'modules_activated')).toBe(true);
    expect(failures.some((f) => f.property === 'comparison_types_present')).toBe(true);
  });
});
