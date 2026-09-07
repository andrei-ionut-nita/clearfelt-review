import { existsSync } from 'node:fs';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LifecycleError } from './lifecycle.ts';
import {
  StoreError,
  hashContent,
  initRun,
  loadReview,
  loadRun,
  newRun,
  writeCollection,
  writeRun,
  writeSnapshot,
} from './store.ts';

const NOW = '2026-09-07T12:00:00.000Z';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'clearfelt-review-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('initRun', () => {
  it('creates every collection file so a fresh run is complete', async () => {
    await initRun(dir, newRun('acme', 'r-001', NOW));
    const files = await readdir(dir);
    expect(files).toContain('run.json');
    expect(files).toContain('evidence.json');
    expect(files).toContain('research-log.json');
    expect(files).toContain('snapshots');
  });

  it('refuses to overwrite an existing run', async () => {
    await initRun(dir, newRun('acme', 'r-001', NOW));
    await expect(initRun(dir, newRun('acme', 'r-002', NOW))).rejects.toThrow(StoreError);
  });
});

describe('loadReview', () => {
  it('fills defaults for collections a young run has not written', async () => {
    await initRun(dir, newRun('acme', 'r-001', NOW));
    const review = await loadReview(dir);
    expect(review.scope).toBeNull();
    expect(review.evidence).toEqual([]);
    expect(review.research_log).toEqual({ actions: [], events: [] });
    expect(review.run.stage).toBe('initialized');
  });

  it('reports the file when JSON is malformed rather than failing obscurely', async () => {
    await initRun(dir, newRun('acme', 'r-001', NOW));
    await writeMalformedJson(join(dir, 'evidence.json'));
    await expect(loadReview(dir)).rejects.toThrow(/evidence\.json is not valid JSON/);
  });

  it('errors clearly when the directory is not a run', async () => {
    await expect(loadRun(dir)).rejects.toThrow(/No run\.json/);
  });
});

async function writeMalformedJson(path: string): Promise<void> {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(path, '{ not json', 'utf8');
}

describe('writeCollection lifecycle enforcement', () => {
  it('refuses a write the current stage does not permit', async () => {
    // The whole point of the state machine: findings cannot be written while the
    // run is still researching, so the findings gate cannot be skipped.
    await initRun(dir, newRun('acme', 'r-001', NOW));
    const run = await loadRun(dir);
    await writeRun(dir, { ...run, stage: 'researching' }, NOW);

    await expect(writeCollection(dir, 'findings', [])).rejects.toThrow(LifecycleError);
    await expect(writeCollection(dir, 'findings', [])).rejects.toThrow(/findings_pending/);
  });

  it('permits a write the current stage does allow', async () => {
    await initRun(dir, newRun('acme', 'r-001', NOW));
    const run = await loadRun(dir);
    await writeRun(dir, { ...run, stage: 'researching' }, NOW);
    await expect(writeCollection(dir, 'sources', [])).resolves.toBeUndefined();
  });

  it('permits feedback in any stage, including complete', async () => {
    await initRun(dir, newRun('acme', 'r-001', NOW));
    const run = await loadRun(dir);
    await writeRun(dir, { ...run, stage: 'complete' }, NOW);
    await expect(writeCollection(dir, 'feedback', [])).resolves.toBeUndefined();
  });

  it('bypasses the check only when explicitly asked', async () => {
    await initRun(dir, newRun('acme', 'r-001', NOW));
    await expect(
      writeCollection(dir, 'recommendations', [], { bypassLifecycle: true }),
    ).resolves.toBeUndefined();
  });
});

describe('atomic writes', () => {
  it('leaves no temporary file behind', async () => {
    await initRun(dir, newRun('acme', 'r-001', NOW));
    await writeCollection(dir, 'feedback', []);
    const files = await readdir(dir);
    expect(files.filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });
});

describe('writeSnapshot', () => {
  it('records what we saw, at a path relative to the run', async () => {
    await initRun(dir, newRun('acme', 'r-001', NOW));
    const result = await writeSnapshot(dir, 'S-0001', 'html', '<h1>Hello</h1>');
    expect(result.snapshot_path).toBe(join('snapshots', 'S-0001.html'));
    expect(result.content_hash).toBe(hashContent('<h1>Hello</h1>'));
    expect(existsSync(join(dir, result.snapshot_path))).toBe(true);
  });

  it('hashes content so a later claim about it is checkable', () => {
    expect(hashContent('a')).not.toBe(hashContent('b'));
    expect(hashContent('a')).toBe(hashContent('a'));
  });
});
