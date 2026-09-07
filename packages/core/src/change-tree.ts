import type {
  Action,
  AffectedAsset,
  Asset,
  ChangeTree,
  ChangeTreeNode,
  Review,
} from './model/index.ts';

/**
 * Change tree derivation: spec section 62.
 *
 * The tree is built from actions and the assets they affect, never authored.
 * Generated as prose it becomes a second hallucination layer, where the tree
 * says one thing and the recommendations say another and nobody notices until
 * someone tries to do the work.
 *
 * It must also work for subjects that are not websites. A tree that only
 * renders pages is a website auditor with extra steps, which spec section 81
 * names as the thing this product must not become.
 */

/**
 * Readability overrides for root labels. Everything else falls back to the
 * asset type in caps, which is why POSITIONING, PRODUCT and SERVICE subjects
 * render correctly without an entry here. This keys off asset type, never
 * entity type, so it does not reintroduce the branching spec section 60 bans.
 */
const ROOT_LABELS: Record<string, string> = {
  website_page: 'WEBSITE',
  website_section: 'WEBSITE',
};

function rootLabel(type: string): string {
  return ROOT_LABELS[type] ?? type.replace(/_/g, ' ').toUpperCase();
}

/**
 * Path to segments. A website root path of '/' becomes 'index' so the node has
 * something to render, matching the spec section 28 example.
 */
function segmentsOf(path: string): string[] {
  const parts = path.split('/').filter((p) => p !== '');
  return parts.length > 0 ? parts : ['index'];
}

interface Trace {
  action_ids: Set<string>;
  recommendation_ids: Set<string>;
  finding_ids: Set<string>;
  evidence_ids: Set<string>;
}

interface MutableNode {
  label: string;
  path: string;
  operation?: ChangeTreeNode['operation'];
  asset_id?: string;
  trace: Trace;
  children: Map<string, MutableNode>;
}

function newNode(label: string, path: string): MutableNode {
  return {
    label,
    path,
    trace: {
      action_ids: new Set(),
      recommendation_ids: new Set(),
      finding_ids: new Set(),
      evidence_ids: new Set(),
    },
    children: new Map(),
  };
}

function mergeTrace(target: Trace, source: Trace): void {
  for (const id of source.action_ids) target.action_ids.add(id);
  for (const id of source.recommendation_ids) target.recommendation_ids.add(id);
  for (const id of source.finding_ids) target.finding_ids.add(id);
  for (const id of source.evidence_ids) target.evidence_ids.add(id);
}

/**
 * Resolves one affected asset to its type and path.
 *
 * Returns null when an edit names an asset that does not exist. validate
 * already rejects that, so reaching here means the caller skipped validation;
 * dropping the node is safer than inventing a plausible looking one.
 */
function locate(
  affected: AffectedAsset,
  assetsById: Map<string, Asset>,
): { type: string; path: string; asset_id?: string } | null {
  if (affected.asset_id) {
    const asset = assetsById.get(affected.asset_id);
    if (!asset) return null;
    return { type: asset.type, path: asset.path, asset_id: asset.id };
  }
  if (affected.proposed) {
    return { type: affected.proposed.type, path: affected.proposed.path };
  }
  return null;
}

/** Walks the traceability chain backwards from one action, per spec section 29. */
function traceFor(action: Action, review: Review): Trace {
  const trace: Trace = {
    action_ids: new Set([action.id]),
    recommendation_ids: new Set(),
    finding_ids: new Set(),
    evidence_ids: new Set(),
  };
  const rec = review.recommendations.find((r) => r.id === action.recommendation_id);
  if (!rec) return trace;
  trace.recommendation_ids.add(rec.id);
  for (const findingId of rec.finding_ids ?? []) {
    trace.finding_ids.add(findingId);
    const finding = review.findings.find((f) => f.id === findingId);
    for (const evidenceId of finding?.evidence_ids ?? []) trace.evidence_ids.add(evidenceId);
  }
  return trace;
}

function freeze(node: MutableNode): ChangeTreeNode {
  const children = [...node.children.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(freeze);
  return {
    label: node.label,
    path: node.path,
    ...(node.operation ? { operation: node.operation } : {}),
    ...(node.asset_id ? { asset_id: node.asset_id } : {}),
    action_ids: [...node.trace.action_ids].sort(),
    recommendation_ids: [...node.trace.recommendation_ids].sort(),
    finding_ids: [...node.trace.finding_ids].sort(),
    evidence_ids: [...node.trace.evidence_ids].sort(),
    children,
  };
}

export function buildChangeTree(review: Review): ChangeTree {
  const assetsById = new Map(review.assets.map((a) => [a.id, a]));
  const roots = new Map<string, MutableNode>();

  for (const action of review.actions) {
    const trace = traceFor(action, review);
    for (const affected of action.affected_assets ?? []) {
      const located = locate(affected, assetsById);
      if (!located) continue;

      const label = rootLabel(located.type);
      let node = roots.get(label);
      if (!node) {
        node = newNode(label, label);
        roots.set(label, node);
      }
      mergeTrace(node.trace, trace);

      const segments = segmentsOf(located.path);
      // The target, when present, is the deepest node: 'hero' inside '/index'.
      if (affected.target) segments.push(affected.target);

      for (const segment of segments) {
        const path = `${node.path}/${segment}`;
        let child = node.children.get(segment);
        if (!child) {
          child = newNode(segment, path);
          node.children.set(segment, child);
        }
        mergeTrace(child.trace, trace);
        node = child;
      }

      // The operation lands on the deepest node, and the asset id with it, so a
      // click on a leaf can resolve back to the thing that actually changes.
      node.operation = affected.operation;
      if (located.asset_id) node.asset_id = located.asset_id;
    }
  }

  return {
    roots: [...roots.values()].sort((a, b) => a.label.localeCompare(b.label)).map(freeze),
  };
}

const OPERATION_LABELS: Record<NonNullable<ChangeTreeNode['operation']>, string> = {
  new: 'NEW',
  edit: 'EDIT',
  remove: 'REMOVE',
  move: 'MOVE',
};

/**
 * ASCII rendering, per spec sections 28 and 35.
 *
 * Box-drawing characters only, no arrows, matching the family's output
 * conventions and staying readable in a terminal that is not a browser.
 */
export function renderChangeTreeAscii(tree: ChangeTree): string {
  const lines: string[] = [];

  const walk = (node: ChangeTreeNode, prefix: string, isLast: boolean, isRoot: boolean): void => {
    if (isRoot) {
      lines.push(`${node.label}/`);
    } else {
      const connector = isLast ? '└── ' : '├── ';
      const op = node.operation ? `[${OPERATION_LABELS[node.operation]}] ` : '';
      lines.push(`${prefix}${connector}${op}${node.label}`);
    }
    const childPrefix = isRoot ? '' : `${prefix}${isLast ? '    ' : '│   '}`;
    node.children.forEach((child, index) => {
      walk(child, childPrefix, index === node.children.length - 1, false);
    });
  };

  tree.roots.forEach((root, index) => {
    if (index > 0) lines.push('');
    walk(root, '', true, true);
  });

  return lines.join('\n');
}

/** Finds a node by its full path, for the section 29 click-through. */
export function findNode(tree: ChangeTree, path: string): ChangeTreeNode | null {
  const search = (node: ChangeTreeNode): ChangeTreeNode | null => {
    if (node.path === path) return node;
    for (const child of node.children) {
      const hit = search(child);
      if (hit) return hit;
    }
    return null;
  };
  for (const root of tree.roots) {
    const hit = search(root);
    if (hit) return hit;
  }
  return null;
}
