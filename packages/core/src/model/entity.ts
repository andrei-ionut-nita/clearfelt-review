import type { Identified } from './common.ts';

/**
 * The abstraction the whole product generalises over. Entity type is an open
 * vocabulary string and is never branched on in code: spec section 60 forbids
 * `if entity.type === 'personal website'`. Behaviour comes from the module
 * registry reading objective, audience and available evidence instead.
 */
export interface Entity extends Identified {
  type: string;
  role: 'subject' | 'comparison' | 'referenced';
  name: string;
  description?: string;
  canonical_url?: string;
  geography?: string[];
  industry?: string;
  asset_ids: string[];
  metadata?: Record<string, string>;
}

export const ENTITY_ROLES = ['subject', 'comparison', 'referenced'] as const;

/**
 * What exists, as distinct from what should change.
 *
 * Keeping Asset separate from AffectedAsset is what stops the change tree
 * becoming a tree of free strings the reasoning layer invented. An action that
 * edits something must point at an asset we established exists, and we know it
 * exists because source_ids says how we found it.
 *
 * parent_id carries the structural graph from spec section 8: a page belongs to
 * a site, a section belongs to a page. Structure first, meaning later.
 */
export interface Asset extends Identified {
  entity_id: string;
  type: string;
  path: string;
  title?: string;
  parent_id?: string;
  source_ids: string[];
}
