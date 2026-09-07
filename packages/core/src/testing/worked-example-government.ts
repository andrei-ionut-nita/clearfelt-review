import type { Review } from '../model/index.ts';
import { emptyReview, newRun } from '../store.ts';

/**
 * A sixth archetype fixture, shipped as government, added in Phase 6.
 *
 * Activates accessibility, discoverability and trust together, a
 * combination no other fixture in this repository produces: a public
 * digital service has to be usable by people with disabilities, findable by
 * citizens who do not already know it exists, and trusted with the personal
 * information an application requires, in a way a SaaS pricing page or a
 * personal-brand homepage does not.
 *
 * The subject is invented. Nothing here is specific to any real government
 * or public body.
 */

const T = '2026-09-07T09:00:00.000Z';
const hash = (seed: string) => seed.repeat(64).slice(0, 64);

export function makeGovernmentExample(): Review {
  const run = newRun('parkside-council-services', 'r-20260907-001', T);
  run.stage = 'complete';
  run.approved_gates = { scope: T, research_plan: T, findings: T };
  run.observability = {
    started_at: T,
    finished_at: '2026-09-07T10:15:00.000Z',
    sources_discovered: 5,
    sources_retrieved: 3,
    retrieval_failures: 0,
    search_iterations: 2,
  };

  return {
    ...emptyReview(run),

    scope: {
      id: 'SCOPE-0001',
      objective: 'Increase completed applications for the household repair grant service.',
      entity_ids: ['ENT-0001'],
      asset_ids: ['AST-0001', 'AST-0002'],
      decision: {
        statement:
          'Which change to the grant service’s digital application would most increase completed applications from eligible residents this year?',
        decision_maker: 'Head of digital services',
        horizon: 'One financial year',
        evidence_required: [
          'How findable and accessible the application is compared against benchmark council services',
          'What trust or policy signals a resident sees before submitting personal information',
        ],
      },
      audiences: [
        {
          name: 'Eligible residents applying without assistance',
          priority: 1,
          decision_role: 'Applicant',
        },
        {
          name: 'Residents using assistive technology to complete the form',
          priority: 1,
          decision_role: 'Applicant',
        },
      ],
      geography: ['Parkside council area'],
      languages: ['en'],
      channels: ['website'],
      exclusions: [
        'Phone and in-person applications, which are handled by a separate assisted-digital process',
      ],
      depth: 'standard',
      comparison_applicable: true,
      budget: {
        max_sources: 15,
        max_search_iterations: 6,
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
        'The review treats the grant application as a findability, accessibility and trust decision for an eligible resident, not as a general service review.',
      activated_modules: [
        {
          key: 'positioning',
          reason:
            'How the grant is described against other councils’ equivalent services affects whether a resident recognises it applies to them.',
          research_question_ids: [],
        },
        {
          key: 'audience',
          reason:
            'A resident using assistive technology and one applying unassisted meet the same form differently.',
          research_question_ids: [],
        },
        {
          key: 'messaging',
          reason:
            'Eligibility and policy language has to be understood correctly, not just present.',
          research_question_ids: [],
        },
        {
          key: 'competitive_landscape',
          reason:
            'Benchmark council services for the same grant type show what a well-run version of this service looks like.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'offer',
          reason:
            'The grant itself, its eligibility rules and what it covers, is the subject of the application.',
          research_question_ids: [],
        },
        {
          key: 'conversion',
          reason: 'Completing the application is the decision this review exists to improve.',
          research_question_ids: ['RQ-0003'],
        },
        {
          key: 'digital_experience',
          reason: 'The application is a web form.',
          research_question_ids: [],
        },
        {
          key: 'accessibility',
          reason:
            'A public service has an obligation to be usable by residents using assistive technology.',
          research_question_ids: ['RQ-0002'],
        },
        {
          key: 'discoverability',
          reason:
            'A resident who does not already know the grant exists has to be able to find it.',
          research_question_ids: [],
        },
        {
          key: 'trust',
          reason:
            'The application collects personal and financial information a resident has to trust the council with.',
          research_question_ids: [],
        },
        {
          key: 'external_environment',
          reason:
            'Eligibility rules are set by national and local policy, not by the council alone.',
          research_question_ids: [],
        },
      ],
      dormant_modules: [
        {
          key: 'market',
          reason:
            'There is no market this service competes in; residents do not choose between councils.',
        },
        {
          key: 'content',
          reason: 'No blog or writing corpus bears on a single grant application form.',
        },
        {
          key: 'credibility',
          reason:
            'Not raised for a mandatory public service; residents do not weigh third-party endorsement before applying.',
        },
        {
          key: 'acquisition',
          reason:
            'Eligible residents are reached through the council’s own channels, not an acquisition funnel this review covers.',
        },
        {
          key: 'pricing',
          reason: 'The grant is free to apply for; there is no price to analyse.',
        },
        {
          key: 'reputation',
          reason: 'No press or public sentiment signal was anticipated for this specific form.',
        },
        {
          key: 'operations',
          reason:
            'Grant processing and payment operations are out of scope; this review covers the application step only.',
        },
      ],
      comparison_plan: {
        supplied_count: 0,
        to_discover: true,
        rationale:
          'No comparisons were supplied, so the benchmark set had to be discovered by service type.',
      },
      anticipated_gaps: [
        'No analytics access, so where in the form residents actually abandon is not directly observable.',
      ],
    },

    entities: [
      {
        id: 'ENT-0001',
        type: 'government_service',
        role: 'subject',
        name: 'Parkside Council household repair grant',
        description: 'A means-tested grant service for essential home repairs.',
        canonical_url: 'https://parkside-council.example/services/repair-grant',
        geography: ['Parkside council area'],
        industry: 'Local government',
        asset_ids: ['AST-0001', 'AST-0002'],
      },
      {
        id: 'ENT-0002',
        type: 'government_service',
        role: 'comparison',
        name: 'Benchmark council repair grant A',
        canonical_url: 'https://benchmark-council-a.example/services/repair-grant',
        asset_ids: [],
      },
    ],

    assets: [
      {
        id: 'AST-0001',
        entity_id: 'ENT-0001',
        type: 'website_page',
        path: '/services/repair-grant',
        title: 'Household repair grant',
        source_ids: ['S-0001'],
      },
      {
        id: 'AST-0002',
        entity_id: 'ENT-0001',
        type: 'application_form',
        path: '/services/repair-grant/apply',
        title: 'Apply for the repair grant',
        source_ids: ['S-0001'],
      },
    ],

    user_assertions: [],

    research_questions: [
      {
        id: 'RQ-0001',
        question: 'How findable is the application compared against a benchmark council service?',
        module: 'discoverability',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail: 'Both pages’ presence in a direct site search is directly observable.',
        evidence_ids: ['E-0001'],
        source_ids: ['S-0001', 'S-0002'],
        confidence: 'medium',
        priority: 1,
      },
      {
        id: 'RQ-0002',
        question:
          'Does the application form meet basic accessibility requirements for assistive technology?',
        module: 'accessibility',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail: 'Form field labelling is directly inspectable in the page markup.',
        evidence_ids: ['E-0002'],
        source_ids: ['S-0001'],
        confidence: 'high',
        priority: 1,
      },
      {
        id: 'RQ-0003',
        question:
          'What trust or policy signal does a resident see before entering financial information?',
        module: 'trust',
        state: 'INSUFFICIENT_EVIDENCE',
        stop_reason: 'no_evidence_available',
        stop_detail: 'No user testing or resident feedback data exists on this specific step.',
        evidence_ids: [],
        source_ids: ['S-0001'],
        confidence: 'low',
        priority: 2,
      },
    ],

    sources: [
      {
        id: 'S-0001',
        url: 'https://parkside-council.example/services/repair-grant',
        title: 'Household repair grant',
        publisher: 'Parkside Council',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0001.html',
        content_hash: hash('g1'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0001',
      },
      {
        id: 'S-0002',
        url: 'https://benchmark-council-a.example/services/repair-grant',
        title: 'Repair grant',
        publisher: 'Benchmark council A',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0002.html',
        content_hash: hash('g2'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0002',
      },
    ],

    observations: [
      {
        id: 'OBS-0001',
        source_id: 'S-0001',
        observation_type: 'negative',
        statement:
          'The grant page is not linked from the council’s housing section navigation, only from a general A-Z services index.',
        locator: 'nav#housing-section',
        observed_at: T,
      },
      {
        id: 'OBS-0002',
        source_id: 'S-0002',
        observation_type: 'positive',
        statement:
          'The benchmark council links its equivalent grant page directly from its housing section navigation.',
        locator: 'nav#housing',
        observed_at: T,
      },
      {
        id: 'OBS-0003',
        source_id: 'S-0001',
        observation_type: 'negative',
        statement: 'Three of the application form’s input fields have no associated label element.',
        locator: 'form#apply input:not([aria-label]):not([id])',
        observed_at: T,
      },
    ],

    evidence: [
      {
        id: 'E-0001',
        observation_ids: ['OBS-0001', 'OBS-0002'],
        source_ids: ['S-0001', 'S-0002'],
        claim:
          'The subject’s grant page is reachable only through a general index while the benchmark council links its equivalent page from the relevant section navigation.',
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
        observation_ids: ['OBS-0003'],
        source_ids: ['S-0001'],
        claim:
          'Three required fields in the application form have no label a screen reader can announce.',
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
        name: 'Benchmark council repair grant A',
        type: 'benchmark',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Same grant type, comparable eligibility criteria and resident population.',
        audience_overlap: 'high',
        objective_overlap: 'high',
        decision_overlap: 'high',
        relevance: 'high',
        confidence: 'high',
        source_ids: ['S-0002'],
        positioning_territories: ['Repair grant reachable from housing navigation'],
      },
    ],

    findings: [
      {
        id: 'F-0001',
        category: 'discoverability',
        title: 'The grant is reachable only through the general services index',
        statement:
          'The subject’s grant page is reachable only through a general index while the benchmark council links its equivalent page from the relevant section navigation.',
        claim_type: 'derived',
        evidence_ids: ['E-0001'],
        confidence: 'high',
        importance: 'high',
        implication:
          'A resident who does not already know the grant’s exact name is less likely to find it here than on the benchmark council’s site.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: [],
        audience_relevance:
          'Eligible residents who have not already been told the grant exists are the ones this affects.',
      },
      {
        id: 'F-0002',
        category: 'accessibility',
        title: 'Three required application fields have no accessible label',
        statement:
          'Three required fields in the application form have no label a screen reader can announce.',
        claim_type: 'derived',
        evidence_ids: ['E-0002'],
        confidence: 'high',
        importance: 'high',
        implication:
          'A resident using a screen reader cannot reliably tell what three of the required fields are asking for.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: [],
        audience_relevance:
          'Residents using assistive technology to complete the form are directly blocked by this.',
      },
    ],

    opportunities: [
      {
        id: 'O-0001',
        title: 'Section navigation is an unoccupied route to the grant page',
        description:
          'Linking the grant from the housing section navigation, as the benchmark council already does, closes a findability gap the comparison set makes visible.',
        supporting_finding_ids: ['F-0001'],
        supporting_evidence_ids: ['E-0001'],
        strategic_value: 'medium',
        audience_value: 'high',
        confidence: 'medium',
        white_space: {
          territory: 'Repair grant reachable from housing navigation',
          current_position: 'low',
        },
      },
      {
        id: 'O-0002',
        title: 'Labelling the three fields removes a hard block for assistive-technology users',
        description:
          'Adding accessible labels is a small, mechanical fix that removes a barrier rather than merely reducing it.',
        supporting_finding_ids: ['F-0002'],
        supporting_evidence_ids: ['E-0002'],
        strategic_value: 'high',
        audience_value: 'high',
        confidence: 'high',
      },
    ],

    recommendations: [
      {
        id: 'R-0001',
        title: 'Link the repair grant from the housing section navigation',
        problem:
          'The grant page is reachable only through the general A-Z services index, unlike the benchmark council’s equivalent page.',
        why_it_matters:
          'A resident who does not already know the grant’s exact name is less likely to find it here than on a comparable council’s site.',
        finding_ids: ['F-0001'],
        opportunity_ids: ['O-0001'],
        strategic_rationale:
          'Matches a navigation pattern already in use by a benchmark council service.',
        recommended_change:
          'Add a direct link to the repair grant page from the housing section of the council’s navigation.',
        expected_outcome:
          'A resident browsing the housing section can reach the grant page without already knowing its name.',
        impact: 'medium',
        effort: 'low',
        confidence: 'medium',
        urgency: 'medium',
        dependencies: [],
        assumption_ids: [],
        measurement: {
          kind: 'quantitative',
          hypothesis:
            'Linking from housing navigation increases traffic to the grant page from within the housing section.',
          success_metric:
            'Share of grant-page visits that arrive via the housing section navigation.',
          baseline: 'unknown',
          target: 'Establish a baseline, then improve on it',
          validation_method:
            'Compare the referral share for eight weeks before and after the navigation change.',
          falsifier:
            'The referral share from housing navigation is unchanged between the two eight-week windows.',
          review_period: '8 weeks',
        },
      },
      {
        id: 'R-0002',
        title: 'Add accessible labels to the three unlabelled application fields',
        problem:
          'Three required fields in the application form have no label a screen reader can announce.',
        why_it_matters:
          'A resident using assistive technology cannot reliably complete the application as it stands.',
        finding_ids: ['F-0002'],
        opportunity_ids: ['O-0002'],
        strategic_rationale:
          'A mechanical accessibility fix with no ambiguity about whether it is needed.',
        recommended_change:
          'Add a programmatically associated label to each of the three fields identified.',
        expected_outcome:
          'A screen reader announces a correct label for every required field in the form.',
        impact: 'high',
        effort: 'low',
        confidence: 'high',
        urgency: 'high',
        dependencies: [],
        assumption_ids: [],
        measurement: {
          kind: 'binary',
          hypothesis:
            'Adding accessible labels removes the identified barrier for screen reader users.',
          success_metric:
            'Whether all three fields have a programmatically associated label, verified by re-inspection.',
          baseline: 'Zero of three fields labelled.',
          target: 'Three of three fields labelled.',
          validation_method: 'Re-inspect the form markup after the change ships.',
          falsifier:
            'A re-inspection after the change still finds one or more of the three fields without a label.',
          review_period: 'On next release',
        },
      },
    ],

    actions: [
      {
        id: 'A-0001',
        recommendation_id: 'R-0001',
        description: 'Add a link to the repair grant page in the housing section navigation.',
        affected_assets: [
          { asset_id: 'AST-0001', operation: 'edit', target: 'housing-navigation-link' },
        ],
        effort: 'low',
        dependencies: [],
        status: 'todo',
        validation:
          'The repair grant page is reachable from a link within the housing section navigation.',
        horizon: 'now',
      },
      {
        id: 'A-0002',
        recommendation_id: 'R-0002',
        description: 'Add an accessible label to each of the three identified form fields.',
        affected_assets: [{ asset_id: 'AST-0002', operation: 'edit', target: 'field-labels' }],
        effort: 'low',
        dependencies: [],
        status: 'todo',
        validation: 'A screen reader announces a correct label for all three fields.',
        horizon: 'now',
      },
    ],

    assumptions: [],

    unknowns: [
      {
        id: 'UNK-0001',
        statement:
          'What trust or policy signal a resident sees before entering financial information is not established.',
        why_unknown:
          'No user testing or resident feedback data exists on this specific step of the form.',
        how_to_resolve:
          'Commission a small round of moderated user testing on the financial-information step.',
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
          action: 'compare',
          rationale:
            'Navigation placement is directly observable on both the subject and the benchmark council’s site.',
          target: 'housing section navigation, subject and benchmark',
          result_event_ids: ['RE-0001', 'RE-0002'],
        },
        {
          id: 'RA-0002',
          research_question_id: 'RQ-0002',
          action: 'inspect',
          rationale:
            'Field labelling is directly inspectable in the page markup; no external source was needed.',
          target: 'https://parkside-council.example/services/repair-grant/apply',
          result_event_ids: ['RE-0003'],
        },
        {
          id: 'RA-0003',
          research_question_id: 'RQ-0003',
          action: 'search',
          rationale:
            'Checked for existing resident feedback or user testing data on the financial-information step before concluding none exists.',
          target: 'internal research repository',
          result_event_ids: ['RE-0004'],
        },
      ],
      events: [
        {
          id: 'RE-0001',
          action_id: 'RA-0001',
          outcome: 'succeeded',
          detail: 'Subject page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0002',
          action_id: 'RA-0001',
          outcome: 'succeeded',
          detail: 'Benchmark council page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0003',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail: 'Form markup inspected directly; no retrieval needed.',
          at: T,
        },
        {
          id: 'RE-0004',
          action_id: 'RA-0003',
          outcome: 'insufficient',
          detail: 'No user testing or resident feedback data exists on this specific step.',
          at: T,
        },
      ],
    },
  };
}
