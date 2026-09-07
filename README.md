# Clearfelt Review

Evidence-backed strategic intelligence.

An entity plus a strategic objective goes in. A change plan comes out where every recommendation traces back to a finding, to evidence, to an observation, to a source you can open.

Part of the clearfelt family, alongside [clearfelt-diagram](../clearfelt-diagram), [clearfelt-slide](../clearfelt-slide) and [clearfelt-writing](../clearfelt-writing).

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

Phases 0 and 1 complete. 166 tests.

The deterministic layer: canonical model, id allocation, run lifecycle, stage-gated storage, validation and integrity, priority computation, change tree derivation, coverage, traceability, and four renderers over one shared view.

The reasoning layer: four Claude Code skills under `.claude/skills/`, one per stage, gated by the lifecycle rather than by their own good intentions.

Phase 2 next, and deliberately before breadth: quality evaluation. Six archetypes producing consistently mediocre reviews would be worse than one producing a defensible one.

## Getting started

```
pnpm install
pnpm run preflight
pnpm run build

node packages/core/dist/cli.js init acme
```

## Commands

```
clearfelt-review init <slug> [--depth quick|standard|deep] [--root <dir>]
clearfelt-review stage <run> <stage>
clearfelt-review approve <run> scope|research-plan|findings
clearfelt-review validate <run>
clearfelt-review coverage <run>
clearfelt-review prioritise <run>
clearfelt-review change-tree <run> [--json]
clearfelt-review trace <run> <id> [--reverse]
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
