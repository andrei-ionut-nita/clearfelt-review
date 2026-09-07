import type { Review } from '../model/index.ts';
import { emptyReview, newRun } from '../store.ts';

/**
 * A complete, valid run used by the renderer tests and shipped as the
 * personal-brand fixture.
 *
 * Deliberately exercises the awkward parts rather than the happy path: an
 * absence observation, evidence that contradicts a finding, an inferred finding
 * resting on an unvalidated assumption, a user assertion the research
 * contradicted, a question that ran out of evidence, and one that was blocked.
 * A renderer that only handles clean data will look fine against a clean
 * fixture and mislead on a real run.
 *
 * The subject is invented. Nothing here is specific to any real entity, per the
 * rule that no fixture becomes the product ontology.
 */

const T = '2026-09-07T09:00:00.000Z';
const hash = (seed: string) => seed.repeat(64).slice(0, 64);

export function makeWorkedExample(): Review {
  const run = newRun('jordan-ellis', 'r-20260907-001', T);
  run.stage = 'complete';
  run.approved_gates = { scope: T, research_plan: T, findings: T };
  run.observability = {
    started_at: T,
    finished_at: '2026-09-07T10:40:00.000Z',
    sources_discovered: 14,
    sources_retrieved: 6,
    retrieval_failures: 1,
    search_iterations: 5,
  };

  return {
    ...emptyReview(run),

    scope: {
      id: 'SCOPE-0001',
      objective: 'Generate senior technology leadership opportunities.',
      entity_ids: ['ENT-0001'],
      asset_ids: ['AST-0001', 'AST-0002', 'AST-0003', 'AST-0004'],
      decision: {
        statement: 'What should change on the site and its positioning over the next 90 days?',
        decision_maker: 'The subject',
        horizon: '90 days',
        evidence_required: [
          'How the subject is currently positioned in their own words',
          'How comparable profiles position themselves',
          'What proof of commercial impact is publicly visible',
        ],
      },
      audiences: [
        {
          name: 'Founders and CEOs at scale-up companies',
          priority: 1,
          decision_role: 'Hiring decision maker',
        },
        { name: 'Executive recruiters', priority: 2, decision_role: 'Gatekeeper and shortlister' },
        { name: 'Investors and board members', priority: 3, decision_role: 'Referrer' },
      ],
      geography: ['United Kingdom'],
      languages: ['en'],
      channels: ['website', 'long-form writing'],
      exclusions: [
        'Paid advertising performance, since none is running',
        'Social media cadence, which the subject has explicitly deprioritised',
      ],
      depth: 'standard',
      comparison_applicable: true,
      budget: {
        max_sources: 40,
        max_search_iterations: 12,
        max_depth: 2,
        min_evidence_per_question: 2,
        min_independent_corroboration: 2,
        priority_question_ids: ['RQ-0001', 'RQ-0002'],
      },
    },

    plan: {
      id: 'PLAN-0001',
      created_at: T,
      objective_interpretation:
        'The subject wants to be considered for senior technology leadership roles, so the review treats the site as a decision aid for a hiring audience rather than as a portfolio.',
      activated_modules: [
        {
          key: 'positioning',
          reason: 'The objective turns on how the subject is understood.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'competitive_landscape',
          reason: 'A hiring audience compares candidates by definition.',
          research_question_ids: ['RQ-0002'],
        },
        {
          key: 'credibility',
          reason: 'Seniority claims need visible proof.',
          research_question_ids: ['RQ-0003'],
        },
        {
          key: 'conversion',
          reason: 'The site has a contact path worth assessing.',
          research_question_ids: ['RQ-0004'],
        },
        {
          key: 'discoverability',
          reason: 'Recruiters search before they browse.',
          research_question_ids: ['RQ-0005'],
        },
      ],
      dormant_modules: [
        { key: 'pricing', reason: 'No commercial offer is being sold through the site.' },
        {
          key: 'accessibility',
          reason: 'Not raised in the objective and no evidence of a compliance driver.',
        },
        { key: 'operations', reason: 'Out of scope for a personal positioning review.' },
      ],
      comparison_plan: {
        supplied_count: 1,
        to_discover: true,
        rationale:
          'One comparison was supplied by the subject. The audience compares against a wider set than the subject named, so further candidates were discovered and qualified.',
      },
      anticipated_gaps: [
        'No analytics access, so actual conversion behaviour cannot be observed.',
        'Recruiter decision criteria are inferred from public material rather than interviews.',
      ],
    },

    entities: [
      {
        id: 'ENT-0001',
        type: 'person',
        role: 'subject',
        name: 'Jordan Ellis',
        description: 'Technology leader publishing under their own name.',
        canonical_url: 'https://jordan-ellis.example',
        geography: ['United Kingdom'],
        asset_ids: ['AST-0001', 'AST-0002', 'AST-0003', 'AST-0004'],
      },
      {
        id: 'ENT-0002',
        type: 'person',
        role: 'comparison',
        name: 'Comparable profile: transformation lead',
        canonical_url: 'https://comparable-one.example',
        asset_ids: [],
      },
      {
        id: 'ENT-0003',
        type: 'person',
        role: 'comparison',
        name: 'Comparable profile: platform lead',
        canonical_url: 'https://comparable-two.example',
        asset_ids: [],
      },
      {
        id: 'ENT-0004',
        type: 'organisation',
        role: 'referenced',
        name: 'A large consultancy',
        asset_ids: [],
      },
    ],

    assets: [
      {
        id: 'AST-0001',
        entity_id: 'ENT-0001',
        type: 'website_page',
        path: '/',
        title: 'Homepage',
        source_ids: ['S-0001'],
      },
      {
        id: 'AST-0002',
        entity_id: 'ENT-0001',
        type: 'website_page',
        path: '/about',
        title: 'About',
        source_ids: ['S-0002'],
      },
      {
        id: 'AST-0003',
        entity_id: 'ENT-0001',
        type: 'website_page',
        path: '/writing',
        title: 'Writing',
        source_ids: ['S-0003'],
      },
      {
        id: 'AST-0004',
        entity_id: 'ENT-0001',
        type: 'positioning',
        path: 'Executive narrative',
        source_ids: ['S-0001', 'S-0002'],
      },
    ],

    user_assertions: [
      {
        id: 'UA-0001',
        statement: 'My main competition is large consultancies.',
        about_id: 'ENT-0004',
        status: 'contradicted',
        research_question_ids: ['RQ-0002'],
        evidence_ids: ['E-0003'],
        created_at: T,
      },
      {
        id: 'UA-0002',
        statement: 'Recruiters are the most important audience.',
        status: 'accepted_untested',
        research_question_ids: [],
        evidence_ids: [],
        created_at: T,
      },
    ],

    research_questions: [
      {
        id: 'RQ-0001',
        question: 'How does the subject currently position themselves?',
        module: 'positioning',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail: 'Two independent pages state the same proposition consistently.',
        evidence_ids: ['E-0001', 'E-0002', 'E-0005'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        confidence: 'high',
        priority: 1,
      },
      {
        id: 'RQ-0002',
        question:
          'How do comparable profiles position themselves, and which territories are crowded?',
        module: 'competitive_landscape',
        state: 'ANSWERED',
        stop_reason: 'diminishing_returns',
        stop_detail: 'Additional profiles repeated territories already recorded.',
        evidence_ids: ['E-0003'],
        source_ids: ['S-0004', 'S-0005'],
        confidence: 'medium',
        priority: 1,
      },
      {
        id: 'RQ-0003',
        question: 'What proof of commercial impact is publicly visible?',
        module: 'credibility',
        state: 'PARTIALLY_ANSWERED',
        evidence_ids: ['E-0004'],
        source_ids: ['S-0001', 'S-0002'],
        confidence: 'medium',
        priority: 2,
      },
      {
        id: 'RQ-0004',
        question: 'How well does the site convert an interested visitor into a conversation?',
        module: 'conversion',
        state: 'INSUFFICIENT_EVIDENCE',
        stop_reason: 'no_evidence_available',
        stop_detail: 'No analytics access, and behaviour cannot be inferred from public material.',
        evidence_ids: [],
        source_ids: [],
        confidence: 'low',
        priority: 2,
      },
      {
        id: 'RQ-0005',
        question: 'How discoverable is the subject for the searches the audience actually runs?',
        module: 'discoverability',
        state: 'BLOCKED',
        stop_reason: 'blocked',
        stop_detail: 'Search result pages could not be retrieved programmatically.',
        evidence_ids: [],
        source_ids: [],
        confidence: 'low',
        priority: 3,
      },
    ],

    sources: [
      {
        id: 'S-0001',
        url: 'https://jordan-ellis.example/',
        title: 'Homepage',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0001.html',
        content_hash: hash('a'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0001',
        language: 'en',
      },
      {
        id: 'S-0002',
        url: 'https://jordan-ellis.example/about',
        title: 'About',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0002.html',
        content_hash: hash('b'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0001',
        language: 'en',
      },
      {
        id: 'S-0003',
        url: 'https://jordan-ellis.example/writing',
        title: 'Writing',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0003.html',
        content_hash: hash('c'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0001',
        language: 'en',
      },
      {
        id: 'S-0004',
        url: 'https://comparable-one.example/',
        title: 'Comparable profile one',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0004.html',
        content_hash: hash('d'),
        authority: 'medium',
        independence: { type: 'independent' },
        entity_id: 'ENT-0002',
      },
      {
        id: 'S-0005',
        url: 'https://comparable-two.example/',
        title: 'Comparable profile two',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0005.html',
        content_hash: hash('e'),
        authority: 'medium',
        independence: { type: 'independent' },
        entity_id: 'ENT-0003',
      },
      {
        id: 'S-0006',
        title: 'Onboarding conversation',
        source_type: 'user_statement',
        accessed_at: T,
        retrieval_method: 'user_supplied',
        authority: 'low',
        independence: { type: 'unknown' },
      },
    ],

    observations: [
      {
        id: 'OBS-0001',
        source_id: 'S-0001',
        observation_type: 'positive',
        statement: 'The homepage headline reads "Building resilient engineering organisations".',
        locator: 'main h1',
        observed_at: T,
      },
      {
        id: 'OBS-0002',
        source_id: 'S-0002',
        observation_type: 'positive',
        statement:
          'The About page lists platform migration, team scaling and architecture as the three areas of focus.',
        locator: 'section#focus ul',
        observed_at: T,
      },
      {
        id: 'OBS-0003',
        source_id: 'S-0001',
        scanned_source_ids: ['S-0001', 'S-0002', 'S-0003'],
        observation_type: 'absence',
        statement: 'No quantified commercial outcome appears anywhere on the site.',
        search_scope: [
          '/',
          '/about',
          '/writing',
          'site search for "cost", "revenue", "saved", "%"',
        ],
        locator: 'full-site text scan',
        observed_at: T,
      },
      {
        id: 'OBS-0004',
        source_id: 'S-0004',
        observation_type: 'positive',
        statement:
          'The first comparable profile leads with "digital transformation at enterprise scale".',
        locator: 'main h1',
        observed_at: T,
      },
      {
        id: 'OBS-0005',
        source_id: 'S-0005',
        observation_type: 'positive',
        statement:
          'The second comparable profile leads with "AI transformation for regulated industries".',
        locator: 'main h1',
        observed_at: T,
      },
      {
        id: 'OBS-0006',
        source_id: 'S-0002',
        scanned_source_ids: ['S-0001', 'S-0002', 'S-0003'],
        observation_type: 'absence',
        statement: 'No named client, case study or testimonial appears on the site.',
        search_scope: ['/', '/about', '/writing'],
        locator: 'full-site text scan',
        observed_at: T,
      },
      {
        id: 'OBS-0007',
        source_id: 'S-0003',
        observation_type: 'positive',
        statement:
          'Three of the eleven published articles discuss the cost consequences of architectural decisions.',
        locator: 'article list, items 2, 5 and 9',
        observed_at: T,
      },
      {
        id: 'OBS-0008',
        source_id: 'S-0006',
        observation_type: 'positive',
        statement: 'The subject stated that large consultancies are their main competition.',
        locator: 'onboarding step 3',
        observed_at: T,
      },
    ],

    evidence: [
      {
        id: 'E-0001',
        observation_ids: ['OBS-0001', 'OBS-0002'],
        source_ids: ['S-0001', 'S-0002'],
        claim:
          'The stated proposition is organised around engineering capability rather than commercial consequence.',
        research_question_ids: ['RQ-0001'],
        user_assertion_ids: [],
        relevance: 'high',
        reliability: 'high',
        corroborated_by: ['E-0002'],
        supports: ['F-0001'],
        contradicts: [],
        temporal_scope: 'current',
      },
      {
        id: 'E-0002',
        observation_ids: ['OBS-0003'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        claim: 'No quantified commercial outcome is published, across every page searched.',
        research_question_ids: ['RQ-0001', 'RQ-0003'],
        user_assertion_ids: [],
        relevance: 'high',
        reliability: 'high',
        corroborated_by: [],
        supports: ['F-0001', 'F-0003'],
        contradicts: [],
        temporal_scope: 'current',
      },
      {
        id: 'E-0003',
        observation_ids: ['OBS-0004', 'OBS-0005'],
        source_ids: ['S-0004', 'S-0005'],
        claim:
          'Comparable profiles concentrate on transformation language, leaving cost and economics unoccupied.',
        research_question_ids: ['RQ-0002'],
        user_assertion_ids: ['UA-0001'],
        relevance: 'high',
        reliability: 'medium',
        corroborated_by: [],
        supports: ['F-0002'],
        contradicts: [],
        temporal_scope: 'current',
      },
      {
        id: 'E-0004',
        observation_ids: ['OBS-0006'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        claim: 'No third-party proof of impact is published.',
        research_question_ids: ['RQ-0003'],
        user_assertion_ids: [],
        relevance: 'high',
        reliability: 'high',
        corroborated_by: [],
        supports: ['F-0003', 'F-0004'],
        contradicts: [],
        temporal_scope: 'current',
      },
      {
        id: 'E-0005',
        observation_ids: ['OBS-0007'],
        source_ids: ['S-0003'],
        claim:
          'The writing archive does engage with cost consequences, unlike the site proposition.',
        research_question_ids: ['RQ-0001'],
        user_assertion_ids: [],
        relevance: 'medium',
        reliability: 'high',
        corroborated_by: [],
        supports: [],
        contradicts: ['F-0001'],
        temporal_scope: 'current',
      },
    ],

    comparisons: [
      {
        id: 'COMP-0001',
        entity_id: 'ENT-0002',
        name: 'Comparable profile: transformation lead',
        type: 'direct_competitor',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Targets the same hiring audience with an overlapping seniority claim.',
        audience_overlap: 'high',
        objective_overlap: 'high',
        decision_overlap: 'high',
        relevance: 'high',
        confidence: 'high',
        source_ids: ['S-0004'],
      },
      {
        id: 'COMP-0002',
        entity_id: 'ENT-0003',
        name: 'Comparable profile: platform lead',
        type: 'direct_competitor',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Appears in the same shortlists and addresses the same decision.',
        audience_overlap: 'high',
        objective_overlap: 'medium',
        decision_overlap: 'high',
        relevance: 'high',
        confidence: 'medium',
        source_ids: ['S-0005'],
      },
      {
        id: 'COMP-0003',
        entity_id: 'ENT-0004',
        name: 'A large consultancy',
        type: 'substitute',
        status: 'rejected',
        proposed_by: 'user',
        user_assertion_id: 'UA-0001',
        why_included: 'Named by the subject during onboarding as their main competition.',
        why_rejected:
          'A consultancy is bought instead of a hire in a different decision, by a different buyer, on a different budget. It is a substitute for the work, not a competitor for the role, so comparing positioning against it would mislead.',
        audience_overlap: 'low',
        objective_overlap: 'low',
        decision_overlap: 'low',
        relevance: 'low',
        confidence: 'medium',
        source_ids: ['S-0006'],
      },
    ],

    findings: [
      {
        id: 'F-0001',
        category: 'positioning',
        title: 'The proposition leads on capability, not consequence',
        statement:
          'The public proposition is organised around engineering capability, and states no commercial consequence of that capability.',
        claim_type: 'derived',
        evidence_ids: ['E-0001', 'E-0002'],
        confidence: 'high',
        importance: 'high',
        implication:
          'A hiring audience can tell what the subject does, and cannot tell what it is worth.',
        temporal_scope: 'current',
        contradicted_by: ['E-0005'],
        assumption_ids: [],
        competitive_relevance:
          'Both qualified comparisons make the same omission, so this is a shared weakness rather than a disadvantage.',
        audience_relevance:
          'Directly relevant to the founder and CEO audience, who decide on consequence.',
      },
      {
        id: 'F-0002',
        category: 'competitive_landscape',
        title: 'Transformation language is crowded; economics is not',
        statement:
          'Both qualified comparisons lead on transformation language, and none addresses the cost consequences of technical decisions.',
        claim_type: 'derived',
        evidence_ids: ['E-0003'],
        confidence: 'medium',
        importance: 'high',
        implication:
          'A position built on economics would not compete for attention with the language the comparison set already occupies.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: [],
      },
      {
        id: 'F-0003',
        category: 'credibility',
        title: 'Seniority is claimed but not evidenced',
        statement:
          'Seniority claims appear without quantified outcomes or third-party proof, which a hiring audience is likely to weigh heavily.',
        claim_type: 'inferred',
        evidence_ids: ['E-0002', 'E-0004'],
        confidence: 'medium',
        importance: 'high',
        implication: 'The claim may be discounted by exactly the audience it is aimed at.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: ['ASM-0001'],
        audience_relevance: 'Recruiters shortlist on evidence they can repeat to a client.',
      },
      {
        id: 'F-0004',
        category: 'credibility',
        title: 'No third-party proof is published',
        statement: 'The site publishes no named client, case study or testimonial.',
        claim_type: 'derived',
        evidence_ids: ['E-0004'],
        confidence: 'high',
        importance: 'medium',
        implication: 'Every claim on the site is self-asserted.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: [],
      },
    ],

    opportunities: [
      {
        id: 'O-0001',
        title: 'Technology economics is an unoccupied territory',
        description:
          'No entity in the qualified comparison set addresses the cost consequences of technical decisions, and the subject already writes about it.',
        supporting_finding_ids: ['F-0001', 'F-0002'],
        supporting_evidence_ids: ['E-0003', 'E-0005'],
        strategic_value: 'high',
        audience_value: 'high',
        competitive_context: 'Unoccupied across both qualified comparisons.',
        confidence: 'medium',
        white_space: {
          territory: 'Technology economics',
          saturation: 'low',
          current_position: 'medium',
        },
      },
      {
        id: 'O-0002',
        title: 'Existing work can be converted into proof',
        description:
          'The writing archive already contains the reasoning that a proof page would need, so the gap is presentation rather than substance.',
        supporting_finding_ids: ['F-0003', 'F-0004'],
        supporting_evidence_ids: ['E-0004', 'E-0005'],
        strategic_value: 'high',
        audience_value: 'high',
        confidence: 'medium',
      },
    ],

    assumptions: [
      {
        id: 'ASM-0001',
        statement:
          'A hiring audience weighs quantified outcomes more heavily than described capability.',
        why_assumed:
          'Consistent with how the comparison set presents itself, but not established for this audience by direct evidence.',
        status: 'unvalidated',
        validation_method: 'Ask three recruiters what they shortlist on.',
        evidence_ids: [],
      },
    ],

    unknowns: [
      {
        id: 'UNK-0001',
        statement: 'How visitors actually behave on the site.',
        why_unknown: 'No analytics access was available during the review.',
        how_to_resolve:
          'Grant read access to analytics, or run a short moderated test with five people from the target audience.',
        blocks_finding_ids: ['F-0003'],
      },
      {
        id: 'UNK-0002',
        statement: 'Which searches the hiring audience actually runs.',
        why_unknown: 'Search result pages could not be retrieved programmatically.',
        how_to_resolve: 'Ask two recruiters to describe their search process.',
        blocks_finding_ids: [],
      },
    ],

    hypotheses: [
      {
        id: 'HYP-0001',
        statement:
          'An economics-led proposition would be recalled more accurately than a capability-led one by the same audience.',
        based_on_evidence_ids: ['E-0003', 'E-0005'],
        validation_method:
          'Show both propositions to five people in the target audience and ask what the subject does and what it is worth.',
        confidence: 'low',
      },
    ],

    recommendations: [
      {
        id: 'R-0001',
        title: 'Reframe the proposition around the economics of engineering decisions',
        problem:
          'The proposition states capability and leaves its commercial consequence unstated.',
        why_it_matters:
          'The primary audience decides on consequence, and the comparison set has left that territory unoccupied.',
        finding_ids: ['F-0001', 'F-0002'],
        opportunity_ids: ['O-0001'],
        strategic_rationale:
          'This is the one repositioning available that is both supported by existing work and uncontested by the qualified comparisons.',
        recommended_change:
          'Rewrite the homepage hero and the executive narrative to lead with the cost consequences of engineering decisions, keeping capability as supporting detail.',
        expected_outcome:
          'A reader can state what the subject does and what it is worth within one screen.',
        impact: 'high',
        effort: 'medium',
        confidence: 'high',
        urgency: 'high',
        dependencies: [],
        assumption_ids: [],
        measurement: {
          kind: 'qualitative',
          hypothesis: 'Leading with economics makes the proposition repeatable by a reader.',
          success_metric:
            'Whether five readers from the target audience can restate the proposition unprompted after thirty seconds.',
          baseline: 'unknown',
          target: 'Four of five restate it including a commercial consequence.',
          validation_method:
            'A thirty-second recall test with five people in the target audience, before and after.',
          falsifier:
            'Fewer readers restate the proposition correctly after the change than before.',
          review_period: '6 weeks',
        },
      },
      {
        id: 'R-0002',
        title: 'Publish quantified proof drawn from existing work',
        problem:
          'Every claim on the site is self-asserted, with no quantified outcome or third-party evidence.',
        why_it_matters:
          'Recruiters shortlist on evidence they can repeat to a client, and currently have none to repeat.',
        finding_ids: ['F-0003', 'F-0004'],
        opportunity_ids: ['O-0002'],
        strategic_rationale:
          'The substance already exists in the writing archive; the gap is that it is never presented as proof.',
        recommended_change:
          'Add a proof page carrying three outcomes with figures, and reference it from the homepage.',
        expected_outcome: 'At least three claims on the site become externally checkable.',
        impact: 'high',
        effort: 'high',
        confidence: 'medium',
        urgency: 'medium',
        dependencies: ['R-0001'],
        assumption_ids: ['ASM-0001'],
        measurement: {
          kind: 'binary',
          hypothesis: 'Published quantified outcomes give a recruiter something to repeat.',
          success_metric:
            'Number of published outcomes carrying a figure and a verifiable referent.',
          baseline: '0',
          target: '3',
          validation_method:
            'Count published outcomes that name a figure and something a third party could confirm.',
          falsifier:
            'Three outcomes are published and no enquiry references any of them within the review period.',
          review_period: '12 weeks',
        },
      },
      {
        id: 'R-0003',
        title: 'Group the writing archive into a named economics pillar',
        problem:
          'The articles that already address economics are scattered through a reverse-chronological list.',
        why_it_matters:
          'A territory claim is more credible when the supporting work is visibly organised around it.',
        finding_ids: ['F-0002'],
        opportunity_ids: ['O-0001'],
        strategic_rationale:
          'Low-cost reinforcement of the repositioning, using work that already exists.',
        recommended_change:
          'Introduce a named pillar page collecting the economics articles, and link it from the writing index.',
        expected_outcome: 'The territory claim has visible supporting work behind it.',
        impact: 'medium',
        effort: 'low',
        confidence: 'medium',
        urgency: 'low',
        dependencies: ['R-0001'],
        assumption_ids: [],
        measurement: {
          kind: 'proxy',
          hypothesis: 'A grouped pillar makes the territory claim legible at a glance.',
          success_metric:
            'Whether a reader can find three economics articles in under fifteen seconds.',
          target: 'Three of five readers succeed.',
          validation_method: 'A timed findability task with five readers.',
          falsifier: 'Readers take no less time to find the articles than with the ungrouped list.',
          review_period: '6 weeks',
        },
      },
    ],

    actions: [
      {
        id: 'A-0001',
        recommendation_id: 'R-0001',
        description:
          'Rewrite the homepage hero headline and supporting sentence to lead with commercial consequence.',
        affected_assets: [{ asset_id: 'AST-0001', target: 'hero', operation: 'edit' }],
        effort: 'medium',
        dependencies: [],
        status: 'todo',
        validation: 'A reader can state a commercial consequence after reading one screen.',
        horizon: 'now',
      },
      {
        id: 'A-0002',
        recommendation_id: 'R-0001',
        description:
          'Rewrite the executive narrative so capability supports the economics claim rather than leading it.',
        affected_assets: [{ asset_id: 'AST-0004', operation: 'edit' }],
        effort: 'medium',
        dependencies: ['A-0001'],
        status: 'todo',
        validation: 'The narrative states a consequence before it states a capability.',
        horizon: 'now',
      },
      {
        id: 'A-0003',
        recommendation_id: 'R-0001',
        description: 'Rewrite the About page opening to match the revised proposition.',
        affected_assets: [{ asset_id: 'AST-0002', target: 'intro', operation: 'edit' }],
        effort: 'low',
        dependencies: ['A-0001'],
        status: 'todo',
        validation: 'The About opening and the homepage hero make the same claim.',
        horizon: 'next',
      },
      {
        id: 'A-0004',
        recommendation_id: 'R-0002',
        description: 'Create a proof page carrying three quantified outcomes.',
        affected_assets: [
          { operation: 'new', proposed: { type: 'website_page', path: '/proof', title: 'Proof' } },
        ],
        effort: 'high',
        dependencies: ['A-0001'],
        status: 'todo',
        validation: 'Three outcomes are published, each with a figure and a verifiable referent.',
        horizon: 'next',
      },
      {
        id: 'A-0005',
        recommendation_id: 'R-0003',
        description: 'Add an economics pillar page collecting the relevant articles.',
        affected_assets: [
          {
            operation: 'new',
            proposed: {
              type: 'website_page',
              path: '/writing/economics',
              title: 'Technology economics',
            },
          },
        ],
        effort: 'low',
        dependencies: [],
        status: 'todo',
        validation:
          'The pillar page lists at least three articles and is linked from the writing index.',
        horizon: 'later',
      },
    ],

    feedback: [
      {
        id: 'FB-0001',
        target_id: 'COMP-0003',
        type: 'reject',
        reason: 'Confirmed by the subject that consultancies compete for budget, not for the role.',
        at: '2026-09-07T10:20:00.000Z',
      },
    ],

    research_log: {
      actions: [
        {
          id: 'RA-0001',
          research_question_id: 'RQ-0001',
          action: 'retrieve',
          rationale:
            'The homepage and About page carry the stated proposition, so they are the primary source for how the subject positions themselves.',
          target: 'https://jordan-ellis.example/',
          result_event_ids: ['RE-0001'],
        },
        {
          id: 'RA-0002',
          research_question_id: 'RQ-0002',
          action: 'search',
          rationale:
            'The subject named one comparison. The hiring audience compares more widely, so further candidates were needed before the landscape could be described.',
          target: 'comparable technology leadership profiles',
          result_event_ids: ['RE-0002'],
        },
        {
          id: 'RA-0003',
          research_question_id: 'RQ-0001',
          action: 'verify',
          rationale:
            'The writing archive appeared to contradict the proposition, which needed checking before the finding could be stated.',
          target: 'https://jordan-ellis.example/writing',
          result_event_ids: ['RE-0003'],
        },
        {
          id: 'RA-0004',
          research_question_id: 'RQ-0005',
          action: 'retrieve',
          rationale:
            'Recruiters search before they browse, so search visibility bears directly on the objective.',
          target: 'search result pages',
          result_event_ids: ['RE-0004'],
        },
        {
          id: 'RA-0005',
          research_question_id: 'RQ-0004',
          action: 'inspect',
          rationale:
            'Conversion behaviour would materially change the priority of the proof recommendation.',
          target: 'analytics',
          result_event_ids: ['RE-0005'],
        },
      ],
      events: [
        {
          id: 'RE-0001',
          action_id: 'RA-0001',
          outcome: 'succeeded',
          detail: 'Retrieved and snapshotted three pages.',
          at: T,
        },
        {
          id: 'RE-0002',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail:
            'Fourteen candidates found, two qualified after applying audience and decision overlap.',
          at: T,
        },
        {
          id: 'RE-0003',
          action_id: 'RA-0003',
          outcome: 'contradicted',
          detail:
            'The writing archive does address economics, which cuts against the positioning finding and is recorded as contradicting evidence rather than resolved away.',
          at: T,
        },
        {
          id: 'RE-0004',
          action_id: 'RA-0004',
          outcome: 'blocked',
          detail: 'Search result pages could not be retrieved programmatically.',
          at: T,
        },
        {
          id: 'RE-0005',
          action_id: 'RA-0005',
          outcome: 'insufficient',
          detail: 'No analytics access was available, so conversion could not be assessed at all.',
          at: T,
        },
      ],
    },
  };
}
