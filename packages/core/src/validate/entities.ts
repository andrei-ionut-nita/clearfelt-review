import {
  ACTION_HORIZONS,
  ACTION_STATUSES,
  ASSERTION_STATUSES,
  ASSET_OPERATIONS,
  ASSUMPTION_STATUSES,
  CLAIM_TYPES,
  COMPARISON_STATUSES,
  COMPARISON_TYPES,
  ENTITY_ROLES,
  INDEPENDENCE_TYPES,
  LEVELS,
  MEASUREMENT_KINDS,
  OBSERVATION_TYPES,
  QUESTION_STATES,
  RESEARCH_ACTION_KINDS,
  RESEARCH_OUTCOMES,
  RETRIEVAL_METHODS,
  REVIEW_DEPTHS,
  RUN_STAGES,
  STOP_REASONS,
  TEMPORAL_SCOPES,
} from '../model/index.ts';
import {
  type Ctx,
  type Issue,
  type Rec,
  ctxFor,
  error,
  isRecord,
  optionalEnum,
  optionalIsoDate,
  optionalString,
  optionalStringArray,
  requireBoolean,
  requireEnum,
  requireIsoDate,
  requireNonEmptyIdArray,
  requireNumber,
  requireObject,
  requireString,
  requireStringArray,
} from './fields.ts';

/**
 * One validator per entity type, all the same shape.
 *
 * Shape checking only. Anything that needs to look at another collection lives
 * in integrity.ts, because a validator that reaches across collections cannot be
 * tested on a single object and grows into the thing nobody wants to touch.
 */

export type EntityValidator = (value: unknown, issues: Issue[]) => void;

/** Guards the common case of a collection entry that is not an object at all. */
function asEntity(collection: string, value: unknown, issues: Issue[]): [Ctx, Rec] | null {
  if (!isRecord(value)) {
    issues.push({
      severity: 'error',
      code: 'entity.not_object',
      collection,
      message: 'Collection entry is not an object',
    });
    return null;
  }
  const id = typeof value.id === 'string' ? value.id : undefined;
  const ctx = ctxFor(collection, id, issues);
  requireString(ctx, value, 'id');
  optionalString(ctx, value, 'supersedes');
  optionalString(ctx, value, 'superseded_by');
  return [ctx, value];
}

export function validateRun(value: unknown, issues: Issue[]): void {
  const pair = asEntity('run', value, issues);
  if (!pair) return;
  const [ctx, run] = pair;
  requireString(ctx, run, 'slug');
  requireIsoDate(ctx, run, 'created_at');
  requireIsoDate(ctx, run, 'updated_at');
  requireEnum(ctx, run, 'stage', RUN_STAGES);
  optionalString(ctx, run, 'previous_run_id');
  optionalString(ctx, run, 'blocked_reason');
  if (run.stage === 'blocked' && typeof run.blocked_reason !== 'string') {
    error(ctx, 'run.blocked_without_reason', 'blocked_reason', 'A blocked run must say why');
  }
  const obs = requireObject(ctx, run, 'observability');
  if (obs) {
    requireIsoDate(ctx, obs, 'started_at');
    for (const field of [
      'sources_discovered',
      'sources_retrieved',
      'retrieval_failures',
      'search_iterations',
    ]) {
      requireNumber(ctx, obs, field);
    }
  }
}

export function validateScope(value: unknown, issues: Issue[]): void {
  const pair = asEntity('scope', value, issues);
  if (!pair) return;
  const [ctx, scope] = pair;
  requireString(ctx, scope, 'objective');
  requireStringArray(ctx, scope, 'entity_ids');
  requireStringArray(ctx, scope, 'asset_ids');
  requireStringArray(ctx, scope, 'exclusions');
  requireEnum(ctx, scope, 'depth', REVIEW_DEPTHS);
  requireBoolean(ctx, scope, 'comparison_applicable');
  // Spec section 51 allows skipping comparison, but never silently.
  if (scope.comparison_applicable === false) {
    requireString(ctx, scope, 'comparison_not_applicable_reason');
  }
  const decision = requireObject(ctx, scope, 'decision');
  if (decision) {
    requireString(ctx, decision, 'statement');
    requireStringArray(ctx, decision, 'evidence_required');
  }
  const budget = requireObject(ctx, scope, 'budget');
  if (budget) {
    for (const field of [
      'max_sources',
      'max_search_iterations',
      'max_depth',
      'min_evidence_per_question',
      'min_independent_corroboration',
    ]) {
      requireNumber(ctx, budget, field);
    }
    requireStringArray(ctx, budget, 'priority_question_ids');
  }
  if (!Array.isArray(scope.audiences)) {
    error(ctx, 'field.array', 'audiences', 'audiences must be an array');
  }
}

export function validatePlan(value: unknown, issues: Issue[]): void {
  const pair = asEntity('plan', value, issues);
  if (!pair) return;
  const [ctx, plan] = pair;
  requireIsoDate(ctx, plan, 'created_at');
  requireString(ctx, plan, 'objective_interpretation');
  requireStringArray(ctx, plan, 'anticipated_gaps');
  if (!Array.isArray(plan.activated_modules)) {
    error(ctx, 'field.array', 'activated_modules', 'activated_modules must be an array');
  }
  if (!Array.isArray(plan.dormant_modules)) {
    error(ctx, 'field.array', 'dormant_modules', 'dormant_modules must be an array');
  }
  const comparison = requireObject(ctx, plan, 'comparison_plan');
  if (comparison) {
    requireNumber(ctx, comparison, 'supplied_count');
    requireBoolean(ctx, comparison, 'to_discover');
    requireString(ctx, comparison, 'rationale');
  }
}

export function validateEntity(value: unknown, issues: Issue[]): void {
  const pair = asEntity('entities', value, issues);
  if (!pair) return;
  const [ctx, entity] = pair;
  requireString(ctx, entity, 'type');
  requireString(ctx, entity, 'name');
  requireEnum(ctx, entity, 'role', ENTITY_ROLES);
  requireStringArray(ctx, entity, 'asset_ids');
  optionalString(ctx, entity, 'canonical_url');
}

export function validateAsset(value: unknown, issues: Issue[]): void {
  const pair = asEntity('assets', value, issues);
  if (!pair) return;
  const [ctx, asset] = pair;
  requireString(ctx, asset, 'entity_id');
  requireString(ctx, asset, 'type');
  requireString(ctx, asset, 'path');
  requireStringArray(ctx, asset, 'source_ids');
  optionalString(ctx, asset, 'parent_id');
}

export function validateUserAssertion(value: unknown, issues: Issue[]): void {
  const pair = asEntity('user_assertions', value, issues);
  if (!pair) return;
  const [ctx, assertion] = pair;
  requireString(ctx, assertion, 'statement');
  requireEnum(ctx, assertion, 'status', ASSERTION_STATUSES);
  requireStringArray(ctx, assertion, 'research_question_ids');
  requireStringArray(ctx, assertion, 'evidence_ids');
  requireIsoDate(ctx, assertion, 'created_at');
  // A corroborated assertion has to have something behind it, or 'corroborated'
  // means nothing more than the reasoning layer feeling confident.
  if (assertion.status === 'corroborated') {
    requireNonEmptyIdArray(ctx, assertion, 'evidence_ids');
  }
}

export function validateResearchQuestion(value: unknown, issues: Issue[]): void {
  const pair = asEntity('research_questions', value, issues);
  if (!pair) return;
  const [ctx, question] = pair;
  requireString(ctx, question, 'question');
  requireString(ctx, question, 'module');
  requireEnum(ctx, question, 'state', QUESTION_STATES);
  optionalEnum(ctx, question, 'stop_reason', STOP_REASONS);
  optionalEnum(ctx, question, 'confidence', LEVELS);
  requireStringArray(ctx, question, 'evidence_ids');
  requireStringArray(ctx, question, 'source_ids');
  requireNumber(ctx, question, 'priority');
  // A question that stopped must say why. "Researched sufficiently" and "could
  // not obtain evidence" produce identical silence in a report unless the model
  // insists on the difference. PARTIALLY_ANSWERED is included because it is the
  // easiest state to leave a question in and walk away from: something was
  // found, the question is not closed, and without a reason the report cannot
  // tell a reader whether more was available.
  const closed = ['ANSWERED', 'PARTIALLY_ANSWERED', 'INSUFFICIENT_EVIDENCE', 'BLOCKED'];
  if (typeof question.state === 'string' && closed.includes(question.state)) {
    requireEnum(ctx, question, 'stop_reason', STOP_REASONS);
  }
}

export function validateSource(value: unknown, issues: Issue[]): void {
  const pair = asEntity('sources', value, issues);
  if (!pair) return;
  const [ctx, source] = pair;
  requireString(ctx, source, 'source_type');
  requireIsoDate(ctx, source, 'accessed_at');
  requireEnum(ctx, source, 'retrieval_method', RETRIEVAL_METHODS);
  requireEnum(ctx, source, 'authority', LEVELS);
  optionalIsoDate(ctx, source, 'published_at');
  optionalIsoDate(ctx, source, 'updated_at');
  optionalString(ctx, source, 'url');
  const independence = requireObject(ctx, source, 'independence');
  if (independence) {
    requireEnum(ctx, independence, 'type', INDEPENDENCE_TYPES);
    // Claiming derivation without naming the origin makes the claim unusable:
    // corroboration counting needs to know which source it collapses into.
    if (
      typeof independence.type === 'string' &&
      independence.type !== 'independent' &&
      independence.type !== 'unknown' &&
      typeof independence.of_source_id !== 'string'
    ) {
      error(
        ctx,
        'source.independence_missing_origin',
        'independence.of_source_id',
        `independence.type '${independence.type}' requires of_source_id`,
      );
    }
  }
  // A fetched source without a snapshot cannot be reproduced or checked, which
  // is the one guard we have against a fabricated retrieval.
  if (source.retrieval_method === 'fetch') {
    requireString(ctx, source, 'snapshot_path');
    requireString(ctx, source, 'content_hash');
  }
}

export function validateObservation(value: unknown, issues: Issue[]): void {
  const pair = asEntity('observations', value, issues);
  if (!pair) return;
  const [ctx, obs] = pair;
  requireString(ctx, obs, 'source_id');
  requireString(ctx, obs, 'statement');
  requireString(ctx, obs, 'locator');
  requireIsoDate(ctx, obs, 'observed_at');
  requireEnum(ctx, obs, 'observation_type', OBSERVATION_TYPES);
  optionalStringArray(ctx, obs, 'search_scope');
  // "No pricing found" is only defensible if we say where we looked. Without
  // the scope it collapses into "they do not publish pricing", which is a claim
  // the observation cannot support.
  optionalStringArray(ctx, obs, 'scanned_source_ids');
  if (obs.observation_type === 'absence') {
    const scope = obs.search_scope;
    if (!Array.isArray(scope) || scope.length === 0) {
      error(
        ctx,
        'observation.absence_without_scope',
        'search_scope',
        'An absence observation must record where it looked',
      );
    } else if (scope.length > 1) {
      // An absence found across several pages must say which sources those
      // were, or it credits one page with work done across all of them.
      const scanned = obs.scanned_source_ids;
      if (!Array.isArray(scanned) || scanned.length < 2) {
        error(
          ctx,
          'observation.absence_without_scanned_sources',
          'scanned_source_ids',
          'An absence searched across more than one place must name the sources scanned',
        );
      }
    }
  }
}

export function validateEvidence(value: unknown, issues: Issue[]): void {
  const pair = asEntity('evidence', value, issues);
  if (!pair) return;
  const [ctx, evidence] = pair;
  requireString(ctx, evidence, 'claim');
  requireNonEmptyIdArray(ctx, evidence, 'observation_ids');
  requireStringArray(ctx, evidence, 'source_ids');
  requireStringArray(ctx, evidence, 'research_question_ids');
  requireStringArray(ctx, evidence, 'user_assertion_ids');
  requireStringArray(ctx, evidence, 'corroborated_by');
  requireStringArray(ctx, evidence, 'supports');
  requireStringArray(ctx, evidence, 'contradicts');
  requireEnum(ctx, evidence, 'relevance', LEVELS);
  requireEnum(ctx, evidence, 'reliability', LEVELS);
  requireEnum(ctx, evidence, 'temporal_scope', TEMPORAL_SCOPES);
}

export function validateComparison(value: unknown, issues: Issue[]): void {
  const pair = asEntity('comparisons', value, issues);
  if (!pair) return;
  const [ctx, comparison] = pair;
  requireString(ctx, comparison, 'entity_id');
  requireString(ctx, comparison, 'name');
  requireString(ctx, comparison, 'why_included');
  requireEnum(ctx, comparison, 'type', COMPARISON_TYPES);
  requireEnum(ctx, comparison, 'status', COMPARISON_STATUSES);
  requireEnum(ctx, comparison, 'proposed_by', ['user', 'system'] as const);
  for (const field of [
    'audience_overlap',
    'objective_overlap',
    'decision_overlap',
    'relevance',
    'confidence',
  ]) {
    requireEnum(ctx, comparison, field, LEVELS);
  }
  requireStringArray(ctx, comparison, 'source_ids');
  if (comparison.status === 'rejected') {
    requireString(ctx, comparison, 'why_rejected');
  }
  // A user naming a competitor is a proposal to investigate. Recording which
  // assertion it came from keeps it from hardening into an established fact.
  if (comparison.proposed_by === 'user') {
    requireString(ctx, comparison, 'user_assertion_id');
  }
}

export function validateFinding(value: unknown, issues: Issue[]): void {
  const pair = asEntity('findings', value, issues);
  if (!pair) return;
  const [ctx, finding] = pair;
  requireString(ctx, finding, 'category');
  requireString(ctx, finding, 'title');
  requireString(ctx, finding, 'statement');
  requireString(ctx, finding, 'implication');
  requireEnum(ctx, finding, 'claim_type', CLAIM_TYPES);
  requireNonEmptyIdArray(ctx, finding, 'evidence_ids');
  requireEnum(ctx, finding, 'confidence', LEVELS);
  requireEnum(ctx, finding, 'importance', LEVELS);
  requireEnum(ctx, finding, 'temporal_scope', TEMPORAL_SCOPES);
  requireStringArray(ctx, finding, 'contradicted_by');
  requireStringArray(ctx, finding, 'assumption_ids');
}

export function validateOpportunity(value: unknown, issues: Issue[]): void {
  const pair = asEntity('opportunities', value, issues);
  if (!pair) return;
  const [ctx, opportunity] = pair;
  requireString(ctx, opportunity, 'title');
  requireString(ctx, opportunity, 'description');
  requireNonEmptyIdArray(ctx, opportunity, 'supporting_finding_ids');
  requireStringArray(ctx, opportunity, 'supporting_evidence_ids');
  requireEnum(ctx, opportunity, 'strategic_value', LEVELS);
  requireEnum(ctx, opportunity, 'audience_value', LEVELS);
  requireEnum(ctx, opportunity, 'confidence', LEVELS);
  if (opportunity.white_space !== undefined) {
    const ws = requireObject(ctx, opportunity, 'white_space');
    if (ws) {
      requireString(ctx, ws, 'territory');
      requireEnum(ctx, ws, 'saturation', LEVELS);
      requireEnum(ctx, ws, 'current_position', LEVELS);
    }
  }
}

export function validateAssumption(value: unknown, issues: Issue[]): void {
  const pair = asEntity('assumptions', value, issues);
  if (!pair) return;
  const [ctx, assumption] = pair;
  requireString(ctx, assumption, 'statement');
  requireString(ctx, assumption, 'why_assumed');
  requireEnum(ctx, assumption, 'status', ASSUMPTION_STATUSES);
  requireStringArray(ctx, assumption, 'evidence_ids');
}

export function validateUnknown(value: unknown, issues: Issue[]): void {
  const pair = asEntity('unknowns', value, issues);
  if (!pair) return;
  const [ctx, unknownItem] = pair;
  requireString(ctx, unknownItem, 'statement');
  requireString(ctx, unknownItem, 'why_unknown');
  requireStringArray(ctx, unknownItem, 'blocks_finding_ids');
}

export function validateHypothesis(value: unknown, issues: Issue[]): void {
  const pair = asEntity('hypotheses', value, issues);
  if (!pair) return;
  const [ctx, hypothesis] = pair;
  requireString(ctx, hypothesis, 'statement');
  requireString(ctx, hypothesis, 'validation_method');
  requireStringArray(ctx, hypothesis, 'based_on_evidence_ids');
  requireEnum(ctx, hypothesis, 'confidence', LEVELS);
}

export function validateRecommendation(value: unknown, issues: Issue[]): void {
  const pair = asEntity('recommendations', value, issues);
  if (!pair) return;
  const [ctx, rec] = pair;
  for (const field of [
    'title',
    'problem',
    'why_it_matters',
    'strategic_rationale',
    'recommended_change',
    'expected_outcome',
  ]) {
    requireString(ctx, rec, field);
  }
  requireNonEmptyIdArray(ctx, rec, 'finding_ids');
  requireStringArray(ctx, rec, 'opportunity_ids');
  requireStringArray(ctx, rec, 'dependencies');
  requireStringArray(ctx, rec, 'assumption_ids');
  for (const field of ['impact', 'effort', 'confidence', 'urgency']) {
    requireEnum(ctx, rec, field, LEVELS);
  }
  // priority is computed by prioritise.ts. An authored one would let the
  // reasoning layer assert a P0 it has not earned, so its presence is an error
  // rather than something quietly ignored.
  if ('priority' in rec) {
    error(
      ctx,
      'recommendation.authored_priority',
      'priority',
      'priority is computed from impact, effort, confidence and urgency, never authored',
    );
  }
  const measurement = requireObject(ctx, rec, 'measurement');
  if (measurement) {
    requireEnum(ctx, measurement, 'kind', MEASUREMENT_KINDS);
    requireString(ctx, measurement, 'hypothesis');
    requireString(ctx, measurement, 'success_metric');
    requireString(ctx, measurement, 'validation_method');
    // Without a falsifier a recommendation cannot be wrong, and a claim that
    // cannot be wrong is not worth much.
    requireString(ctx, measurement, 'falsifier');
    optionalString(ctx, measurement, 'baseline');
    optionalString(ctx, measurement, 'target');
  }
}

export function validateAction(value: unknown, issues: Issue[]): void {
  const pair = asEntity('actions', value, issues);
  if (!pair) return;
  const [ctx, action] = pair;
  requireString(ctx, action, 'recommendation_id');
  requireString(ctx, action, 'description');
  requireString(ctx, action, 'validation');
  requireEnum(ctx, action, 'effort', LEVELS);
  requireEnum(ctx, action, 'status', ACTION_STATUSES);
  optionalEnum(ctx, action, 'horizon', ACTION_HORIZONS);
  requireStringArray(ctx, action, 'dependencies');
  const assets = action.affected_assets;
  if (!Array.isArray(assets) || assets.length === 0) {
    error(
      ctx,
      'action.no_affected_assets',
      'affected_assets',
      'An action must say where the change lands, or the change tree cannot be derived',
    );
    return;
  }
  assets.forEach((asset, index) => {
    if (!isRecord(asset)) {
      error(ctx, 'field.object', `affected_assets[${index}]`, 'affected asset must be an object');
      return;
    }
    requireEnum(ctx, asset, 'operation', ASSET_OPERATIONS);
    const hasExisting = typeof asset.asset_id === 'string';
    const hasProposed = isRecord(asset.proposed);
    // 'new' describes something that does not exist yet; everything else must
    // point at an asset we established exists. Allowing neither is how the
    // change tree becomes a tree of invented strings.
    if (asset.operation === 'new') {
      if (!hasProposed) {
        error(
          ctx,
          'action.new_without_proposal',
          `affected_assets[${index}].proposed`,
          "operation 'new' requires a proposed asset",
        );
      }
    } else if (!hasExisting) {
      error(
        ctx,
        'action.change_without_asset',
        `affected_assets[${index}].asset_id`,
        `operation '${String(asset.operation)}' requires an existing asset_id`,
      );
    }
    if (asset.operation === 'move' && typeof asset.to !== 'string') {
      error(
        ctx,
        'action.move_without_target',
        `affected_assets[${index}].to`,
        "operation 'move' requires 'to'",
      );
    }
  });
}

export function validateFeedback(value: unknown, issues: Issue[]): void {
  const pair = asEntity('feedback', value, issues);
  if (!pair) return;
  const [ctx, feedback] = pair;
  requireString(ctx, feedback, 'target_id');
  requireEnum(ctx, feedback, 'type', ['accept', 'reject', 'correct', 'amend', 'add'] as const);
  requireIsoDate(ctx, feedback, 'at');
}

export function validateResearchLog(value: unknown, issues: Issue[]): void {
  const ctx = ctxFor('research_log', undefined, issues);
  if (!isRecord(value)) {
    error(ctx, 'field.object', undefined, 'research-log.json must be an object');
    return;
  }
  const actions = value.actions;
  const events = value.events;
  if (!Array.isArray(actions)) {
    error(ctx, 'field.array', 'actions', 'actions must be an array');
  } else {
    for (const action of actions) {
      if (!isRecord(action)) continue;
      const actionCtx = ctxFor(
        'research_log.actions',
        typeof action.id === 'string' ? action.id : undefined,
        issues,
      );
      requireString(actionCtx, action, 'id');
      requireString(actionCtx, action, 'research_question_id');
      requireEnum(actionCtx, action, 'action', RESEARCH_ACTION_KINDS);
      // Intent is what makes the process auditable rather than merely leaving a
      // trail: the rationale says why this was the sensible next move.
      requireString(actionCtx, action, 'rationale');
      requireStringArray(actionCtx, action, 'result_event_ids');
    }
  }
  if (!Array.isArray(events)) {
    error(ctx, 'field.array', 'events', 'events must be an array');
  } else {
    for (const event of events) {
      if (!isRecord(event)) continue;
      const eventCtx = ctxFor(
        'research_log.events',
        typeof event.id === 'string' ? event.id : undefined,
        issues,
      );
      requireString(eventCtx, event, 'id');
      requireString(eventCtx, event, 'action_id');
      requireEnum(eventCtx, event, 'outcome', RESEARCH_OUTCOMES);
      requireString(eventCtx, event, 'detail');
      requireIsoDate(eventCtx, event, 'at');
    }
  }
}
