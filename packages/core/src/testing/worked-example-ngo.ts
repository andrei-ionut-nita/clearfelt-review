import type { Review } from '../model/index.ts';
import { emptyReview, newRun } from '../store.ts';

/**
 * A fifth archetype fixture, shipped as ngo, added in Phase 6.
 *
 * The one deliberate structural difference from every other fixture:
 * `scope.comparison_applicable` is false. Specification section 51 requires
 * that decision be recorded explicitly, with a reason, when comparison does
 * not apply, rather than an empty comparisons array standing in unexplained
 * for a decision nobody made. This fixture is the one place that path is
 * exercised: the subject runs two field programmes for the same population
 * and asks which to scale, a decision a comparison against other
 * organisations would not help answer.
 *
 * That single choice reshapes the module set: competitive_landscape reads
 * comparisonApplicable directly, so it goes dormant here regardless of any
 * keyword, and with no digital assets in scope (the evidence is programme
 * reports, not web pages), digital_experience, accessibility and
 * discoverability go dormant too. What activates instead, market,
 * operations and external_environment, is not something any other fixture
 * in this repository activates.
 *
 * The subject is invented. Nothing here is specific to any real
 * organisation.
 */

const T = '2026-09-07T09:00:00.000Z';
const hash = (seed: string) => seed.repeat(64).slice(0, 64);

export function makeNgoExample(): Review {
  const run = newRun('fieldward-trust', 'r-20260907-001', T);
  run.stage = 'complete';
  run.approved_gates = { scope: T, research_plan: T, findings: T };
  run.observability = {
    started_at: T,
    finished_at: '2026-09-07T10:20:00.000Z',
    sources_discovered: 4,
    sources_retrieved: 2,
    retrieval_failures: 0,
    search_iterations: 1,
  };

  return {
    ...emptyReview(run),

    scope: {
      id: 'SCOPE-0001',
      objective: 'Increase impact per pound spent across field programmes.',
      entity_ids: ['ENT-0001'],
      asset_ids: ['AST-0001', 'AST-0002'],
      decision: {
        statement:
          'Which of the two current field programmes should receive next year’s marginal funding to scale?',
        decision_maker: 'Programme director',
        horizon: 'One funding cycle',
        evidence_required: [
          'What each programme’s own reporting shows about cost per beneficiary reached',
          'What operational capacity exists to scale either programme without degrading delivery',
        ],
      },
      audiences: [
        {
          name: 'Programme director allocating next cycle’s marginal funding',
          priority: 1,
          decision_role: 'Decision maker',
        },
        {
          name: 'Institutional funders reviewing the allocation rationale',
          priority: 2,
          decision_role: 'Funder',
        },
      ],
      geography: ['East Africa region'],
      languages: ['en'],
      channels: [],
      exclusions: [
        'Programmes outside the current funding cycle, which are not eligible for reallocation',
      ],
      depth: 'standard',
      comparison_applicable: false,
      comparison_not_applicable_reason:
        'The decision is which of two internal programmes to scale, not how the organisation compares against others; no external comparison bears on this allocation.',
      budget: {
        max_sources: 10,
        max_search_iterations: 4,
        max_depth: 1,
        min_evidence_per_question: 1,
        min_independent_corroboration: 1,
        priority_question_ids: ['RQ-0001'],
      },
    },

    plan: {
      id: 'PLAN-0001',
      created_at: T,
      objective_interpretation:
        'The review treats this as an internal allocation decision between two programmes, not as a positioning or acquisition review.',
      activated_modules: [
        {
          key: 'positioning',
          reason:
            'How each programme’s outcomes are framed for funders is itself a positioning choice.',
          research_question_ids: [],
        },
        {
          key: 'audience',
          reason:
            'The programme director and the institutional funder weigh the same evidence for different reasons.',
          research_question_ids: [],
        },
        {
          key: 'messaging',
          reason:
            'The allocation rationale has to be stated in a way a funder can follow, not just decided internally.',
          research_question_ids: [],
        },
        {
          key: 'market',
          reason:
            'How funder priorities are trending in the region bears on which programme is easier to fund at scale.',
          research_question_ids: [],
        },
        {
          key: 'operations',
          reason: 'Scaling either programme is fundamentally a delivery-capacity question.',
          research_question_ids: ['RQ-0002'],
        },
        {
          key: 'credibility',
          reason:
            'Institutional funders weigh a programme’s track record before its projected impact.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'external_environment',
          reason:
            'The funding environment for the region shapes what is realistically fundable at scale.',
          research_question_ids: [],
        },
      ],
      dormant_modules: [
        {
          key: 'competitive_landscape',
          reason:
            'scope.json records comparison as explicitly not applicable to this internal allocation decision.',
        },
        {
          key: 'offer',
          reason: 'Neither programme is a packaged offer being sold; both are delivered directly.',
        },
        {
          key: 'content',
          reason: 'No blog or writing corpus bears on a funding-allocation decision.',
        },
        {
          key: 'acquisition',
          reason:
            'Beneficiaries are reached through the programme itself, not through a funnel this review covers.',
        },
        {
          key: 'conversion',
          reason: 'There is no purchase or signup step in either programme.',
        },
        {
          key: 'pricing',
          reason: 'Neither programme charges beneficiaries.',
        },
        {
          key: 'digital_experience',
          reason:
            'The evidence base is programme reports, not web pages; no digital asset is in scope.',
        },
        {
          key: 'accessibility',
          reason: 'No digital asset is in scope for this review.',
        },
        {
          key: 'discoverability',
          reason: 'No digital asset is in scope for this review.',
        },
        {
          key: 'reputation',
          reason:
            'No press or public sentiment signal was anticipated for an internal allocation decision.',
        },
        {
          key: 'trust',
          reason: 'No security, privacy or compliance concern was raised for this decision.',
        },
      ],
      comparison_plan: {
        supplied_count: 0,
        to_discover: false,
        rationale:
          'Comparison does not apply to this decision; see scope.comparison_not_applicable_reason.',
      },
      anticipated_gaps: [
        'No independent evaluation exists for either programme; both figures come from internal reporting.',
      ],
    },

    entities: [
      {
        id: 'ENT-0001',
        type: 'ngo',
        role: 'subject',
        name: 'Fieldward Trust',
        description: 'An NGO running two field programmes in the same region.',
        canonical_url: 'https://fieldward-trust.example',
        geography: ['East Africa region'],
        industry: 'Development and relief',
        asset_ids: ['AST-0001', 'AST-0002'],
      },
    ],

    assets: [
      {
        id: 'AST-0001',
        entity_id: 'ENT-0001',
        type: 'programme',
        path: 'PROGRAMME-WATER',
        title: 'Clean water access programme',
        source_ids: ['S-0001'],
      },
      {
        id: 'AST-0002',
        entity_id: 'ENT-0001',
        type: 'programme',
        path: 'PROGRAMME-NUTRITION',
        title: 'Child nutrition programme',
        source_ids: ['S-0002'],
      },
    ],

    user_assertions: [],

    research_questions: [
      {
        id: 'RQ-0001',
        question:
          'What does each programme’s own reporting show about cost per beneficiary reached?',
        module: 'credibility',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail:
          'Both programme reports state the figure directly for the same reporting period.',
        evidence_ids: ['E-0001'],
        source_ids: ['S-0001', 'S-0002'],
        confidence: 'medium',
        priority: 1,
      },
      {
        id: 'RQ-0002',
        question:
          'What operational capacity exists to scale either programme without degrading delivery?',
        module: 'operations',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail: 'The water programme’s report states current staffing headroom directly.',
        evidence_ids: ['E-0002'],
        source_ids: ['S-0001'],
        confidence: 'medium',
        priority: 1,
      },
    ],

    sources: [
      {
        id: 'S-0001',
        url: 'https://fieldward-trust.example/reports/water-annual-report.pdf',
        title: 'Clean water programme annual report',
        publisher: 'Fieldward Trust',
        source_type: 'published_report',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0001.pdf',
        content_hash: hash('n1'),
        authority: 'medium',
        independence: { type: 'independent' },
        entity_id: 'ENT-0001',
      },
      {
        id: 'S-0002',
        url: 'https://fieldward-trust.example/reports/nutrition-annual-report.pdf',
        title: 'Child nutrition programme annual report',
        publisher: 'Fieldward Trust',
        source_type: 'published_report',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0002.pdf',
        content_hash: hash('n2'),
        authority: 'medium',
        // Both reports come from the same organisation about itself, so S-0002
        // does not count as independent corroboration of S-0001, per
        // Source.independence and coverage.ts's independent-corroboration count.
        independence: { type: 'same_organisation', of_source_id: 'S-0001' },
        entity_id: 'ENT-0001',
      },
    ],

    observations: [
      {
        id: 'OBS-0001',
        source_id: 'S-0001',
        observation_type: 'positive',
        statement:
          'The water programme report states a cost of 42 per beneficiary reached for the last reporting year.',
        locator: 'section 3, cost table',
        observed_at: T,
      },
      {
        id: 'OBS-0002',
        source_id: 'S-0002',
        observation_type: 'positive',
        statement:
          'The nutrition programme report states a cost of 96 per beneficiary reached for the last reporting year.',
        locator: 'section 2, cost table',
        observed_at: T,
      },
      {
        id: 'OBS-0003',
        source_id: 'S-0001',
        observation_type: 'positive',
        statement:
          'The water programme report states current field staff are operating at 70 percent of rated capacity.',
        locator: 'section 5, staffing',
        observed_at: T,
      },
    ],

    evidence: [
      {
        id: 'E-0001',
        observation_ids: ['OBS-0001', 'OBS-0002'],
        source_ids: ['S-0001', 'S-0002'],
        claim:
          'The water programme reaches a beneficiary at roughly a fifth of the nutrition programme’s reported cost.',
        research_question_ids: ['RQ-0001'],
        user_assertion_ids: [],
        relevance: 'high',
        reliability: 'medium',
        corroborated_by: [],
        supports: ['F-0001'],
        contradicts: [],
        temporal_scope: 'historical',
      },
      {
        id: 'E-0002',
        observation_ids: ['OBS-0003'],
        source_ids: ['S-0001'],
        claim:
          'The water programme has unused staffing capacity that would allow it to scale without new hiring.',
        research_question_ids: ['RQ-0002'],
        user_assertion_ids: [],
        relevance: 'high',
        reliability: 'medium',
        corroborated_by: [],
        supports: ['F-0002'],
        contradicts: [],
        temporal_scope: 'current',
      },
    ],

    comparisons: [],

    findings: [
      {
        id: 'F-0001',
        category: 'credibility',
        title: 'The water programme reports a substantially lower cost per beneficiary',
        statement:
          'The water programme reaches a beneficiary at roughly a fifth of the nutrition programme’s reported cost for the same reporting period.',
        claim_type: 'derived',
        evidence_ids: ['E-0001'],
        confidence: 'medium',
        importance: 'high',
        implication:
          'Marginal funding directed to the water programme would reach more beneficiaries at the same spend, on the reported figures alone.',
        temporal_scope: 'historical',
        contradicted_by: [],
        assumption_ids: ['ASM-0001'],
        audience_relevance:
          'An institutional funder comparing cost-effectiveness across programmes weighs this figure directly.',
      },
      {
        id: 'F-0002',
        category: 'operations',
        title: 'The water programme has unused delivery capacity',
        statement:
          'The water programme has unused staffing capacity that would allow it to scale without new hiring.',
        claim_type: 'derived',
        evidence_ids: ['E-0002'],
        confidence: 'medium',
        importance: 'high',
        implication:
          'Scaling the water programme would not require the lead time or cost of building new operational capacity first.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: [],
        audience_relevance:
          'The programme director weighing what can realistically scale this cycle weighs this directly.',
      },
    ],

    opportunities: [
      {
        id: 'O-0001',
        title: 'Existing headroom lets the water programme scale without new capacity investment',
        description:
          'Marginal funding could go directly to reach, rather than first funding the staffing capacity to enable it.',
        supporting_finding_ids: ['F-0001', 'F-0002'],
        supporting_evidence_ids: ['E-0001', 'E-0002'],
        strategic_value: 'high',
        audience_value: 'high',
        confidence: 'medium',
      },
    ],

    recommendations: [
      {
        id: 'R-0001',
        title: 'Direct next cycle’s marginal funding to the water programme',
        problem:
          'Marginal funding has historically been split evenly between the two programmes regardless of relative cost-effectiveness or capacity.',
        why_it_matters:
          'On the reported figures, the same marginal pound reaches roughly five times as many beneficiaries through the water programme, which also has the capacity to absorb it without new hiring.',
        finding_ids: ['F-0001', 'F-0002'],
        opportunity_ids: ['O-0001'],
        strategic_rationale:
          'Combines the lower reported cost per beneficiary with existing unused capacity to absorb the funding.',
        recommended_change:
          'Allocate next cycle’s marginal funding to the water programme rather than splitting it evenly with the nutrition programme.',
        expected_outcome:
          'More beneficiaries reached for the same total marginal spend, without a capacity-building delay.',
        impact: 'high',
        effort: 'low',
        confidence: 'medium',
        urgency: 'medium',
        dependencies: [],
        assumption_ids: ['ASM-0001'],
        measurement: {
          kind: 'quantitative',
          hypothesis:
            'Reallocating marginal funding to the water programme increases total beneficiaries reached next cycle without increasing total spend.',
          success_metric:
            'Total beneficiaries reached across both programmes, at constant total spend.',
          baseline: 'Beneficiaries reached under the prior even split.',
          target: 'An increase in total beneficiaries reached at the same total spend.',
          validation_method:
            'Compare total beneficiaries reached this cycle against the prior cycle’s reported figure.',
          falsifier:
            'Total beneficiaries reached this cycle is flat or lower than the prior cycle despite the reallocation.',
          review_period: 'One funding cycle',
        },
      },
    ],

    actions: [
      {
        id: 'A-0001',
        recommendation_id: 'R-0001',
        description:
          'Update the funding allocation plan to direct marginal funding to the water programme.',
        affected_assets: [
          { asset_id: 'AST-0001', operation: 'edit', target: 'funding-allocation' },
        ],
        effort: 'low',
        dependencies: [],
        status: 'todo',
        validation:
          'The approved allocation plan for next cycle shows marginal funding directed to the water programme.',
        horizon: 'now',
      },
    ],

    assumptions: [
      {
        id: 'ASM-0001',
        statement:
          'The two programmes’ self-reported cost-per-beneficiary figures are calculated on a comparable basis.',
        why_assumed:
          'No independent evaluation exists to verify the reporting methodology behind either figure.',
        status: 'unvalidated',
        validation_method:
          'Commission or obtain an independent review of both programmes’ cost-accounting methodology.',
        evidence_ids: [],
      },
    ],

    unknowns: [
      {
        id: 'UNK-0001',
        statement:
          'Whether the nutrition programme’s higher reported cost reflects a harder-to-reach population rather than lower relative effectiveness is not established.',
        why_unknown: 'Neither report breaks down cost by beneficiary sub-population.',
        how_to_resolve:
          'Request a population-segmented cost breakdown from both programme teams before the next allocation cycle.',
        blocks_finding_ids: ['F-0001'],
      },
    ],

    hypotheses: [],
    feedback: [],
    research_log: {
      actions: [
        {
          id: 'RA-0001',
          research_question_id: 'RQ-0001',
          action: 'inspect',
          rationale:
            'Both annual reports state the cost figure directly; no external retrieval was needed.',
          target: 'internal programme reports',
          result_event_ids: ['RE-0001', 'RE-0002'],
        },
        {
          id: 'RA-0002',
          research_question_id: 'RQ-0002',
          action: 'inspect',
          rationale: 'The water programme report states current staffing headroom directly.',
          target: 'clean water programme annual report',
          result_event_ids: ['RE-0003'],
        },
      ],
      events: [
        {
          id: 'RE-0001',
          action_id: 'RA-0001',
          outcome: 'succeeded',
          detail: 'Water programme report supplied and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0002',
          action_id: 'RA-0001',
          outcome: 'succeeded',
          detail: 'Nutrition programme report supplied and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0003',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail: 'Staffing section inspected directly; no further retrieval needed.',
          at: T,
        },
      ],
    },
  };
}
