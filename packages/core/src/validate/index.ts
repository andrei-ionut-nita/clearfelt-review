import type { Review } from '../model/index.ts';
import {
  validateAction,
  validateAsset,
  validateAssumption,
  validateComparison,
  validateEntity,
  validateEvidence,
  validateFeedback,
  validateFinding,
  validateHypothesis,
  validateObservation,
  validateOpportunity,
  validateOutcomeAssessment,
  validatePlan,
  validateRecommendation,
  validateResearchLog,
  validateResearchQuestion,
  validateRun,
  validateScope,
  validateSource,
  validateUnknown,
  validateUserAssertion,
} from './entities.ts';
import { type Issue, errorsOnly, formatIssue } from './fields.ts';
import { checkIntegrity } from './integrity.ts';

export * from './fields.ts';
export * from './entities.ts';
export { checkIntegrity } from './integrity.ts';

/** Which validator runs over which collection. One row per list collection. */
const LIST_VALIDATORS: [keyof Review, (value: unknown, issues: Issue[]) => void][] = [
  ['entities', validateEntity],
  ['assets', validateAsset],
  ['user_assertions', validateUserAssertion],
  ['research_questions', validateResearchQuestion],
  ['sources', validateSource],
  ['observations', validateObservation],
  ['evidence', validateEvidence],
  ['comparisons', validateComparison],
  ['findings', validateFinding],
  ['opportunities', validateOpportunity],
  ['recommendations', validateRecommendation],
  ['actions', validateAction],
  ['assumptions', validateAssumption],
  ['unknowns', validateUnknown],
  ['hypotheses', validateHypothesis],
  ['feedback', validateFeedback],
  ['outcome_assessments', validateOutcomeAssessment],
];

export interface ValidationResult {
  issues: Issue[];
  errors: Issue[];
  ok: boolean;
}

/**
 * Validates a whole run: shape first, then integrity.
 *
 * Both passes always run. Reporting only the first failure would mean fixing a
 * run one error at a time, and the reasoning layer that produced it needs the
 * whole list to correct its output in a single pass.
 */
export function validateReview(review: Review): ValidationResult {
  const issues: Issue[] = [];

  validateRun(review.run, issues);
  if (review.scope !== null) validateScope(review.scope, issues);
  if (review.plan !== null) validatePlan(review.plan, issues);
  validateResearchLog(review.research_log, issues);

  for (const [key, validator] of LIST_VALIDATORS) {
    const items = review[key];
    if (!Array.isArray(items)) {
      issues.push({
        severity: 'error',
        code: 'collection.not_array',
        collection: String(key),
        message: `${String(key)} must be an array`,
      });
      continue;
    }
    for (const item of items) validator(item, issues);
  }

  issues.push(...checkIntegrity(review));

  const errors = errorsOnly(issues);
  return { issues, errors, ok: errors.length === 0 };
}

export function formatIssues(issues: readonly Issue[]): string {
  return issues.map(formatIssue).join('\n');
}
