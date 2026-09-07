import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GATE_NAMES, REVIEW_DEPTHS, RUN_STAGES } from './model/index.ts';

/**
 * Keeps the reasoning layer honest about the deterministic one.
 *
 * A skill that tells an agent to run a command that does not exist fails at the
 * worst moment, halfway through a real review, and nothing else in the test
 * suite would catch it: the skills are Markdown and the CLI is TypeScript, so
 * they drift silently. Modelled on clearfelt-diagram's skills-consistency test.
 */

const ROOT = join(import.meta.dirname, '..', '..', '..');
const SKILLS_DIR = join(ROOT, '.claude', 'skills');
const CLI_SOURCE = readFileSync(join(import.meta.dirname, 'cli.ts'), 'utf8');

/** The commands cli.ts actually dispatches, read from its switch. */
const IMPLEMENTED = new Set(
  [...CLI_SOURCE.matchAll(/^\s*case '([a-z-]+)':/gm)].map((m) => m[1] as string),
);

const skillDirs = existsSync(SKILLS_DIR)
  ? readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  : [];

describe('skills', () => {
  it('exist', () => {
    expect(skillDirs.sort()).toEqual([
      'review-analyse',
      'review-onboard',
      'review-recommend',
      'review-research',
    ]);
  });

  for (const name of skillDirs) {
    const path = join(SKILLS_DIR, name, 'SKILL.md');
    const body = readFileSync(path, 'utf8');

    describe(name, () => {
      it('has frontmatter whose name matches its directory', () => {
        const frontmatter = body.split('---')[1] ?? '';
        expect(frontmatter).toMatch(new RegExp(`^name:\\s*${name}$`, 'm'));
        expect(frontmatter).toMatch(/^description:\s*Use /m);
      });

      it('references only commands the CLI implements', () => {
        const referenced = [...body.matchAll(/clearfelt-review ([a-z-]+)/g)].map(
          (m) => m[1] as string,
        );
        const unknown = [...new Set(referenced)].filter((c) => !IMPLEMENTED.has(c));
        // No exemptions. A skill telling the reasoning layer to run a command
        // that does not exist is drift, and the exemption that used to live
        // here for 'quality' is gone now that the command ships.
        expect(unknown).toEqual([]);
      });

      it('references only real stages, gates and depths', () => {
        for (const match of body.matchAll(/clearfelt-review stage <run> ([a-z_]+)/g)) {
          expect(RUN_STAGES).toContain(match[1]);
        }
        for (const match of body.matchAll(/clearfelt-review approve <run> ([a-z-]+)/g)) {
          expect(GATE_NAMES).toContain((match[1] as string).replace(/-/g, '_'));
        }
        const depths = body.match(/--depth ([a-z|]+)/)?.[1]?.split('|') ?? [];
        for (const depth of depths) expect(REVIEW_DEPTHS).toContain(depth);
      });

      it('uses no em-dash characters', () => {
        expect(body).not.toMatch(/\u2014/);
      });
    });
  }
});

describe('the skill set as a whole', () => {
  const bodies = skillDirs.map((name) => readFileSync(join(SKILLS_DIR, name, 'SKILL.md'), 'utf8'));

  it('covers every approval gate exactly once', () => {
    for (const gate of GATE_NAMES) {
      const cli = gate.replace(/_/g, '-');
      const approving = bodies.filter((b) => b.includes(`clearfelt-review approve <run> ${cli}`));
      expect(approving).toHaveLength(1);
    }
  });

  it('tells every stage what it must not write', () => {
    // The lifecycle enforces this, but a skill that does not say so produces an
    // agent that discovers the boundary by hitting an error mid-run.
    for (const body of bodies) expect(body).toMatch(/## Rules/);
  });
});
