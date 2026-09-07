import type { Review } from './model/index.ts';

/**
 * Traceability walks: spec section 79.
 *
 * The ultimate test of the whole pipeline is whether a user can point at a
 * recommendation, ask "why?", and be walked back to a real source. If that walk
 * cannot be performed, the intelligence pipeline is incomplete however good the
 * report looks, so it is a first-class command rather than a report section.
 *
 * Both directions matter. Forward answers "why are you telling me this?".
 * Reverse answers "what did this source actually change?", which is how a
 * reader checks that an expensive piece of research earned its place.
 */

export interface TraceNode {
  id: string;
  collection: string;
  /** Short human-readable summary, so the walk is readable without lookups. */
  label: string;
  children: TraceNode[];
}

type Edge = (id: string, review: Review) => { id: string; collection: string }[];

function unique(items: { id: string; collection: string }[]): { id: string; collection: string }[] {
  const seen = new Set<string>();
  const out: { id: string; collection: string }[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Toward the evidence. "Why does this exist?" */
const FORWARD: Record<string, Edge> = {
  actions: (id, review) => {
    const action = review.actions.find((a) => a.id === id);
    return action ? [{ id: action.recommendation_id, collection: 'recommendations' }] : [];
  },
  recommendations: (id, review) => {
    const rec = review.recommendations.find((r) => r.id === id);
    if (!rec) return [];
    return unique([
      ...(rec.finding_ids ?? []).map((f) => ({ id: f, collection: 'findings' })),
      ...(rec.opportunity_ids ?? []).map((o) => ({ id: o, collection: 'opportunities' })),
      ...(rec.assumption_ids ?? []).map((a) => ({ id: a, collection: 'assumptions' })),
    ]);
  },
  opportunities: (id, review) => {
    const opportunity = review.opportunities.find((o) => o.id === id);
    return (opportunity?.supporting_finding_ids ?? []).map((f) => ({
      id: f,
      collection: 'findings',
    }));
  },
  findings: (id, review) => {
    const finding = review.findings.find((f) => f.id === id);
    if (!finding) return [];
    return unique([
      ...(finding.evidence_ids ?? []).map((e) => ({ id: e, collection: 'evidence' })),
      ...(finding.assumption_ids ?? []).map((a) => ({ id: a, collection: 'assumptions' })),
      // Contradicting evidence is part of the answer to "why?", not a footnote.
      ...(finding.contradicted_by ?? []).map((e) => ({ id: e, collection: 'evidence' })),
    ]);
  },
  evidence: (id, review) => {
    const evidence = review.evidence.find((e) => e.id === id);
    return (evidence?.observation_ids ?? []).map((o) => ({ id: o, collection: 'observations' }));
  },
  observations: (id, review) => {
    const observation = review.observations.find((o) => o.id === id);
    return observation ? [{ id: observation.source_id, collection: 'sources' }] : [];
  },
  assumptions: () => [],
  sources: () => [],
};

/** Toward the action. "What did this lead to?" */
const REVERSE: Record<string, Edge> = {
  sources: (id, review) =>
    review.observations
      .filter((o) => o.source_id === id)
      .map((o) => ({ id: o.id, collection: 'observations' })),
  observations: (id, review) =>
    review.evidence
      .filter((e) => (e.observation_ids ?? []).includes(id))
      .map((e) => ({ id: e.id, collection: 'evidence' })),
  evidence: (id, review) =>
    review.findings
      .filter((f) => (f.evidence_ids ?? []).includes(id) || (f.contradicted_by ?? []).includes(id))
      .map((f) => ({ id: f.id, collection: 'findings' })),
  findings: (id, review) =>
    unique([
      ...review.opportunities
        .filter((o) => (o.supporting_finding_ids ?? []).includes(id))
        .map((o) => ({ id: o.id, collection: 'opportunities' })),
      ...review.recommendations
        .filter((r) => (r.finding_ids ?? []).includes(id))
        .map((r) => ({ id: r.id, collection: 'recommendations' })),
    ]),
  opportunities: (id, review) =>
    review.recommendations
      .filter((r) => (r.opportunity_ids ?? []).includes(id))
      .map((r) => ({ id: r.id, collection: 'recommendations' })),
  recommendations: (id, review) =>
    review.actions
      .filter((a) => a.recommendation_id === id)
      .map((a) => ({ id: a.id, collection: 'actions' })),
  actions: () => [],
};

/** One line describing an entity, so a walk reads without further lookups. */
export function labelFor(id: string, collection: string, review: Review): string {
  const find = <T extends { id: string }>(items: T[]): T | undefined =>
    items.find((i) => i.id === id);
  switch (collection) {
    case 'actions':
      return find(review.actions)?.description ?? id;
    case 'recommendations':
      return find(review.recommendations)?.title ?? id;
    case 'opportunities':
      return find(review.opportunities)?.title ?? id;
    case 'findings': {
      const finding = find(review.findings);
      return finding ? `[${finding.claim_type}] ${finding.statement}` : id;
    }
    case 'evidence':
      return find(review.evidence)?.claim ?? id;
    case 'observations': {
      const observation = find(review.observations);
      if (!observation) return id;
      const prefix = observation.observation_type === 'absence' ? '[absence] ' : '';
      return `${prefix}${observation.statement}`;
    }
    case 'sources': {
      const source = find(review.sources);
      if (!source) return id;
      return source.title ?? source.url ?? source.source_type;
    }
    case 'assumptions': {
      const assumption = find(review.assumptions);
      return assumption ? `[${assumption.status}] ${assumption.statement}` : id;
    }
    default:
      return id;
  }
}

export function collectionOf(id: string, review: Review): string | null {
  const table: [string, { id: string }[]][] = [
    ['actions', review.actions],
    ['recommendations', review.recommendations],
    ['opportunities', review.opportunities],
    ['findings', review.findings],
    ['evidence', review.evidence],
    ['observations', review.observations],
    ['sources', review.sources],
    ['assumptions', review.assumptions],
    ['comparisons', review.comparisons],
    ['user_assertions', review.user_assertions],
  ];
  for (const [collection, items] of table) {
    if (items.some((i) => i.id === id)) return collection;
  }
  return null;
}

function walk(
  id: string,
  collection: string,
  review: Review,
  edges: Record<string, Edge>,
  seen: Set<string>,
): TraceNode {
  const node: TraceNode = { id, collection, label: labelFor(id, collection, review), children: [] };
  // A cycle would otherwise recurse forever. Cycles should not occur in a valid
  // run, but trace has to survive an invalid one: it is the tool a person
  // reaches for when something already looks wrong.
  if (seen.has(id)) return node;
  seen.add(id);
  const next = edges[collection]?.(id, review) ?? [];
  node.children = next.map((child) =>
    walk(child.id, child.collection, review, edges, new Set(seen)),
  );
  return node;
}

export class TraceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TraceError';
  }
}

export function trace(
  review: Review,
  id: string,
  direction: 'forward' | 'reverse' = 'forward',
): TraceNode {
  const collection = collectionOf(id, review);
  if (!collection) throw new TraceError(`${id} does not exist in this run`);
  const edges = direction === 'forward' ? FORWARD : REVERSE;
  return walk(id, collection, review, edges, new Set());
}

export function renderTraceAscii(node: TraceNode): string {
  const lines: string[] = [];
  const walkNode = (current: TraceNode, prefix: string, isLast: boolean, isRoot: boolean): void => {
    const connector = isRoot ? '' : isLast ? '└── ' : '├── ';
    lines.push(`${prefix}${connector}${current.id}  ${current.label}`);
    const childPrefix = isRoot ? '' : `${prefix}${isLast ? '    ' : '│   '}`;
    current.children.forEach((child, index) => {
      walkNode(child, childPrefix, index === current.children.length - 1, false);
    });
  };
  walkNode(node, '', true, true);
  return lines.join('\n');
}

/** Every id the walk reached, for the renderer completeness test. */
export function idsIn(node: TraceNode): string[] {
  return [node.id, ...node.children.flatMap(idsIn)];
}
