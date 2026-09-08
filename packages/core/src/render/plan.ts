import { renderChangeTreeAscii } from '../change-tree.ts';
import type { Level, Recommendation } from '../model/index.ts';
import { QUADRANT_LABELS } from '../prioritise.ts';
import { renderBrief } from './brief.ts';
import type { ReviewView } from './view.ts';

/**
 * The detailed plan: the long-form Markdown output.
 *
 * Structure follows the specification's output requirements: executive summary
 * (32), to-do list grouped by priority (33), a roadmap by horizon (27), the
 * change tree (28), the findings and recommendations in full, the comparison
 * landscape (17), research limitations (31) and an evidence room (41).
 *
 * The standard it aims at is section 53's: detailed where detail changes a
 * decision, concise where it does not. Every section here either carries
 * something a reader would act on or says explicitly what is missing.
 */

const HORIZON_TITLES: Record<string, string> = {
  now: 'Now',
  next: 'Next',
  later: 'Later',
};

function levelRank(level: Level): number {
  return level === 'high' ? 3 : level === 'medium' ? 2 : 1;
}

export function renderPlan(view: ReviewView): string {
  const { review } = view;
  const out: string[] = [];

  out.push(renderBrief(view).trimEnd());
  out.push('');
  out.push('---');
  out.push('');

  out.push(...todoList(view));
  out.push(...roadmap(view));
  out.push(...changeTree(view));
  out.push(...assessments(view));
  out.push(...findings(view));
  out.push(...opportunities(view));
  out.push(...recommendations(view));
  out.push(...comparisonLandscape(view));
  out.push(...limitations(view));
  out.push(...qualityReview(view));
  out.push(...evidenceRoom(view));

  return `${out.join('\n')}\n`;
}

/** Specification section 33: a concise executable list, grouped by priority. */
function todoList(view: ReviewView): string[] {
  const out = ['## To-do list', ''];
  const groups = ['P0', 'P1', 'P2', 'P3'] as const;
  let any = false;
  for (const priority of groups) {
    const inGroup = view.priorities.filter((p) => p.priority === priority);
    if (inGroup.length === 0) continue;
    any = true;
    out.push(`### ${priority}`);
    out.push('');
    for (const result of inGroup) {
      const rec = view.recommendationOf(result.id);
      if (!rec) continue;
      out.push(`- **${rec.title}** [${rec.id}]`);
      for (const action of view.actionsFor(rec.id)) {
        out.push(`  - [ ] ${action.description} [${action.id}]`);
      }
    }
    out.push('');
  }
  if (!any) out.push('No recommendations were produced.', '');
  return out;
}

/** Specification section 27, using the horizons the actions actually declare. */
function roadmap(view: ReviewView): string[] {
  const out = ['## Roadmap', ''];
  const horizons = ['now', 'next', 'later'] as const;
  let any = false;
  for (const horizon of horizons) {
    const actions = view.review.actions.filter((a) => a.horizon === horizon);
    if (actions.length === 0) continue;
    any = true;
    out.push(`### ${HORIZON_TITLES[horizon]}`);
    out.push('');
    for (const action of actions) {
      const rec = view.recommendationOf(action.recommendation_id);
      const priority = view.priorityOf(action.recommendation_id)?.priority ?? '';
      out.push(`- ${action.description} [${action.id}] (${priority}, effort ${action.effort})`);
      if (rec) out.push(`  Serves: ${rec.title} [${rec.id}]`);
      if (action.dependencies.length > 0) {
        out.push(`  Depends on: ${action.dependencies.join(', ')}`);
      }
      out.push(`  Done when: ${action.validation}`);
    }
    out.push('');
  }
  const unscheduled = view.review.actions.filter((a) => !a.horizon);
  if (unscheduled.length > 0) {
    any = true;
    out.push('### Unscheduled', '');
    for (const action of unscheduled) out.push(`- ${action.description} [${action.id}]`);
    out.push('');
  }
  if (!any) out.push('No actions were produced.', '');
  return out;
}

function changeTree(view: ReviewView): string[] {
  const tree = renderChangeTreeAscii(view.changeTree);
  if (tree === '') return [];
  const out = ['## Change tree', '', '```text', tree, '```', ''];
  out.push('Every node above was produced by an action. Node traceability:', '');
  const walk = (nodes: typeof view.changeTree.roots): void => {
    for (const node of nodes) {
      if (node.operation) {
        out.push(
          `- \`${node.path}\`: ${node.action_ids.join(', ')} from ${node.recommendation_ids.join(', ')}, supported by ${node.finding_ids.join(', ')}`,
        );
      }
      walk(node.children);
    }
  };
  walk(view.changeTree.roots);
  out.push('');
  return out;
}

/**
 * Specification section 40: dimension-specific assessments rather than one
 * meaningless overall score. Confidence comes from the coverage arithmetic, so
 * an area with no evidence reads as an area with no evidence.
 */
function assessments(view: ReviewView): string[] {
  if (view.coverage.modules.length === 0) return [];
  const out = [
    '## Assessment by area',
    '',
    '| Area | Questions | Evidence | Independent sources | Confidence |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const module of view.coverage.modules) {
    out.push(
      `| ${module.module} | ${module.by_state.ANSWERED}/${module.questions} answered | ${module.evidence_count} | ${module.independent_source_count} | ${module.confidence} |`,
    );
  }
  out.push('');
  out.push(
    'Confidence is the weakest answer in the area, not an average, so one confident answer cannot disguise an unanswered question beside it.',
  );
  out.push('');
  return out;
}

function findings(view: ReviewView): string[] {
  if (view.review.findings.length === 0) return [];
  const out = ['## Findings', ''];
  const sorted = [...view.review.findings].sort(
    (a, b) => levelRank(b.importance) - levelRank(a.importance) || a.id.localeCompare(b.id),
  );
  for (const finding of sorted) {
    out.push(`### ${finding.id}: ${finding.title}`);
    out.push('');
    out.push(finding.statement);
    out.push('');
    out.push(
      `**Claim type.** ${finding.claim_type}${finding.claim_type === 'inferred' ? '. This goes beyond what the evidence directly shows.' : '.'}`,
    );
    out.push('');
    out.push(`**Implication.** ${finding.implication}`);
    out.push('');
    out.push(
      `**Confidence.** ${finding.confidence}. **Importance.** ${finding.importance}. **Time frame.** ${finding.temporal_scope}.`,
    );
    out.push('');
    const sources = view.sourcesBehind(finding);
    out.push(
      `**Evidence.** ${finding.evidence_ids.join(', ')} from ${sources.map((s) => `${s.title ?? s.url ?? s.source_type} [${s.id}]`).join(', ') || 'no recorded source'}.`,
    );
    out.push('');
    if (finding.contradicted_by.length > 0) {
      // Contradiction is surfaced with the finding, not in a footnote. Section
      // 64 requires it to be representable; burying it would defeat the point.
      out.push(`**Contradicted by.** ${finding.contradicted_by.join(', ')}.`);
      for (const id of finding.contradicted_by) {
        const evidence = view.evidenceOf(id);
        if (evidence) out.push(`  - ${evidence.claim} [${id}]`);
      }
      out.push('');
    }
    if (finding.assumption_ids.length > 0) {
      out.push(`**Rests on.** ${finding.assumption_ids.join(', ')}.`);
      out.push('');
    }
    if (finding.competitive_relevance) {
      out.push(`**Competitive relevance.** ${finding.competitive_relevance}`);
      out.push('');
    }
    if (finding.audience_relevance) {
      out.push(`**Audience relevance.** ${finding.audience_relevance}`);
      out.push('');
    }
  }
  return out;
}

function opportunities(view: ReviewView): string[] {
  if (view.review.opportunities.length === 0) return [];
  const out = ['## Opportunities', ''];
  for (const opportunity of view.review.opportunities) {
    out.push(`### ${opportunity.id}: ${opportunity.title}`);
    out.push('');
    out.push(opportunity.description);
    out.push('');
    out.push(
      `**Strategic value.** ${opportunity.strategic_value}. **Audience value.** ${opportunity.audience_value}. **Confidence.** ${opportunity.confidence}.`,
    );
    out.push('');
    if (opportunity.white_space) {
      const territory = opportunity.white_space.territory;
      const row = view.saturation.rows.find((r) => r.territory === territory);
      out.push(
        `**White space.** Territory "${territory}", current position ${opportunity.white_space.current_position}${
          row ? `, saturation ${row.saturation.replace('_', ' ')} (computed)` : ''
        }.`,
      );
      out.push('');
    }
    out.push(`**Supported by.** ${opportunity.supporting_finding_ids.join(', ')}.`);
    out.push('');
  }
  return out;
}

function recommendations(view: ReviewView): string[] {
  if (view.review.recommendations.length === 0) return [];
  const out = ['## Recommendations', ''];
  for (const result of view.priorities) {
    const rec = view.recommendationOf(result.id);
    if (!rec) continue;
    out.push(`### ${rec.id}: ${rec.title}`);
    out.push('');
    out.push(
      `**Priority ${result.priority}.** ${result.rationale}. Opportunity map: ${QUADRANT_LABELS[result.quadrant]}.`,
    );
    out.push('');
    out.push(`**Problem.** ${rec.problem}`);
    out.push('');
    out.push(`**Why it matters.** ${rec.why_it_matters}`);
    out.push('');
    out.push(`**Rationale.** ${rec.strategic_rationale}`);
    out.push('');
    out.push(`**Change.** ${rec.recommended_change}`);
    out.push('');
    out.push(`**Expected outcome.** ${rec.expected_outcome}`);
    out.push('');
    out.push(...measurement(rec));
    out.push(
      `**Supported by.** ${rec.finding_ids.join(', ')}${rec.opportunity_ids.length > 0 ? `, ${rec.opportunity_ids.join(', ')}` : ''}.`,
    );
    out.push('');
    const unvalidated = view.unvalidatedAssumptions(rec);
    if (unvalidated.length > 0) {
      out.push('**Unvalidated dependency.**');
      for (const assumption of unvalidated) {
        out.push(
          `- ${assumption.statement} [${assumption.id}]. Validate by: ${assumption.validation_method ?? 'not stated'}.`,
        );
      }
      out.push('');
    }
    if (rec.dependencies.length > 0) {
      out.push(`**Depends on.** ${rec.dependencies.join(', ')}.`);
      out.push('');
    }
    const actions = view.actionsFor(rec.id);
    if (actions.length > 0) {
      out.push('**Actions.**');
      for (const action of actions) {
        out.push(
          `- ${action.description} [${action.id}], effort ${action.effort}, ${action.horizon ?? 'unscheduled'}`,
        );
      }
      out.push('');
    }
  }
  return out;
}

function measurement(rec: Recommendation): string[] {
  const m = rec.measurement;
  return [
    '**How we will know.**',
    '',
    `- Hypothesis: ${m.hypothesis}`,
    `- Metric (${m.kind}): ${m.success_metric}`,
    `- Baseline: ${m.baseline ?? 'not established'}`,
    `- Target: ${m.target ?? 'not set'}`,
    `- Method: ${m.validation_method}`,
    // The falsifier is what separates a testable intervention from advice.
    `- Would be proved wrong by: ${m.falsifier}`,
    `- Review after: ${m.review_period ?? 'not set'}`,
    '',
  ];
}

function comparisonLandscape(view: ReviewView): string[] {
  const { comparisons } = view.review;
  if (comparisons.length === 0) {
    return view.review.scope?.comparison_applicable === false
      ? [
          '## Comparison landscape',
          '',
          `Comparison was not applied. ${view.review.scope.comparison_not_applicable_reason ?? ''}`,
          '',
        ]
      : [];
  }
  const out = [
    '## Comparison landscape',
    '',
    '| ID | Name | Type | Status | Audience overlap | Relevance | Proposed by |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const c of comparisons) {
    out.push(
      `| ${c.id} | ${c.name} | ${c.type.replace(/_/g, ' ')} | ${c.status} | ${c.audience_overlap} | ${c.relevance} | ${c.proposed_by} |`,
    );
  }
  out.push('');
  for (const c of comparisons) {
    out.push(`- **${c.id}.** ${c.why_included}`);
    if (c.status === 'rejected' && c.why_rejected) {
      // Rejections stay visible so the same candidate is not rediscovered next
      // run, and so a reader can disagree with the judgement.
      out.push(`  Rejected: ${c.why_rejected}`);
    }
  }
  out.push('');
  out.push(...saturationTable(view));
  return out;
}

/**
 * Specification section 19's worked table, computed rather than authored: see
 * comparison-synthesis.ts. Territories are the union of what qualified
 * comparisons contest and what an opportunity's white_space named, so a
 * territory with no comparison in it at all is not silently dropped.
 */
function saturationTable(view: ReviewView): string[] {
  const { rows } = view.saturation;
  if (rows.length === 0) return [];
  const out = [
    '### Positioning territories',
    '',
    'Saturation and opportunity are computed from the comparison landscape, not asserted. Current position is a judgement carried from the opportunity that named the territory.',
    '',
    '| Territory | Saturation | Current position | Opportunity | Reading |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const row of rows) {
    out.push(
      `| ${row.territory} | ${row.saturation.replace('_', ' ')} | ${row.current_position} | ${row.opportunity.replace('_', ' ')} | ${row.classification.replace(/_/g, ' ')} |`,
    );
  }
  out.push('');
  for (const row of rows) {
    out.push(`- **${row.territory}.** ${row.saturation_rationale}`);
  }
  out.push('');
  const { possible_duplicate_territories: duplicates } = view.saturation;
  if (duplicates.length > 0) {
    out.push(
      '**Possibly the same territory (a caution, not a merge: reconcile the names by hand if so):**',
    );
    out.push('');
    for (const d of duplicates) {
      out.push(
        `- "${d.territory_a}" (${d.comparison_ids_a.join(', ')})  ~  "${d.territory_b}" (${d.comparison_ids_b.join(', ')})  (similarity ${d.similarity.toFixed(2)})`,
      );
    }
    out.push('');
  }
  return out;
}

/** Specification section 31: what we know, do not know, inferred, should validate. */
function limitations(view: ReviewView): string[] {
  const { review, coverage } = view;
  const out = ['## Research limitations', ''];

  out.push('### What we could not establish', '');
  if (review.unknowns.length === 0 && coverage.modules.every((m) => m.unresolved.length === 0)) {
    out.push('Nothing was recorded as unresolved.');
  } else {
    for (const unknown of review.unknowns) {
      out.push(`- ${unknown.statement} [${unknown.id}] ${unknown.why_unknown}`);
      if (unknown.how_to_resolve) out.push(`  To resolve: ${unknown.how_to_resolve}`);
    }
    for (const module of coverage.modules) {
      for (const item of module.unresolved) {
        out.push(
          `- ${item.question} [${item.id}] Stopped because: ${item.stop_reason ?? 'no reason recorded'}.`,
        );
        if (item.stop_detail) out.push(`  ${item.stop_detail}`);
      }
    }
  }
  out.push('');

  const inferred = review.findings.filter((f) => f.claim_type !== 'derived');
  out.push('### What we inferred rather than observed', '');
  if (inferred.length === 0) {
    out.push('Every finding restates what its evidence shows.');
  } else {
    for (const finding of inferred) {
      out.push(`- [${finding.id}] (${finding.claim_type}) ${finding.statement}`);
    }
  }
  out.push('');

  out.push('### What should be validated', '');
  const toValidate = [
    ...review.assumptions
      .filter((a) => a.status === 'unvalidated')
      .map((a) => `${a.statement} [${a.id}]. ${a.validation_method ?? 'No method stated.'}`),
    ...review.hypotheses.map((h) => `${h.statement} [${h.id}]. ${h.validation_method}`),
  ];
  out.push(
    toValidate.length > 0 ? toValidate.map((t) => `- ${t}`).join('\n') : 'Nothing outstanding.',
  );
  out.push('');

  if (coverage.failures.length > 0) {
    out.push('### Research that did not succeed', '');
    for (const failure of coverage.failures) {
      out.push(`- ${failure.research_question_id}: ${failure.outcome}. ${failure.detail}`);
    }
    out.push('');
  }

  if (coverage.uncorroborated_findings.length > 0) {
    out.push('### Findings on fewer than two independent sources', '');
    out.push(coverage.uncorroborated_findings.map((id) => `- ${id}`).join('\n'));
    out.push('');
  }

  return out;
}

/**
 * The report carrying its own critique.
 *
 * Unusual, and deliberate. A plan that prints its own unanswered contract
 * questions and its own mechanical defects is harder to read as an oracle,
 * which is the failure mode specification section 77 names. Hiding this section
 * when it is empty would make its appearance a signal that something went
 * wrong; printing it always makes a clean run a claim the reader can check.
 */
function qualityReview(view: ReviewView): string[] {
  const { quality } = view;
  const out = ['## How this review checks out', ''];

  if (quality.contract.total === 0) {
    out.push('No recommendations yet, so the output contract has nothing to test.', '');
  } else {
    out.push(
      `${quality.contract.complete_count} of ${quality.contract.total} recommendation(s) answer all ten questions the output contract asks.`,
      '',
    );
    for (const rec of quality.contract.recommendations) {
      if (rec.complete) continue;
      out.push(`- ${rec.recommendation_id} does not answer:`);
      for (const answer of rec.answers) {
        if (answer.answered) continue;
        out.push(`  - ${answer.question} ${answer.detail}`);
      }
    }
    if (quality.contract.complete_count < quality.contract.total) out.push('');
  }

  if (quality.findings.length === 0) {
    out.push('No mechanical quality issue was detected.', '');
  } else {
    for (const [category, findings] of Object.entries(quality.by_category)) {
      out.push(`### ${category}`, '');
      for (const finding of findings ?? []) {
        out.push(`- ${finding.severity}: ${finding.id}. ${finding.message}`);
        out.push(`  ${finding.remedy}`);
      }
      out.push('');
    }
  }

  out.push(
    'These are mechanical checks. They say nothing about whether the analysis is any good: whether the comparison set is the one this audience actually considers, whether an inference is warranted, and whether any of this bears on the decision are judgments only a reader can make.',
    '',
  );
  return out;
}

/** Specification section 41: every conclusion traceable to what supports it. */
function evidenceRoom(view: ReviewView): string[] {
  if (view.review.evidence.length === 0) return [];
  const out = ['## Evidence', ''];
  for (const evidence of view.review.evidence) {
    const usedBy = [
      ...view.review.findings.filter((f) => f.evidence_ids.includes(evidence.id)).map((f) => f.id),
      ...view.review.findings
        .filter((f) => f.contradicted_by.includes(evidence.id))
        .map((f) => `${f.id} (contradicts)`),
    ];
    out.push(`### ${evidence.id}`);
    out.push('');
    out.push(`**Claim.** ${evidence.claim}`);
    out.push('');
    out.push('**Observations.**');
    for (const id of evidence.observation_ids) {
      const observation = view.observationOf(id);
      if (!observation) continue;
      const kind = observation.observation_type === 'absence' ? 'Absence. ' : '';
      out.push(`- ${kind}${observation.statement} [${id}] at \`${observation.locator}\``);
      if (observation.search_scope && observation.search_scope.length > 0) {
        // An absence is only defensible with its search scope attached, so the
        // scope travels with it into the output rather than staying in the data.
        out.push(`  Searched: ${observation.search_scope.join(', ')}`);
      }
    }
    out.push('');
    out.push('**Sources.**');
    for (const id of evidence.source_ids) {
      const source = view.sourceOf(id);
      if (!source) continue;
      out.push(
        `- [${id}] ${source.title ?? source.source_type}${source.url ? ` (${source.url})` : ''}, ${source.retrieval_method}, authority ${source.authority}, ${source.independence.type}, accessed ${source.accessed_at.slice(0, 10)}`,
      );
    }
    out.push('');
    out.push(
      `**Relevance.** ${evidence.relevance}. **Reliability.** ${evidence.reliability}. **Time frame.** ${evidence.temporal_scope}.`,
    );
    out.push('');
    out.push(
      `**Used by.** ${usedBy.length > 0 ? usedBy.join(', ') : 'Not yet used by any finding.'}`,
    );
    out.push('');
  }
  return out;
}
