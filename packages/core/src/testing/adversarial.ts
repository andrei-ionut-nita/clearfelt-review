import type { Review } from '../model/index.ts';
import {
  makeAction,
  makeAssumption,
  makeEvidence,
  makeFinding,
  makeObservation,
  makeRecommendation,
  makeScope,
  makeSource,
  makeValidReview,
} from './factory.ts';

/**
 * One run per mechanical quality check, each tripping exactly one.
 *
 * A check with no fixture proving it fires is a check nobody has tested, and a
 * check that fires on a clean run is worse than no check at all: it teaches the
 * reader to ignore the report. Every case below starts from the same clean base
 * and breaks one thing, so any other finding it produces is a false positive by
 * construction and the test says so.
 *
 * These are quality fixtures, not validation fixtures. Every one of them passes
 * `validate` completely, which is the whole point: they are well-formed reviews
 * that a reader should not act on.
 */

const T = '2026-09-07T12:00:00.000Z';

/**
 * A small run that is both valid and good.
 *
 * Richer than makeValidReview because several quality checks only have anything
 * to look at once a run has research questions, more than one source and an
 * audience the findings name.
 */
export function makeQualityCleanReview(): Review {
  return makeValidReview({
    scope: makeScope({
      budget: {
        max_sources: 40,
        max_search_iterations: 12,
        max_depth: 2,
        min_evidence_per_question: 2,
        min_independent_corroboration: 1,
        priority_question_ids: [],
      },
    }),
    sources: [
      makeSource(),
      makeSource({
        id: 'S-0002',
        url: 'https://directory.example.org/profile',
        publisher: 'Example Directory',
        snapshot_path: 'snapshots/S-0002.html',
        content_hash: 'b'.repeat(64),
      }),
    ],
    observations: [
      makeObservation(),
      makeObservation({
        id: 'OBS-0002',
        source_id: 'S-0002',
        statement: 'The directory listing describes the work in cost-of-delivery terms.',
        locator: 'section.summary',
      }),
    ],
    evidence: [
      makeEvidence({ supports: ['F-0001'], research_question_ids: ['RQ-0001'] }),
      makeEvidence({
        id: 'E-0002',
        observation_ids: ['OBS-0002'],
        source_ids: ['S-0002'],
        claim: 'A third-party listing describes the work in the same commercial terms.',
        research_question_ids: ['RQ-0001'],
        corroborated_by: ['E-0001'],
        supports: ['F-0001'],
      }),
    ],
    research_questions: [
      {
        id: 'RQ-0001',
        question: 'How is the proposition currently framed?',
        module: 'positioning',
        state: 'ANSWERED',
        stop_reason: 'sufficient',
        stop_detail: 'Two independent sources agree and further search repeated them.',
        evidence_ids: ['E-0001', 'E-0002'],
        source_ids: ['S-0001', 'S-0002'],
        confidence: 'high',
        priority: 1,
      },
    ],
    findings: [
      makeFinding({
        evidence_ids: ['E-0001', 'E-0002'],
        audience_relevance: 'Founders and CEOs judge the work on commercial consequence.',
      }),
    ],
  });
}

export interface AdversarialCase {
  /** Directory name under fixtures/adversarial/. */
  name: string;
  /** The one check code this run must trip. */
  expect: string;
  /** Why this run is bad, in the language a reader would use. */
  problem: string;
  /** True when breaking this rule also leaves the output contract unanswered. */
  contract_incomplete?: boolean;
  build(): Review;
}

/** Applies a change to the single recommendation in the clean base. */
function withRecommendation(over: Parameters<typeof makeRecommendation>[0]): Review {
  const review = makeQualityCleanReview();
  review.recommendations = [makeRecommendation({ finding_ids: ['F-0001'], ...over })];
  return review;
}

export const ADVERSARIAL_CASES: readonly AdversarialCase[] = [
  {
    name: 'restates-finding',
    expect: 'recommendation.restates_finding',
    problem: 'The change is the finding with an imperative verb in front of it.',
    build: () =>
      withRecommendation({
        recommended_change:
          'Make the homepage proposition lead on commercial outcomes rather than capability.',
      }),
  },
  {
    name: 'circular-falsifier',
    expect: 'recommendation.circular_falsifier',
    problem: 'The falsifier restates the hypothesis, so no result can refute it.',
    build: () =>
      withRecommendation({
        measurement: {
          ...makeRecommendation().measurement,
          hypothesis: 'Outcome-led framing raises the qualified enquiry rate.',
          falsifier: 'Outcome-led framing does not raise the qualified enquiry rate.',
        },
      }),
  },
  {
    name: 'falsifier-states-success',
    expect: 'recommendation.falsifier_states_success',
    problem: 'The falsifier describes the outcome we want, which nothing can contradict.',
    build: () =>
      withRecommendation({
        measurement: {
          ...makeRecommendation().measurement,
          falsifier: 'Qualified enquiries rise over the following quarter.',
        },
      }),
  },
  {
    name: 'generic-language',
    expect: 'recommendation.generic_language',
    problem: 'Consultant theatre: advice that could be given to any entity at all.',
    build: () =>
      withRecommendation({
        recommended_change: 'Improve messaging across the site and build trust with the audience.',
      }),
  },
  {
    name: 'duplicate-recommendations',
    expect: 'recommendation.near_duplicate',
    problem: 'One intervention split into two, so the plan looks more substantial.',
    build: () => {
      const review = makeQualityCleanReview();
      review.recommendations = [
        makeRecommendation(),
        makeRecommendation({
          id: 'R-0002',
          title: 'Reframe the hero around cost of decision',
          recommended_change: 'Rewrite the hero so it leads with cost-of-decision framing.',
        }),
      ];
      review.actions = [makeAction(), makeAction({ id: 'A-0002', recommendation_id: 'R-0002' })];
      return review;
    },
  },
  {
    name: 'dropped-assumption',
    expect: 'recommendation.drops_assumption',
    problem: 'The finding says it rests on an assumption; the recommendation does not.',
    contract_incomplete: true,
    build: () => {
      const review = makeQualityCleanReview();
      review.assumptions = [makeAssumption({ status: 'validated' })];
      review.findings = [
        makeFinding({
          evidence_ids: ['E-0001', 'E-0002'],
          audience_relevance: 'Founders and CEOs judge the work on commercial consequence.',
          assumption_ids: ['ASM-0001'],
        }),
      ];
      return review;
    },
  },
  {
    name: 'unvalidated-assumption',
    expect: 'recommendation.rests_on_unvalidated_assumption',
    problem: 'A confident recommendation resting on something nobody established.',
    build: () => {
      const review = makeQualityCleanReview();
      review.assumptions = [makeAssumption()];
      review.findings = [
        makeFinding({
          evidence_ids: ['E-0001', 'E-0002'],
          audience_relevance: 'Founders and CEOs judge the work on commercial consequence.',
          assumption_ids: ['ASM-0001'],
        }),
      ];
      review.recommendations = [makeRecommendation({ assumption_ids: ['ASM-0001'] })];
      return review;
    },
  },
  {
    name: 'no-independent-corroboration',
    expect: 'finding.no_independent_corroboration',
    problem: 'Two sources agreeing, both republishing the same original.',
    build: () => {
      const review = makeQualityCleanReview();
      review.sources = review.sources.map((source) => ({
        ...source,
        independence: { type: 'republished' as const, of_source_id: 'S-0001' },
      }));
      return review;
    },
  },
  {
    name: 'derived-introduces-concepts',
    expect: 'finding.derived_introduces_concepts',
    problem: 'A finding labelled derived that travelled well past its evidence.',
    build: () => {
      const review = makeQualityCleanReview();
      review.findings = [
        makeFinding({
          evidence_ids: ['E-0001', 'E-0002'],
          audience_relevance: 'Founders and CEOs judge the work on commercial consequence.',
          statement:
            'Procurement teams trust this supplier more than incumbent vendors during renewal negotiations.',
        }),
      ];
      return review;
    },
  },
  {
    name: 'current-from-historical',
    expect: 'finding.current_from_historical_evidence',
    problem: 'A claim about today resting entirely on evidence about last year.',
    build: () => {
      const review = makeQualityCleanReview();
      review.evidence = review.evidence.map((item) => ({
        ...item,
        temporal_scope: 'historical' as const,
      }));
      return review;
    },
  },
  {
    name: 'sufficient-below-floor',
    expect: 'question.sufficient_below_evidence_floor',
    problem: 'Closed as sufficient on less evidence than the budget itself demanded.',
    build: () => {
      const review = makeQualityCleanReview();
      review.research_questions = review.research_questions.map((question) => ({
        ...question,
        evidence_ids: ['E-0001'],
      }));
      return review;
    },
  },
  {
    name: 'insufficient-but-found',
    expect: 'question.insufficient_but_produced_findings',
    problem: 'The research judged the evidence inadequate, then built a finding on it.',
    build: () => {
      const review = makeQualityCleanReview();
      review.research_questions = review.research_questions.map((question) => ({
        ...question,
        state: 'INSUFFICIENT_EVIDENCE' as const,
        stop_reason: 'no_evidence_available' as const,
        confidence: 'low' as const,
      }));
      return review;
    },
  },
];

/** The run every case is a mutation of, exported so a test can prove it is clean. */
export const ADVERSARIAL_BASE = { name: 'clean-base', build: makeQualityCleanReview };

export function buildAdversarial(name: string): Review {
  const found = ADVERSARIAL_CASES.find((c) => c.name === name);
  if (!found) throw new Error(`No adversarial case named ${name}`);
  return found.build();
}

export const ADVERSARIAL_TIMESTAMP = T;
