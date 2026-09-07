import type { Review } from '../model/index.ts';
import { emptyReview, newRun } from '../store.ts';

/**
 * A seventh archetype fixture, shipped as product, added in Phase 6.
 *
 * Activates operations and reputation together, a combination no other
 * fixture in this repository produces: a physical product sold online has
 * a fulfilment reality (shipping, returns) that a SaaS subscription does
 * not, and carries public reviews in a way a donation page or a government
 * form does not.
 *
 * The subject is invented. Nothing here is specific to any real product or
 * retailer.
 */

const T = '2026-09-07T09:00:00.000Z';
const hash = (seed: string) => seed.repeat(64).slice(0, 64);

export function makeProductExample(): Review {
  const run = newRun('trailmark-packs', 'r-20260907-001', T);
  run.stage = 'complete';
  run.approved_gates = { scope: T, research_plan: T, findings: T };
  run.observability = {
    started_at: T,
    finished_at: '2026-09-07T10:10:00.000Z',
    sources_discovered: 6,
    sources_retrieved: 3,
    retrieval_failures: 0,
    search_iterations: 2,
  };

  return {
    ...emptyReview(run),

    scope: {
      id: 'SCOPE-0001',
      objective: 'Increase online purchase conversion for the flagship hiking pack.',
      entity_ids: ['ENT-0001'],
      asset_ids: ['AST-0001', 'AST-0002'],
      decision: {
        statement:
          'Which change to the product page or checkout would most increase purchase conversion for the flagship pack this quarter?',
        decision_maker: 'Head of ecommerce',
        horizon: 'One quarter',
        evidence_required: [
          'How the product page compares against the qualified comparison set on price, reviews and shipping terms',
          'What friction exists at checkout',
        ],
      },
      audiences: [
        {
          name: 'First-time buyers comparing packs before purchase',
          priority: 1,
          decision_role: 'Buyer',
        },
        {
          name: 'Returning customers reordering or upgrading',
          priority: 2,
          decision_role: 'Buyer',
        },
      ],
      geography: ['United States'],
      languages: ['en'],
      channels: ['website'],
      exclusions: ['Wholesale and retail-partner sales, which use a separate ordering process'],
      depth: 'standard',
      comparison_applicable: true,
      budget: {
        max_sources: 20,
        max_search_iterations: 8,
        max_depth: 2,
        min_evidence_per_question: 1,
        min_independent_corroboration: 1,
        priority_question_ids: ['RQ-0001'],
      },
    },

    plan: {
      id: 'PLAN-0001',
      created_at: T,
      objective_interpretation:
        'The review treats the product page and checkout as a purchase-conversion decision for a comparison-shopping buyer, not as a general brand review.',
      activated_modules: [
        {
          key: 'positioning',
          reason: 'How the pack is framed against comparable packs is itself a positioning choice.',
          research_question_ids: [],
        },
        {
          key: 'audience',
          reason: 'A first-time buyer and a returning customer weigh the same page differently.',
          research_question_ids: [],
        },
        {
          key: 'messaging',
          reason: 'The product page has to justify the price, not just state it.',
          research_question_ids: [],
        },
        {
          key: 'competitive_landscape',
          reason:
            'Price and shipping terms only read as a choice against what comparable packs offer.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'offer',
          reason:
            'The pack itself, and what is included with it, is the subject of the purchase decision.',
          research_question_ids: [],
        },
        {
          key: 'pricing',
          reason: 'The decision is explicitly about purchase conversion at the current price.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'acquisition',
          reason:
            'The product page is what a comparison-shopping visitor lands on before purchase.',
          research_question_ids: [],
        },
        {
          key: 'conversion',
          reason: 'Checkout friction is the second half of the stated decision.',
          research_question_ids: ['RQ-0002'],
        },
        {
          key: 'digital_experience',
          reason: 'The product page and checkout are both web pages.',
          research_question_ids: [],
        },
        {
          key: 'operations',
          reason:
            'Shipping cost and delivery time are part of what a buyer weighs before purchase.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'reputation',
          reason:
            'Published reviews are a visible input to a comparison-shopping buyer’s decision.',
          research_question_ids: [],
        },
      ],
      dormant_modules: [
        {
          key: 'market',
          reason:
            'Broader outdoor-gear market trends are not what this quarter’s conversion decision turns on.',
        },
        {
          key: 'content',
          reason: 'No blog or writing corpus bears on a single product page decision.',
        },
        {
          key: 'credibility',
          reason:
            'Reputation, not credibility, covers third-party proof for this decision; no separate case-study or endorsement signal was raised.',
        },
        {
          key: 'accessibility',
          reason: 'No compliance driver was raised for this specific page.',
        },
        {
          key: 'discoverability',
          reason:
            'The decision concerns visitors who already arrived at the product page, not being found.',
        },
        {
          key: 'trust',
          reason: 'No security, privacy or compliance concern was raised for this purchase flow.',
        },
        {
          key: 'external_environment',
          reason: 'No regulatory or macro-economic driver bears on this decision.',
        },
      ],
      comparison_plan: {
        supplied_count: 0,
        to_discover: true,
        rationale:
          'No comparisons were supplied, so the qualified set had to be discovered by category.',
      },
      anticipated_gaps: [
        'No analytics access, so the actual checkout drop-off step cannot be observed directly.',
      ],
    },

    entities: [
      {
        id: 'ENT-0001',
        type: 'company',
        role: 'subject',
        name: 'Trailmark Packs',
        description: 'A direct-to-consumer hiking pack brand.',
        canonical_url: 'https://trailmark-packs.example',
        industry: 'Outdoor gear',
        asset_ids: ['AST-0001', 'AST-0002'],
      },
      {
        id: 'ENT-0002',
        type: 'company',
        role: 'comparison',
        name: 'Comparable pack brand A',
        canonical_url: 'https://comparable-pack-a.example',
        asset_ids: [],
      },
      {
        id: 'ENT-0003',
        type: 'company',
        role: 'comparison',
        name: 'Comparable pack brand B',
        canonical_url: 'https://comparable-pack-b.example',
        asset_ids: [],
      },
    ],

    assets: [
      {
        id: 'AST-0001',
        entity_id: 'ENT-0001',
        type: 'website_page',
        path: '/products/flagship-pack',
        title: 'Flagship 40L Pack',
        source_ids: ['S-0001'],
      },
      {
        id: 'AST-0002',
        entity_id: 'ENT-0001',
        type: 'checkout_flow',
        path: '/checkout',
        title: 'Checkout',
        source_ids: ['S-0001'],
      },
    ],

    user_assertions: [],

    research_questions: [
      {
        id: 'RQ-0001',
        question:
          'How does price, review count and shipping compare against the qualified comparison set?',
        module: 'pricing',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail:
          'Both qualified comparisons publish price, review count and shipping terms directly.',
        evidence_ids: ['E-0001'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        confidence: 'high',
        priority: 1,
      },
      {
        id: 'RQ-0002',
        question: 'What friction exists at checkout?',
        module: 'conversion',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail: 'The checkout flow itself states its required steps directly.',
        evidence_ids: ['E-0002'],
        source_ids: ['S-0001'],
        confidence: 'medium',
        priority: 1,
      },
    ],

    sources: [
      {
        id: 'S-0001',
        url: 'https://trailmark-packs.example/products/flagship-pack',
        title: 'Flagship 40L Pack',
        publisher: 'Trailmark Packs',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0001.html',
        content_hash: hash('p1'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0001',
      },
      {
        id: 'S-0002',
        url: 'https://comparable-pack-a.example/products/40l-pack',
        title: '40L Pack',
        publisher: 'Comparable pack brand A',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0002.html',
        content_hash: hash('p2'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0002',
      },
      {
        id: 'S-0003',
        url: 'https://comparable-pack-b.example/products/40l-pack',
        title: '40L Pack',
        publisher: 'Comparable pack brand B',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0003.html',
        content_hash: hash('p3'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0003',
      },
    ],

    observations: [
      {
        id: 'OBS-0001',
        source_id: 'S-0001',
        observation_type: 'positive',
        statement:
          'The flagship pack is priced at 220 with free shipping over 100, and shows no visible review count.',
        locator: 'section.product-price',
        observed_at: T,
      },
      {
        id: 'OBS-0002',
        source_id: 'S-0002',
        observation_type: 'positive',
        statement:
          'Comparable pack A is priced at 235, ships free with no minimum, and shows a count of 1,240 reviews.',
        locator: 'section.buy-box',
        observed_at: T,
      },
      {
        id: 'OBS-0003',
        source_id: 'S-0003',
        observation_type: 'positive',
        statement:
          'Comparable pack B is priced at 210, ships free with no minimum, and shows a count of 860 reviews.',
        locator: 'section.pdp-purchase',
        observed_at: T,
      },
      {
        id: 'OBS-0004',
        source_id: 'S-0001',
        observation_type: 'positive',
        statement: 'Checkout requires account creation before the shipping address step.',
        locator: 'form#checkout-step-1',
        observed_at: T,
      },
    ],

    evidence: [
      {
        id: 'E-0001',
        observation_ids: ['OBS-0001', 'OBS-0002', 'OBS-0003'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        claim:
          'The subject shows no visible review count and requires a 100 minimum for free shipping, while both qualified comparisons show review counts in the hundreds or thousands and ship free with no minimum.',
        research_question_ids: ['RQ-0001'],
        user_assertion_ids: [],
        relevance: 'high',
        reliability: 'high',
        corroborated_by: [],
        supports: ['F-0001'],
        contradicts: [],
        temporal_scope: 'current',
      },
      {
        id: 'E-0002',
        observation_ids: ['OBS-0004'],
        source_ids: ['S-0001'],
        claim: 'A buyer must create an account before entering a shipping address at checkout.',
        research_question_ids: ['RQ-0002'],
        user_assertion_ids: [],
        relevance: 'high',
        reliability: 'high',
        corroborated_by: [],
        supports: ['F-0002'],
        contradicts: [],
        temporal_scope: 'current',
      },
    ],

    comparisons: [
      {
        id: 'COMP-0001',
        entity_id: 'ENT-0002',
        name: 'Comparable pack brand A',
        type: 'direct_competitor',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Same category, same price band, addresses the same purchase decision.',
        audience_overlap: 'high',
        objective_overlap: 'high',
        decision_overlap: 'high',
        relevance: 'high',
        confidence: 'high',
        source_ids: ['S-0002'],
        positioning_territories: ['Free shipping with no minimum'],
      },
      {
        id: 'COMP-0002',
        entity_id: 'ENT-0003',
        name: 'Comparable pack brand B',
        type: 'direct_competitor',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Appears alongside brand A in the same comparison-shopping searches.',
        audience_overlap: 'high',
        objective_overlap: 'medium',
        decision_overlap: 'high',
        relevance: 'medium',
        confidence: 'medium',
        source_ids: ['S-0003'],
        positioning_territories: ['Free shipping with no minimum'],
      },
    ],

    findings: [
      {
        id: 'F-0001',
        category: 'pricing',
        title:
          'Review count is absent, and free shipping has a minimum, unlike both qualified comparisons',
        statement:
          'The subject shows no visible review count and requires a 100 minimum for free shipping, while both qualified comparisons show review counts in the hundreds or thousands and ship free with no minimum.',
        claim_type: 'derived',
        evidence_ids: ['E-0001'],
        confidence: 'high',
        importance: 'high',
        implication:
          'A buyer comparing three packs sees proof and a shipping term on two of them and neither on this one.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: [],
        audience_relevance:
          'First-time buyers comparing packs before purchase weigh review count and shipping terms directly.',
      },
      {
        id: 'F-0002',
        category: 'conversion',
        title: 'Account creation is required before checkout can begin',
        statement: 'A buyer must create an account before entering a shipping address at checkout.',
        claim_type: 'derived',
        evidence_ids: ['E-0002'],
        confidence: 'high',
        importance: 'medium',
        implication:
          'A buyer who wanted to check the total cost with shipping cannot do so without first creating an account.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: ['ASM-0001'],
        audience_relevance:
          'First-time buyers unwilling to commit to an account before seeing the final price are the ones this blocks.',
      },
    ],

    opportunities: [
      {
        id: 'O-0001',
        title: 'Free shipping with no minimum is occupied territory this page does not yet claim',
        description:
          'Both qualified comparisons already ship free with no minimum and display review counts prominently. Matching both closes a visible gap in the same comparison a buyer is already making.',
        supporting_finding_ids: ['F-0001'],
        supporting_evidence_ids: ['E-0001'],
        strategic_value: 'high',
        audience_value: 'high',
        confidence: 'medium',
        white_space: {
          territory: 'Free shipping with no minimum',
          current_position: 'low',
        },
      },
      {
        id: 'O-0002',
        title: 'Guest checkout removes a commitment step before the buyer sees total cost',
        description:
          'Letting a buyer reach the shipping-cost total before being asked to create an account removes a reason to abandon before ever seeing the final price.',
        supporting_finding_ids: ['F-0002'],
        supporting_evidence_ids: ['E-0002'],
        strategic_value: 'medium',
        audience_value: 'medium',
        confidence: 'medium',
      },
    ],

    recommendations: [
      {
        id: 'R-0001',
        title: 'Display the review count and remove the free-shipping minimum',
        problem:
          'The product page shows no visible review count and requires a 100 minimum for free shipping, unlike both qualified comparisons.',
        why_it_matters:
          'A buyer comparing three packs sees proof and a shipping term on two of them and neither on this one.',
        finding_ids: ['F-0001'],
        opportunity_ids: ['O-0001'],
        strategic_rationale:
          'Matches terms already normalised across the qualified comparison set.',
        recommended_change:
          'Show the existing review count prominently on the product page, and remove the 100 minimum for free shipping.',
        expected_outcome:
          'A buyer comparing this page against the other two sees review proof and an unconditional free-shipping term on all three.',
        impact: 'high',
        effort: 'medium',
        confidence: 'high',
        urgency: 'medium',
        dependencies: [],
        assumption_ids: [],
        measurement: {
          kind: 'quantitative',
          hypothesis:
            'Showing review count and removing the shipping minimum increases purchase conversion on the product page.',
          success_metric: 'Product-page-to-purchase conversion rate.',
          baseline: 'unknown',
          target: 'Establish a baseline, then improve on it',
          validation_method:
            'Compare conversion rate for six weeks before and after both changes ship together.',
          falsifier: 'Conversion rate is indistinguishable between the two six-week windows.',
          review_period: '6 weeks',
        },
      },
      {
        id: 'R-0002',
        title: 'Allow guest checkout before account creation',
        problem: 'A buyer must create an account before entering a shipping address at checkout.',
        why_it_matters:
          'A buyer who wants to see the final cost with shipping cannot do so without first creating an account.',
        finding_ids: ['F-0002'],
        opportunity_ids: ['O-0002'],
        strategic_rationale:
          'Removes a commitment step from what is still a price-checking step for the buyer.',
        recommended_change:
          'Let checkout proceed through the shipping-cost step as a guest, offering account creation only at payment.',
        expected_outcome:
          'A buyer can see the total cost with shipping before being asked to create an account.',
        impact: 'medium',
        effort: 'medium',
        confidence: 'medium',
        urgency: 'medium',
        dependencies: [],
        assumption_ids: ['ASM-0001'],
        measurement: {
          kind: 'quantitative',
          hypothesis:
            'Guest checkout increases the share of shipping-cost views that complete a purchase.',
          success_metric: 'Shipping-step-to-purchase completion rate.',
          baseline: 'unknown',
          target: 'Establish a baseline, then improve on it',
          validation_method: 'Compare completion rate for six weeks before and after the change.',
          falsifier: 'Completion rate is unchanged between the two six-week windows.',
          review_period: '6 weeks',
        },
      },
    ],

    actions: [
      {
        id: 'A-0001',
        recommendation_id: 'R-0001',
        description:
          'Show the existing review count and remove the free-shipping minimum on the product page.',
        affected_assets: [
          { asset_id: 'AST-0001', operation: 'edit', target: 'review-count-and-shipping-terms' },
        ],
        effort: 'medium',
        dependencies: [],
        status: 'todo',
        validation:
          'The review count and an unconditional free-shipping statement both appear on the product page.',
        horizon: 'now',
      },
      {
        id: 'A-0002',
        recommendation_id: 'R-0002',
        description:
          'Move account creation to the payment step and allow guest checkout through the shipping-cost step.',
        affected_assets: [{ asset_id: 'AST-0002', operation: 'edit', target: 'guest-checkout' }],
        effort: 'medium',
        dependencies: [],
        status: 'todo',
        validation: 'A shipping-cost total can be reached at checkout without an account.',
        horizon: 'next',
      },
    ],

    assumptions: [
      {
        id: 'ASM-0001',
        statement:
          'Allowing guest checkout through the shipping-cost step will not materially increase abandoned, low-quality orders at payment.',
        why_assumed: 'No historical guest-checkout data exists for this store to check against.',
        status: 'unvalidated',
        validation_method:
          'Run guest checkout for one cohort and compare completed-order quality against the existing account-first cohort.',
        evidence_ids: [],
      },
    ],

    unknowns: [
      {
        id: 'UNK-0001',
        statement: 'Where in checkout buyers actually abandon is not established.',
        why_unknown:
          'No analytics access; only the stated requirement in the checkout form is observable from outside.',
        how_to_resolve:
          'Instrument the checkout flow and compare abandonment before and after the account-creation step moves.',
        blocks_finding_ids: [],
      },
    ],

    hypotheses: [],
    feedback: [],
    research_log: {
      actions: [
        {
          id: 'RA-0001',
          research_question_id: 'RQ-0001',
          action: 'retrieve',
          rationale:
            'The product page states price, shipping terms and review count directly, so it is the primary source for this question.',
          target: 'https://trailmark-packs.example/products/flagship-pack',
          result_event_ids: ['RE-0001'],
        },
        {
          id: 'RA-0002',
          research_question_id: 'RQ-0001',
          action: 'compare',
          rationale:
            'Both qualified comparisons needed their own product pages retrieved to compare price, shipping and reviews.',
          target: 'qualified comparison product pages',
          result_event_ids: ['RE-0002', 'RE-0003'],
        },
        {
          id: 'RA-0003',
          research_question_id: 'RQ-0002',
          action: 'inspect',
          rationale:
            'The checkout flow itself states its required steps; no external source was needed.',
          target: 'https://trailmark-packs.example/checkout',
          result_event_ids: ['RE-0004'],
        },
      ],
      events: [
        {
          id: 'RE-0001',
          action_id: 'RA-0001',
          outcome: 'succeeded',
          detail: 'Product page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0002',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail: 'Comparable pack A product page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0003',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail: 'Comparable pack B product page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0004',
          action_id: 'RA-0003',
          outcome: 'succeeded',
          detail: 'Checkout flow inspected directly; no retrieval needed.',
          at: T,
        },
      ],
    },
  };
}
