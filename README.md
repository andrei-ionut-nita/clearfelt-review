# Clearfelt Review

[![CI](https://github.com/andrei-ionut-nita/clearfelt-review/actions/workflows/ci.yml/badge.svg)](https://github.com/andrei-ionut-nita/clearfelt-review/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22.12-brightgreen)](package.json)

Evidence-backed strategic intelligence.

An entity plus a strategic objective goes in. A change plan comes out where every recommendation traces back to a finding, to evidence, to an observation, to a source you can open.

Part of the clearfelt family, alongside [clearfelt-diagram](https://github.com/andrei-ionut-nita/clearfelt-diagram), [clearfelt-slide](https://github.com/andrei-ionut-nita/clearfelt-slide) and [clearfelt-writing](https://github.com/andrei-ionut-nita/clearfelt-writing).

## Why

Most AI analysis tools take a website and return an audit. The conclusions are unfalsifiable, the reasoning is invisible, and the report is the only artifact. You cannot ask why.

Clearfelt Review is built so you can always ask why, and get an answer that ends at something real:

```
$ clearfelt-review trace reviews/acme/r-20260907-001 R-0001

R-0001  Lead the homepage with the economics framing
├── F-0001  [derived] The homepage proposition leads on commercial outcomes rather than capability.
│   └── E-0001  The stated proposition leads on commercial outcomes.
│       └── OBS-0001  The homepage headline states "Engineering that pays for itself".
│           └── S-0001  https://example.com/
└── O-0001  Technology economics is underoccupied
    └── ...
```

And in reverse, to ask what a piece of research actually changed:

```
$ clearfelt-review trace reviews/acme/r-20260907-001 S-0001 --reverse
```

## What makes it different

**Layers stay separate.** An observation is not a finding. A finding is not a recommendation. A recommendation is not an action. Each level must cite the one below it, and a collapsed layer fails validation rather than quietly shipping.

**Priority is computed.** `priority` does not exist as a field. It is derived from impact, effort, confidence and urgency, with the arithmetic printed alongside, so nothing can claim to be P0 without earning it.

**The change tree is derived.** It is built from the actions and the assets they affect, not written as prose, so it cannot contradict the recommendations it came from.

**What you told it is not evidence.** "Our main competitor is X" enters as an assertion to investigate. A finding that rests only on what you said is rejected, because that is your belief handed back to you as research.

**Absence is recorded honestly.** "No pricing found after checking /pricing, /product and /faq" is an observation. "They do not publish pricing" is a claim. The first is allowed and must say where it looked; the second is not.

**Gaps appear as gaps.** Research that was blocked, paywalled or fruitless is logged and reported. "We researched this sufficiently" and "we could not find out" never render the same way.

## Status

Phases 0 through 5 complete, plus a Phase 6 hardening pass. 335 tests.

The deterministic layer: canonical model, id allocation, run lifecycle, stage-gated storage, validation and integrity, priority computation, change tree derivation, coverage, traceability, and four renderers over one shared view.

The reasoning layer: four Claude Code skills under `.claude/skills/`, one per stage, gated by the lifecycle rather than by their own good intentions.

**Quality evaluation, separate from validation.** `quality/contract.ts` checks that every recommendation answers ten fixed questions, from what evidence proves it to what would prove it wrong. `quality/checks.ts` runs nine mechanical checks, from a recommendation restating its own finding to a falsifier that cannot fail, against named failure categories in `quality/rubric.md` rather than a score. Run against a real site, it found real gaps in the run, not in the tool: two recommendations that had dropped which audience they served, and two research questions that stopped without saying why. See `CHANGELOG.md` for the full account, and `docs/ROADMAP.md` for the calibration work it left outstanding.

**Comparison depth.** `comparison-synthesis.ts` computes specification section 19's saturation table from the comparison landscape rather than from a reasoning stage's impression: how crowded a positioning territory is comes from a weighted count of the qualified comparisons contesting it, so a claim that a territory is open has to survive the same count a reader can run themselves. See `docs/decisions/0009-computed-saturation.md`.

**Generalisation, checked rather than assumed.** `modules/registry.ts` did not exist before Phase 4; module selection was a free-form key and reason the reasoning layer wrote from nothing. It is now eighteen predicates over signals derived from the objective, decision, audience text and captured assets, never from `Entity.type`. `validate` now rejects a plan that leaves any registry module undecided, uses an unknown key, or lists one as both activated and dormant. A second fixture, `fixtures/commercial-saas`, proves the registry actually adapts: it activates `pricing`, `offer` and `acquisition` where the personal-brand fixture leaves them dormant, and vice versa for `content`, `credibility` and `discoverability`, checked directly by a test rather than asserted in prose. `invariant-19.test.ts` greps production source for the entity-type branch the whole design exists to forbid. See `docs/decisions/0010-signal-based-module-activation.md`.

**Iteration.** `clearfelt-review init <slug> --previous <run>` carries a previous run's `feedback.json` forward, so a rejected comparison stays rejected the second time. `clearfelt-review diff <run-a> <run-b>` shows what carried forward, what is new, and what quietly disappeared, and it never trusts a matching id as evidence of anything: `ids.ts` allocates fresh within every run, so identity across runs exists only where the newer run explicitly claims it with `supersedes`. Verified by hand against a constructed rerun of the personal-brand fixture: leaving `supersedes` unset made everything read as dropped and replaced, which is the correct, if unforgiving, default. See `docs/decisions/0011-cross-run-identity-is-supersedes-only.md`.

All six phases from the original plan are now built. **Phase 6, hardening.** All seven archetypes the original plan named now have a fixture: `charity`, `ngo`, `government` and `product` and `professional-services` join `personal-brand` and `commercial-saas`, each activating a module combination none of the others do, checked directly by tests. `ngo` is the one fixture where `scope.comparison_applicable` is false, exercising the explicit no-comparison path rather than an unexplained empty array. `diff.ts` now prints an item-count delta for the evidentiary collections it deliberately does not diff item by item, and flags a close textual match between a still-open feedback item and an unlinked new item as a caution, narrowing without closing the blind spot `docs/decisions/0011-cross-run-identity-is-supersedes-only.md` names. `docs/ROADMAP.md` records what stays deliberately out of scope, and what is narrowed rather than closed, and why.

## Getting started

```
pnpm install
pnpm run preflight
pnpm run build

node packages/core/dist/cli.js init acme
```

## Commands

```
clearfelt-review init <slug> [--depth quick|standard|deep] [--root <dir>] [--previous <run>]
clearfelt-review stage <run> <stage>
clearfelt-review approve <run> scope|research-plan|findings
clearfelt-review validate <run>
clearfelt-review quality <run>
clearfelt-review modules <run>
clearfelt-review coverage <run>
clearfelt-review prioritise <run>
clearfelt-review change-tree <run> [--json]
clearfelt-review trace <run> <id> [--reverse]
clearfelt-review render <run> --format brief|plan|html|json [--out <path>]
clearfelt-review diff <run-a> <run-b>
```

## Documentation

- [AGENTS.md](AGENTS.md) hard rules and orientation
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) the intellectual model and a module-by-module tour
- [docs/DEVELOP.md](docs/DEVELOP.md) working on the repo
- [docs/ROADMAP.md](docs/ROADMAP.md) what is deliberately not built, and the known limitations
- [docs/decisions/](docs/decisions/) ADRs and Notes

## Author

Andrei Nita

## License

MIT
