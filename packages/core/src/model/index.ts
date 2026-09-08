/**
 * The canonical intelligence model.
 *
 * One loaded Review is the single source of truth every renderer reads. Nothing
 * downstream may hold a fact that is not in here, which is what keeps the HTML
 * report a view of the model rather than a parallel narrative.
 */

export * from './common.ts';
export * from './run.ts';
export * from './scope.ts';
export * from './entity.ts';
export * from './assertion.ts';
export * from './source.ts';
export * from './evidence.ts';
export * from './comparison.ts';
export * from './research.ts';
export * from './analysis.ts';
export * from './recommendation.ts';
export * from './change-tree.ts';
export * from './feedback.ts';
export * from './outcome-assessment.ts';
export * from './plan.ts';

import type { Assumption, Finding, Hypothesis, Opportunity, Unknown } from './analysis.ts';
import type { UserAssertion } from './assertion.ts';
import type { Comparison } from './comparison.ts';
import type { Asset, Entity } from './entity.ts';
import type { Evidence } from './evidence.ts';
import type { Feedback } from './feedback.ts';
import type { OutcomeAssessment } from './outcome-assessment.ts';
import type { ResearchPlan } from './plan.ts';
import type { Action, Recommendation } from './recommendation.ts';
import type { ResearchLog, ResearchQuestion } from './research.ts';
import type { ReviewRun } from './run.ts';
import type { ReviewScope } from './scope.ts';
import type { Observation, Source } from './source.ts';

/** A complete run, loaded from disk. */
export interface Review {
  run: ReviewRun;
  scope: ReviewScope | null;
  plan: ResearchPlan | null;
  entities: Entity[];
  assets: Asset[];
  user_assertions: UserAssertion[];
  research_questions: ResearchQuestion[];
  sources: Source[];
  observations: Observation[];
  evidence: Evidence[];
  comparisons: Comparison[];
  findings: Finding[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
  actions: Action[];
  assumptions: Assumption[];
  unknowns: Unknown[];
  hypotheses: Hypothesis[];
  feedback: Feedback[];
  outcome_assessments: OutcomeAssessment[];
  research_log: ResearchLog;
}

/** How a collection is shaped on disk. */
export type CollectionShape = 'single' | 'list' | 'log';

export interface CollectionSpec {
  /** Key on the Review object. */
  key: keyof Review;
  file: string;
  shape: CollectionShape;
  /** Id prefix for list collections. Absent for single documents and the log. */
  prefix?: string;
}

/**
 * The single registry every other module keys off: store.ts for reading and
 * writing, ids.ts for allocation, lifecycle.ts for stage gating, and
 * integrity.ts for prefix checks. Adding a collection means adding a row here,
 * and nothing else has a hardcoded list of filenames to fall out of sync with.
 */
export const COLLECTIONS: readonly CollectionSpec[] = [
  { key: 'run', file: 'run.json', shape: 'single' },
  { key: 'scope', file: 'scope.json', shape: 'single' },
  { key: 'plan', file: 'plan.json', shape: 'single' },
  { key: 'entities', file: 'entities.json', shape: 'list', prefix: 'ENT' },
  { key: 'assets', file: 'assets.json', shape: 'list', prefix: 'AST' },
  { key: 'user_assertions', file: 'user-assertions.json', shape: 'list', prefix: 'UA' },
  { key: 'research_questions', file: 'research-questions.json', shape: 'list', prefix: 'RQ' },
  { key: 'sources', file: 'sources.json', shape: 'list', prefix: 'S' },
  { key: 'observations', file: 'observations.json', shape: 'list', prefix: 'OBS' },
  { key: 'evidence', file: 'evidence.json', shape: 'list', prefix: 'E' },
  { key: 'comparisons', file: 'comparisons.json', shape: 'list', prefix: 'COMP' },
  { key: 'findings', file: 'findings.json', shape: 'list', prefix: 'F' },
  { key: 'opportunities', file: 'opportunities.json', shape: 'list', prefix: 'O' },
  { key: 'recommendations', file: 'recommendations.json', shape: 'list', prefix: 'R' },
  { key: 'actions', file: 'actions.json', shape: 'list', prefix: 'A' },
  { key: 'assumptions', file: 'assumptions.json', shape: 'list', prefix: 'ASM' },
  { key: 'unknowns', file: 'unknowns.json', shape: 'list', prefix: 'UNK' },
  { key: 'hypotheses', file: 'hypotheses.json', shape: 'list', prefix: 'HYP' },
  { key: 'feedback', file: 'feedback.json', shape: 'list', prefix: 'FB' },
  {
    key: 'outcome_assessments',
    file: 'outcome-assessments.json',
    shape: 'list',
    prefix: 'OA',
  },
  { key: 'research_log', file: 'research-log.json', shape: 'log' },
] as const;

export function collectionByKey(key: keyof Review): CollectionSpec {
  const spec = COLLECTIONS.find((c) => c.key === key);
  if (!spec) throw new Error(`Unknown collection key: ${String(key)}`);
  return spec;
}
