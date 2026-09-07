#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { buildChangeTree, renderChangeTreeAscii } from './change-tree.ts';
import { computeCoverage } from './coverage.ts';
import { assertTransition, gateForStage, stageForGate } from './lifecycle.ts';
import { GATE_NAMES, REVIEW_DEPTHS, RUN_STAGES } from './model/index.ts';
import type { GateName, ReviewDepth, RunStage } from './model/index.ts';
import { selectModules } from './modules/registry.ts';
import { prioritise } from './prioritise.ts';
import { evaluateQuality, formatQualityReport } from './quality/index.ts';
import { renderBrief } from './render/brief.ts';
import { renderHtml } from './render/html/index.ts';
import { renderJson } from './render/json.ts';
import { renderPlan } from './render/plan.ts';
import { buildView } from './render/view.ts';
import {
  initRun,
  listRuns,
  loadReview,
  loadRun,
  newRun,
  writeCollection,
  writeRun,
} from './store.ts';
import { renderTraceAscii, trace } from './trace.ts';
import { formatIssues, validateReview } from './validate/index.ts';

/**
 * The CLI is a thin shell. Every command's logic lives in a sibling module that
 * can be tested without spawning a process, matching the pattern in
 * clearfelt-diagram's engine. Argument parsing is hand rolled: the family has no
 * commander or yargs dependency, and this surface is small enough not to need
 * one.
 */

const USAGE = [
  'clearfelt-review - evidence-backed strategic intelligence',
  '',
  'Usage:',
  '  clearfelt-review init <slug> [--depth quick|standard|deep] [--root <dir>]',
  '  clearfelt-review stage <run> <stage>          advance a non-gate transition',
  '  clearfelt-review approve <run> <gate>         scope | research-plan | findings',
  '  clearfelt-review validate <run>               schema, integrity and lifecycle',
  '  clearfelt-review quality <run>                output contract and quality checks',
  '  clearfelt-review modules <run>                suggested module activation from scope',
  '  clearfelt-review coverage <run>               question states, gaps, budget',
  '  clearfelt-review prioritise <run>             computed P0..P3 with reasoning',
  '  clearfelt-review change-tree <run> [--json]   derived from actions and assets',
  '  clearfelt-review trace <run> <id> [--reverse] why does this exist?',
  '  clearfelt-review render <run> --format brief|plan|html|json [--out <path>]',
  '',
  'A <run> is a path to a run directory, for example reviews/acme/r-20260907-001.',
].join('\n');

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function flagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

function requireRunDir(path: string | undefined): string {
  if (!path) fail('Expected a path to a run directory.');
  const dir = resolve(path);
  if (!existsSync(join(dir, 'run.json'))) {
    fail(`${dir} is not a review run directory (no run.json).`);
  }
  return dir;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Run ids sort chronologically so listRuns returns them in order. */
function makeRunId(existing: string[]): string {
  const date = nowIso().slice(0, 10).replace(/-/g, '');
  const todays = existing.filter((id) => id.startsWith(`r-${date}`)).length;
  return `r-${date}-${String(todays + 1).padStart(3, '0')}`;
}

async function initCommand(args: string[]): Promise<void> {
  const slug = args[0];
  if (!slug || slug.startsWith('--')) fail('Usage: clearfelt-review init <slug> [--depth <depth>]');
  const depth = (flagValue(args, '--depth') ?? 'standard') as ReviewDepth;
  if (!REVIEW_DEPTHS.includes(depth)) {
    fail(`--depth must be one of: ${REVIEW_DEPTHS.join(', ')}`);
  }
  const root = resolve(flagValue(args, '--root') ?? 'reviews');
  const slugDir = join(root, slug);
  const runId = makeRunId(await listRuns(slugDir));
  const dir = join(slugDir, runId);
  const run = newRun(slug, runId, nowIso());
  await initRun(dir, run);
  console.log(dir);
  console.log(`Stage: ${run.stage}. Depth: ${depth}.`);
  console.log('Next: the review-onboard skill drafts scope.json, then approve the scope gate.');
}

async function stageCommand(args: string[]): Promise<void> {
  const dir = requireRunDir(args[0]);
  const target = args[1] as RunStage | undefined;
  if (!target || !RUN_STAGES.includes(target)) {
    fail(`Usage: clearfelt-review stage <run> <${RUN_STAGES.join('|')}>`);
  }
  const run = await loadRun(dir);
  // A gated stage cannot be left by fiat: that is what the gate is for.
  const gate = gateForStage(run.stage);
  if (gate && target !== 'blocked' && !run.approved_gates[gate]) {
    fail(
      `Stage '${run.stage}' is waiting on the '${gate}' gate. Run: clearfelt-review approve ${args[0]} ${gate.replace('_', '-')}`,
    );
  }
  assertTransition(run.stage, target);
  await writeRun(dir, { ...run, stage: target }, nowIso());
  console.log(`Stage: ${run.stage} -> ${target}`);
}

async function approveCommand(args: string[]): Promise<void> {
  const dir = requireRunDir(args[0]);
  const raw = args[1]?.replace(/-/g, '_') as GateName | undefined;
  if (!raw || !GATE_NAMES.includes(raw)) {
    fail(`Usage: clearfelt-review approve <run> <${GATE_NAMES.join('|').replace(/_/g, '-')}>`);
  }
  const run = await loadRun(dir);
  const expected = stageForGate(raw);
  if (run.stage !== expected) {
    fail(
      `The '${raw}' gate is approved in stage '${expected}', but this run is in '${run.stage}'.`,
    );
  }
  if (run.approved_gates[raw]) {
    fail(`The '${raw}' gate was already approved at ${run.approved_gates[raw]}.`);
  }
  const at = nowIso();
  const nextStage = RUN_STAGES[RUN_STAGES.indexOf(expected) + 1] as RunStage;
  await writeRun(
    dir,
    { ...run, stage: nextStage, approved_gates: { ...run.approved_gates, [raw]: at } },
    at,
  );
  console.log(`Approved '${raw}' at ${at}. Stage: ${expected} -> ${nextStage}`);
}

async function validateCommand(args: string[]): Promise<void> {
  const dir = requireRunDir(args[0]);
  const review = await loadReview(dir);
  const result = validateReview(review);
  if (result.issues.length > 0) console.log(formatIssues(result.issues));
  const warnings = result.issues.length - result.errors.length;
  if (result.ok) {
    console.log(`OK. ${warnings} warning(s), 0 errors.`);
    return;
  }
  // Nothing renders from an invalid run: an invalid model would produce a
  // report whose traceability silently does not resolve.
  console.error(`\nFAILED. ${result.errors.length} error(s), ${warnings} warning(s).`);
  process.exit(1);
}

/**
 * Evaluation, not validation.
 *
 * Exits 1 on a defect and 0 on cautions alone, because a caution is sometimes
 * the honest answer: a single source really can be the only source that exists.
 * Making every finding fatal would teach a user to pass --force and stop
 * reading, which is how a quality gate becomes decoration.
 */
async function qualityCommand(args: string[]): Promise<void> {
  const review = await loadReview(requireRunDir(args[0]));
  const report = evaluateQuality(review);
  console.log(formatQualityReport(report));
  if (report.defects.length > 0) process.exit(1);
}

/**
 * The deterministic suggestion only. review-onboard reads scope.json, decides
 * for real and writes its own reason for every module into plan.json; this
 * command exists so that decision can be checked against something rather than
 * made from nothing, and so a reader can see the module registry actually
 * changes its answer for a different objective.
 */
async function modulesCommand(args: string[]): Promise<void> {
  const review = await loadReview(requireRunDir(args[0]));
  const { activated, dormant } = selectModules(review);
  console.log('Suggested activation, from scope.json and assets.json alone:');
  console.log('');
  console.log('Activate:');
  for (const m of activated) console.log(`  ${m.key.padEnd(22)} ${m.analyses}`);
  console.log('');
  console.log('Leave dormant:');
  for (const m of dormant) console.log(`  ${m.key.padEnd(22)} ${m.analyses}`);
  console.log('');
  console.log(
    'This is a suggestion, not a verdict: write plan.json with your own reasoning, one entry per module, in either activated_modules or dormant_modules. validate rejects a plan that leaves any module undecided.',
  );
}

async function coverageCommand(args: string[]): Promise<void> {
  const review = await loadReview(requireRunDir(args[0]));
  const coverage = computeCoverage(review);
  console.log('Research coverage');
  console.log('');
  if (coverage.modules.length === 0) {
    console.log('  No research questions yet. The review-onboard skill generates them.');
    console.log('');
  }
  for (const module of coverage.modules) {
    const states = Object.entries(module.by_state)
      .filter(([, count]) => count > 0)
      .map(([state, count]) => `${state} ${count}`)
      .join(', ');
    console.log(`  ${module.module}`);
    console.log(`    questions: ${module.questions} (${states || 'none'})`);
    console.log(
      `    evidence: ${module.evidence_count}, sources: ${module.source_count} (${module.independent_source_count} independent)`,
    );
    console.log(`    confidence: ${module.confidence}`);
    for (const item of module.unresolved) {
      console.log(
        `    unresolved ${item.id}: ${item.question} [${item.stop_reason ?? 'no reason recorded'}]`,
      );
      if (item.stop_detail) console.log(`      ${item.stop_detail}`);
    }
  }
  console.log('');
  console.log(
    `Totals: ${coverage.totals.answered}/${coverage.totals.questions} answered, ${coverage.totals.unresolved} unresolved, ${coverage.totals.evidence} evidence, ${coverage.totals.sources} sources (${coverage.totals.independent_sources} independent)`,
  );
  if (coverage.budget.exhausted) {
    console.log(
      'Budget: exhausted. Stopping here is a limit, not a judgement that we know enough.',
    );
  }
  if (coverage.uncorroborated_findings.length > 0) {
    console.log(
      `Findings on fewer than two independent sources: ${coverage.uncorroborated_findings.join(', ')}`,
    );
  }
  for (const failure of coverage.failures) {
    console.log(
      `Research failure (${failure.research_question_id}): ${failure.outcome}, ${failure.detail}`,
    );
  }
}

async function prioritiseCommand(args: string[]): Promise<void> {
  const review = await loadReview(requireRunDir(args[0]));
  const results = prioritise(review);
  if (results.length === 0) {
    console.log('No recommendations yet.');
    return;
  }
  for (const result of results) {
    const rec = review.recommendations.find((r) => r.id === result.id);
    console.log(`${result.priority}  ${result.id}  ${rec?.title ?? ''}`);
    console.log(`      ${result.rationale}`);
    console.log(`      quadrant: ${result.quadrant}`);
  }
}

async function changeTreeCommand(args: string[]): Promise<void> {
  const review = await loadReview(requireRunDir(args[0]));
  const tree = buildChangeTree(review);
  if (args.includes('--json')) {
    console.log(JSON.stringify(tree, null, 2));
    return;
  }
  const ascii = renderChangeTreeAscii(tree);
  console.log(ascii === '' ? 'No changes proposed yet.' : ascii);
}

async function traceCommand(args: string[]): Promise<void> {
  const dir = requireRunDir(args[0]);
  const id = args[1];
  if (!id || id.startsWith('--')) fail('Usage: clearfelt-review trace <run> <id> [--reverse]');
  const review = await loadReview(dir);
  const direction = args.includes('--reverse') ? 'reverse' : 'forward';
  console.log(renderTraceAscii(trace(review, id, direction)));
}

const RENDERERS = {
  brief: renderBrief,
  plan: renderPlan,
  json: renderJson,
  html: renderHtml,
} as const;

type Format = keyof typeof RENDERERS;

async function renderCommand(args: string[]): Promise<void> {
  const dir = requireRunDir(args[0]);
  const format = (flagValue(args, '--format') ?? 'brief') as Format;
  if (!(format in RENDERERS)) {
    fail(`--format must be one of: ${Object.keys(RENDERERS).join(', ')}`);
  }
  const review = await loadReview(dir);
  // Nothing renders from an invalid run. A report built on a broken model
  // would carry traceability that silently does not resolve, which is worse
  // than no report: it looks checkable and is not.
  const validation = validateReview(review);
  if (!validation.ok) {
    console.error(formatIssues(validation.errors));
    fail(`\nRefusing to render: the run has ${validation.errors.length} validation error(s).`);
  }
  const output = RENDERERS[format](buildView(review));
  const out = flagValue(args, '--out');
  if (out) {
    await writeFile(resolve(out), output, 'utf8');
    console.log(resolve(out));
    return;
  }
  process.stdout.write(output);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case 'init':
      await initCommand(rest);
      break;
    case 'stage':
      await stageCommand(rest);
      break;
    case 'approve':
      await approveCommand(rest);
      break;
    case 'validate':
      await validateCommand(rest);
      break;
    case 'quality':
      await qualityCommand(rest);
      break;
    case 'modules':
      await modulesCommand(rest);
      break;
    case 'coverage':
      await coverageCommand(rest);
      break;
    case 'prioritise':
      await prioritiseCommand(rest);
      break;
    case 'change-tree':
      await changeTreeCommand(rest);
      break;
    case 'trace':
      await traceCommand(rest);
      break;
    case 'render':
      await renderCommand(rest);
      break;
    default:
      console.log(USAGE);
      process.exit(command ? 1 : 0);
  }
}

try {
  await main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
