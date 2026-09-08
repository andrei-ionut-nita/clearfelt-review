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

## charity

A complete run for an invented relief charity deciding how to increase recurring donations, generated from `packages/core/src/testing/worked-example-charity.ts`. The one fixture besides `government` to activate `trust`, since a recurring financial commitment to a cause is weighed differently than a SaaS subscription.

## ngo

A complete run for an invented NGO deciding which of two field programmes to scale, generated from `packages/core/src/testing/worked-example-ngo.ts`. The one fixture in the repository where `scope.comparison_applicable` is false: the decision is an internal allocation choice, not a comparison against other organisations, and this is the only place that explicit no-comparison path (specification section 51) is exercised end to end rather than left untested.

## government

A complete run for an invented council grant service deciding how to increase completed applications, generated from `packages/core/src/testing/worked-example-government.ts`. The one fixture to pair `accessibility` with `discoverability`: a public service has to be usable by residents on assistive technology and findable by residents who do not already know it exists, in a way no commercial fixture needs to be.

## product

A complete run for an invented direct-to-consumer hiking-pack brand deciding how to increase purchase conversion, generated from `packages/core/src/testing/worked-example-product.ts`. The one fixture to activate `operations`: a physical product sold online has a shipping and fulfilment reality none of the other subjects carry.

## professional-services

A complete run for an invented boutique advisory firm deciding how to increase qualified inbound enquiries, generated from `packages/core/src/testing/worked-example-professional-services.ts`. Activates `credibility` and `reputation` together while leaving `pricing` dormant, unlike `product` or `commercial-saas`: engagement rates are quoted per client rather than published.

Each of these five, checked directly by `fixtures.test.ts`, activates at least one module combination none of the other six fixtures do. That is the actual claim a seventh, eighth or ninth archetype would have to earn its place by extending, not merely broadening.

The subject of every fixture is invented. No fixture is allowed to become the product ontology.
