import { describe, expect, it } from 'vitest';
import { makeAsset, makeScope, makeValidReview } from '../testing/factory.ts';
import { MODULES, MODULE_KEYS, deriveSignals, selectModules } from './registry.ts';

/**
 * Proves the registry adapts to what a review is actually about rather than
 * producing the same eighteen sections every time. Each profile below is a
 * scope a real onboarding might produce for a genuinely different kind of
 * review; none of them mention an entity type anywhere, and the registry
 * itself never reads one, so any difference in output has to come from the
 * text of the objective and decision.
 */

function reviewWithScope(
  objective: string,
  decision: string,
  extra: Partial<Parameters<typeof makeScope>[0]> = {},
) {
  return makeValidReview({
    scope: makeScope({
      objective,
      decision: { statement: decision, evidence_required: [] },
      ...extra,
    }),
    assets: [],
  });
}

describe('MODULES', () => {
  it('has eighteen distinct keys, matching specification section 21', () => {
    expect(MODULE_KEYS.length).toBe(18);
    expect(new Set(MODULE_KEYS).size).toBe(18);
  });

  it('never reads Entity.type or any archetype-shaped literal', () => {
    // The registry's whole job is to prove behaviour comes from signals, not
    // from what kind of thing is being reviewed. Reading the source itself is
    // the only way to check that the module authors kept that promise.
    const source = MODULES.map((m) => m.activates.toString()).join('\n');
    expect(source).not.toMatch(/entity\.?type/i);
  });
});

describe('selectModules', () => {
  it('activates positioning, audience and messaging regardless of the objective', () => {
    const { activated } = selectModules(reviewWithScope('Anything at all.', 'Anything at all.'));
    const keys = activated.map((m) => m.key);
    expect(keys).toEqual(expect.arrayContaining(['positioning', 'audience', 'messaging']));
  });

  it('leaves every module dormant that the text gives no reason to activate', () => {
    const { activated } = selectModules(
      reviewWithScope('Improve how the entity is understood.', 'What should the story be?', {
        comparison_applicable: false,
      }),
    );
    const keys = new Set(activated.map((m) => m.key));
    for (const key of ['pricing', 'accessibility', 'operations', 'external_environment', 'trust']) {
      expect(keys.has(key)).toBe(false);
    }
  });

  it('activates competitive_landscape from comparison_applicable, not from keywords', () => {
    const applicable = selectModules(
      reviewWithScope('Grow.', 'Grow how?', { comparison_applicable: true }),
    );
    const notApplicable = selectModules(
      reviewWithScope('Grow.', 'Grow how?', {
        comparison_applicable: false,
        comparison_not_applicable_reason: 'No meaningful comparison exists for this decision.',
      }),
    );
    expect(applicable.activated.map((m) => m.key)).toContain('competitive_landscape');
    expect(notApplicable.dormant.map((m) => m.key)).toContain('competitive_landscape');
  });

  it('adapts to a hiring decision: a personal-brand-shaped profile', () => {
    const { activated, dormant } = selectModules(
      reviewWithScope(
        'Generate senior technology leadership opportunities.',
        'What should the positioning become to be found and trusted by recruiters and boards?',
        { comparison_applicable: true },
      ),
    );
    const activeKeys = activated.map((m) => m.key);
    expect(activeKeys).toEqual(
      expect.arrayContaining([
        'positioning',
        'audience',
        'messaging',
        'competitive_landscape',
        'trust',
      ]),
    );
    expect(dormant.map((m) => m.key)).toEqual(expect.arrayContaining(['pricing', 'accessibility']));
  });

  it('adapts to a subscription-pricing decision: a commercial-SaaS-shaped profile', () => {
    const { activated, dormant } = selectModules(
      makeValidReview({
        scope: makeScope({
          objective: 'Increase paid subscription conversion on the pricing page.',
          decision: {
            statement:
              'Which pricing tier and checkout change would most improve signup conversion?',
            evidence_required: [],
          },
          comparison_applicable: true,
        }),
        assets: [makeAsset({ type: 'website_page', path: '/pricing' })],
      }),
    );
    const activeKeys = activated.map((m) => m.key);
    expect(activeKeys).toEqual(
      expect.arrayContaining(['pricing', 'conversion', 'digital_experience', 'acquisition']),
    );
    expect(dormant.map((m) => m.key)).toEqual(
      expect.arrayContaining(['accessibility', 'operations', 'external_environment']),
    );
  });

  it('adapts to a donor-facing decision: a charity-shaped profile', () => {
    const { activated, dormant } = selectModules(
      reviewWithScope(
        'Increase individual donation revenue.',
        'Which giving proposition or donation flow change, and which trust and safeguarding signal, would most improve donor conversion?',
        { comparison_applicable: true },
      ),
    );
    const activeKeys = activated.map((m) => m.key);
    expect(activeKeys).toEqual(expect.arrayContaining(['offer', 'conversion', 'trust']));
    expect(dormant.map((m) => m.key)).toContain('pricing');
  });

  it('adapts to a compliance-driven decision: a government-service-shaped profile', () => {
    const { activated, dormant } = selectModules(
      reviewWithScope(
        'Improve service adoption for residents who rely on assistive technology.',
        'Which accessibility and trust changes would most improve completion of the online service?',
        {
          comparison_applicable: false,
          comparison_not_applicable_reason: 'A statutory service has no competitor.',
        },
      ),
    );
    const activeKeys = activated.map((m) => m.key);
    expect(activeKeys).toEqual(expect.arrayContaining(['accessibility', 'trust']));
    expect(dormant.map((m) => m.key)).toContain('competitive_landscape');
    expect(dormant.map((m) => m.key)).toContain('pricing');
  });

  it('classifies every module as either activated or dormant, with no overlap', () => {
    const { activated, dormant } = selectModules(reviewWithScope('Objective.', 'Decision.'));
    const activeKeys = new Set(activated.map((m) => m.key));
    const dormantKeys = new Set(dormant.map((m) => m.key));
    expect(activeKeys.size + dormantKeys.size).toBe(MODULE_KEYS.length);
    for (const key of activeKeys) expect(dormantKeys.has(key)).toBe(false);
  });
});

describe('deriveSignals', () => {
  it('reads only scope and assets, nothing that only exists after research', () => {
    const review = makeValidReview();
    // findings, evidence and recommendations exist on this fixture; if
    // deriveSignals depended on any of them it would not be safe to call at
    // onboarding, before research has happened.
    const withoutDownstream = { ...review, findings: [], evidence: [], recommendations: [] };
    expect(deriveSignals(review)).toEqual(deriveSignals(withoutDownstream));
  });

  it('is case-insensitive, so capitalisation in the objective does not change activation', () => {
    const lower = selectModules(reviewWithScope('improve pricing.', 'what changes?'));
    const upper = selectModules(reviewWithScope('IMPROVE PRICING.', 'WHAT CHANGES?'));
    expect(lower.activated.map((m) => m.key).sort()).toEqual(
      upper.activated.map((m) => m.key).sort(),
    );
  });
});
