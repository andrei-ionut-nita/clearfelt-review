import { COLLECTIONS, type CollectionSpec, type Review } from './model/index.ts';

/**
 * Id allocation.
 *
 * Ids are deterministic code's job, not the reasoning layer's. An LLM asked to
 * invent unique ids across eighteen collections will eventually reuse one, and a
 * duplicate id silently reroutes a traceability chain to the wrong entity: the
 * report still renders, still validates structurally, and now points at the
 * wrong evidence. Allocating here makes that failure impossible rather than
 * unlikely.
 */

/** Ids look like ENT-0001. Four digits covers a run comfortably and sorts. */
const ID_PATTERN = /^([A-Z]+)-(\d{4,})$/;

export interface ParsedId {
  prefix: string;
  sequence: number;
}

export function parseId(id: string): ParsedId | null {
  const match = ID_PATTERN.exec(id);
  if (!match) return null;
  const [, prefix, digits] = match;
  if (prefix === undefined || digits === undefined) return null;
  return { prefix, sequence: Number.parseInt(digits, 10) };
}

export function formatId(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

/** The prefix a given collection allocates, or null for single documents. */
export function prefixFor(key: keyof Review): string | null {
  const spec = COLLECTIONS.find((c) => c.key === key);
  return spec?.prefix ?? null;
}

/**
 * The next free id for a collection.
 *
 * Deliberately max-plus-one rather than length-plus-one: entities are never
 * renumbered when one is removed, because an id that has appeared in a rendered
 * report must never later refer to something else.
 */
export function nextId(prefix: string, existing: readonly { id: string }[]): string {
  let highest = 0;
  for (const item of existing) {
    const parsed = parseId(item.id);
    if (parsed && parsed.prefix === prefix && parsed.sequence > highest) {
      highest = parsed.sequence;
    }
  }
  return formatId(prefix, highest + 1);
}

/** Allocates a run of ids at once, for a stage writing a whole collection. */
export function nextIds(
  prefix: string,
  existing: readonly { id: string }[],
  count: number,
): string[] {
  const first = parseId(nextId(prefix, existing));
  if (!first) throw new Error(`Could not allocate ids for prefix ${prefix}`);
  return Array.from({ length: count }, (_, i) => formatId(prefix, first.sequence + i));
}

/** Every list collection's prefix, for integrity checks and error messages. */
export function listCollections(): CollectionSpec[] {
  return COLLECTIONS.filter((c) => c.shape === 'list');
}
