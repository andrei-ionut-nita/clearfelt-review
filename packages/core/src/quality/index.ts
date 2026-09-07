import type { Review } from '../model/index.ts';
import { type QualityCategory, type QualityFinding, runChecks } from './checks.ts';
import { type ContractReport, checkContract } from './contract.ts';

/**
 * Quality evaluation, which is a different problem from validation.
 *
 * validate answers "is this a well-formed review?". quality answers "is this
 * review any good?". A run can pass the first completely and fail the second
 * completely, and the day those two collapse into one command is the day the
 * product starts believing its own output. See
 * docs/decisions/0008-validation-is-not-evaluation.md.
 */

export * from './contract.ts';
export * from './checks.ts';
export * from './text.ts';

export interface QualityReport {
  contract: ContractReport;
  findings: QualityFinding[];
  defects: QualityFinding[];
  cautions: QualityFinding[];
  by_category: Partial<Record<QualityCategory, QualityFinding[]>>;
  /** No defects, and every recommendation answers all ten questions. */
  ok: boolean;
}

export function evaluateQuality(review: Review): QualityReport {
  const contract = checkContract(review);
  const findings = runChecks(review);
  const defects = findings.filter((f) => f.severity === 'defect');
  const cautions = findings.filter((f) => f.severity === 'caution');

  const byCategory: Partial<Record<QualityCategory, QualityFinding[]>> = {};
  for (const finding of findings) {
    const bucket = byCategory[finding.category] ?? [];
    bucket.push(finding);
    byCategory[finding.category] = bucket;
  }

  return {
    contract,
    findings,
    defects,
    cautions,
    by_category: byCategory,
    ok: defects.length === 0 && contract.ok,
  };
}

/** Human-readable report for the CLI. Named categories, deliberately no score. */
export function formatQualityReport(report: QualityReport): string {
  const lines: string[] = [];

  lines.push('Output contract');
  lines.push('');
  if (report.contract.total === 0) {
    // Not a pass. A run with nothing to check has not met the bar, it has not
    // reached it, and a green tick here would be the first lie in the chain.
    lines.push('  No recommendations yet, so the contract has nothing to test.');
  } else {
    lines.push(
      `  ${report.contract.complete_count}/${report.contract.total} recommendation(s) answer all ten questions.`,
    );
    lines.push('');
    for (const rec of report.contract.recommendations) {
      const mark = rec.complete ? 'complete' : `${rec.unanswered.length} unanswered`;
      lines.push(`  ${rec.recommendation_id}  ${rec.title} [${mark}]`);
      for (const answer of rec.answers) {
        if (answer.answered) continue;
        lines.push(`      ${answer.question} ${answer.detail}`);
      }
    }
  }

  lines.push('');
  lines.push('Quality checks');
  lines.push('');
  if (report.findings.length === 0) {
    lines.push('  No mechanical issues. This is not a judgement that the analysis is good:');
    lines.push('  see quality/rubric.md for what only a reader can assess.');
  }
  for (const [category, findings] of Object.entries(report.by_category)) {
    lines.push(`  ${category}`);
    for (const finding of findings ?? []) {
      lines.push(`    ${finding.severity.toUpperCase()} ${finding.id}: ${finding.message}`);
      lines.push(`      ${finding.remedy}`);
    }
  }

  lines.push('');
  lines.push(
    `${report.defects.length} defect(s), ${report.cautions.length} caution(s). A caution is sometimes the honest answer; a reader decides.`,
  );
  return lines.join('\n');
}
