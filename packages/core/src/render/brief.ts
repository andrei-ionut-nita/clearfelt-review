import { renderChangeTreeAscii } from '../change-tree.ts';
import type { ReviewView } from './view.ts';

/**
 * The executive brief: specification section 32.
 *
 * It must be useful to someone who reads only the first few minutes. That means
 * it leads with the decision, states the position, and is explicit about what
 * the review could not establish, because a brief that reports only conclusions
 * invites more confidence than the evidence supports.
 */

function bullet(items: string[]): string {
  return items.length > 0 ? items.map((i) => `- ${i}`).join('\n') : '- None recorded.';
}

export function renderBrief(view: ReviewView): string {
  const { review } = view;
  const scope = review.scope;
  const subject = review.entities.find((e) => e.role === 'subject');
  const out: string[] = [];

  out.push(`# Executive brief: ${subject?.name ?? review.run.slug}`);
  out.push('');
  out.push(`Run ${review.run.id}, ${review.run.created_at.slice(0, 10)}.`);
  out.push('');

  if (scope) {
    out.push('## The decision this supports');
    out.push('');
    out.push(scope.decision.statement);
    out.push('');
    out.push(`**Objective.** ${scope.objective}`);
    out.push('');
    out.push(`**Audience.** ${scope.audiences.map((a) => a.name).join('; ') || 'Not stated.'}`);
    out.push('');
  }

  const topFindings = [...review.findings]
    .sort((a, b) => rankLevel(b.importance) - rankLevel(a.importance))
    .slice(0, 5);

  out.push('## Current position');
  out.push('');
  if (topFindings.length === 0) {
    out.push('No findings were established.');
  } else {
    for (const finding of topFindings) {
      // The claim type is carried into the brief deliberately: a reader
      // skimming only this section still needs to see which conclusions are
      // inferences rather than restatements of the evidence.
      const inferred = finding.claim_type === 'inferred' ? ' _(inferred)_' : '';
      const contested = finding.contradicted_by.length > 0 ? ' _(contested)_' : '';
      out.push(
        `- **${finding.title}**${inferred}${contested}. ${finding.statement} [${finding.id}]`,
      );
    }
  }
  out.push('');

  if (review.outcome_assessments.length > 0) {
    // Leads, not trails: what a rerun established about the previous run's
    // recommendations is not a footnote, it can be the entire point of the
    // run. See ADR 0012.
    out.push('## Outcome assessments');
    out.push('');
    out.push(
      bullet(
        review.outcome_assessments.map(
          (oa) =>
            `${oa.recommendation_id} (run ${oa.recommendation_run_id}): ${oa.verdict}. ${oa.rationale} [${oa.id}]`,
        ),
      ),
    );
    out.push('');
  }

  out.push('## Primary opportunity');
  out.push('');
  const topOpportunity = [...review.opportunities].sort(
    (a, b) => rankLevel(b.strategic_value) - rankLevel(a.strategic_value),
  )[0];
  out.push(
    topOpportunity
      ? `**${topOpportunity.title}** [${topOpportunity.id}]. ${topOpportunity.description}`
      : 'No opportunity was identified.',
  );
  out.push('');

  out.push('## Top priorities');
  out.push('');
  const top = view.priorities.slice(0, 3);
  if (top.length === 0) {
    out.push('No recommendations were produced.');
  } else {
    top.forEach((result, index) => {
      const rec = view.recommendationOf(result.id);
      if (!rec) return;
      out.push(`${index + 1}. **${rec.title}** (${result.priority}) [${rec.id}]`);
      out.push(`   ${rec.why_it_matters}`);
      const unvalidated = view.unvalidatedAssumptions(rec);
      if (unvalidated.length > 0) {
        // Surfaced in the brief, not buried in an appendix: a reader deciding
        // from this page needs to know the recommendation rests on something
        // nobody has checked.
        out.push(
          `   _Depends on an unvalidated assumption: ${unvalidated.map((a) => `${a.statement} [${a.id}]`).join('; ')}_`,
        );
      }
    });
  }
  out.push('');

  out.push('## What we could not establish');
  out.push('');
  out.push(
    bullet([
      ...review.unknowns.map((u) => `${u.statement} ${u.why_unknown} [${u.id}]`),
      ...view.coverage.modules
        .flatMap((m) => m.unresolved)
        .map((u) =>
          `${u.question} Stopped because: ${u.stop_reason ?? 'no reason recorded'}. ${u.stop_detail ?? ''} [${u.id}]`.replace(
            /\s+/g,
            ' ',
          ),
        ),
    ]),
  );
  out.push('');

  if (review.assumptions.length > 0) {
    out.push('## What we assumed');
    out.push('');
    out.push(
      bullet(
        review.assumptions.map((a) => `${a.statement} (${a.status}) ${a.why_assumed} [${a.id}]`),
      ),
    );
    out.push('');
  }

  const tree = renderChangeTreeAscii(view.changeTree);
  if (tree !== '') {
    out.push('## What changes');
    out.push('');
    out.push('```text');
    out.push(tree);
    out.push('```');
    out.push('');
  }

  return `${out.join('\n')}\n`;
}

function rankLevel(level: 'high' | 'medium' | 'low'): number {
  return level === 'high' ? 3 : level === 'medium' ? 2 : 1;
}
