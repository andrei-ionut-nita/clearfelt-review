import type {
  Action,
  Asset,
  Assumption,
  Comparison,
  Entity,
  Evidence,
  Finding,
  Observation,
  Opportunity,
  Recommendation,
  Review,
  ReviewScope,
  Source,
  UserAssertion,
} from '../model/index.ts';
import { emptyReview, newRun } from '../store.ts';

/**
 * Fixture builders.
 *
 * Every builder returns a valid entity, so a test that wants to prove one rule
 * fires can break exactly one field and be confident that any reported issue is
 * the one it is testing. Building invalid fixtures by hand tends to produce
 * tests that pass for the wrong reason.
 */

const NOW = '2026-09-07T12:00:00.000Z';

export function makeEntity(over: Partial<Entity> = {}): Entity {
  return {
    id: 'ENT-0001',
    type: 'organisation',
    role: 'subject',
    name: 'Acme',
    asset_ids: [],
    ...over,
  };
}

export function makeAsset(over: Partial<Asset> = {}): Asset {
  return {
    id: 'AST-0001',
    entity_id: 'ENT-0001',
    type: 'website_page',
    path: '/',
    title: 'Homepage',
    source_ids: ['S-0001'],
    ...over,
  };
}

export function makeSource(over: Partial<Source> = {}): Source {
  return {
    id: 'S-0001',
    url: 'https://example.com/',
    source_type: 'website',
    accessed_at: NOW,
    retrieval_method: 'fetch',
    snapshot_path: 'snapshots/S-0001.html',
    content_hash: 'a'.repeat(64),
    authority: 'high',
    independence: { type: 'independent' },
    ...over,
  };
}

export function makeObservation(over: Partial<Observation> = {}): Observation {
  return {
    id: 'OBS-0001',
    source_id: 'S-0001',
    observation_type: 'positive',
    statement: 'The homepage headline states "Engineering that pays for itself".',
    locator: 'main h1',
    observed_at: NOW,
    ...over,
  };
}

export function makeEvidence(over: Partial<Evidence> = {}): Evidence {
  return {
    id: 'E-0001',
    observation_ids: ['OBS-0001'],
    source_ids: ['S-0001'],
    claim: 'The stated proposition leads on commercial outcomes.',
    research_question_ids: [],
    user_assertion_ids: [],
    relevance: 'high',
    reliability: 'high',
    corroborated_by: [],
    supports: [],
    contradicts: [],
    temporal_scope: 'current',
    ...over,
  };
}

export function makeFinding(over: Partial<Finding> = {}): Finding {
  return {
    id: 'F-0001',
    category: 'positioning',
    title: 'Proposition leads on outcomes',
    statement: 'The homepage proposition leads on commercial outcomes rather than capability.',
    claim_type: 'derived',
    evidence_ids: ['E-0001'],
    confidence: 'high',
    importance: 'high',
    implication: 'A reader learns what the work is worth before learning how it is done.',
    temporal_scope: 'current',
    contradicted_by: [],
    assumption_ids: [],
    ...over,
  };
}

export function makeOpportunity(over: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'O-0001',
    title: 'Technology economics is underoccupied',
    description: 'No comparison entity leads on the cost of engineering decisions.',
    supporting_finding_ids: ['F-0001'],
    supporting_evidence_ids: ['E-0001'],
    strategic_value: 'high',
    audience_value: 'high',
    confidence: 'medium',
    ...over,
  };
}

export function makeAssumption(over: Partial<Assumption> = {}): Assumption {
  return {
    id: 'ASM-0001',
    statement: 'Recruiters read the homepage before the writing archive.',
    why_assumed: 'No analytics access, so entry-point order is inferred from navigation.',
    status: 'unvalidated',
    evidence_ids: [],
    ...over,
  };
}

export function makeComparison(over: Partial<Comparison> = {}): Comparison {
  return {
    id: 'COMP-0001',
    entity_id: 'ENT-0002',
    name: 'Comparable CTO profile',
    type: 'direct_competitor',
    status: 'qualified',
    proposed_by: 'system',
    why_included: 'Targets the same audience with the same objective.',
    audience_overlap: 'high',
    objective_overlap: 'high',
    decision_overlap: 'medium',
    relevance: 'high',
    confidence: 'medium',
    source_ids: ['S-0001'],
    positioning_territories: ['Technical leadership'],
    ...over,
  };
}

export function makeUserAssertion(over: Partial<UserAssertion> = {}): UserAssertion {
  return {
    id: 'UA-0001',
    statement: 'Our main competitor is Example Consulting.',
    status: 'to_validate',
    research_question_ids: [],
    evidence_ids: [],
    created_at: NOW,
    ...over,
  };
}

export function makeRecommendation(over: Partial<Recommendation> = {}): Recommendation {
  return {
    id: 'R-0001',
    title: 'Lead the homepage with the economics framing',
    problem: 'Capability is clearer than commercial consequence.',
    why_it_matters: 'The audience decides on consequence, not on stack.',
    finding_ids: ['F-0001'],
    opportunity_ids: ['O-0001'],
    strategic_rationale: 'The territory is unoccupied across the comparison set.',
    recommended_change: 'Rewrite the hero to lead with cost-of-decision framing.',
    expected_outcome: 'A reader can state what the work is worth within one screen.',
    impact: 'high',
    effort: 'medium',
    confidence: 'high',
    urgency: 'high',
    dependencies: [],
    assumption_ids: [],
    measurement: {
      kind: 'quantitative',
      hypothesis: 'Outcome-led framing raises qualified enquiry rate.',
      success_metric: 'Qualified enquiries per 100 sessions',
      baseline: 'unknown',
      target: 'Establish a baseline, then improve on it',
      validation_method: 'Compare enquiry quality over eight weeks.',
      falsifier: 'No change in qualified enquiry rate after eight weeks of comparable traffic.',
      review_period: '8 weeks',
    },
    ...over,
  };
}

export function makeAction(over: Partial<Action> = {}): Action {
  return {
    id: 'A-0001',
    recommendation_id: 'R-0001',
    description: 'Rewrite the homepage hero headline and supporting sentence.',
    affected_assets: [{ asset_id: 'AST-0001', target: 'hero', operation: 'edit' }],
    effort: 'medium',
    dependencies: [],
    status: 'todo',
    validation: 'A reader can state the proposition after one screen.',
    horizon: 'now',
    ...over,
  };
}

export function makeScope(over: Partial<ReviewScope> = {}): ReviewScope {
  return {
    id: 'SCOPE-0001',
    objective: 'Generate CTO opportunities.',
    entity_ids: ['ENT-0001'],
    asset_ids: ['AST-0001'],
    decision: {
      statement: 'What should change on the site over the next 90 days?',
      evidence_required: ['How the site is currently positioned'],
    },
    audiences: [{ name: 'Founders and CEOs' }],
    exclusions: ['Paid advertising performance'],
    depth: 'standard',
    comparison_applicable: true,
    budget: {
      max_sources: 40,
      max_search_iterations: 12,
      max_depth: 2,
      min_evidence_per_question: 2,
      min_independent_corroboration: 1,
      priority_question_ids: [],
    },
    ...over,
  };
}

/**
 * A minimal run that validates cleanly, all the way from source to action.
 *
 * Tests break one thing in this and assert the corresponding rule fires. If this
 * base ever stops validating, every such test becomes meaningless, so a test
 * asserts the base itself is clean.
 */
export function makeValidReview(over: Partial<Review> = {}): Review {
  const run = newRun('acme', 'r-001', NOW);
  run.stage = 'complete';
  run.approved_gates = { scope: NOW, research_plan: NOW, findings: NOW };
  return {
    ...emptyReview(run),
    scope: makeScope(),
    entities: [makeEntity()],
    assets: [makeAsset()],
    sources: [makeSource()],
    observations: [makeObservation()],
    evidence: [makeEvidence({ supports: ['F-0001'] })],
    findings: [makeFinding()],
    opportunities: [makeOpportunity()],
    recommendations: [makeRecommendation()],
    actions: [makeAction()],
    ...over,
  };
}
