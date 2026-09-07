import type { Review } from '../model/index.ts';
import { emptyReview, newRun } from '../store.ts';

/**
 * The seventh and final archetype fixture named in the original plan,
 * shipped as professional-services, added in Phase 6.
 *
 * Activates credibility, reputation and discoverability together: a
 * boutique advisory firm's site has to prove its track record, surface what
 * others say about it, and be found by a prospect who does not yet know its
 * name, in a combination no other fixture in this repository produces.
 * pricing stays dormant here, unlike product and commercial-saas, because
 * the firm's rates are quoted per engagement rather than published.
 *
 * The subject is invented. Nothing here is specific to any real firm.
 */

const T = '2026-09-07T09:00:00.000Z';
const hash = (seed: string) => seed.repeat(64).slice(0, 64);

export function makeProfessionalServicesExample(): Review {
  const run = newRun('waymark-advisory', 'r-20260907-001', T);
  run.stage = 'complete';
  run.approved_gates = { scope: T, research_plan: T, findings: T };
  run.observability = {
    started_at: T,
    finished_at: '2026-09-07T10:05:00.000Z',
    sources_discovered: 5,
    sources_retrieved: 3,
    retrieval_failures: 0,
    search_iterations: 2,
  };

  return {
    ...emptyReview(run),

    scope: {
      id: 'SCOPE-0001',
      objective: 'Increase qualified inbound enquiries for the advisory service.',
      entity_ids: ['ENT-0001'],
      asset_ids: ['AST-0001', 'AST-0002'],
      decision: {
        statement:
          'Which change to the site’s proof and enquiry path would most increase qualified inbound enquiries this quarter?',
        decision_maker: 'Managing partner',
        horizon: 'One quarter',
        evidence_required: [
          'How the firm’s stated track record compares against the qualified comparison set',
          'How findable the firm is for a prospect who does not already know its name',
        ],
      },
      audiences: [
        {
          name: 'Prospective clients evaluating advisors before a first call',
          priority: 1,
          decision_role: 'Buyer',
        },
        {
          name: 'Referral sources deciding whether to recommend the firm',
          priority: 2,
          decision_role: 'Referrer',
        },
      ],
      geography: ['United States'],
      languages: ['en'],
      channels: ['website'],
      exclusions: [
        'Existing client relationships, which are managed directly rather than through the site',
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
        'The review treats the site as a proof-and-findability decision for a prospect evaluating advisors, not as a general brand review.',
      activated_modules: [
        {
          key: 'positioning',
          reason:
            'How the firm frames its specialism against comparable firms is a positioning choice.',
          research_question_ids: [],
        },
        {
          key: 'audience',
          reason: 'A prospective client and a referral source weigh the same site differently.',
          research_question_ids: [],
        },
        {
          key: 'messaging',
          reason: 'The site has to justify why this firm, not just state what it does.',
          research_question_ids: [],
        },
        {
          key: 'competitive_landscape',
          reason:
            'A prospect choosing an advisor compares this firm against others they could engage.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'offer',
          reason:
            'The advisory service itself, and how its scope is described, is the subject of the enquiry decision.',
          research_question_ids: [],
        },
        {
          key: 'content',
          reason:
            'Published case studies and articles are how the firm demonstrates expertise before a first call.',
          research_question_ids: [],
        },
        {
          key: 'credibility',
          reason:
            'A track record and named client outcomes are what a prospect weighs before reaching out.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'discoverability',
          reason: 'A prospect who does not already know the firm’s name has to be able to find it.',
          research_question_ids: ['RQ-0002'],
        },
        {
          key: 'acquisition',
          reason: 'The site is what a prospect lands on before ever making contact.',
          research_question_ids: [],
        },
        {
          key: 'conversion',
          reason: 'Submitting an enquiry is the action this review exists to increase.',
          research_question_ids: [],
        },
        {
          key: 'digital_experience',
          reason: 'The site is a set of web pages.',
          research_question_ids: [],
        },
        {
          key: 'reputation',
          reason:
            'What referral sources and past clients say publicly bears directly on a prospect’s decision to reach out.',
          research_question_ids: [],
        },
      ],
      dormant_modules: [
        {
          key: 'market',
          reason:
            'Broader advisory-market trends are not what this quarter’s enquiry decision turns on.',
        },
        {
          key: 'pricing',
          reason:
            'Engagement rates are quoted per client, not published, so there is no price to analyse on the site.',
        },
        {
          key: 'accessibility',
          reason: 'No compliance driver was raised for this specific site.',
        },
        {
          key: 'trust',
          reason: 'No security, privacy or compliance concern was raised for this decision.',
        },
        {
          key: 'operations',
          reason: 'Engagement delivery is out of scope for a site-and-enquiry decision.',
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
          'No comparisons were supplied, so the qualified set had to be discovered by specialism.',
      },
      anticipated_gaps: [
        'No analytics access, so where a referred prospect first lands on the site is not directly observable.',
      ],
    },

    entities: [
      {
        id: 'ENT-0001',
        type: 'company',
        role: 'subject',
        name: 'Waymark Advisory',
        description: 'A boutique operations advisory firm serving mid-market manufacturers.',
        canonical_url: 'https://waymark-advisory.example',
        industry: 'Professional services',
        asset_ids: ['AST-0001', 'AST-0002'],
      },
      {
        id: 'ENT-0002',
        type: 'company',
        role: 'comparison',
        name: 'Comparable advisory firm A',
        canonical_url: 'https://comparable-advisory-a.example',
        asset_ids: [],
      },
      {
        id: 'ENT-0003',
        type: 'company',
        role: 'comparison',
        name: 'Comparable advisory firm B',
        canonical_url: 'https://comparable-advisory-b.example',
        asset_ids: [],
      },
    ],

    assets: [
      {
        id: 'AST-0001',
        entity_id: 'ENT-0001',
        type: 'website_page',
        path: '/work',
        title: 'Client work',
        source_ids: ['S-0001'],
      },
      {
        id: 'AST-0002',
        entity_id: 'ENT-0001',
        type: 'website_page',
        path: '/contact',
        title: 'Contact',
        source_ids: ['S-0001'],
      },
    ],

    user_assertions: [],

    research_questions: [
      {
        id: 'RQ-0001',
        question:
          'How does the firm’s stated track record compare against the qualified comparison set?',
        module: 'credibility',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail: 'Both qualified comparisons publish named client outcomes directly.',
        evidence_ids: ['E-0001'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        confidence: 'high',
        priority: 1,
      },
      {
        id: 'RQ-0002',
        question: 'How findable is the firm for a prospect who does not already know its name?',
        module: 'discoverability',
        state: 'PARTIALLY_ANSWERED',
        stop_reason: 'budget_exhausted',
        stop_detail:
          'A single search-visibility check was completed; a fuller audit across more search terms was out of budget for this run.',
        evidence_ids: ['E-0002'],
        source_ids: ['S-0001'],
        confidence: 'low',
        priority: 2,
      },
    ],

    sources: [
      {
        id: 'S-0001',
        url: 'https://waymark-advisory.example/work',
        title: 'Client work',
        publisher: 'Waymark Advisory',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0001.html',
        content_hash: hash('ps1'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0001',
      },
      {
        id: 'S-0002',
        url: 'https://comparable-advisory-a.example/case-studies',
        title: 'Case studies',
        publisher: 'Comparable advisory firm A',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0002.html',
        content_hash: hash('ps2'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0002',
      },
      {
        id: 'S-0003',
        url: 'https://comparable-advisory-b.example/results',
        title: 'Results',
        publisher: 'Comparable advisory firm B',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0003.html',
        content_hash: hash('ps3'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0003',
      },
      {
        id: 'S-0004',
        url: 'https://waymark-advisory.example/about',
        title: 'About',
        publisher: 'Waymark Advisory',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0004.html',
        content_hash: hash('ps4'),
        authority: 'high',
        independence: { type: 'same_organisation', of_source_id: 'S-0001' },
        entity_id: 'ENT-0001',
      },
      {
        id: 'S-0005',
        url: 'https://waymark-advisory.example/contact',
        title: 'Contact',
        publisher: 'Waymark Advisory',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0005.html',
        content_hash: hash('ps5'),
        authority: 'high',
        independence: { type: 'same_organisation', of_source_id: 'S-0001' },
        entity_id: 'ENT-0001',
      },
    ],

    observations: [
      {
        id: 'OBS-0001',
        source_id: 'S-0001',
        observation_type: 'absence',
        statement:
          'No named client or measured outcome appears on the client work page after checking /work, /about and /contact.',
        search_scope: ['/work', '/about', '/contact'],
        scanned_source_ids: ['S-0001', 'S-0004', 'S-0005'],
        locator: 'main#client-work',
        observed_at: T,
      },
      {
        id: 'OBS-0002',
        source_id: 'S-0002',
        observation_type: 'positive',
        statement:
          'Comparable firm A names three clients and states a measured percentage improvement for each.',
        locator: 'section.case-studies',
        observed_at: T,
      },
      {
        id: 'OBS-0003',
        source_id: 'S-0003',
        observation_type: 'positive',
        statement: 'Comparable firm B names two clients and states a measured outcome for each.',
        locator: 'section.results',
        observed_at: T,
      },
      {
        id: 'OBS-0004',
        source_id: 'S-0001',
        observation_type: 'positive',
        statement:
          'A direct search for the firm’s specialism and region returns the firm’s homepage on the second results page, not the first.',
        locator: 'search results, position 14',
        observed_at: T,
      },
    ],

    evidence: [
      {
        id: 'E-0001',
        observation_ids: ['OBS-0001', 'OBS-0002', 'OBS-0003'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        claim:
          'The subject names no client or measured outcome anywhere checked, while both qualified comparisons name specific clients with measured results.',
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
        claim:
          'A prospect searching for the firm’s specialism and region does not see the firm on the first page of results.',
        research_question_ids: ['RQ-0002'],
        user_assertion_ids: [],
        relevance: 'medium',
        reliability: 'medium',
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
        name: 'Comparable advisory firm A',
        type: 'direct_competitor',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Same specialism, same client segment, addresses the same enquiry decision.',
        audience_overlap: 'high',
        objective_overlap: 'high',
        decision_overlap: 'high',
        relevance: 'high',
        confidence: 'high',
        source_ids: ['S-0002'],
        positioning_territories: ['Named client outcomes with measured results'],
      },
      {
        id: 'COMP-0002',
        entity_id: 'ENT-0003',
        name: 'Comparable advisory firm B',
        type: 'direct_competitor',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Appears alongside firm A when prospects search for this specialism.',
        audience_overlap: 'high',
        objective_overlap: 'medium',
        decision_overlap: 'high',
        relevance: 'medium',
        confidence: 'medium',
        source_ids: ['S-0003'],
        positioning_territories: ['Named client outcomes with measured results'],
      },
    ],

    findings: [
      {
        id: 'F-0001',
        category: 'credibility',
        title: 'No named client or measured outcome appears anywhere checked',
        statement:
          'The subject names no client or measured outcome anywhere checked, while both qualified comparisons name specific clients with measured results.',
        claim_type: 'derived',
        evidence_ids: ['E-0001'],
        confidence: 'high',
        importance: 'high',
        implication:
          'A prospect comparing three firms sees concrete proof on two of them and none on this one.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: [],
        audience_relevance:
          'Prospective clients evaluating advisors before a first call are the ones weighing this directly.',
      },
      {
        id: 'F-0002',
        category: 'discoverability',
        title: 'The firm does not appear on the first page of results for its own specialism',
        statement:
          'A prospect searching for the firm’s specialism and region does not see the firm on the first page of results.',
        claim_type: 'inferred',
        evidence_ids: ['E-0002'],
        confidence: 'low',
        importance: 'medium',
        implication:
          'A prospect who does not already know the firm by name or referral is unlikely to find it through a direct search.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: ['ASM-0001'],
        audience_relevance:
          'A prospect with no referral relationship, searching cold, is the one this affects.',
      },
    ],

    opportunities: [
      {
        id: 'O-0001',
        title: 'Named outcomes are proof this firm has and has not yet published',
        description:
          'Both qualified comparisons already publish named client outcomes. Publishing the firm’s own, which exist internally but are not yet on the site, closes a proof gap the comparison set makes visible.',
        supporting_finding_ids: ['F-0001'],
        supporting_evidence_ids: ['E-0001'],
        strategic_value: 'high',
        audience_value: 'high',
        confidence: 'medium',
        white_space: {
          territory: 'Named client outcomes with measured results',
          current_position: 'low',
        },
      },
      {
        id: 'O-0002',
        title: 'Improving search visibility reaches prospects with no referral relationship',
        description:
          'A prospect searching cold for this specialism currently has to find the firm some other way; appearing on the first page opens a channel referral alone does not cover.',
        supporting_finding_ids: ['F-0002'],
        supporting_evidence_ids: ['E-0002'],
        strategic_value: 'medium',
        audience_value: 'medium',
        confidence: 'low',
      },
    ],

    recommendations: [
      {
        id: 'R-0001',
        title: 'Publish named client outcomes with measured results on the client work page',
        problem:
          'The client work page names no client or measured outcome, unlike both qualified comparisons.',
        why_it_matters:
          'A prospect comparing three firms sees concrete proof on two of them and none on this one.',
        finding_ids: ['F-0001'],
        opportunity_ids: ['O-0001'],
        strategic_rationale:
          'Closes a proof gap already normalised across the qualified comparison set, using outcomes the firm already has internally.',
        recommended_change:
          'Add two or three named client case studies to the work page, each stating a specific measured result, with client permission.',
        expected_outcome:
          'A prospect reading the work page sees at least one specific, named, measured outcome.',
        impact: 'high',
        effort: 'medium',
        confidence: 'high',
        urgency: 'medium',
        dependencies: [],
        assumption_ids: [],
        measurement: {
          kind: 'quantitative',
          hypothesis:
            'Publishing named outcomes increases the enquiry rate from visitors to the work page.',
          success_metric: 'Work-page-to-enquiry conversion rate.',
          baseline: 'unknown',
          target: 'Establish a baseline, then improve on it',
          validation_method:
            'Compare enquiry rate for eight weeks before and after the case studies publish.',
          falsifier: 'Enquiry rate is indistinguishable between the two eight-week windows.',
          review_period: '8 weeks',
        },
      },
      {
        id: 'R-0002',
        title: 'Improve search visibility for the firm’s core specialism and region',
        problem:
          'A prospect searching for the firm’s specialism and region does not see the firm on the first page of results.',
        why_it_matters:
          'A prospect with no referral relationship, searching cold, is unlikely to find the firm this way.',
        finding_ids: ['F-0002'],
        opportunity_ids: ['O-0002'],
        strategic_rationale:
          'Opens a channel referral relationships do not cover, though the underlying cause is not yet fully diagnosed.',
        recommended_change:
          'Commission a fuller search-visibility audit across the firm’s core search terms, since this run’s single check was not conclusive on its own.',
        expected_outcome:
          'A specific, evidenced list of search terms and gaps to act on, rather than a single spot-check result.',
        impact: 'medium',
        effort: 'low',
        confidence: 'low',
        urgency: 'low',
        dependencies: [],
        assumption_ids: ['ASM-0001'],
        measurement: {
          kind: 'qualitative',
          hypothesis:
            'A fuller audit will identify specific, actionable gaps behind the single spot-check result this run found.',
          success_metric:
            'Whether the audit produces a specific list of search terms and ranking gaps.',
          baseline: 'One spot-check result, not yet a diagnosed cause.',
          target: 'A completed audit with named gaps and a proposed fix for each.',
          validation_method:
            'Review the audit’s findings against the original spot-check result for consistency.',
          falsifier:
            'The audit finds the firm already ranks well across its core terms, contradicting this run’s spot-check.',
          review_period: 'Next quarter',
        },
      },
    ],

    actions: [
      {
        id: 'A-0001',
        recommendation_id: 'R-0001',
        description:
          'Add two or three named client case studies with measured results to the work page.',
        affected_assets: [
          { asset_id: 'AST-0001', operation: 'edit', target: 'named-case-studies' },
        ],
        effort: 'medium',
        dependencies: [],
        status: 'todo',
        validation: 'The work page shows at least one named client and one measured result.',
        horizon: 'now',
      },
      {
        id: 'A-0002',
        recommendation_id: 'R-0002',
        description:
          'Commission a search-visibility audit across the firm’s core specialism and region terms.',
        affected_assets: [
          { proposed: { type: 'document', path: 'SEARCH-VISIBILITY-AUDIT' }, operation: 'new' },
        ],
        effort: 'low',
        dependencies: [],
        status: 'todo',
        validation: 'A completed audit document exists naming specific search terms and gaps.',
        horizon: 'next',
      },
    ],

    assumptions: [
      {
        id: 'ASM-0001',
        statement:
          'The single search-visibility check this run performed is representative of the firm’s visibility across its core specialism terms more broadly.',
        why_assumed:
          'Budget for this run only covered one search term; a fuller check was out of scope.',
        status: 'unvalidated',
        validation_method:
          'Commission the fuller search-visibility audit recommended in R-0002 and compare its findings against this run’s single result.',
        evidence_ids: ['E-0002'],
      },
    ],

    unknowns: [
      {
        id: 'UNK-0001',
        statement:
          'Whether the firm ranks similarly across its other core specialism and region terms is not established.',
        why_unknown: 'Budget for this run only covered a single search term.',
        how_to_resolve: 'Commission the fuller search-visibility audit recommended in R-0002.',
        blocks_finding_ids: ['F-0002'],
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
            'The client work page states what proof exists directly, so it is the primary source for this question.',
          target: 'https://waymark-advisory.example/work',
          result_event_ids: ['RE-0001'],
        },
        {
          id: 'RA-0002',
          research_question_id: 'RQ-0001',
          action: 'compare',
          rationale:
            'Both qualified comparisons needed their own proof pages retrieved to compare what they publish.',
          target: 'qualified comparison case-study pages',
          result_event_ids: ['RE-0002', 'RE-0003'],
        },
        {
          id: 'RA-0003',
          research_question_id: 'RQ-0002',
          action: 'search',
          rationale:
            'A direct search for the firm’s specialism and region is the most direct way to check first-page visibility.',
          target: 'search results for the firm’s core specialism and region',
          result_event_ids: ['RE-0004'],
        },
      ],
      events: [
        {
          id: 'RE-0001',
          action_id: 'RA-0001',
          outcome: 'succeeded',
          detail: 'Client work page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0002',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail: 'Comparable firm A case-studies page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0003',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail: 'Comparable firm B results page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0004',
          action_id: 'RA-0003',
          outcome: 'insufficient',
          detail: 'One search term checked; budget exhausted before a fuller sweep could run.',
          at: T,
        },
      ],
    },
  };
}
