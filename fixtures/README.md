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

## adversarial/

Thirteen generated run directories, one per mechanical quality check, each written from `packages/core/src/testing/adversarial.ts` so a fixture and its test cannot drift the way a hand-maintained one can.

Every one validates completely. That is the point: each is a well-formed review a reader should not act on, and `clearfelt-review quality <run>` names the one thing wrong with it.

```bash
node packages/core/dist/cli.js validate fixtures/adversarial/restates-finding
node packages/core/dist/cli.js quality  fixtures/adversarial/restates-finding
```

## Planned

`commercial-saas`, `charity`, `ngo`, `government`, `product`, `professional-services` arrive in Phase 4, where the point is to verify the module registry genuinely adapts rather than producing the same sections every time.

The subject of every fixture is invented. No fixture is allowed to become the product ontology.
