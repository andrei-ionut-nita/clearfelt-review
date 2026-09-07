import type { AssetOperation } from './recommendation.ts';

/**
 * A node in the derived change tree.
 *
 * This type is never written to disk and never authored by the reasoning layer.
 * change-tree.ts builds it from every action's affected_assets, resolving asset
 * ids against assets.json. Spec section 62 is explicit that the tree must be
 * derived: generated as prose it becomes a second hallucination layer, where
 * the tree says one thing and the recommendations say another.
 *
 * Each node carries the ids that produced it, which is what makes the section 29
 * click-through work: selecting a node exposes the action, recommendation,
 * finding and evidence behind it.
 */
export interface ChangeTreeNode {
  /** Path segment for this node, for example 'index' or 'Hero'. */
  label: string;
  /** Full path from the root, joined with '/'. Stable across renders. */
  path: string;
  /** Absent on grouping nodes that exist only to hold children. */
  operation?: AssetOperation;
  /** The existing asset this node refers to, when it is not a new one. */
  asset_id?: string;
  action_ids: string[];
  recommendation_ids: string[];
  finding_ids: string[];
  evidence_ids: string[];
  children: ChangeTreeNode[];
}

/** One root per asset type, so non-website subjects render as their own tree. */
export interface ChangeTree {
  roots: ChangeTreeNode[];
}
