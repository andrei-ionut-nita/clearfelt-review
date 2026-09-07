# Fixtures

Committed review runs used by tests and as worked references.

Each is a real run directory: the same layout `clearfelt-review init` produces, so every CLI command works against them directly.

```bash
node packages/core/dist/cli.js validate    fixtures/personal-brand
node packages/core/dist/cli.js trace       fixtures/personal-brand R-0001
node packages/core/dist/cli.js render      fixtures/personal-brand --format html --out /tmp/report.html
```

## personal-brand

A complete run for an invented technology leader. Generated from `packages/core/src/testing/worked-example.ts`, so the file and the fixture cannot drift.

It deliberately exercises the awkward cases rather than the happy path:

- an absence observation, with the scope searched
- evidence that contradicts a finding, kept rather than resolved away
- an inferred finding resting on an unvalidated assumption
- a user assertion the research contradicted, and the comparison it produced being rejected
- a question that ran out of evidence, and one that was blocked
- a research ledger containing failures

A renderer or a check tested only against clean data looks correct and misleads on a real run. This fixture is what that costs.

## commercial-saas

A complete run for an invented analytics subscription product, generated from `packages/core/src/testing/worked-example-saas.ts`. Lighter than personal-brand rather than matching its depth line for line: the point of a second archetype is to prove the deterministic layer adapts, not to re-exercise every awkward case a second time.

It activates a genuinely different set of modules (`pricing`, `offer`, `acquisition`, `conversion` where personal-brand leaves them dormant; `content`, `credibility`, `discoverability` dormant where personal-brand activates them), and its comparison landscape produces the other half of the saturation table personal-brand only shows one side of: a territory two qualified comparisons actually contest (`high` saturation, `contested`) sitting next to an uncontested one (`low` saturation, `white_space`). `fixtures.test.ts` asserts both fixtures' module sets actually differ, so this claim stays checked rather than asserted in prose.

Its change tree also roots on a non-website asset type (`signup_flow`) alongside `website_page`, which personal-brand alone would not prove: `change-tree.ts` keys root labels off asset type, and a tree that only ever renders one asset type would be a website auditor with extra steps regardless of what the rest of the model can do.

## adversarial/

Thirteen generated run directories, one per mechanical quality check, each written from `packages/core/src/testing/adversarial.ts` so a fixture and its test cannot drift the way a hand-maintained one can.

Every one validates completely. That is the point: each is a well-formed review a reader should not act on, and `clearfelt-review quality <run>` names the one thing wrong with it.

```bash
node packages/core/dist/cli.js validate fixtures/adversarial/restates-finding
node packages/core/dist/cli.js quality  fixtures/adversarial/restates-finding
```

## Planned

`charity`, `ngo`, `government`, `product`, `professional-services` are still open. Two archetypes already prove the registry adapts rather than defaulting to one shape; the remaining five would mostly add breadth to that same claim rather than test something new, so they are recorded as future work rather than built for their own sake. See `docs/ROADMAP.md`.

The subject of every fixture is invented. No fixture is allowed to become the product ontology.
