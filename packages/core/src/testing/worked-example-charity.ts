import type { Review } from '../model/index.ts';
import { emptyReview, newRun } from '../store.ts';

/**
 * A fourth archetype fixture, shipped as charity, added in Phase 6 to close
 * the gap between the original plan's seven named archetypes and the two
 * that had actually been built by the end of Phase 4.
 *
 * The point of adding a fourth, fifth, sixth and seventh archetype is not to
 * exercise every awkward case again: it is to keep proving the module
 * registry produces a genuinely different activated set for a genuinely
 * different kind of review, per docs/decisions/0010-signal-based-module-activation.md.
 * This one activates trust, which neither personal-brand nor commercial-saas
 * does, because a donor deciding whether to give recurringly weighs financial
 * trust the way a SaaS buyer weighs neither.
 *
 * The subject is invented. Nothing here is specific to any real charity.
 */

const T = '2026-09-07T09:00:00.000Z';
const hash = (seed: string) => seed.repeat(64).slice(0, 64);

export function makeCharityExample(): Review {
  const run = newRun('riverbank-relief', 'r-20260907-001', T);
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
      objective: 'Increase recurring individual donations.',
      entity_ids: ['ENT-0001'],
      asset_ids: ['AST-0001', 'AST-0002'],
      decision: {
        statement:
          'Which change to the donation ask or the donation page would most increase recurring monthly giving this quarter, in a way donors can trust?',
        decision_maker: 'Head of fundraising',
        horizon: 'One quarter',
        evidence_required: [
          'How the donation ask compares against benchmark charities pursuing the same donor',
          'What proof of impact a donor sees before being asked to give',
        ],
      },
      audiences: [
        {
          name: 'Prospective monthly donors researching before their first gift',
          priority: 1,
          decision_role: 'Giver',
        },
        {
          name: 'Existing one-time donors deciding whether to convert to recurring',
          priority: 2,
          decision_role: 'Giver',
        },
      ],
      geography: ['United Kingdom'],
      languages: ['en'],
      channels: ['website'],
      exclusions: [
        'Major gifts and corporate partnerships, which are relationship-managed off-page',
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
        'The review treats the donation page as a trust and framing decision for a first-time or converting donor, not as a general brand review.',
      activated_modules: [
        {
          key: 'positioning',
          reason:
            'How the charity frames its cause against comparable charities is a positioning choice.',
          research_question_ids: [],
        },
        {
          key: 'audience',
          reason:
            'A first-time donor and a converting one-time donor weigh the same page differently.',
          research_question_ids: [],
        },
        {
          key: 'messaging',
          reason: 'The ask itself has to justify recurring giving, not just request it.',
          research_question_ids: [],
        },
        {
          key: 'competitive_landscape',
          reason:
            'A donor choosing where to give compares this cause against others they could support.',
          research_question_ids: ['RQ-0001'],
        },
        {
          key: 'offer',
          reason:
            'The donation itself, what it funds and how it is framed, is the subject of the decision.',
          research_question_ids: [],
        },
        {
          key: 'credibility',
          reason: 'Impact proof is what turns an ask into a trusted request rather than a plea.',
          research_question_ids: ['RQ-0002'],
        },
        {
          key: 'acquisition',
          reason: 'The donation page is what visitors arrive at before ever giving.',
          research_question_ids: [],
        },
        {
          key: 'conversion',
          reason:
            'Converting a one-time donor to recurring is the second half of the stated decision.',
          research_question_ids: [],
        },
        {
          key: 'digital_experience',
          reason: 'The donation ask lives on a website page.',
          research_question_ids: [],
        },
        {
          key: 'trust',
          reason:
            'A recurring financial commitment to a cause rests on donor trust in how funds are used.',
          research_question_ids: [],
        },
      ],
      dormant_modules: [
        {
          key: 'content',
          reason: 'No blog or writing corpus bears on a donation-page framing decision.',
        },
        {
          key: 'market',
          reason: "Broader charitable-giving trends are not what this quarter's decision turns on.",
        },
        {
          key: 'pricing',
          reason:
            'A donation is not a priced product; the ask is a suggested amount, not a fee structure.',
        },
        {
          key: 'accessibility',
          reason: 'No compliance driver was raised for this specific page.',
        },
        {
          key: 'discoverability',
          reason: 'The decision concerns visitors who already arrived, not being found.',
        },
        {
          key: 'reputation',
          reason: 'No press or third-party sentiment signal was anticipated going in.',
        },
        {
          key: 'operations',
          reason: 'Programme delivery operations are out of scope for a donation-page decision.',
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
          'No comparisons were supplied, so the benchmark set had to be discovered by cause area.',
      },
      anticipated_gaps: [
        'No donor-level data, so whether a monthly default would suppress total gift volume cannot be observed directly.',
      ],
    },

    entities: [
      {
        id: 'ENT-0001',
        type: 'charity',
        role: 'subject',
        name: 'Riverbank Relief',
        description: 'A regional charity funding emergency food and shelter support.',
        canonical_url: 'https://riverbank-relief.example',
        industry: 'Charity',
        asset_ids: ['AST-0001', 'AST-0002'],
      },
      {
        id: 'ENT-0002',
        type: 'charity',
        role: 'comparison',
        name: 'Benchmark relief charity A',
        canonical_url: 'https://benchmark-relief-a.example',
        asset_ids: [],
      },
      {
        id: 'ENT-0003',
        type: 'charity',
        role: 'comparison',
        name: 'Benchmark relief charity B',
        canonical_url: 'https://benchmark-relief-b.example',
        asset_ids: [],
      },
    ],

    assets: [
      {
        id: 'AST-0001',
        entity_id: 'ENT-0001',
        type: 'website_page',
        path: '/donate',
        title: 'Donate',
        source_ids: ['S-0001'],
      },
      {
        id: 'AST-0002',
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
        question: 'How does the donation ask compare against the benchmark charities?',
        module: 'competitive_landscape',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail: 'Both benchmark charities publish their donation form directly.',
        evidence_ids: ['E-0001'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        confidence: 'high',
        priority: 1,
      },
      {
        id: 'RQ-0002',
        question: 'What proof of impact does a donor see before being asked to give?',
        module: 'credibility',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail: 'The page order is directly observable without interpretation.',
        evidence_ids: ['E-0002'],
        source_ids: ['S-0001'],
        confidence: 'medium',
        priority: 1,
      },
    ],

    sources: [
      {
        id: 'S-0001',
        url: 'https://riverbank-relief.example/donate',
        title: 'Donate',
        publisher: 'Riverbank Relief',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0001.html',
        content_hash: hash('c1'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0001',
      },
      {
        id: 'S-0002',
        url: 'https://benchmark-relief-a.example/donate',
        title: 'Donate',
        publisher: 'Benchmark relief charity A',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0002.html',
        content_hash: hash('c2'),
        authority: 'high',
        independence: { type: 'independent' },
        entity_id: 'ENT-0002',
      },
      {
        id: 'S-0003',
        url: 'https://benchmark-relief-b.example/donate',
        title: 'Donate',
        publisher: 'Benchmark relief charity B',
        source_type: 'website',
        accessed_at: T,
        retrieval_method: 'fetch',
        snapshot_path: 'snapshots/S-0003.html',
        content_hash: hash('c3'),
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
          'The donation form defaults to a one-time gift, with monthly as a selectable option.',
        locator: 'form#donate select[name=frequency]',
        observed_at: T,
      },
      {
        id: 'OBS-0002',
        source_id: 'S-0002',
        observation_type: 'positive',
        statement:
          'The donation form defaults to a monthly gift, with one-time as a selectable option.',
        locator: 'form#give select[name=frequency]',
        observed_at: T,
      },
      {
        id: 'OBS-0003',
        source_id: 'S-0003',
        observation_type: 'positive',
        statement: 'The donation form defaults to a monthly gift.',
        locator: 'form#donate-now input[name=monthly]',
        observed_at: T,
      },
      {
        id: 'OBS-0004',
        source_id: 'S-0001',
        observation_type: 'positive',
        statement:
          'The donation form appears above any statement of what a gift funds or its measured effect.',
        locator: 'main > form#donate',
        observed_at: T,
      },
    ],

    evidence: [
      {
        id: 'E-0001',
        observation_ids: ['OBS-0001', 'OBS-0002', 'OBS-0003'],
        source_ids: ['S-0001', 'S-0002', 'S-0003'],
        claim:
          'The subject defaults its donation form to one-time while both benchmark charities default to monthly.',
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
          'A prospective donor is asked to give before seeing any statement of what the gift funds.',
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
        name: 'Benchmark relief charity A',
        type: 'benchmark',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Same cause area, same donor pool, comparable scale.',
        audience_overlap: 'high',
        objective_overlap: 'high',
        decision_overlap: 'high',
        relevance: 'high',
        confidence: 'high',
        source_ids: ['S-0002'],
        positioning_territories: ['Recurring giving as the default ask'],
      },
      {
        id: 'COMP-0002',
        entity_id: 'ENT-0003',
        name: 'Benchmark relief charity B',
        type: 'benchmark',
        status: 'qualified',
        proposed_by: 'system',
        why_included: 'Appears alongside charity A when donors compare relief causes.',
        audience_overlap: 'high',
        objective_overlap: 'medium',
        decision_overlap: 'high',
        relevance: 'medium',
        confidence: 'medium',
        source_ids: ['S-0003'],
        positioning_territories: ['Recurring giving as the default ask'],
      },
    ],

    findings: [
      {
        id: 'F-0001',
        category: 'competitive_landscape',
        title: 'A one-time default is the odd choice out among benchmark charities',
        statement:
          'The subject defaults its donation form to one-time while both benchmark charities default to monthly, making it the only one of the three that does not lead with recurring giving.',
        claim_type: 'derived',
        evidence_ids: ['E-0001'],
        confidence: 'high',
        importance: 'high',
        implication:
          'A donor comparing causes sees recurring framed as the norm everywhere except here.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: [],
        audience_relevance:
          'Prospective monthly donors researching before a first gift are the ones the default reaches first.',
      },
      {
        id: 'F-0002',
        category: 'credibility',
        title: 'The ask precedes any proof of impact',
        statement:
          'A prospective donor is asked to give before seeing any statement of what the gift funds.',
        claim_type: 'derived',
        evidence_ids: ['E-0002'],
        confidence: 'high',
        importance: 'medium',
        implication:
          'A donor deciding whether to trust the cause has nothing to weigh before being asked.',
        temporal_scope: 'current',
        contradicted_by: [],
        assumption_ids: [],
        audience_relevance:
          'A donor converting from one-time to recurring is weighing continued trust, not first impressions.',
      },
    ],

    opportunities: [
      {
        id: 'O-0001',
        title: 'Recurring giving as the default is unoccupied only by the subject',
        description:
          'Both benchmark charities already default to monthly. Matching the default, rather than leaving one-time as the norm, closes a gap the comparison set has already normalised for this donor.',
        supporting_finding_ids: ['F-0001'],
        supporting_evidence_ids: ['E-0001'],
        strategic_value: 'high',
        audience_value: 'high',
        confidence: 'medium',
        white_space: {
          territory: 'Recurring giving as the default ask',
          current_position: 'low',
        },
      },
      {
        id: 'O-0002',
        title:
          'A visible impact statement above the ask gives the donor something to trust before giving',
        description:
          'Stating what a monthly gift funds before the form, rather than after, gives a first-time donor a reason before a request.',
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
        title: 'Default the donation form to monthly, matching both benchmark charities',
        problem:
          'The donation form defaults to one-time, next to benchmark charities that both default to monthly.',
        why_it_matters:
          'A donor comparing causes encounters recurring giving as the norm everywhere except on this form.',
        finding_ids: ['F-0001'],
        opportunity_ids: ['O-0001'],
        strategic_rationale:
          'Matches a default already normalised across the qualified comparison set.',
        recommended_change:
          'Change the donation form default from one-time to monthly, keeping one-time selectable.',
        expected_outcome:
          'A donor completing the form without changing the default gives monthly rather than once.',
        impact: 'high',
        effort: 'low',
        confidence: 'high',
        urgency: 'medium',
        dependencies: [],
        assumption_ids: ['ASM-0001'],
        measurement: {
          kind: 'quantitative',
          hypothesis: 'Defaulting to monthly increases the share of gifts that are recurring.',
          success_metric: 'Share of completed donations that are monthly rather than one-time.',
          baseline: 'unknown',
          target: 'Establish a baseline, then improve on it',
          validation_method:
            'Compare the monthly share for six weeks before and after the default change.',
          falsifier:
            'The monthly share is unchanged between the two six-week windows, or total completed gifts fall enough that recurring gains do not offset it.',
          review_period: '6 weeks',
        },
      },
      {
        id: 'R-0002',
        title: 'State what a monthly gift funds before the donation form',
        problem:
          'A prospective donor is asked to give before seeing any statement of what the gift funds.',
        why_it_matters:
          'A donor deciding whether to trust the cause with a recurring commitment has nothing to weigh before the request.',
        finding_ids: ['F-0002'],
        opportunity_ids: ['O-0002'],
        strategic_rationale:
          'Gives a reason before a request, on the page most likely to convert a first-time gift.',
        recommended_change:
          'Add one sentence stating what a typical monthly gift funds, placed above the donation form rather than after it.',
        expected_outcome:
          'A donor reaching the form has already seen one concrete statement of impact.',
        impact: 'medium',
        effort: 'low',
        confidence: 'medium',
        urgency: 'medium',
        dependencies: [],
        assumption_ids: [],
        measurement: {
          kind: 'quantitative',
          hypothesis: 'Impact proof above the form increases form completion.',
          success_metric:
            'Donation form completion rate for visitors who scroll past the impact statement.',
          baseline: 'unknown',
          target: 'Establish a baseline, then improve on it',
          validation_method: 'Compare completion rate for four weeks before and after the change.',
          falsifier: 'Completion rate is unchanged between the two four-week windows.',
          review_period: '4 weeks',
        },
      },
    ],

    actions: [
      {
        id: 'A-0001',
        recommendation_id: 'R-0001',
        description: 'Change the donation form default frequency from one-time to monthly.',
        affected_assets: [{ asset_id: 'AST-0001', operation: 'edit', target: 'frequency-default' }],
        effort: 'low',
        dependencies: [],
        status: 'todo',
        validation: 'A donor completing the form without touching frequency gives monthly.',
        horizon: 'now',
      },
      {
        id: 'A-0002',
        recommendation_id: 'R-0002',
        description: 'Add an impact statement above the donation form.',
        affected_assets: [{ asset_id: 'AST-0001', operation: 'edit', target: 'impact-statement' }],
        effort: 'low',
        dependencies: [],
        status: 'todo',
        validation: 'The impact statement appears above the form in the rendered page.',
        horizon: 'now',
      },
    ],

    assumptions: [
      {
        id: 'ASM-0001',
        statement:
          'Defaulting to monthly will not materially reduce the number of donors who complete a gift at all.',
        why_assumed: 'No historical default-change data exists for this form to check against.',
        status: 'unvalidated',
        validation_method:
          'Compare total completed-gift counts, not just frequency share, before and after the change.',
        evidence_ids: [],
      },
    ],

    unknowns: [
      {
        id: 'UNK-0001',
        statement:
          'Whether donors who would have given one-time simply abandon the form when monthly is the default is not established.',
        why_unknown:
          'No analytics access; only the current form default is observable from outside.',
        how_to_resolve:
          'Instrument the form and compare abandonment before and after the default change.',
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
            'The donation form states its own default directly, so it is the primary source for this question.',
          target: 'https://riverbank-relief.example/donate',
          result_event_ids: ['RE-0001'],
        },
        {
          id: 'RA-0002',
          research_question_id: 'RQ-0001',
          action: 'compare',
          rationale:
            'Both benchmark charities needed their own donation forms retrieved to compare defaults.',
          target: 'benchmark donation forms',
          result_event_ids: ['RE-0002', 'RE-0003'],
        },
        {
          id: 'RA-0003',
          research_question_id: 'RQ-0002',
          action: 'inspect',
          rationale: 'The page order itself answers the question; no external source was needed.',
          target: 'https://riverbank-relief.example/donate',
          result_event_ids: ['RE-0004'],
        },
      ],
      events: [
        {
          id: 'RE-0001',
          action_id: 'RA-0001',
          outcome: 'succeeded',
          detail: 'Donation page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0002',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail: 'Benchmark charity A donation page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0003',
          action_id: 'RA-0002',
          outcome: 'succeeded',
          detail: 'Benchmark charity B donation page retrieved and snapshotted.',
          at: T,
        },
        {
          id: 'RE-0004',
          action_id: 'RA-0003',
          outcome: 'succeeded',
          detail: 'Page order inspected directly; no retrieval needed.',
          at: T,
        },
      ],
    },
  };
}
