import type { ComparisonType, Review } from '../model/index.ts';
import { selectModules } from '../modules/registry.ts';
import { evaluateQuality } from '../quality/index.ts';
import { makeCharityExample } from './worked-example-charity.ts';
import { makeGovernmentExample } from './worked-example-government.ts';
import { makeNgoExample } from './worked-example-ngo.ts';
import { makeProductExample } from './worked-example-product.ts';
import { makeProfessionalServicesExample } from './worked-example-professional-services.ts';
import { makeCommercialSaasExample } from './worked-example-saas.ts';
import { makeWorkedExample } from './worked-example.ts';

/**
 * What a good review of this archetype should discover, without hard-coding the
 * exact output.
 *
 * The worked-example fixtures already prove the deterministic layer round-trips:
 * fixtures.test.ts checks a committed run equals what its builder produces.
 * That is a structural property, not an analytical one, and it is the same
 * check for every archetype. Nothing before this file asked whether a given
 * archetype's *content* was any good: whether the modules the registry
 * activates for a grant-application service actually differ from the ones it
 * activates for a SaaS pricing page, whether every recommendation still clears
 * the output contract, whether genuine uncertainty survived into the output
 * rather than being smoothed away. This is that check, expressed as properties
 * a reasoning layer's output has to satisfy rather than a fixed answer it has
 * to match. See docs/ROADMAP.md, "Next".
 */
export interface ArchetypeExpectation {
  archetype: string;
  make: () => Review;
  /**
   * Module keys the registry must activate for this scope. Proves module
   * selection is signal-based rather than defaulting to one shape: a grant
   * service and a pricing page should not activate the same set for the same
   * reason.
   */
  modules_activated: string[];
  /** Module keys that must stay dormant, so activation is not "activate everything". */
  modules_dormant: string[];
  /**
   * Comparison relationship types that must appear among *qualified*
   * comparisons, per spec section 17. An empty array is a legitimate
   * expectation of its own (see the ngo archetype): not every review has a
   * comparison landscape, and asserting one where none belongs would be
   * exactly the "generic competitor summary" the comparison engine exists to
   * avoid producing.
   */
  comparison_types_present: ComparisonType[];
  /**
   * At least one of these forms of surviving uncertainty must be present:
   * an unvalidated assumption, an inferred finding, or a contradicted finding.
   * A review that resolves every open question before writing findings.json
   * is not more confident, it is less honest. See docs/decisions/0008.
   */
  expects_surviving_uncertainty: boolean;
  /** Every recommendation clears all ten output-contract questions, and no mechanical quality check fires a defect. */
  expects_no_quality_defects: boolean;
}

export const ARCHETYPE_EXPECTATIONS: readonly ArchetypeExpectation[] = [
  {
    archetype: 'personal-brand',
    make: makeWorkedExample,
    modules_activated: [
      'positioning',
      'audience',
      'messaging',
      'competitive_landscape',
      'content',
      'credibility',
      'acquisition',
      'digital_experience',
    ],
    modules_dormant: ['pricing', 'operations', 'accessibility', 'external_environment'],
    comparison_types_present: ['direct_competitor'],
    expects_surviving_uncertainty: true,
    expects_no_quality_defects: true,
  },
  {
    archetype: 'commercial-saas',
    make: makeCommercialSaasExample,
    modules_activated: [
      'positioning',
      'audience',
      'competitive_landscape',
      'offer',
      'conversion',
      'pricing',
    ],
    modules_dormant: ['content', 'credibility', 'reputation', 'operations', 'external_environment'],
    comparison_types_present: ['direct_competitor'],
    expects_surviving_uncertainty: true,
    expects_no_quality_defects: true,
  },
  {
    archetype: 'charity',
    make: makeCharityExample,
    modules_activated: [
      'positioning',
      'audience',
      'offer',
      'credibility',
      'conversion',
      'discoverability',
      'trust',
    ],
    modules_dormant: [
      'acquisition',
      'pricing',
      'accessibility',
      'operations',
      'external_environment',
    ],
    comparison_types_present: ['benchmark'],
    expects_surviving_uncertainty: true,
    expects_no_quality_defects: true,
  },
  {
    archetype: 'ngo',
    make: makeNgoExample,
    modules_activated: ['positioning', 'audience', 'offer', 'pricing', 'reputation', 'operations'],
    modules_dormant: [
      'competitive_landscape',
      'credibility',
      'digital_experience',
      'accessibility',
    ],
    // No comparison is qualified for this archetype at all: proves the engine
    // does not manufacture a landscape where the objective does not call for one.
    comparison_types_present: [],
    expects_surviving_uncertainty: true,
    expects_no_quality_defects: true,
  },
  {
    archetype: 'government',
    make: makeGovernmentExample,
    modules_activated: [
      'positioning',
      'audience',
      'competitive_landscape',
      'offer',
      'accessibility',
      'discoverability',
      'trust',
      'external_environment',
    ],
    modules_dormant: ['market', 'content', 'acquisition', 'pricing', 'reputation', 'operations'],
    comparison_types_present: ['benchmark'],
    // The one archetype whose fixture carries no open uncertainty at all: a
    // legitimate shape for a review this narrow, and worth asserting as its
    // own property rather than assuming every archetype looks like the others.
    expects_surviving_uncertainty: false,
    expects_no_quality_defects: true,
  },
  {
    archetype: 'product',
    make: makeProductExample,
    modules_activated: ['positioning', 'competitive_landscape', 'offer', 'conversion', 'pricing'],
    modules_dormant: [
      'credibility',
      'accessibility',
      'trust',
      'operations',
      'external_environment',
    ],
    comparison_types_present: ['direct_competitor'],
    expects_surviving_uncertainty: true,
    expects_no_quality_defects: true,
  },
  {
    archetype: 'professional-services',
    make: makeProfessionalServicesExample,
    modules_activated: [
      'positioning',
      'competitive_landscape',
      'credibility',
      'conversion',
      'discoverability',
    ],
    modules_dormant: ['acquisition', 'pricing', 'accessibility', 'reputation', 'operations'],
    comparison_types_present: ['direct_competitor'],
    expects_surviving_uncertainty: true,
    expects_no_quality_defects: true,
  },
] as const;

export interface ExpectationFailure {
  archetype: string;
  property: string;
  detail: string;
}

/** Checks one archetype's fixture against its expectations. Empty return means every property held. */
export function checkArchetypeExpectations(
  expectation: ArchetypeExpectation,
): ExpectationFailure[] {
  const review = expectation.make();
  const failures: ExpectationFailure[] = [];
  const fail = (property: string, detail: string): void => {
    failures.push({ archetype: expectation.archetype, property, detail });
  };

  const { activated, dormant } = selectModules(review);
  const activatedKeys = new Set(activated.map((m) => m.key));
  const dormantKeys = new Set(dormant.map((m) => m.key));

  for (const key of expectation.modules_activated) {
    if (!activatedKeys.has(key)) {
      fail('modules_activated', `expected '${key}' to activate, but it was dormant or unknown`);
    }
  }
  for (const key of expectation.modules_dormant) {
    if (!dormantKeys.has(key)) {
      fail('modules_dormant', `expected '${key}' to stay dormant, but it activated`);
    }
  }

  const qualifiedTypes = new Set(
    review.comparisons.filter((c) => c.status === 'qualified').map((c) => c.type),
  );
  if (expectation.comparison_types_present.length === 0 && qualifiedTypes.size > 0) {
    fail(
      'comparison_types_present',
      `expected no qualified comparisons, found ${[...qualifiedTypes].join(', ')}`,
    );
  }
  for (const type of expectation.comparison_types_present) {
    if (!qualifiedTypes.has(type)) {
      fail(
        'comparison_types_present',
        `expected a qualified '${type}' comparison, found ${[...qualifiedTypes].join(', ') || 'none'}`,
      );
    }
  }

  const hasSurvivingUncertainty =
    review.assumptions.some((a) => a.status === 'unvalidated') ||
    review.findings.some((f) => f.claim_type === 'inferred') ||
    review.findings.some((f) => f.contradicted_by.length > 0);
  if (expectation.expects_surviving_uncertainty !== hasSurvivingUncertainty) {
    fail(
      'expects_surviving_uncertainty',
      `expected ${expectation.expects_surviving_uncertainty}, found ${hasSurvivingUncertainty}`,
    );
  }

  const quality = evaluateQuality(review);
  const noDefects = quality.defects.length === 0;
  if (expectation.expects_no_quality_defects !== noDefects) {
    const codes = quality.defects.map((d) => d.code).join(', ');
    fail(
      'expects_no_quality_defects',
      `expected no defects, found ${quality.defects.length}${codes ? ` (${codes})` : ''}`,
    );
  }

  return failures;
}
