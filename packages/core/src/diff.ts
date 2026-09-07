import type { Review } from './model/index.ts';

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

export interface DiffReport {
  a: { run_id: string; slug: string };
  b: { run_id: string; slug: string };
  /** True when b.run.previous_run_id does not point at a, which does not stop the diff but is worth saying. */
  unrelated_runs: boolean;
  collections: CollectionDiff[];
  /** Feedback ids from A whose correction is not visible as a supersedes link, a broken link, or a dropped item explained some other way. */
  feedback_still_open: { id: string; target_id: string; type: string; reason?: string }[];
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

  return {
    a: { run_id: a.run.id, slug: a.run.slug },
    b: { run_id: b.run.id, slug: b.run.slug },
    unrelated_runs: b.run.previous_run_id !== a.run.id,
    collections,
    feedback_still_open: feedbackStillOpen,
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

  if (report.feedback_still_open.length > 0) {
    out.push('Feedback from run A not visibly acted on in run B:');
    for (const fb of report.feedback_still_open) {
      out.push(`  ${fb.id}  ${fb.type} on ${fb.target_id}${fb.reason ? `: ${fb.reason}` : ''}`);
    }
    out.push('');
  }

  return out.join('\n').trimEnd();
}
