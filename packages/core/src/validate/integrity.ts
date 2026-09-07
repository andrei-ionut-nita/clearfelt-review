import { parseId } from '../ids.ts';
import { COLLECTIONS, type Review } from '../model/index.ts';
import { type Ctx, type Issue, ctxFor, error, warn } from './fields.ts';

/**
 * Cross-collection checks: spec section 46.
 *
 * Shape checking lives in entities.ts. Everything here needs to look at more
 * than one collection, which is the half that actually catches broken
 * intelligence. A finding can be perfectly well formed and still cite evidence
 * that does not exist, or rest entirely on what the user told us.
 */

interface Index {
  /** Every id in the run, mapped to the collection it belongs to. */
  owner: Map<string, string>;
  bySource: Map<string, { retrieval_method: string; independence_type: string }>;
}

function buildIndex(review: Review): Index {
  const owner = new Map<string, string>();
  const bySource = new Map<string, { retrieval_method: string; independence_type: string }>();
  for (const spec of COLLECTIONS) {
    if (spec.shape !== 'list') continue;
    const items = review[spec.key] as unknown as { id?: unknown }[];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (typeof item?.id === 'string') owner.set(item.id, String(spec.key));
    }
  }
  for (const source of review.sources) {
    bySource.set(source.id, {
      retrieval_method: source.retrieval_method,
      independence_type: source.independence?.type ?? 'unknown',
    });
  }
  return { owner, bySource };
}

/** Checks one reference, naming both ends so the error is actionable. */
function ref(
  ctx: Ctx,
  index: Index,
  id: unknown,
  field: string,
  expected: keyof Review | (keyof Review)[],
): void {
  if (typeof id !== 'string' || id === '') return;
  const owner = index.owner.get(id);
  const expectedList = Array.isArray(expected) ? expected : [expected];
  if (!owner) {
    error(ctx, 'ref.missing', field, `references ${id}, which does not exist in this run`);
    return;
  }
  if (!expectedList.includes(owner as keyof Review)) {
    error(
      ctx,
      'ref.wrong_collection',
      field,
      `references ${id}, which is a ${owner} entry, not ${expectedList.join(' or ')}`,
    );
  }
}

function refs(
  ctx: Ctx,
  index: Index,
  ids: unknown,
  field: string,
  expected: keyof Review | (keyof Review)[],
): void {
  if (!Array.isArray(ids)) return;
  ids.forEach((id, i) => ref(ctx, index, id, `${field}[${i}]`, expected));
}

export function checkIntegrity(review: Review): Issue[] {
  const issues: Issue[] = [];
  const index = buildIndex(review);

  checkIdsUniqueAndPrefixed(review, issues);
  checkReferences(review, index, issues);
  checkEvidenceDiscipline(review, index, issues);
  checkAssertionDiscipline(review, index, issues);
  checkLifecycleConsistency(review, issues);

  return issues;
}

/**
 * A duplicate id silently reroutes a traceability chain to the wrong entity: the
 * report still renders, still validates structurally, and now points at the
 * wrong evidence. That is worse than a crash, so it is an error everywhere.
 */
function checkIdsUniqueAndPrefixed(review: Review, issues: Issue[]): void {
  const seen = new Map<string, string>();
  for (const spec of COLLECTIONS) {
    if (spec.shape !== 'list') continue;
    const items = review[spec.key] as unknown as { id?: unknown }[];
    if (!Array.isArray(items)) continue;
    const local = new Set<string>();
    for (const item of items) {
      const id = item?.id;
      if (typeof id !== 'string') continue;
      const ctx = ctxFor(String(spec.key), id, issues);
      if (local.has(id)) {
        error(ctx, 'id.duplicate', 'id', `${id} appears more than once in ${spec.file}`);
      }
      local.add(id);
      const previous = seen.get(id);
      if (previous && previous !== String(spec.key)) {
        error(ctx, 'id.duplicate_across', 'id', `${id} is also used in ${previous}`);
      }
      seen.set(id, String(spec.key));
      const parsed = parseId(id);
      if (!parsed) {
        error(ctx, 'id.malformed', 'id', `${id} is not of the form PREFIX-0001`);
      } else if (spec.prefix && parsed.prefix !== spec.prefix) {
        error(
          ctx,
          'id.wrong_prefix',
          'id',
          `${id} should use the ${spec.prefix}- prefix for ${spec.file}`,
        );
      }
    }
  }
}

function checkReferences(review: Review, index: Index, issues: Issue[]): void {
  for (const asset of review.assets) {
    const ctx = ctxFor('assets', asset.id, issues);
    ref(ctx, index, asset.entity_id, 'entity_id', 'entities');
    ref(ctx, index, asset.parent_id, 'parent_id', 'assets');
    refs(ctx, index, asset.source_ids, 'source_ids', 'sources');
  }

  for (const source of review.sources) {
    const ctx = ctxFor('sources', source.id, issues);
    ref(ctx, index, source.independence?.of_source_id, 'independence.of_source_id', 'sources');
    ref(ctx, index, source.entity_id, 'entity_id', 'entities');
  }

  for (const obs of review.observations) {
    const ctx = ctxFor('observations', obs.id, issues);
    ref(ctx, index, obs.source_id, 'source_id', 'sources');
  }

  for (const evidence of review.evidence) {
    const ctx = ctxFor('evidence', evidence.id, issues);
    refs(ctx, index, evidence.observation_ids, 'observation_ids', 'observations');
    refs(ctx, index, evidence.source_ids, 'source_ids', 'sources');
    refs(ctx, index, evidence.research_question_ids, 'research_question_ids', 'research_questions');
    refs(ctx, index, evidence.user_assertion_ids, 'user_assertion_ids', 'user_assertions');
    refs(ctx, index, evidence.corroborated_by, 'corroborated_by', 'evidence');
    refs(ctx, index, evidence.supports, 'supports', 'findings');
    refs(ctx, index, evidence.contradicts, 'contradicts', 'findings');
  }

  for (const question of review.research_questions) {
    const ctx = ctxFor('research_questions', question.id, issues);
    refs(ctx, index, question.evidence_ids, 'evidence_ids', 'evidence');
    refs(ctx, index, question.source_ids, 'source_ids', 'sources');
  }

  for (const assertion of review.user_assertions) {
    const ctx = ctxFor('user_assertions', assertion.id, issues);
    refs(
      ctx,
      index,
      assertion.research_question_ids,
      'research_question_ids',
      'research_questions',
    );
    refs(ctx, index, assertion.evidence_ids, 'evidence_ids', 'evidence');
    ref(ctx, index, assertion.about_id, 'about_id', ['entities', 'comparisons']);
  }

  for (const comparison of review.comparisons) {
    const ctx = ctxFor('comparisons', comparison.id, issues);
    ref(ctx, index, comparison.entity_id, 'entity_id', 'entities');
    ref(ctx, index, comparison.user_assertion_id, 'user_assertion_id', 'user_assertions');
    refs(ctx, index, comparison.source_ids, 'source_ids', 'sources');
  }

  for (const finding of review.findings) {
    const ctx = ctxFor('findings', finding.id, issues);
    refs(ctx, index, finding.evidence_ids, 'evidence_ids', 'evidence');
    refs(ctx, index, finding.contradicted_by, 'contradicted_by', 'evidence');
    refs(ctx, index, finding.assumption_ids, 'assumption_ids', 'assumptions');
  }

  for (const opportunity of review.opportunities) {
    const ctx = ctxFor('opportunities', opportunity.id, issues);
    refs(ctx, index, opportunity.supporting_finding_ids, 'supporting_finding_ids', 'findings');
    refs(ctx, index, opportunity.supporting_evidence_ids, 'supporting_evidence_ids', 'evidence');
  }

  for (const assumption of review.assumptions) {
    const ctx = ctxFor('assumptions', assumption.id, issues);
    refs(ctx, index, assumption.evidence_ids, 'evidence_ids', 'evidence');
  }

  for (const unknownItem of review.unknowns) {
    const ctx = ctxFor('unknowns', unknownItem.id, issues);
    refs(ctx, index, unknownItem.blocks_finding_ids, 'blocks_finding_ids', 'findings');
  }

  for (const hypothesis of review.hypotheses) {
    const ctx = ctxFor('hypotheses', hypothesis.id, issues);
    refs(ctx, index, hypothesis.based_on_evidence_ids, 'based_on_evidence_ids', 'evidence');
  }

  for (const rec of review.recommendations) {
    const ctx = ctxFor('recommendations', rec.id, issues);
    refs(ctx, index, rec.finding_ids, 'finding_ids', 'findings');
    refs(ctx, index, rec.opportunity_ids, 'opportunity_ids', 'opportunities');
    refs(ctx, index, rec.assumption_ids, 'assumption_ids', 'assumptions');
    refs(ctx, index, rec.dependencies, 'dependencies', 'recommendations');
  }

  for (const action of review.actions) {
    const ctx = ctxFor('actions', action.id, issues);
    ref(ctx, index, action.recommendation_id, 'recommendation_id', 'recommendations');
    refs(ctx, index, action.dependencies, 'dependencies', 'actions');
    action.affected_assets?.forEach((asset, i) => {
      ref(ctx, index, asset.asset_id, `affected_assets[${i}].asset_id`, 'assets');
    });
  }

  for (const item of review.feedback) {
    const ctx = ctxFor('feedback', item.id, issues);
    // Feedback may target anything, so only existence is checked.
    if (typeof item.target_id === 'string' && !index.owner.has(item.target_id)) {
      error(ctx, 'ref.missing', 'target_id', `targets ${item.target_id}, which does not exist`);
    }
  }

  for (const action of review.research_log.actions) {
    const ctx = ctxFor('research_log.actions', action.id, issues);
    ref(ctx, index, action.research_question_id, 'research_question_id', 'research_questions');
  }
  const actionIds = new Set(review.research_log.actions.map((a) => a.id));
  for (const event of review.research_log.events) {
    const ctx = ctxFor('research_log.events', event.id, issues);
    if (!actionIds.has(event.action_id)) {
      error(
        ctx,
        'ref.missing',
        'action_id',
        `references action ${event.action_id}, which does not exist`,
      );
    }
  }

  if (review.scope) {
    const ctx = ctxFor('scope', review.scope.id, issues);
    refs(ctx, index, review.scope.entity_ids, 'entity_ids', 'entities');
    refs(ctx, index, review.scope.asset_ids, 'asset_ids', 'assets');
    refs(
      ctx,
      index,
      review.scope.budget?.priority_question_ids,
      'budget.priority_question_ids',
      'research_questions',
    );
  }
}

function checkEvidenceDiscipline(review: Review, index: Index, issues: Issue[]): void {
  for (const evidence of review.evidence) {
    const ctx = ctxFor('evidence', evidence.id, issues);
    // Supporting and contradicting the same finding is not nuance, it is a
    // modelling mistake: one of the two relationships is wrong.
    const both = (evidence.supports ?? []).filter((id) =>
      (evidence.contradicts ?? []).includes(id),
    );
    for (const id of both) {
      error(
        ctx,
        'evidence.supports_and_contradicts',
        'contradicts',
        `both supports and contradicts ${id}`,
      );
    }
    // Corroboration only counts across independent sources. Two outlets
    // reprinting one press release are one source, and letting them count twice
    // makes the corroboration signal actively misleading.
    for (const otherId of evidence.corroborated_by ?? []) {
      const other = review.evidence.find((e) => e.id === otherId);
      if (!other) continue;
      const independent = (other.source_ids ?? []).some(
        (sid) => index.bySource.get(sid)?.independence_type === 'independent',
      );
      if (!independent) {
        warn(
          ctx,
          'evidence.corroboration_not_independent',
          'corroborated_by',
          `${otherId} is not backed by an independent source, so it does not corroborate`,
        );
      }
    }
  }

  // A finding whose supporting evidence has no independent source is standing on
  // a single leg. Reported as a warning because it is sometimes unavoidable and
  // sometimes exactly the point.
  for (const finding of review.findings) {
    const ctx = ctxFor('findings', finding.id, issues);
    const sourceIds = new Set<string>();
    for (const eid of finding.evidence_ids ?? []) {
      const evidence = review.evidence.find((e) => e.id === eid);
      for (const sid of evidence?.source_ids ?? []) sourceIds.add(sid);
    }
    if (sourceIds.size === 1) {
      warn(
        ctx,
        'finding.single_source',
        'evidence_ids',
        'all supporting evidence traces to one source',
      );
    }
  }
}

/**
 * The contamination route this system exists to close.
 *
 * A user saying "McKinsey is our main competitor" enters as a user assertion.
 * If the reasoning layer turns it straight into a user_supplied source, an
 * observation and a finding, every referential check passes: the references are
 * all real. What has happened is that the user's belief has been laundered into
 * a finding and handed back to them as though it were research.
 */
function checkAssertionDiscipline(review: Review, index: Index, issues: Issue[]): void {
  const evidenceById = new Map(review.evidence.map((e) => [e.id, e]));

  const restsOnlyOnUser = (evidenceIds: readonly string[]): boolean => {
    const sourceIds = new Set<string>();
    for (const eid of evidenceIds) {
      for (const sid of evidenceById.get(eid)?.source_ids ?? []) sourceIds.add(sid);
    }
    if (sourceIds.size === 0) return false;
    return [...sourceIds].every(
      (sid) => index.bySource.get(sid)?.retrieval_method === 'user_supplied',
    );
  };

  for (const assertion of review.user_assertions) {
    const ctx = ctxFor('user_assertions', assertion.id, issues);
    if (assertion.status !== 'corroborated') continue;
    if (restsOnlyOnUser(assertion.evidence_ids ?? [])) {
      error(
        ctx,
        'assertion.corroborated_by_itself',
        'evidence_ids',
        'is marked corroborated but every supporting source is user supplied, which corroborates nothing',
      );
    }
  }

  for (const finding of review.findings) {
    const ctx = ctxFor('findings', finding.id, issues);
    if (restsOnlyOnUser(finding.evidence_ids ?? [])) {
      error(
        ctx,
        'finding.rests_only_on_user_assertion',
        'evidence_ids',
        'rests entirely on user supplied sources, so it repeats what the user told us rather than establishing it',
      );
    }
  }
}

/**
 * Catches a run whose contents got ahead of its approvals.
 *
 * store.ts refuses out-of-stage writes, so reaching this state normally means a
 * file was edited by hand or a bypass was used. Checking it here means a
 * hand-assembled run cannot smuggle recommendations past the findings gate.
 */
function checkLifecycleConsistency(review: Review, issues: Issue[]): void {
  const ctx = ctxFor('run', review.run.id, issues);
  const gates = review.run.approved_gates ?? {};
  if (review.findings.length > 0 && !gates.research_plan) {
    error(
      ctx,
      'lifecycle.findings_before_plan',
      'approved_gates.research_plan',
      'findings exist but the research plan gate was never approved',
    );
  }
  if (review.recommendations.length > 0 && !gates.findings) {
    error(
      ctx,
      'lifecycle.recommendations_before_findings',
      'approved_gates.findings',
      'recommendations exist but the findings gate was never approved',
    );
  }
  if (review.evidence.length > 0 && !gates.scope) {
    error(
      ctx,
      'lifecycle.evidence_before_scope',
      'approved_gates.scope',
      'evidence exists but the scope gate was never approved',
    );
  }
}
