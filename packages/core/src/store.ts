import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { assertWritable } from './lifecycle.ts';
import {
  COLLECTIONS,
  type CollectionSpec,
  type ResearchLog,
  type Review,
  type ReviewRun,
  type RunStage,
} from './model/index.ts';

/**
 * Reading and writing a run directory.
 *
 * The run directory is the canonical state. There is no database, per spec
 * section 9: a directory of JSON files plus the snapshots of what we actually
 * retrieved is the whole persistence layer, and it stays inspectable with cat.
 */

export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreError';
  }
}

/** An empty run, before any stage has written anything. */
export function emptyReview(run: ReviewRun): Review {
  return {
    run,
    scope: null,
    plan: null,
    entities: [],
    assets: [],
    user_assertions: [],
    research_questions: [],
    sources: [],
    observations: [],
    evidence: [],
    comparisons: [],
    findings: [],
    opportunities: [],
    recommendations: [],
    actions: [],
    assumptions: [],
    unknowns: [],
    hypotheses: [],
    feedback: [],
    outcome_assessments: [],
    research_log: { actions: [], events: [] },
  };
}

export function newRun(
  slug: string,
  runId: string,
  now: string,
  previousRunId?: string,
): ReviewRun {
  return {
    id: runId,
    slug,
    created_at: now,
    updated_at: now,
    stage: 'initialized',
    approved_gates: {},
    ...(previousRunId ? { previous_run_id: previousRunId } : {}),
    observability: {
      started_at: now,
      sources_discovered: 0,
      sources_retrieved: 0,
      retrieval_failures: 0,
      search_iterations: 0,
    },
  };
}

/**
 * Writes via a temporary file and a rename.
 *
 * A run directory that is half written is worse than one that is not written at
 * all, because validate would report a referential integrity failure that has
 * nothing to do with the intelligence and everything to do with an interrupted
 * process. rename is atomic within a filesystem, so a reader sees either the
 * old file or the new one.
 */
async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tmp, path);
}

async function readJsonIfPresent<T>(path: string): Promise<T | null> {
  if (!existsSync(path)) return null;
  const raw = await readFile(path, 'utf8');
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new StoreError(
      `${path} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function defaultFor(spec: CollectionSpec): unknown {
  if (spec.shape === 'list') return [];
  if (spec.shape === 'log') return { actions: [], events: [] } satisfies ResearchLog;
  return null;
}

export async function loadRun(dir: string): Promise<ReviewRun> {
  const run = await readJsonIfPresent<ReviewRun>(join(dir, 'run.json'));
  if (!run) throw new StoreError(`No run.json in ${dir}. Is this a review run directory?`);
  return run;
}

/** Loads every collection, filling in defaults for files a young run lacks. */
export async function loadReview(dir: string): Promise<Review> {
  const run = await loadRun(dir);
  const review = emptyReview(run);
  for (const spec of COLLECTIONS) {
    if (spec.key === 'run') continue;
    const value = await readJsonIfPresent<unknown>(join(dir, spec.file));
    // biome-ignore lint/suspicious/noExplicitAny: the registry is the type bridge
    (review as any)[spec.key] = value ?? defaultFor(spec);
  }
  return review;
}

export interface WriteOptions {
  /**
   * Skips the stage check. Reserved for the CLI's own stage transitions and for
   * fixture construction, never for a reasoning stage. Every use is a decision
   * to bypass the guarantee the lifecycle exists to provide.
   */
  bypassLifecycle?: boolean;
}

/**
 * Writes one collection, refusing if the run's stage does not permit it.
 *
 * This is the enforcement point for the whole lifecycle. Skills call the CLI,
 * the CLI calls here, and a stage that tries to write out of turn gets an error
 * naming the stage that would have allowed it.
 */
export async function writeCollection<K extends keyof Review>(
  dir: string,
  key: K,
  value: Review[K],
  options: WriteOptions = {},
): Promise<void> {
  const spec = COLLECTIONS.find((c) => c.key === key);
  if (!spec) throw new StoreError(`Unknown collection: ${String(key)}`);
  if (!options.bypassLifecycle) {
    const run = await loadRun(dir);
    assertWritable(run.stage, key);
  }
  await writeJsonAtomic(join(dir, spec.file), value);
}

/** Writes run.json and stamps updated_at. Stage transitions go through here. */
export async function writeRun(dir: string, run: ReviewRun, now: string): Promise<void> {
  await writeJsonAtomic(join(dir, 'run.json'), { ...run, updated_at: now });
}

/** Creates the directory and every collection file, so a fresh run is complete. */
export async function initRun(dir: string, run: ReviewRun): Promise<void> {
  if (existsSync(join(dir, 'run.json'))) {
    throw new StoreError(`${dir} already contains a run. Refusing to overwrite it.`);
  }
  await mkdir(join(dir, 'snapshots'), { recursive: true });
  await writeJsonAtomic(join(dir, 'run.json'), run);
  for (const spec of COLLECTIONS) {
    if (spec.key === 'run') continue;
    await writeJsonAtomic(join(dir, spec.file), defaultFor(spec));
  }
}

/**
 * Copies a previous run's corrections into a freshly initialised one.
 *
 * feedback.json is append-only and carried into a rerun by design, so
 * "COMP-004 is not actually a competitor" stays true the second time. The
 * ids in the copy still name entities from the old run, which is fine: this
 * is a lookaside list for the reasoning layer to check candidates against by
 * name before re-proposing something already rejected, not a set of live
 * references the new run's validator resolves. Returns how many entries were
 * carried, so the caller can tell a real user there is something to read.
 */
export async function carryForwardFeedback(previousDir: string, dir: string): Promise<number> {
  const previous = await readJsonIfPresent<unknown[]>(join(previousDir, 'feedback.json'));
  if (!previous || previous.length === 0) return 0;
  await writeJsonAtomic(join(dir, 'feedback.json'), previous);
  return previous.length;
}

export function hashContent(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Stores what we actually saw, and returns the path to record on the Source.
 *
 * The distinction between "this URL exists" and "this is what was there when we
 * looked" is what makes a review reproducible after a competitor rewrites their
 * pricing page. The hash makes a later claim that the content was different
 * checkable rather than a matter of memory.
 */
export async function writeSnapshot(
  dir: string,
  sourceId: string,
  extension: string,
  content: string | Buffer,
): Promise<{ snapshot_path: string; content_hash: string }> {
  const snapshotDir = join(dir, 'snapshots');
  await mkdir(snapshotDir, { recursive: true });
  const filename = `${sourceId}.${extension.replace(/^\./, '')}`;
  const full = join(snapshotDir, filename);
  await writeFile(full, content);
  return { snapshot_path: relative(dir, full), content_hash: hashContent(content) };
}

/** Lists run ids under a slug directory, newest last by lexical id ordering. */
export async function listRuns(slugDir: string): Promise<string[]> {
  if (!existsSync(slugDir)) return [];
  const entries = await readdir(slugDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && existsSync(join(slugDir, e.name, 'run.json')))
    .map((e) => e.name)
    .sort();
}

export function stageOf(review: Review): RunStage {
  return review.run.stage;
}
