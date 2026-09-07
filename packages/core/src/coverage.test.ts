import { describe, expect, it } from 'vitest';
import { computeCoverage } from './coverage.ts';
import type { ResearchQuestion } from './model/index.ts';
import {
  makeEvidence,
  makeFinding,
  makeObservation,
  makeScope,
  makeSource,
  makeValidReview,
} from './testing/factory.ts';

function question(over: Partial<ResearchQuestion> = {}): ResearchQuestion {
  return {
    id: 'RQ-0001',
    question: 'How is the entity currently positioned?',
    module: 'positioning',
    state: 'ANSWERED',
    stop_reason: 'sufficient',
    evidence_ids: ['E-0001'],
    source_ids: ['S-0001'],
    confidence: 'high',
    priority: 1,
    ...over,
  };
}

describe('computeCoverage', () => {
  it('groups questions by module and counts their states', () => {
    const review = makeValidReview({
      research_questions: [
        question(),
        question({ id: 'RQ-0002', module: 'audience', state: 'OPEN', stop_reason: undefined }),
      ],
    });
    const coverage = computeCoverage(review);
    expect(coverage.modules.map((m) => m.module)).toEqual(['audience', 'positioning']);
    expect(coverage.totals.answered).toBe(1);
  });

  it('separates a question that ran out of evidence from one that was answered', () => {
    // "Researched sufficiently" and "could not obtain evidence" produce
    // identical silence in a report unless coverage insists on the difference.
    const review = makeValidReview({
      research_questions: [
        question(),
        question({
          id: 'RQ-0002',
          state: 'INSUFFICIENT_EVIDENCE',
          stop_reason: 'no_evidence_available',
          confidence: 'low',
        }),
      ],
    });
    const coverage = computeCoverage(review);
    expect(coverage.totals.unresolved).toBe(1);
    expect(coverage.stop_reasons.no_evidence_available).toBe(1);
    expect(coverage.stop_reasons.sufficient).toBe(1);
    expect(coverage.modules[0]?.unresolved[0]?.id).toBe('RQ-0002');
  });

  it('reports the weakest confidence in a module, not the average', () => {
    // Averaging would let one confident answer disguise an unanswered question
    // next to it, which is the opposite of what this report is for.
    const review = makeValidReview({
      research_questions: [
        question({ confidence: 'high' }),
        question({ id: 'RQ-0002', confidence: 'low' }),
      ],
    });
    expect(computeCoverage(review).modules[0]?.confidence).toBe('low');
  });

  it('counts independent sources separately from all sources', () => {
    const review = makeValidReview({
      sources: [
        makeSource(),
        makeSource({ id: 'S-0002', independence: { type: 'republished', of_source_id: 'S-0001' } }),
      ],
    });
    const coverage = computeCoverage(review);
    expect(coverage.totals.sources).toBe(2);
    expect(coverage.totals.independent_sources).toBe(1);
  });

  it('flags a finding standing on fewer than two independent sources', () => {
    expect(computeCoverage(makeValidReview()).uncorroborated_findings).toEqual(['F-0001']);
  });

  it('clears the flag once a second independent source backs the finding', () => {
    const review = makeValidReview({
      sources: [makeSource(), makeSource({ id: 'S-0002', url: 'https://elsewhere.example/' })],
      observations: [makeObservation(), makeObservation({ id: 'OBS-0002', source_id: 'S-0002' })],
      evidence: [
        makeEvidence({ supports: ['F-0001'] }),
        makeEvidence({ id: 'E-0002', observation_ids: ['OBS-0002'], source_ids: ['S-0002'] }),
      ],
      findings: [makeFinding({ evidence_ids: ['E-0001', 'E-0002'] })],
    });
    expect(computeCoverage(review).uncorroborated_findings).toEqual([]);
  });

  it('reports research failures from the ledger rather than dropping them', () => {
    const review = makeValidReview({
      research_questions: [question()],
      research_log: {
        actions: [
          {
            id: 'RA-0001',
            research_question_id: 'RQ-0001',
            action: 'retrieve',
            rationale: 'The pricing page is the only place the tier names appear.',
            result_event_ids: ['RE-0001'],
          },
        ],
        events: [
          {
            id: 'RE-0001',
            action_id: 'RA-0001',
            outcome: 'blocked',
            detail: 'robots.txt disallows /pricing',
            at: '2026-09-07T12:00:00.000Z',
          },
        ],
      },
    });
    const coverage = computeCoverage(review);
    expect(coverage.failures).toEqual([
      {
        research_question_id: 'RQ-0001',
        outcome: 'blocked',
        detail: 'robots.txt disallows /pricing',
      },
    ]);
  });

  it('reports budget exhaustion, so stopping and running out are distinguishable', () => {
    const scope = makeScope();
    const review = makeValidReview({
      scope: { ...scope, budget: { ...scope.budget, max_sources: 1 } },
    });
    expect(computeCoverage(review).budget.exhausted).toBe(true);
  });
});
