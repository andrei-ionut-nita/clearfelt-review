import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Invariant 19: no production code contains an entity-specific branch.
 *
 * "No renderer contains a fact absent from the model" has a test. This is its
 * counterpart for the invariant that keeps the product from becoming an AI
 * website auditor: nothing may read Entity.type (or a field shaped like it)
 * in a conditional. Behaviour has to come from the module registry's signals,
 * per docs/decisions/0010-signal-based-module-activation.md, or from a field
 * every entity carries regardless of what it is, never from what kind of
 * thing is being reviewed.
 *
 * A grep-shaped test rather than a semantic one, on purpose: the thing being
 * checked is a literal pattern in the source, not a judgement about intent,
 * and a grep is the tool that cannot be argued with about what it found.
 */

const SRC = import.meta.dirname;

/**
 * Strips comments before matching, crudely: block comments, then line
 * comments. Good enough for TypeScript source with no comment-shaped string
 * literals in the files this scans, and it is what lets this file, AGENTS.md
 * style documentation and the registry's own docstrings say "entity.type"
 * and name archetypes as examples without tripping the rule they document.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function productionFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...productionFiles(full));
    } else if (
      entry.endsWith('.ts') &&
      !entry.endsWith('.test.ts') &&
      !full.includes(`${join('src', 'testing')}`)
    ) {
      files.push(full);
    }
  }
  return files;
}

describe('invariant 19: no entity-specific branching', () => {
  const files = productionFiles(SRC);

  it('found production files to check', () => {
    // A guard against the walker silently returning nothing and every other
    // assertion in this file passing for the wrong reason.
    expect(files.length).toBeGreaterThan(20);
  });

  it('never compares or switches on an entity type field', () => {
    const pattern =
      /\bentity\w*\.\s*type\b\s*(===|!==)|switch\s*\(\s*\w*[Ee]ntity\w*\.\s*type\s*\)/;
    const offenders = files.filter((file) =>
      pattern.test(withoutComments(readFileSync(file, 'utf8'))),
    );
    expect(offenders).toEqual([]);
  });

  it('never branches a module or asset type on a fixed archetype vocabulary', () => {
    // Not a ban on the words themselves. AGENTS.md, ARCHITECTURE.md and this
    // very file all say "charity" or "personal brand" as an example, and
    // that is fine in prose. What is checked is the narrower, riskier shape:
    // a string-equality or switch-case comparison against one of these words,
    // which is exactly how an entity-type branch gets smuggled in through a
    // field that happens to hold similar values.
    const archetypes = [
      'personal_brand',
      'commercial_saas',
      'professional_services',
      'charity',
      'ngo',
      'government',
    ];
    const pattern = new RegExp(
      `(===|!==)\\s*['"](${archetypes.join('|')})['"]|case\\s+['"](${archetypes.join('|')})['"]`,
      'i',
    );
    const offenders = files.filter((file) =>
      pattern.test(withoutComments(readFileSync(file, 'utf8'))),
    );
    expect(offenders).toEqual([]);
  });
});
