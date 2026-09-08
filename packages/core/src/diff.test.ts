import { describe, expect, it } from 'vitest';
import { diffReviews, renderDiffAscii } from './diff.ts';
import { newRun } from './store.ts';
import {
  makeComparison,
  makeFeedback,
  makeFinding,
  makeOpportunity,
  makeRecommendation,
  makeSource,
  makeValidReview,
} from './testing/factory.ts';

const T = '2026-09-07T12:00:00.000Z';

/** Runs are independent: same slug, different run ids, ids allocated fresh in each. */
function runA() {
  return makeValidReview({ run: newRun('acme', 'r-001', T) });
}

function runB(over: Parameters<typeof makeValidReview>[0] = {}) {
  return makeValidReview({ run: newRun('acme', 'r-002', T, 'r-001'), ...over });
}

describe('diffReviews', () => {
  it('treats identical ids in two runs as unrelated, never as the same entity', () => {
    // The whole point: F-0001 in A and F-0001 in B share nothing but a
    // string. With no supersedes link, A's finding must read as dropped and
    // B's as new, even though the ids match exactly.
    const report = diffReviews(runA(), runB());
    const findings = report.collections.find((c) => c.collection === 'findings');
    expect(findings?.carried).toEqual([]);
    expect(findings?.dropped_from_a.map((f) => f.id)).toEqual(['F-0001']);
    expect(findings?.new_in_b.map((f) => f.id)).toEqual(['F-0001']);
  });

  it('carries an item forward only via an explicit supersedes link', () => {
    const report = diffReviews(
      runA(),
      runB({ findings: [makeFinding({ id: 'F-0009', supersedes: 'F-0001' })] }),
    );
    const findings = report.collections.find((c) => c.collection === 'findings');
    expect(findings?.carried).toEqual([
      { from: 'F-0001', to: 'F-0009', label: expect.any(String) },
    ]);
    expect(findings?.dropped_from_a).toEqual([]);
    expect(findings?.new_in_b).toEqual([]);
  });

  it('flags a supersedes link that points at nothing in run A', () => {
    const report = diffReviews(
      runA(),
      runB({ findings: [makeFinding({ id: 'F-0009', supersedes: 'F-9999' })] }),
    );
    const findings = report.collections.find((c) => c.collection === 'findings');
    expect(findings?.broken_links).toEqual([{ b_id: 'F-0009', claims_to_supersede: 'F-9999' }]);
    // A broken link is not a valid carry: the item still counts as new.
    expect(findings?.new_in_b.map((f) => f.id)).toEqual(['F-0009']);
  });

  it('does not diff evidentiary collections at all', () => {
    const report = diffReviews(runA(), runB());
    const keys = report.collections.map((c) => c.collection);
    for (const evidentiary of ['sources', 'observations', 'evidence', 'research_questions']) {
      expect(keys).not.toContain(evidentiary);
    }
  });

  it('notices run B does not actually follow run A', () => {
    const unrelatedB = makeValidReview({ run: newRun('acme', 'r-777', T) });
    expect(diffReviews(runA(), unrelatedB).unrelated_runs).toBe(true);
    expect(diffReviews(runA(), runB()).unrelated_runs).toBe(false);
  });

  describe('feedback_still_open', () => {
    it('reports a correction from A with no visible action taken in B', () => {
      const a = runA();
      a.feedback = [makeFeedback({ target_id: 'COMP-0001' })];
      const report = diffReviews(a, runB());
      expect(report.feedback_still_open.map((f) => f.id)).toEqual(['FB-0001']);
    });

    it('does not report a correction whose target was carried forward with a successor', () => {
      const a = runA();
      a.comparisons = [makeComparison()];
      a.feedback = [makeFeedback({ target_id: 'COMP-0001' })];
      const b = runB({
        comparisons: [makeComparison({ id: 'COMP-0009', supersedes: 'COMP-0001' })],
      });
      const report = diffReviews(a, b);
      expect(report.feedback_still_open).toEqual([]);
    });

    it('ignores accepted feedback, which needed no action to begin with', () => {
      const a = runA();
      a.feedback = [makeFeedback({ type: 'accept', target_id: 'F-0001' })];
      const report = diffReviews(a, runB());
      expect(report.feedback_still_open).toEqual([]);
    });
  });

  describe('feedback_acknowledged', () => {
    it('moves an item from feedback_still_open into feedback_acknowledged when B explicitly acknowledges it', () => {
      const a = runA();
      a.feedback = [
        makeFeedback({
          id: 'FB-0001',
          target_id: 'COMP-0001',
          type: 'reject',
          reason: 'Not actually a competitor for this decision.',
        }),
      ];
      const b = runB({
        feedback: [
          // Carried forward verbatim by carryForwardFeedback: same id, same content.
          makeFeedback({
            id: 'FB-0001',
            target_id: 'COMP-0001',
            type: 'reject',
            reason: 'Not actually a competitor for this decision.',
          }),
          makeFeedback({
            id: 'FB-0002',
            target_id: 'FB-0001',
            type: 'acknowledge',
            reason:
              'Still not a competitor; nothing changed since last run, so nothing was re-proposed.',
          }),
        ],
      });
      const report = diffReviews(a, b);
      expect(report.feedback_still_open).toEqual([]);
      expect(report.feedback_acknowledged).toEqual([
        {
          id: 'FB-0001',
          target_id: 'COMP-0001',
          type: 'reject',
          reason: 'Not actually a competitor for this decision.',
          acknowledgment: {
            id: 'FB-0002',
            reason:
              'Still not a competitor; nothing changed since last run, so nothing was re-proposed.',
            at: expect.any(String),
          },
        },
      ]);
    });

    it('leaves an item open when an acknowledge entry targets something else', () => {
      const a = runA();
      a.feedback = [makeFeedback({ id: 'FB-0001', target_id: 'COMP-0001' })];
      const b = runB({
        feedback: [
          makeFeedback({
            id: 'FB-0002',
            target_id: 'FB-9999',
            type: 'acknowledge',
            reason: 'Unrelated to FB-0001.',
          }),
        ],
      });
      const report = diffReviews(a, b);
      expect(report.feedback_still_open.map((f) => f.id)).toEqual(['FB-0001']);
      expect(report.feedback_acknowledged).toEqual([]);
    });

    it('scopes feedback_possible_matches to the unacknowledged remainder', () => {
      const a = runA();
      a.feedback = [
        makeFeedback({
          id: 'FB-0001',
          type: 'reject',
          target_id: 'F-0001',
          reason: 'Not actually a competitor for this decision.',
        }),
      ];
      const report = diffReviews(
        a,
        runB({
          // Close wording to A's default finding F-0001, which without an
          // acknowledgment would trip feedback_possible_matches (see that
          // describe block below).
          findings: [makeFinding({ id: 'F-0009', title: 'Proposition still leads on outcomes' })],
          feedback: [
            makeFeedback({
              id: 'FB-0002',
              target_id: 'FB-0001',
              type: 'acknowledge',
              reason:
                'The reworded finding is coincidental wording, not the same claim; leaving as is.',
            }),
          ],
        }),
      );
      expect(report.feedback_acknowledged.map((f) => f.id)).toEqual(['FB-0001']);
      expect(report.feedback_possible_matches).toEqual([]);
    });
  });

  describe('evidence_base', () => {
    it('counts the excluded evidentiary collections without diffing them item by item', () => {
      const report = diffReviews(
        runA(),
        runB({ sources: [makeSource(), makeSource({ id: 'S-0002' })] }),
      );
      const sources = report.evidence_base.find((e) => e.collection === 'sources');
      expect(sources).toEqual({ collection: 'sources', a_count: 1, b_count: 2 });
      // observations and evidence were not overridden, so the count held steady.
      const observations = report.evidence_base.find((e) => e.collection === 'observations');
      expect(observations).toEqual({ collection: 'observations', a_count: 1, b_count: 1 });
    });
  });

  describe('feedback_possible_matches', () => {
    it('flags a closely worded unlinked candidate as a caution, not a match', () => {
      const a = runA();
      a.feedback = [makeFeedback({ type: 'reject', target_id: 'F-0001' })];
      // Close wording to A's default finding F-0001, "Proposition leads on
      // outcomes", but carries no supersedes: still reads as fully new.
      const report = diffReviews(
        a,
        runB({
          findings: [makeFinding({ id: 'F-0009', title: 'Proposition still leads on outcomes' })],
        }),
      );
      expect(report.feedback_still_open.map((f) => f.id)).toEqual(['FB-0001']);
      expect(report.feedback_possible_matches).toEqual([
        {
          feedback_id: 'FB-0001',
          target_id: 'F-0001',
          candidate_id: 'F-0009',
          candidate_label: 'Proposition still leads on outcomes',
          similarity: expect.any(Number),
        },
      ]);
    });

    it('does not flag an unrelated candidate', () => {
      const a = runA();
      a.feedback = [makeFeedback({ type: 'reject', target_id: 'F-0001' })];
      const report = diffReviews(
        a,
        runB({
          findings: [
            makeFinding({ id: 'F-0009', title: 'Checkout requires a card before trial access' }),
          ],
        }),
      );
      expect(report.feedback_possible_matches).toEqual([]);
    });
  });

  describe('emerging_threats', () => {
    it('flags a territory whose saturation rose with no matching improvement in position', () => {
      const a = runA();
      a.comparisons = [makeComparison({ relevance: 'low' })];
      a.opportunities = [
        makeOpportunity({
          white_space: { territory: 'Technical leadership', current_position: 'low' },
        }),
      ];
      const b = runB({
        comparisons: [
          makeComparison({ id: 'COMP-0009', supersedes: 'COMP-0001', relevance: 'high' }),
        ],
        opportunities: [
          makeOpportunity({
            white_space: { territory: 'Technical leadership', current_position: 'low' },
          }),
        ],
      });
      const report = diffReviews(a, b);
      expect(report.emerging_threats).toEqual([
        {
          territory: 'Technical leadership',
          a_saturation: 'medium',
          b_saturation: 'high',
          a_current_position: 'low',
          b_current_position: 'low',
        },
      ]);
    });

    it('does not flag a territory whose position improved to match the rising saturation', () => {
      const a = runA();
      a.comparisons = [makeComparison({ relevance: 'low' })];
      a.opportunities = [
        makeOpportunity({
          white_space: { territory: 'Technical leadership', current_position: 'low' },
        }),
      ];
      const b = runB({
        comparisons: [
          makeComparison({ id: 'COMP-0009', supersedes: 'COMP-0001', relevance: 'high' }),
        ],
        opportunities: [
          makeOpportunity({
            white_space: { territory: 'Technical leadership', current_position: 'high' },
          }),
        ],
      });
      expect(diffReviews(a, b).emerging_threats).toEqual([]);
    });

    it('does not flag a territory whose saturation did not rise', () => {
      const a = runA();
      a.comparisons = [makeComparison()];
      const b = runB({
        comparisons: [makeComparison({ id: 'COMP-0009', supersedes: 'COMP-0001' })],
      });
      expect(diffReviews(a, b).emerging_threats).toEqual([]);
    });

    it('does not flag a territory that only exists in run B', () => {
      const a = runA();
      a.comparisons = [];
      a.opportunities = [];
      const b = runB({
        comparisons: [makeComparison({ relevance: 'high' })],
      });
      expect(diffReviews(a, b).emerging_threats).toEqual([]);
    });
  });

  describe('benchmark_strengths', () => {
    it('flags a carried benchmark comparison whose relevance rose', () => {
      const a = runA();
      a.comparisons = [makeComparison({ type: 'benchmark', relevance: 'medium' })];
      const b = runB({
        comparisons: [
          makeComparison({
            id: 'COMP-0009',
            supersedes: 'COMP-0001',
            type: 'benchmark',
            relevance: 'high',
          }),
        ],
      });
      const report = diffReviews(a, b);
      expect(report.benchmark_strengths).toEqual([
        {
          comparison_id: 'COMP-0009',
          name: expect.any(String),
          improved_dimensions: ['relevance'],
          a: {
            relevance: 'medium',
            audience_overlap: 'high',
            objective_overlap: 'high',
            decision_overlap: 'medium',
          },
          b: {
            relevance: 'high',
            audience_overlap: 'high',
            objective_overlap: 'high',
            decision_overlap: 'medium',
          },
        },
      ]);
    });

    it('flags an overlap rating rising even when relevance is unchanged', () => {
      const a = runA();
      a.comparisons = [makeComparison({ type: 'benchmark', decision_overlap: 'low' })];
      const b = runB({
        comparisons: [
          makeComparison({
            id: 'COMP-0009',
            supersedes: 'COMP-0001',
            type: 'benchmark',
            decision_overlap: 'high',
          }),
        ],
      });
      expect(diffReviews(a, b).benchmark_strengths.map((s) => s.improved_dimensions)).toEqual([
        ['decision_overlap'],
      ]);
    });

    it('does not flag a carried comparison that is not a benchmark', () => {
      const a = runA();
      a.comparisons = [makeComparison({ type: 'direct_competitor', relevance: 'low' })];
      const b = runB({
        comparisons: [
          makeComparison({
            id: 'COMP-0009',
            supersedes: 'COMP-0001',
            type: 'direct_competitor',
            relevance: 'high',
          }),
        ],
      });
      expect(diffReviews(a, b).benchmark_strengths).toEqual([]);
    });

    it('does not flag a carried benchmark whose ratings did not improve', () => {
      const a = runA();
      a.comparisons = [makeComparison({ type: 'benchmark' })];
      const b = runB({
        comparisons: [
          makeComparison({ id: 'COMP-0009', supersedes: 'COMP-0001', type: 'benchmark' }),
        ],
      });
      expect(diffReviews(a, b).benchmark_strengths).toEqual([]);
    });

    it('does not flag a benchmark that was not carried forward', () => {
      const a = runA();
      a.comparisons = [makeComparison({ type: 'benchmark', relevance: 'low' })];
      const b = runB({
        comparisons: [makeComparison({ id: 'COMP-0009', type: 'benchmark', relevance: 'high' })],
      });
      expect(diffReviews(a, b).benchmark_strengths).toEqual([]);
    });
  });

  describe('emerging_threats and benchmark_strengths under unrelated_runs', () => {
    it('withholds both entirely rather than compute a false trend', () => {
      const a = runA();
      a.comparisons = [makeComparison({ type: 'benchmark', relevance: 'low' })];
      a.opportunities = [
        makeOpportunity({
          white_space: { territory: 'Technical leadership', current_position: 'low' },
        }),
      ];
      const unrelatedB = makeValidReview({
        run: newRun('acme', 'r-777', T),
        comparisons: [
          makeComparison({
            id: 'COMP-0009',
            supersedes: 'COMP-0001',
            type: 'benchmark',
            relevance: 'high',
          }),
        ],
        opportunities: [
          makeOpportunity({
            white_space: { territory: 'Technical leadership', current_position: 'low' },
          }),
        ],
      });
      const report = diffReviews(a, unrelatedB);
      expect(report.unrelated_runs).toBe(true);
      expect(report.emerging_threats).toEqual([]);
      expect(report.benchmark_strengths).toEqual([]);
    });
  });
});

describe('renderDiffAscii', () => {
  it('renders no arrow or em-dash characters', () => {
    // \u2192 arrow, \u2014 em-dash: written as escapes so this assertion
    // itself does not trip the repo-wide em-dash grep in preflight.
    const report = diffReviews(
      runA(),
      runB({
        findings: [makeFinding({ id: 'F-0009', supersedes: 'F-0001' })],
        recommendations: [makeRecommendation({ id: 'R-0009', finding_ids: ['F-0009'] })],
      }),
    );
    const ascii = renderDiffAscii(report);
    expect(ascii).not.toMatch(/[\u2192\u2014]/);
  });

  it('prints acknowledged feedback in its own section, distinct from still-open feedback', () => {
    const a = runA();
    a.feedback = [
      makeFeedback({
        id: 'FB-0001',
        target_id: 'COMP-0001',
        type: 'reject',
        reason: 'Not actually a competitor for this decision.',
      }),
    ];
    const b = runB({
      feedback: [
        makeFeedback({
          id: 'FB-0001',
          target_id: 'COMP-0001',
          type: 'reject',
          reason: 'Not actually a competitor for this decision.',
        }),
        makeFeedback({
          id: 'FB-0002',
          target_id: 'FB-0001',
          type: 'acknowledge',
          reason: 'Still not a competitor; nothing changed since last run.',
        }),
      ],
    });
    const ascii = renderDiffAscii(diffReviews(a, b));
    expect(ascii).toContain(
      'Feedback from run A explicitly acknowledged as deliberately unaddressed in run B:',
    );
    expect(ascii).toContain(
      'acknowledged by FB-0002: Still not a competitor; nothing changed since last run.',
    );
    expect(ascii).not.toContain('Feedback from run A not visibly acted on in run B:');
    expect(ascii).not.toMatch(/[\u2192\u2014]/);
  });

  it('says plainly when nothing changed', () => {
    const same = runB({
      findings: [makeFinding({ id: 'F-0009', supersedes: 'F-0001' })],
      recommendations: [
        makeRecommendation({ id: 'R-0009', supersedes: 'R-0001', finding_ids: ['F-0009'] }),
      ],
      opportunities: [],
    });
    same.comparisons = [];
    const a = runA();
    a.opportunities = [];
    a.comparisons = [];
    a.assumptions = [];
    same.assumptions = [];
    const ascii = renderDiffAscii(diffReviews(a, same));
    expect(ascii).toContain('acme/r-001');
  });
});
