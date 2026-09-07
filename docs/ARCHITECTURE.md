# Architecture

## The intellectual model

This is the shape the whole product hangs off, and the thing that stops it becoming an AI website auditor.

```
ENTITY        what are we analysing?
   |
OBJECTIVE     what are they trying to achieve?
   |
DECISION      what decision must this research help someone make?
   |
EVIDENCE
   |
ANALYSIS
   |
RECOMMENDATIONS
   |
ACTION
   |
MEASUREMENT
   |
   +--------> NEXT REVIEW
```

Decision is the axis that matters most and the one most easily dropped. Without it the output degenerates into "here are 47 interesting things we discovered". With it, the research has a stopping condition that means something: we have enough when someone could decide.

It generalises with no entity-type branching:

| Entity | Objective | Decision |
|---|---|---|
| Company | Improve hiring | Which capabilities to build? |
| SaaS | Increase conversion | What should change? |
| Portfolio company | Improve EBITDA | Where is the highest-value intervention? |
| Charity | Increase donations | Which proposition or channel changes? |
| NGO programme | Increase impact | Which intervention should scale? |
| Government service | Improve adoption | Which service changes matter most? |
| Personal brand | Generate opportunities | What should the positioning become? |

## Two layers

**Deterministic (TypeScript).** Ids, schemas, lifecycle enforcement, referential integrity, priority computation, change-tree derivation, coverage arithmetic, traceability queries, rendering. Never interprets.

**Reasoning (Claude Code skills).** Research, interpretation, classification, synthesis, hypothesis generation. Writes JSON into the run directory. Never computes a priority, never invents an id.

The boundary is not stylistic. Everything on the deterministic side is something an LLM does unreliably and a computer does perfectly, and every one of those failures is silent: a duplicate id still renders, an authored priority still reads as authoritative, a hand-written change tree still looks like a plan.

## Canonical state

A directory of JSON files plus the snapshots of what was actually retrieved. No database, no embeddings, no vector store. It stays inspectable with `cat`, diffable with `git`, and repairable with an editor.

```
reviews/<slug>/<run-id>/
  run.json scope.json plan.json entities.json assets.json
  user-assertions.json research-questions.json sources.json
  observations.json evidence.json comparisons.json findings.json
  opportunities.json recommendations.json actions.json
  assumptions.json unknowns.json hypotheses.json feedback.json
  research-log.json
  snapshots/<source-id>.<ext>
```

Derived and never persisted as truth: change tree, priorities, coverage, all rendered output. Recomputed on every read, so they cannot drift from the model.

## Module by module

### `model/`

Plain interfaces, no runtime behaviour. `model/index.ts` also holds `COLLECTIONS`, the single registry that `store.ts`, `ids.ts`, `lifecycle.ts` and `validate/integrity.ts` all key off. Adding a collection means adding a row there and nothing else has a hardcoded filename list to fall out of sync with.

Three separate confidence axes, which spec section 65 forbids conflating:

- `Evidence.reliability`: how trustworthy the source and observation are
- `Finding.confidence`: how strongly the evidence supports the conclusion
- `Recommendation.confidence`: that the action follows from the analysis

A reliable source can still support a weak conclusion, and a strong conclusion can still imply a doubtful action.

### `ids.ts`

Allocation is max-plus-one, never length-plus-one. Entities are not renumbered when one is removed, because an id that has appeared in a rendered report must never later refer to something else.

### `lifecycle.ts`

The stage machine and a table of which collections are writable in which stage. `run` and `feedback` are writable everywhere: `run` is how the stage advances, and a user must be able to record a correction without rewinding.

### `store.ts`

Reads and writes the run directory. Writes go through a temporary file and a rename, because a half-written run directory produces referential integrity failures that have nothing to do with the intelligence and everything to do with an interrupted process.

Every write consults `lifecycle.ts` first. This is the enforcement point for the whole gating scheme.

### `validate/`

Three files, deliberately. `fields.ts` checks shape and pushes issues rather than throwing, so one pass reports every problem instead of the first. `entities.ts` is one validator per type, all identical in shape, shape-only. `integrity.ts` holds everything that needs to see more than one collection.

The split exists because a validator that reaches across collections cannot be tested on a single object, and grows into the file nobody wants to touch.

### `prioritise.ts`

Weights are stated once, at the top, so the trade-off is arguable rather than buried. Impact dominates; effort only nudges, because a hard change worth making is still worth making. Caps stop a high score in one dimension carrying a recommendation past a band it has not earned.

Every result carries the arithmetic that produced it, because spec section 25 requires the user to understand why something is P0.

### `change-tree.ts`

Groups by asset type, then splits paths into segments, then attaches `target` as a leaf. Root labels come from a small override map keyed on **asset** type, not entity type, so it does not reintroduce the branching that is banned.

Traceability ids roll up to ancestors, so selecting any node exposes everything beneath it.

### `coverage.ts`

Reports the weakest confidence in a module rather than the mean. Averaging would let one confident answer disguise an unanswered question beside it, which is the opposite of what this report exists for.

Counts independent sources separately from all sources throughout.

### `trace.ts`

Two edge tables, forward and reverse. The graph is a DAG rendered as a tree, so a recommendation reachable both directly from a finding and through an opportunity appears on both paths. That is deliberate: collapsing it would hide that the support is doubled.

Cycle protection exists even though a valid run has no cycles, because `trace` is the tool someone reaches for when something already looks wrong.

### `quality/`

Separate from `validate/` on purpose: `contract.ts` asks whether every recommendation answers the ten fixed questions of the output contract, against real reference chains rather than prose length. `checks.ts` runs nine mechanical checks against named failure categories rather than a score. `rubric.md` names the judgements neither can make. See `decisions/0008-validation-is-not-evaluation.md`.

### `comparison-synthesis.ts`

Section 19's saturation table, computed from the comparison landscape rather than authored by the reasoning stage that has the most reason to see a territory as open. Saturation is a weighted count of qualified comparisons naming a territory; opportunity is a fixed lookup from saturation and the subject's own stated position. See `decisions/0009-computed-saturation.md`.
