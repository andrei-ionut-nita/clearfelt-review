import { describe, expect, it } from 'vitest';
import { formatId, nextId, nextIds, parseId, prefixFor } from './ids.ts';

describe('parseId', () => {
  it('parses a well formed id', () => {
    expect(parseId('ENT-0012')).toEqual({ prefix: 'ENT', sequence: 12 });
  });

  it('rejects ids that are not in the canonical shape', () => {
    expect(parseId('ENT-12')).toBeNull();
    expect(parseId('ent-0012')).toBeNull();
    expect(parseId('0012')).toBeNull();
    expect(parseId('')).toBeNull();
  });
});

describe('nextId', () => {
  it('starts at one for an empty collection', () => {
    expect(nextId('E', [])).toBe('E-0001');
  });

  it('takes the highest sequence, not the count', () => {
    // A removed entity must not cause a later one to reuse its id: an id that
    // has appeared in a rendered report must never refer to something else.
    const existing = [{ id: 'E-0001' }, { id: 'E-0007' }];
    expect(nextId('E', existing)).toBe('E-0008');
  });

  it('ignores ids belonging to other prefixes', () => {
    expect(nextId('E', [{ id: 'ENT-0099' }, { id: 'E-0002' }])).toBe('E-0003');
  });

  it('ignores malformed ids rather than throwing', () => {
    expect(nextId('E', [{ id: 'nonsense' }, { id: 'E-0004' }])).toBe('E-0005');
  });
});

describe('nextIds', () => {
  it('allocates a contiguous run', () => {
    expect(nextIds('F', [{ id: 'F-0002' }], 3)).toEqual(['F-0003', 'F-0004', 'F-0005']);
  });
});

describe('formatId', () => {
  it('pads to four digits and does not truncate beyond them', () => {
    expect(formatId('S', 7)).toBe('S-0007');
    expect(formatId('S', 12345)).toBe('S-12345');
  });
});

describe('prefixFor', () => {
  it('resolves list collections and returns null for single documents', () => {
    expect(prefixFor('evidence')).toBe('E');
    expect(prefixFor('run')).toBeNull();
  });
});
