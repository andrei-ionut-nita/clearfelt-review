import type { Review } from './model/index.ts';
import { similarity } from './quality/text.ts';

/**
 * What changed between two runs of the same subject: specification section
 * 55's iteration loop made concrete.
 *
 * The one fact this module cannot assume, and the one every naive diff of two
 * JSON directories would get wrong: an id is not stable across runs. `F-0001`
 * in one run and `F-0001` in another are allocated independently by ids.ts and
 * carry no relationship to each other. Identity across runs exists only where
 * the newer run explicitly claims it, via `Versioned.supersedes`. Everything
 * here reads that field and nothing else to decide what carried forward.
 * See docs/decisions/0011-cross-run-identity-is-supersedes-only.md.
 */

/**
 * Scoped to the analytical layer on purpose. Sources, observations, evidence
 * and research questions are re-collected on every run and diffing them item
 * by item would report "100% new, 100% dropped" on almost every rerun,
 * teaching a reader to ignore the tool. Comparisons, findings, opportunities,
 * assumptions and recommendations are where continuity is the point: a reader
 * genuinely wants to know whether last time's recommendation carried forward,
 * was superseded, or quietly disappeared.
 */
const DIFFABLE_COLLECTIONS = [
  'comparisons',
  'findings',
  'opportunities',
  'assumptions',
  'recommendations',
] as const;

type DiffableCollection = (typeof DIFFABLE_COLLECTIONS)[number];

/**
 * The collections diffCollection deliberately does not diff, per the module
 * comment above. A full item-by-item diff of these would be near-100% churn
 * on every rerun; a one-line count per collection answers "did the evidence
 * base move at all" without that noise. Added in Phase 6.
 */
const EVIDENTIARY_COLLECTIONS = [
  'sources',
  'observations',
  'evidence',
  'research_questions',
] as const;

type EvidentiaryCollection = (typeof EVIDENTIARY_COLLECTIONS)[number];

interface Versioned {
  id: string;
  supersedes?: string;
}

function labelFor(item: Record<string, unknown>): string {
  for (const field of ['title', 'name', 'statement', 'question', 'claim']) {
    const value = item[field];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return item.id as string;
}

export interface DiffItem {
  id: string;
  label: string;
}

export interface CarriedItem {
  /** The newer run's id. */
  to: string;
  /** The older run's id it claims to supersede. */
  from: string;
  label: string;
}

export interface CollectionDiff {
  collection: DiffableCollection;
  /** In B, claiming to supersede something in A. */
  carried: CarriedItem[];
  /** In B, with no supersedes link back into A. */
  new_in_b: DiffItem[];
  /** In A, that nothing in B claims to supersede. The section worth reading first. */
  dropped_from_a: DiffItem[];
  /** B's supersedes pointing at an id that does not exist in A: almost certainly a mistake. */
  broken_links: { b_id: string; claims_to_supersede: string }[];
}

export interface EvidenceBaseCount {
  collection: EvidentiaryCollection;
  a_count: number;
  b_count: number;
}

export interface FeedbackPossibleMatch {
  feedback_id: string;
  target_id: string;
  candidate_id: string;
  candidate_label: string;
  similarity: number;
}

export interface DiffReport {
  a: { run_id: string; slug: string };
  b: { run_id: string; slug: string };
  /** True when b.run.previous_run_id does not point at a, which does not stop the diff but is worth saying. */
  unrelated_runs: boolean;
  collections: CollectionDiff[];
  /** Item counts for the excluded evidentiary collections, per collection, added in Phase 6. */
  evidence_base: EvidenceBaseCount[];
  /** Feedback ids from A whose correction is not visible as a supersedes link, a broken link, or a dropped item explained some other way. */
  feedback_still_open: { id: string; target_id: string; type: string; reason?: string }[];
  /**
   * A caution, not a claim: a still-open feedback item's target has a label
   * closely matching some unlinked new item in B. ADR 0011 rules out same-id
   * matching as identity, and this does not reopen that: it never marks
   * anything carried or resolves feedback_still_open, it only surfaces a
   * candidate worth a human glance. Added in Phase 6 to narrow, not close,
   * the blind spot the ADR names: a re-proposed-and-rejected candidate under
   * a fresh id looks identical to a genuinely new one without this.
   */
  feedback_possible_matches: FeedbackPossibleMatch[];
}

function diffCollection(collection: DiffableCollection, a: Review, b: Review): CollectionDiff {
  const aItems = a[collection] as unknown as Versioned[];
  const bItems = b[collection] as unknown as Versioned[];
  const aById = new Map(
    aItems.map((item) => [item.id, item as unknown as Record<string, unknown>]),
  );

  const carriedFromIds = new Set<string>();
  const carried: CarriedItem[] = [];
  const newInB: DiffItem[] = [];
  const brokenLinks: { b_id: string; claims_to_supersede: string }[] = [];

  for (const item of bItems) {
    const record = item as unknown as Record<string, unknown>;
    if (item.supersedes) {
      if (aById.has(item.supersedes)) {
        carriedFromIds.add(item.supersedes);
        carried.push({ to: item.id, from: item.supersedes, label: labelFor(record) });
      } else {
        brokenLinks.push({ b_id: item.id, claims_to_supersede: item.supersedes });
        newInB.push({ id: item.id, label: labelFor(record) });
      }
    } else {
      newInB.push({ id: item.id, label: labelFor(record) });
    }
  }

  const droppedFromA: DiffItem[] = aItems
    .filter((item) => !carriedFromIds.has(item.id))
    .map((item) => ({ id: item.id, label: labelFor(item as unknown as Record<string, unknown>) }));

  return {
    collection,
    carried,
    new_in_b: newInB,
    dropped_from_a: droppedFromA,
    broken_links: brokenLinks,
  };
}

/** Where a feedback target's label lives, searched across every diffable collection in A. */
function findLabelInA(a: Review, targetId: string): string | undefined {
  for (const c of DIFFABLE_COLLECTIONS) {
    const items = a[c] as unknown as Record<string, unknown>[];
    const match = items.find((item) => item.id === targetId);
    if (match) return labelFor(match);
  }
  return undefined;
}

/** A caution threshold, not an identity threshold: identity is supersedes-only, per ADR 0011. */
const POSSIBLE_MATCH_THRESHOLD = 0.4;

function findFeedbackPossibleMatches(
  a: Review,
  collections: CollectionDiff[],
  feedbackStillOpen: { id: string; target_id: string; type: string }[],
): FeedbackPossibleMatch[] {
  const unlinkedCandidates = collections.flatMap((c) => c.new_in_b);
  const matches: FeedbackPossibleMatch[] = [];
  for (const fb of feedbackStillOpen) {
    const targetLabel = findLabelInA(a, fb.target_id);
    if (!targetLabel) continue;
    for (const candidate of unlinkedCandidates) {
      const score = similarity(targetLabel, candidate.label);
      if (score >= POSSIBLE_MATCH_THRESHOLD) {
        matches.push({
          feedback_id: fb.id,
          target_id: fb.target_id,
          candidate_id: candidate.id,
          candidate_label: candidate.label,
          similarity: score,
        });
      }
    }
  }
  return matches;
}

export function diffReviews(a: Review, b: Review): DiffReport {
  const collections = DIFFABLE_COLLECTIONS.map((c) => diffCollection(c, a, b));

  // A correction is "closed" once something in B either supersedes its
  // target, or the target itself is gone from A's dropped list for a reason
  // this diff can already see. What is left after that is genuinely open: a
  // correction the newer run has not yet acted on.
  const carriedTargets = new Set(collections.flatMap((c) => c.carried.map((item) => item.from)));
  const feedbackStillOpen = a.feedback
    .filter((fb) => fb.type !== 'accept' && !carriedTargets.has(fb.target_id))
    .map((fb) => ({ id: fb.id, target_id: fb.target_id, type: fb.type, reason: fb.reason }));

  const evidenceBase = EVIDENTIARY_COLLECTIONS.map((collection) => ({
    collection,
    a_count: (a[collection] as unknown[]).length,
    b_count: (b[collection] as unknown[]).length,
  }));

  return {
    a: { run_id: a.run.id, slug: a.run.slug },
    b: { run_id: b.run.id, slug: b.run.slug },
    unrelated_runs: b.run.previous_run_id !== a.run.id,
    collections,
    evidence_base: evidenceBase,
    feedback_still_open: feedbackStillOpen,
    feedback_possible_matches: findFeedbackPossibleMatches(a, collections, feedbackStillOpen),
  };
}

export function renderDiffAscii(report: DiffReport): string {
  const out: string[] = [];
  out.push(`${report.a.slug}/${report.a.run_id}  ->  ${report.b.slug}/${report.b.run_id}`);
  if (report.unrelated_runs) {
    out.push(
      "Note: run B's previous_run_id does not point at run A. Comparing them anyway, but this may not be the pair you meant.",
    );
  }
  out.push('');

  let anySection = false;
  for (const c of report.collections) {
    if (c.carried.length === 0 && c.new_in_b.length === 0 && c.dropped_from_a.length === 0)
      continue;
    anySection = true;
    out.push(`${c.collection}`);
    for (const item of c.carried) {
      out.push(`  carried    ${item.from} -> ${item.to}  ${item.label}`);
    }
    for (const item of c.dropped_from_a) {
      out.push(`  dropped    ${item.id}  ${item.label}`);
    }
    for (const item of c.new_in_b) {
      out.push(`  new        ${item.id}  ${item.label}`);
    }
    for (const link of c.broken_links) {
      out.push(
        `  BROKEN     ${link.b_id} claims to supersede ${link.claims_to_supersede}, which is not in run A`,
      );
    }
    out.push('');
  }
  if (!anySection) out.push('No differences in the diffable collections.');

  out.push(
    'Evidence base (not diffed item by item; see docs/decisions/0011-cross-run-identity-is-supersedes-only.md):',
  );
  for (const e of report.evidence_base) {
    out.push(`  ${e.collection}  ${e.a_count} -> ${e.b_count}`);
  }
  out.push('');

  if (report.feedback_still_open.length > 0) {
    out.push('Feedback from run A not visibly acted on in run B:');
    for (const fb of report.feedback_still_open) {
      out.push(`  ${fb.id}  ${fb.type} on ${fb.target_id}${fb.reason ? `: ${fb.reason}` : ''}`);
    }
    out.push('');
  }

  if (report.feedback_possible_matches.length > 0) {
    out.push(
      'Possibly related, unlinked (a caution, not a match: link with supersedes to confirm or dismiss by leaving it unlinked):',
    );
    for (const m of report.feedback_possible_matches) {
      out.push(
        `  ${m.feedback_id} on ${m.target_id}  ~  ${m.candidate_id}  ${m.candidate_label}  (similarity ${m.similarity.toFixed(2)})`,
      );
    }
    out.push('');
  }

  return out.join('\n').trimEnd();
}
