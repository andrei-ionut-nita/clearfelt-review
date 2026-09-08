import type { Review } from './model/index.ts';

/**
 * What a rerun needs to say before the reasoning layer starts, that `init
 * --previous` alone does not: which of the previous run's recommendations
 * need an OutcomeAssessment this time, and what would prove each one wrong.
 *
 * Pure and print-only, on purpose: it does not write anything, and it does not
 * pre-populate entities, scope or comparisons as drafts. Guessing at that
 * content is a reasoning-layer decision, not something CLI code should make;
 * `lifecycle.ts` enforces, skills reason, and this stays on the enforcement
 * side of that line. See docs/decisions/0012-outcome-assessment.md.
 */
export function rerunSummary(previous: Review): string {
  const recs = previous.recommendations;
  if (recs.length === 0) {
    return `${previous.run.slug}/${previous.run.id} produced no recommendations, so there is nothing to assess an outcome for yet.`;
  }
  const lines: string[] = [
    `${previous.run.slug}/${previous.run.id} produced ${recs.length} recommendation(s). Before writing new findings, write an OutcomeAssessment for each one whose review period has plausibly elapsed:`,
    '',
  ];
  for (const rec of recs) {
    lines.push(`  ${rec.id}  ${rec.title}`);
    lines.push(`      falsifier: ${rec.measurement.falsifier}`);
    lines.push(`      review after: ${rec.measurement.review_period ?? 'not set'}`);
  }
  return lines.join('\n');
}
