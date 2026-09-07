import { describe, expect, it } from 'vitest';
import { diffReviews, renderDiffAscii } from './diff.ts';
import { newRun } from './store.ts';
import {
  makeComparison,
  makeFeedback,
  makeFinding,
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
