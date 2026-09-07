# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Canonical intelligence model** (`packages/core/src/model/`). Eighteen collections covering the chain from source through observation, evidence, finding, opportunity and recommendation to action, plus scope, entities, assets, user assertions, comparisons, assumptions, unknowns, hypotheses, feedback and the research ledger. `COLLECTIONS` in `model/index.ts` is the single registry that storage, id allocation, lifecycle and integrity all key off, so no module keeps its own list of filenames to fall out of sync with.

- **Three separate confidence axes.** `Evidence.reliability`, `Finding.confidence` and `Recommendation.confidence` are distinct fields with distinct meanings, because a reliable source can support a weak conclusion and a strong conclusion can imply a doubtful action.

- **Run lifecycle enforced by the filesystem** (`lifecycle.ts`, `store.ts`). Writes are refused when the current stage does not permit them, with an error naming the stage that would. The three approval gates from the specification are therefore structural rather than advisory: a reasoning stage cannot write findings while still researching, or recommendations before findings are approved, whatever its prompt says.

- **Validation split three ways** (`validate/`). `fields.ts` checks shape and accumulates issues rather than throwing, so one pass reports every problem instead of the first. `entities.ts` is one shape-only validator per type. `integrity.ts` holds every check that spans collections, which is the half that actually catches broken intelligence.

- **Evidence discipline as mechanical rules.** A finding must cite evidence, evidence must cite observations, a recommendation must cite a finding, and an action must cite exactly one recommendation. A collapsed layer fails validation rather than shipping. Evidence that both supports and contradicts the same finding is rejected as a modelling error rather than treated as nuance.

- **User assertions held apart from evidence.** A finding resting only on `user_supplied` sources is rejected, as is an assertion marked corroborated by nothing but itself. This closes the contamination route where a user's belief passes every referential check and comes back to them as research.

- **Absence observations.** An `absence` observation must record the scope searched, so "no pricing found after checking these three pages" stays distinguishable from "they do not publish pricing".

- **Source independence.** Sources declare whether they are independent, republished, derived or same-organisation. Corroboration counts independent sources only, because two outlets reprinting one press release inflating a corroboration count is misleading precisely where the evidence is weakest.

- **Computed priority** (`prioritise.ts`). P0 to P3 derived from impact, effort, confidence and urgency, with stated weights, caps and a rationale on every result. Validation rejects an authored `priority` rather than ignoring it, so a reasoning stage cannot believe it set one and never learn otherwise.

- **Derived change tree** (`change-tree.ts`). Built from actions and the assets they affect, with traceability ids rolled up to every ancestor. Root labels key on asset type rather than entity type, so positioning, product and service subjects render correctly without reintroducing entity-type branching.

- **Bidirectional traceability** (`trace.ts`). Forward answers "why are you telling me this?" down to a source; reverse answers "what did this source actually change?" up to an action. The graph is a DAG rendered as a tree, so a recommendation supported by two routes appears on both, which is deliberate: collapsing it would hide that the support is doubled.

- **Coverage reporting** (`coverage.ts`). Question states, six distinct stop reasons, budget consumption, research failures pulled from the ledger, and findings standing on fewer than two independent sources. Module confidence reports the weakest answer rather than the mean, because averaging lets one confident answer disguise an unanswered question beside it.

- **CLI** (`cli.ts`): `init`, `stage`, `approve`, `validate`, `coverage`, `prioritise`, `change-tree`, `trace`. Hand-rolled argument parsing with no commander or yargs, matching the family convention.

- 96 tests, including exhaustive property tests over the priority caps rather than single examples, so a later weight change that silently makes a band reachable fails rather than ships.

- **Four renderers over one shared view** (`render/`). `ReviewView` is the single derived object every renderer reads, so none computes its own priorities or builds its own change tree. A test scans every rendered output for canonical ids and fails on any the model does not contain. Rendering refuses to run on a run that fails validation, because a report built on a broken model looks checkable and is not.

- **The interactive HTML report.** A single self-contained file with no CDN and no external stylesheet, so it keeps working emailed, offline or from a USB stick. Sections render server-side; the model travels as a JSON island for the two-directional drill-down. Uncertainty is in the visual language rather than described in prose: an inferred finding is tagged distinctly from a derived one, a contested finding shows what contradicts it, an absence carries the scope searched, and an unvalidated assumption appears on the card of the recommendation that rests on it.

- **Four Claude Code skills** under `.claude/skills/`, one per reasoning stage, handing off through the run directory rather than through conversation state. `skills-consistency.test.ts` fails if a skill references a CLI command, stage, gate or depth that does not exist, since Markdown and TypeScript otherwise drift silently and the failure surfaces halfway through a real review.

- **`fixtures/personal-brand`**, a committed run that deliberately exercises the awkward cases: an absence observation, contradicting evidence, an inferred finding on an unvalidated assumption, a user assertion the research contradicted, a question that ran out of evidence and one that was blocked. A test asserts it still matches the source that generated it, so a stale fixture cannot quietly make other tests meaningless.

### Fixed

- `research_question.stop_detail` was in the model and reached no output, so a reader saw "insufficient evidence" as a bare label with nothing to act on or disagree with. It now travels through coverage into every renderer. Found by a renderer test looking for the wrong string.

- The HTML report scrolled sideways at 390px while every unit test passed. `max-width` plus `justify-self` on `<main>` switched the grid item to fit-content sizing, so it sized to its content instead of its column. Content is now centred by an inner wrapper, with `min-width: 0` on the grid item so a wide table cannot blow the column out. Found by opening the page in a browser at that width, which is why `docs/DEVELOP.md` lists that as a pre-PR step rather than trusting the suite.

- Opening an evidence item built on an absence showed the absence but not the scope searched, leaving it one click deeper on the observation. An absence must not read as a bare claim anywhere it surfaces, so the scope now travels into that panel too.

### Notes

`prioritise.ts`'s low-confidence cap is currently unreachable: with the present weights, low confidence cannot score into the P0 band anyway. It is kept as a guarantee that survives a weight change, and the exhaustive test asserts the property rather than the mechanism.
