import type { Review } from '../model/index.ts';

/**
 * The module registry: specification section 21 and section 60.
 *
 * A plain data table, not a decision tree keyed on what kind of entity this
 * is. Adding a module is adding a row. Every predicate reads signals derived
 * from the objective, the decision, the audiences and the assets already
 * captured in scope.json and entities.json, never from Entity.type: spec
 * section 60 forbids `if entity.type === 'personal website'`, and reading
 * type here would smuggle the same branch back in through a different door.
 * See docs/decisions/0010-signal-based-module-activation.md.
 *
 * This module only suggests. The reasoning layer decides for real, in
 * review-onboard, and writes its own reason for every module into plan.json.
 * validate/integrity.ts checks the keys it wrote are real and complete; it
 * does not check that the reasoning layer agreed with the suggestion, because
 * there is no case where the suggestion should override a judgement grounded
 * in the actual objective.
 */

export interface ModuleSpec {
  key: string;
  label: string;
  /** What this module analyses, from specification section 21. */
  analyses: string;
  /**
   * Whether this module is relevant given the signals. Near-universal modules
   * return true unconditionally; most read the signals for a real reason to
   * activate.
   */
  activates(signals: ModuleSignals): boolean;
}

export interface ModuleSignals {
  /**
   * scope.objective, scope.decision.statement, scope.decision.evidence_required
   * and every audience's name and description, lowercased and space-joined.
   * The activation vocabulary lives against this one field so a new signal
   * source is one line in deriveSignals rather than a new parameter everywhere.
   */
  text: string;
  /** Lowercased asset.type values captured so far. */
  assetTypes: readonly string[];
  /** Lowercased asset.path values, for a keyword that only shows up in a URL. */
  assetPaths: readonly string[];
  /** Lowercased scope.channels, when stated. */
  channels: readonly string[];
  /** scope.comparison_applicable, read directly rather than re-derived from text. */
  comparisonApplicable: boolean;
}

function mentions(signals: ModuleSignals, ...terms: readonly string[]): boolean {
  return terms.some(
    (term) =>
      signals.text.includes(term) ||
      signals.assetTypes.some((t) => t.includes(term)) ||
      signals.assetPaths.some((p) => p.includes(term)) ||
      signals.channels.some((c) => c.includes(term)),
  );
}

/** Every review needs to understand these three regardless of what it is reviewing. */
const always = (): boolean => true;

export const MODULES: readonly ModuleSpec[] = [
  {
    key: 'positioning',
    label: 'Positioning',
    analyses:
      'Current positioning, stated and implied proposition, differentiation, claims, proof.',
    activates: always,
  },
  {
    key: 'audience',
    label: 'Audience',
    analyses: 'Target audience, decision makers, beneficiaries, objections, decision criteria.',
    activates: always,
  },
  {
    key: 'messaging',
    label: 'Messaging',
    analyses: 'Headline, narrative, claims, proof, calls to action, consistency.',
    activates: always,
  },
  {
    key: 'competitive_landscape',
    label: 'Competitive landscape',
    analyses: 'Competitors, alternatives, substitutes, benchmarks, positioning comparison.',
    // Comparison is core, not conditional on keywords: scope.json already
    // records the explicit decision of whether comparison applies at all,
    // per specification section 51, so this module reads that decision
    // directly rather than re-guessing it from text.
    activates: (s) => s.comparisonApplicable,
  },
  {
    key: 'market',
    label: 'Market',
    analyses: 'Market structure, trends, growth signals, external forces, emerging opportunities.',
    activates: (s) => mentions(s, 'market', 'industry', 'sector', 'growth', 'trend'),
  },
  {
    key: 'offer',
    label: 'Offer',
    analyses: 'What is actually being sold or provided: the product, service or programme itself.',
    activates: (s) =>
      mentions(
        s,
        'product',
        'service',
        'offer',
        'package',
        'plan',
        'subscription',
        'membership',
        'programme',
        'program',
        'course',
        'donation',
        'donate',
      ),
  },
  {
    key: 'content',
    label: 'Content',
    analyses: 'Topics, authority, gaps, content themes, differentiation, audience alignment.',
    activates: (s) => mentions(s, 'content', 'blog', 'article', 'writing', 'publish', 'newsletter'),
  },
  {
    key: 'credibility',
    label: 'Credibility and proof',
    analyses: 'Case studies, testimonials, track record, third-party validation.',
    activates: (s) =>
      mentions(
        s,
        'trust',
        'credibility',
        'proof',
        'case study',
        'testimonial',
        'endorsement',
        'track record',
        'reference',
      ),
  },
  {
    key: 'acquisition',
    label: 'Acquisition',
    analyses: 'How new audience members are found and brought in: traffic, leads, referrals.',
    activates: (s) => mentions(s, 'acquisition', 'lead', 'signup', 'sign-up', 'traffic', 'visitor'),
  },
  {
    key: 'conversion',
    label: 'Conversion',
    analyses: 'The path from interest to committed action: enquiry, purchase, application.',
    activates: (s) =>
      mentions(
        s,
        'conversion',
        'convert',
        'enquiry',
        'inquiry',
        'purchase',
        'checkout',
        'apply',
        'application',
        'contact',
        'book a call',
      ),
  },
  {
    key: 'pricing',
    label: 'Pricing',
    analyses: 'How price is stated, structured and justified.',
    activates: (s) => mentions(s, 'price', 'pricing', 'cost', 'fee', 'tier'),
  },
  {
    key: 'digital_experience',
    label: 'Digital experience',
    analyses: 'Information architecture, usability, conversion mechanics, content discoverability.',
    activates: (s) =>
      mentions(s, 'website', 'web page', 'webpage', 'app', 'platform', 'site') ||
      s.assetTypes.some((t) => t.startsWith('website')),
  },
  {
    key: 'accessibility',
    label: 'Accessibility',
    analyses: 'Whether the digital surface is usable by people with disabilities.',
    activates: (s) =>
      mentions(
        s,
        'accessibility',
        'accessible',
        'disability',
        'wcag',
        'screen reader',
        'inclusive',
      ),
  },
  {
    key: 'discoverability',
    label: 'Discoverability',
    analyses: 'Search, AI discovery, external references, structured data, content footprint.',
    activates: (s) =>
      mentions(s, 'search', 'seo', 'discoverable', 'findable', 'visibility', 'ranking', 'google'),
  },
  {
    key: 'reputation',
    label: 'Reputation',
    analyses: 'Reviews, press coverage, third-party sentiment, brand perception.',
    activates: (s) => mentions(s, 'reputation', 'review', 'press', 'media coverage', 'sentiment'),
  },
  {
    key: 'trust',
    label: 'Trust',
    analyses: 'Security, privacy, safety, compliance signals that bear on the decision.',
    activates: (s) =>
      mentions(s, 'trust', 'security', 'privacy', 'compliance', 'safety', 'certification'),
  },
  {
    key: 'operations',
    label: 'Operations',
    analyses: 'Process, delivery, fulfilment and the operational reality behind the proposition.',
    activates: (s) =>
      mentions(
        s,
        'operations',
        'process',
        'workflow',
        'fulfilment',
        'fulfillment',
        'delivery',
        'logistics',
      ),
  },
  {
    key: 'external_environment',
    label: 'External environment',
    analyses: 'Regulation, funding climate, macro conditions bearing on the decision.',
    activates: (s) =>
      mentions(
        s,
        'regulation',
        'regulatory',
        'policy',
        'funding environment',
        'macro',
        'economic climate',
      ),
  },
] as const;

export const MODULE_KEYS: readonly string[] = MODULES.map((m) => m.key);

function normalise(text: string | undefined): string {
  return (text ?? '').toLowerCase();
}

/**
 * Reads only scope.json and entities.json/assets.json, because module
 * selection happens at onboarding, before any research exists. Nothing here
 * reads findings, evidence or sources: they do not exist yet at the point
 * this runs.
 */
export function deriveSignals(review: Review): ModuleSignals {
  const scope = review.scope;
  const parts: string[] = [];
  if (scope) {
    parts.push(scope.objective, scope.decision.statement, ...scope.decision.evidence_required);
    for (const audience of scope.audiences) {
      parts.push(audience.name, audience.description ?? '', audience.decision_role ?? '');
    }
  }
  return {
    text: normalise(parts.join(' ')),
    assetTypes: review.assets.map((a) => normalise(a.type)),
    assetPaths: review.assets.map((a) => normalise(a.path)),
    channels: (scope?.channels ?? []).map(normalise),
    comparisonApplicable: scope?.comparison_applicable ?? false,
  };
}

export interface ModuleSelection {
  activated: ModuleSpec[];
  dormant: ModuleSpec[];
}

/** The deterministic suggestion. review-onboard consults this and writes its own reasons. */
export function selectModules(review: Review): ModuleSelection {
  const signals = deriveSignals(review);
  const activated: ModuleSpec[] = [];
  const dormant: ModuleSpec[] = [];
  for (const module of MODULES) {
    (module.activates(signals) ? activated : dormant).push(module);
  }
  return { activated, dormant };
}
