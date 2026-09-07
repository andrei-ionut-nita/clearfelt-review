# Clearfelt Review

Evidence-backed strategic intelligence. An entity plus a strategic objective goes in, and a change plan comes out where every recommendation traces back to a finding, to evidence, to an observation, to a source.

Part of the clearfelt family, alongside `clearfelt-diagram`, `clearfelt-slide` and `clearfelt-writing`.

## What this is not

It is not a website auditor, a report generator, or an LLM prompt that produces a polished PDF. The product it must not become is "upload your site, AI gives you an audit". See `docs/ARCHITECTURE.md` for the distinction and why it drives every design decision here.

## Hard rules

- **No em-dash characters in prose.** Markdown, code comments, commit messages. Use a comma, colon, period, semicolon, or restructure the sentence. Enforced in CI by `pnpm run check:em-dash`. Where a test genuinely needs the character, write it as a `\u2014` escape rather than adding a grep exemption: the exemption is what lets the rule rot.
- **The filesystem is the state machine.** `store.ts` refuses a write the current run stage does not permit. A reasoning stage agreeing in its prompt to respect the gates is not enforcement: prompts drift, get compacted, and get edited by whoever is in a hurry.
- **Priority is computed, never authored.** `priority` is deliberately absent from `Recommendation`. `prioritise.ts` derives it from impact, effort, confidence and urgency. An authored priority lets the reasoning layer assert a P0 it has not earned, and validation rejects one if it appears.
- **The change tree is derived, never written.** `change-tree.ts` builds it from actions and the assets they affect. Generated as prose it becomes a second hallucination layer, where the tree says one thing and the recommendations say another.
- **What the user asserts is not evidence.** User statements enter as `UserAssertion`, never as findings. A finding resting entirely on `user_supplied` sources is the user's own belief laundered back at them as research, and integrity rejects it.
- **A finding declares its claim type.** `derived` restates what the evidence shows; `inferred` goes beyond it. Unjustified inference survives every provenance check, because the sources are real and the conclusion still does not follow.
- **Absence is an observation, not a conclusion.** "No pricing found after checking /pricing, /product, /faq" is defensible. "They do not publish pricing" is not. An `absence` observation without `search_scope` is rejected.
- **Corroboration counts independent sources only.** Two outlets reprinting one press release are one source. Without this, "three sources agree" becomes actively misleading exactly where the evidence is weakest.
- **No renderer may hold a fact that is not in the model.** One canonical model, multiple renderers. A renderer that calls an LLM or adds a detail is a parallel narrative, not a view.
- **No entity-type branching.** No `if entity.type === 'personal website'`. Behaviour comes from the module registry reading objective, audience and available evidence. This is what keeps the system general rather than hard-coded to its first test case.
- **Ids are allocated by code, never by the reasoning layer.** A duplicate id silently reroutes a traceability chain to the wrong entity: the report still renders, still validates, and now points at the wrong evidence.

## Layout

```
packages/core/src/
  model/          canonical types, one file per area, no runtime behaviour
  ids.ts          id allocation and parsing
  lifecycle.ts    run stage machine and per-stage write permissions
  store.ts        run directory read and write, atomic, stage gated
  validate/       fields (shape), entities (per type), integrity (cross collection)
  prioritise.ts   impact/effort/confidence/urgency to P0..P3, with reasoning
  change-tree.ts  actions and assets to a derived tree, plus ASCII rendering
  coverage.ts     question states, stop reasons, gaps, budget spend
  trace.ts        forward and reverse traceability walks
  testing/        fixture builders used by tests
  render/         one shared ReviewView, then json, brief, plan and html
.claude/skills/            the reasoning layer, one per stage
reviews/<slug>/<run-id>/   canonical state, gitignored
fixtures/                  committed fixture runs
```

## The four reasoning stages

Each has a bounded responsibility and an explicit contract, and hands off
through the run directory rather than through conversation state:

1. `review-onboard` scope, decision, entities, assets, assertions, questions. Gates 1 and 2.
2. `review-research` sources, snapshots, observations, evidence, comparisons, the ledger.
3. `review-analyse` findings, opportunities, assumptions, unknowns. Gate 3.
4. `review-recommend` recommendations, actions, then the deterministic steps and the renderers.

Four skills is the current implementation of that invariant, not a rule about
the number four. `skills-consistency.test.ts` keeps them honest about the CLI:
a skill referencing a command that does not exist fails there rather than
halfway through a real review.

## Commands

```
pnpm install
pnpm run preflight     lint, em-dash check, typecheck, test
pnpm run build
node packages/core/dist/cli.js
```

## Where things are documented

- Architecture and the intellectual model: `docs/ARCHITECTURE.md`
- Working on the repo, pre-PR checklist: `docs/DEVELOP.md`
- Work deliberately not built, with reasons: `docs/ROADMAP.md`
- Decisions: `docs/decisions/`, ADRs for compositional changes, Notes for additive ones
