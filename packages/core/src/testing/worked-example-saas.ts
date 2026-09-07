import type { Review } from '../model/index.ts';
import { emptyReview, newRun } from '../store.ts';

/**
 * A complete, valid run for a genuinely different kind of subject, shipped as
 * the commercial-saas fixture.
 *
 * Deliberately lighter than the personal-brand worked example rather than
 * matching its depth line for line: the point of a second fixture is to prove
 * the deterministic layer, especially the module registry and the saturation
 * table, produces a different shape for a different review, not to duplicate
 * the effort of exercising every awkward case a second time. It still carries
 * its own genuine uncertainty: an assumption the recommendation depends on and
 * declares, and a finding resting on a single source.
 *
 * The subject is invented. Nothing here is specific to any real product.
 */

const T = '2026-09-07T09:00:00.000Z';
const hash = (seed: string) => seed.repeat(64).slice(0, 64);

export function makeCommercialSaasExample(): Review {
  const run = newRun('lighthouse-metrics', 'r-20260907-001', T);
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
      objective: 'Increase paid subscription conversion on the pricing page.',
      entity_ids: ['ENT-0001'],
      asset_ids: ['AST-0001', 'AST-0002', 'AST-0003'],
      decision: {
        statement:
          'Which pricing page and trial signup change would most improve paid subscription conversion this quarter?',
        decision_maker: 'Head of growth',
        horizon: 'One quarter',
        evidence_required: [
          'How the pricing page compares against the qualified comparison set',
          'What friction exists in the trial signup flow',
        ],
      },
      audiences: [
        {
          name: 'Team leads evaluating tools before a trial',
          priority: 1,
          decision_role: 'Initiator',
        },
        {
          name: 'Finance approvers confirming the annual spend',
          priority: 2,
          decision_role: 'Budget approver',
        },
      ],
      geography: ['United States', 'United Kingdom'],
      languages: ['en'],
      channels: ['website'],
      exclusions: ['Enterprise sales-assisted pricing, which is negotiated off-page'],
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
        'The review treats the pricing page and trial signup as a conversion decision for a budget-conscious evaluator, not as a general product review.',
      activated_modules: [
        {
          key: 'positioning',
          reason: 'How the pricing model is framed is itself a positioning choice.',
          research_question_ids: [],
        },
        {
          key: 'audience',
          reason: 'A team lead and a finance approver weigh the same pricing page differently.',
          research_question_ids: [],
        },
        {
          key: 'messaging',
          reason: 'The pricing page has to justify the model, not just state it.',
          research_question_ids: [],
        },
        {
          key: 'competitive_landscape',
          reason: 'Pricing only reads as a choice against what comparable tools charge.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'offer',
          reason:
            'The subscription itself, and how it is packaged, is the subject of the decision.',
          research_question_ids: [],
        },
        {
          key: 'pricing',
          reason: 'The decision is explicitly about the pricing page.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'acquisition',
          reason: 'Trial signup is the acquisition mechanism this review is asked to improve.',
          research_question_ids: [],
        },
        {
          key: 'conversion',
          reason: 'Signup friction is the second half of the stated decision.',
          research_question_ids: ['RQ-0002'],
        },
        {
          key: 'digital_experience',
          reason: 'The pricing page and signup flow are both web pages.',
          research_question_ids: [],
        },
      ],
      dormant_modules: [
        {
          key: 'content',
          reason: 'No blog or writing corpus bears on a pricing and signup decision.',
        },
        {
          key: 'credibility',
          reason:
            'Not raised in the objective; a separate review would need to establish this before it belonged here.',
        },
        {
          key: 'accessibility',
          reason: 'No compliance driver was raised, and the pages are simple checkout-style forms.',
        },
        {
          key: 'discoverability',
          reason: 'The decision is about visitors who already arrived, not about being found.',
        },
        {
          key: 'market',
          reason: "The analytics tooling market's trends are not what this decision turns on.",
        },
        {
          key: 'reputation',
          reason: 'No press or third-party sentiment signal was anticipated going in.',
        },
        {
          key: 'trust',
          reason:
            'No security or compliance concern was raised for this audience or this decision.',
        },
        { key: 'operations', reason: 'Out of scope for a pricing and conversion review.' },
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
        'No analytics access, so the actual drop-off point in signup cannot be observed directly.',
      ],
    },

    entities: [
      {
        id: 'ENT-0001',
        type: 'company',
        role: 'subject',
        name: 'Lighthouse Metrics',
        description: 'A team analytics dashboard sold as a monthly subscription.',
        canonical_url: 'https://lighthouse-metrics.example',
        industry: 'Analytics software',
        asset_ids: ['AST-0001', 'AST-0002', 'AST-0003'],
      },
      {
        id: 'ENT-0002',
        type: 'company',
        role: 'comparison',
        name: 'Comparable analytics tool A',
        canonical_url: 'https://comparable-a.example',
        asset_ids: [],
      },
      {
        id: 'ENT-0003',
        type: 'company',
        role: 'comparison',
        name: 'Comparable analytics tool B',
        canonical_url: 'https://comparable-b.example',
        asset_ids: [],
      },
    ],

    assets: [
      {
        id: 'AST-0001',
        entity_id: 'ENT-0001',
        type: 'website_page',
        path: '/pricing',
        title: 'Pricing',
        source_ids: ['S-0001'],
      },
      {
        id: 'AST-0002',
        entity_id: 'ENT-0001',
        type: 'signup_flow',
        path: '/trial/start',
        title: 'Trial signup',
        source_ids: ['S-0001'],
      },
      {
        id: 'AST-0003',
        entity_id: 'ENT-0001',
        type: 'website_page',
        path: '/',
        title: 'Homepage',
        source_ids: ['S-0001'],
      },
    ],

    user_assertions: [],

    research_questions: [
      {
        id: 'RQ-0001',
        question: 'How does the pricing model compare against the qualified comparison set?',
        module: 'pricing',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail: 'Both qualified comparisons publish their pricing model directly.',
        evidence_ids: ['E-0001'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        confidence: 'high',
        priority: 1,
      },
      {
        id: 'RQ-0002',
        question: 'What friction exists in the trial signup flow?',
        module: 'conversion',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail:
          'The signup form itself states the requirement directly; no interpretation was needed.',
        evidence_ids: ['E-0002'],
        source_ids: ['S-0001'],
        confidence: 'medium',
        priority: 1,
      },
    ],

    sources: [
      {
        id: 'S-0001',
        url: 'https://lighthouse-metrics.example/pricing',
        title: 'Pricing',
        publisher: 'Lighthouse Metrics',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0001.html',
        content_hash: hash('s1'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0001',
      },
      {
        id: 'S-0002',
        url: 'https://comparable-a.example/pricing',
        title: 'Pricing',
        publisher: 'Comparable analytics tool A',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0002.html',
        content_hash: hash('s2'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0002',
      },
      {
        id: 'S-0003',
        url: 'https://comparable-b.example/pricing',
        title: 'Pricing',
        publisher: 'Comparable analytics tool B',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0003.html',
        content_hash: hash('s3'),
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
        statement: 'The pricing page lists three tiers, each a flat monthly price per seat.',
        locator: 'section.pricing-tiers',
        observed_at: T,
      },
      {
        id: 'OBS-0002',
        source_id: 'S-0002',
        observation_type: 'positive',
        statement: 'Pricing is calculated per tracked event per month, with no flat per-seat tier.',
        locator: 'section.pricing-calculator',
        observed_at: T,
      },
      {
        id: 'OBS-0003',
        source_id: 'S-0003',
        observation_type: 'positive',
        statement: 'Pricing scales with monthly active users tracked, with no flat per-seat tier.',
        locator: 'section.usage-pricing',
        observed_at: T,
      },
      {
        id: 'OBS-0004',
        source_id: 'S-0001',
        observation_type: 'positive',
        statement:
          'The trial signup form requires a card number before the trial account is created.',
        locator: 'form#trial-signup input[name=card_number]',
        observed_at: T,
      },
    ],

    evidence: [
      {
        id: 'E-0001',
        observation_ids: ['OBS-0001', 'OBS-0002', 'OBS-0003'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        claim: 'The subject prices per seat while both qualified comparisons price by usage.',
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
        claim: 'A prospective user must provide a card number before the trial account exists.',
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
        name: 'Comparable analytics tool A',
        type: 'direct_competitor',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Same category, same evaluator audience, addresses the same buying decision.',
        audience_overlap: 'high',
        objective_overlap: 'high',
        decision_overlap: 'high',
        relevance: 'high',
        confidence: 'high',
        source_ids: ['S-0002'],
        positioning_territories: ['Usage-based pricing for scaling teams'],
      },
      {
        id: 'COMP-0002',
        entity_id: 'ENT-0003',
        name: 'Comparable analytics tool B',
        type: 'direct_competitor',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Appears alongside tool A in the same evaluation shortlists.',
        audience_overlap: 'high',
        objective_overlap: 'medium',
        decision_overlap: 'high',
        relevance: 'medium',
        confidence: 'medium',
        source_ids: ['S-0003'],
        positioning_territories: ['Usage-based pricing for scaling teams'],
      },
    ],

    findings: [
      {
        id: 'F-0001',
        category: 'pricing',
        title: 'Per-seat pricing is the odd model out in this comparison set',
        statement:
          'The subject prices per seat while both qualified comparisons price by usage, making it the only flat, predictable option among the three.',
        claim_type: 'derived',
        evidence_ids: ['E-0001'],
        confidence: 'high',
        importance: 'high',
        implication:
          'A finance approver comparing the three has one option whose monthly cost cannot vary with usage.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: [],
        audience_relevance:
          'Finance approvers who need a predictable line item weigh this directly.',
      },
      {
        id: 'F-0002',
        category: 'conversion',
        title: 'A card is required before any trial usage',
        statement:
          'The trial signup form requires a card number before the trial account is created.',
        claim_type: 'derived',
        evidence_ids: ['E-0002'],
        confidence: 'high',
        importance: 'medium',
        implication: 'A team lead cannot evaluate the product before entering payment details.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: ['ASM-0001'],
        audience_relevance:
          'Team leads initiating an evaluation are the ones who hit this step first.',
      },
    ],

    opportunities: [
      {
        id: 'O-0001',
        title: 'Predictable per-seat cost is unoccupied territory in this comparison set',
        description:
          'Both qualified comparisons priced by usage. Naming per-seat predictability as a deliberate choice, rather than leaving it unexplained, turns the odd-one-out position into a stated advantage for a budget-conscious approver.',
        supporting_finding_ids: ['F-0001'],
        supporting_evidence_ids: ['E-0001'],
        strategic_value: 'high',
        audience_value: 'high',
        confidence: 'medium',
        white_space: {
          territory: 'Predictable per-seat pricing for finance approval',
          current_position: 'high',
        },
      },
      {
        id: 'O-0002',
        title: 'A card-free trial removes a procurement step from evaluation',
        description:
          'Team leads evaluating tools before involving finance would not need a payment conversation to start looking.',
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
        title: 'Name predictable per-seat cost as a deliberate choice on the pricing page',
        problem:
          'The pricing page states the per-seat model without explaining why, next to comparisons that price by usage.',
        why_it_matters:
          'A finance approver comparing three tools sees one with a cost that cannot vary and no stated reason for it.',
        finding_ids: ['F-0001'],
        opportunity_ids: ['O-0001'],
        strategic_rationale:
          'Unoccupied among the qualified comparisons, and already true rather than aspirational.',
        recommended_change:
          'Add a short comparison module to /pricing naming the predictability of per-seat cost against usage-based billing, addressed to whoever approves the budget line.',
        expected_outcome:
          'A finance approver can state why the cost is predictable within one screen.',
        impact: 'high',
        effort: 'low',
        confidence: 'high',
        urgency: 'medium',
        dependencies: [],
        assumption_ids: [],
        measurement: {
          kind: 'quantitative',
          hypothesis:
            'Naming per-seat predictability as a deliberate choice reduces approval hesitation.',
          success_metric:
            'Pricing-page-to-signup rate for sessions that view the comparison module.',
          baseline: 'unknown',
          target: 'Establish a baseline, then improve on it',
          validation_method:
            'Compare signup rate for sessions exposed to the module against sessions that were not, over six weeks.',
          falsifier:
            'Signup rate is indistinguishable between sessions that saw the module and sessions that did not, after six weeks of comparable traffic.',
          review_period: '6 weeks',
        },
      },
      {
        id: 'R-0002',
        title: 'Let the trial start without a card',
        problem:
          'A prospective user must provide payment details before the product can be tried at all.',
        why_it_matters:
          'The team lead who starts an evaluation is not yet the person authorised to commit spend, and is asked for a card before knowing if the product fits.',
        finding_ids: ['F-0002'],
        opportunity_ids: ['O-0002'],
        strategic_rationale:
          'Removes a procurement-shaped step from what is still an evaluation step.',
        recommended_change:
          'Allow the trial to start without a card, and ask for payment details only when converting to a paid plan.',
        expected_outcome:
          'A team lead can reach the product itself before any payment conversation.',
        impact: 'high',
        effort: 'medium',
        confidence: 'medium',
        urgency: 'high',
        dependencies: [],
        // Carried from F-0002, which rests on it: uncertainty travels with the
        // recommendation rather than stopping at the finding.
        assumption_ids: ['ASM-0001'],
        measurement: {
          kind: 'quantitative',
          hypothesis:
            'Removing the card requirement increases trial starts without a proportional drop in paid conversion.',
          success_metric:
            'Trial starts per 100 pricing-page visits, and trial-to-paid conversion rate.',
          baseline: 'unknown',
          target:
            'Establish a baseline, then hold trial-to-paid steady or better while trial starts increase.',
          validation_method: 'Run for one full sales cycle and compare the two cohorts.',
          falsifier:
            'Trial starts increase but trial-to-paid conversion falls enough that net paid customers are flat or lower after one cycle.',
          review_period: 'One quarter',
        },
      },
    ],

    actions: [
      {
        id: 'A-0001',
        recommendation_id: 'R-0001',
        description: 'Add a per-seat-versus-usage comparison module to the pricing page.',
        affected_assets: [
          { asset_id: 'AST-0001', operation: 'edit', target: 'pricing-comparison-module' },
        ],
        effort: 'low',
        dependencies: [],
        status: 'todo',
        validation: 'A finance approver reading the page can state why the cost is predictable.',
        horizon: 'now',
      },
      {
        id: 'A-0002',
        recommendation_id: 'R-0002',
        description: 'Remove the card-number requirement from the trial signup form.',
        affected_assets: [{ asset_id: 'AST-0002', operation: 'edit', target: 'card-requirement' }],
        effort: 'medium',
        dependencies: [],
        status: 'todo',
        validation: 'A trial account can be created with no payment field submitted.',
        horizon: 'next',
      },
    ],

    assumptions: [
      {
        id: 'ASM-0001',
        statement:
          'Removing the card requirement will increase trial starts without materially increasing low-quality signups.',
        why_assumed: 'No historical no-card trial data exists for this product to check against.',
        status: 'unvalidated',
        validation_method:
          'Run a no-card trial for one cohort and compare trial-to-paid conversion against the existing card-required cohort.',
        evidence_ids: [],
      },
    ],

    unknowns: [
      {
        id: 'UNK-0001',
        statement:
          'Where in the signup flow prospective users actually abandon is not established.',
        why_unknown:
          'No analytics access; only the stated requirement on the form is observable from outside.',
        how_to_resolve:
          'Instrument the flow and compare abandonment before and after the card requirement is removed.',
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
            'The pricing page states the model directly, so it is the primary source for this question.',
          target: 'https://lighthouse-metrics.example/pricing',
          result_event_ids: ['RE-0001'],
        },
        {
          id: 'RA-0002',
          research_question_id: 'RQ-0001',
          action: 'compare',
          rationale:
            'The qualified comparison set both needed their own pricing pages retrieved to compare models.',
          target: 'qualified comparison pricing pages',
          result_event_ids: ['RE-0002', 'RE-0003'],
        },
        {
          id: 'RA-0003',
          research_question_id: 'RQ-0002',
          action: 'inspect',
          rationale:
            'The signup form itself states its required fields; no external source was needed.',
          target: 'https://lighthouse-metrics.example/trial/start',
          result_event_ids: ['RE-0004'],
        },
      ],
      events: [
        {
          id: 'RE-0001',
          action_id: 'RA-0001',
          outcome: 'succeeded',
          detail: 'Pricing page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0002',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail: 'Comparable tool A pricing page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0003',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail: 'Comparable tool B pricing page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0004',
          action_id: 'RA-0003',
          outcome: 'succeeded',
          detail: 'Signup form fields inspected directly; no retrieval needed.',
          at: T,
        },
      ],
    },
  };
}
