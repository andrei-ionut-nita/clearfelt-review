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

- **`Observation.scanned_source_ids`**, so an absence established across several pages names all of them. Surfaced by the first real run against a live site, and recorded in `docs/decisions/notes/0003-multi-source-absence.md`. Validation now requires it when `search_scope` names more than one place, and adding the rule immediately caught two existing fixtures doing exactly what it forbids.

- **The output contract** (`quality/contract.ts`). Ten fixed questions every recommendation must answer, checked against real fields and real reference chains rather than prose length: a recommendation citing an evidence chain that stops before reaching a source, or naming no asset to change, fails the same way a recommendation with an empty field does.

- **Mechanical quality checks** (`quality/checks.ts`), nine of them: a recommendation restating its own finding, a falsifier that adds no observable condition beyond its own hypothesis, a falsifier phrased as a success rather than a failure, specification section 78's generic-phrase list, near-duplicate recommendations, a recommendation whose supporting findings declared an assumption it does not carry, a finding whose evidence has no independently corroborating source, a `derived` finding whose statement introduces vocabulary absent from its evidence, and a finding stated as current resting entirely on historical evidence. Each is a named `QualityCategory`, not a score, per `docs/decisions/0008-validation-is-not-evaluation.md`.

- **`quality/rubric.md`.** Named failure categories under structural, analytical and actionable tiers, each marked mechanical (a check owns it) or judged (only a reader can tell), so the rubric and the checker speak the same vocabulary and a reader knows which half of the promise code can actually keep.

- **`fixtures/adversarial/`**, thirteen generated run directories, one per mechanical check, each a run that passes `validate` completely and trips exactly one quality finding. Written from the same case table the tests run against, so a fixture and its test cannot drift the way hand-maintained ones do; `pnpm run fixtures:write` regenerates every committed fixture from the code that defines it.

- **The `quality` command**, exiting 1 on a defect and 0 on cautions alone. A caution can be the honest answer, so making every finding fatal would teach a user to stop reading the report; only a defect blocks.

- **Every renderer carries the run's own quality report.** `ReviewView.quality` is computed once and read by json, plan and html alongside priorities, the change tree and coverage, so no renderer can show a confident plan while the quality report says a recommendation is untestable. The plan and the HTML report both print the section even on a clean run, so its absence is never itself a signal.

- **`Comparison.positioning_territories`**, the field that lets specification section 19's saturation table be computed rather than authored. `comparison-synthesis.ts` counts qualified comparisons contesting a territory, weighted by relevance, and bands the result into a four-valued `Intensity` scale that stretches to "very high" where three-valued `Level` cannot. Only `qualified` comparisons count, so a candidate that has not yet survived qualification cannot make a territory look crowded. See `docs/decisions/0009-computed-saturation.md`.

- **Opportunity scored from saturation and position.** A fixed lookup table over the computed saturation and the authored `current_position` produces a four-valued opportunity rating and a one-word classification (`white_space`, `differentiation_opportunity`, `contested`, `weak_spot`, `table_stakes`, `underoccupied`). Two properties hold by construction rather than by the table's exact values: opportunity never falls as position improves at fixed saturation, and never rises as saturation worsens at fixed position.

- **`Opportunity.white_space.saturation` removed.** It was an authored `Level` set by the same reasoning stage that decided the territory mattered, the same failure ADR 0003 already named for priority. `current_position` stays authored, because it is a judgement about the subject's own standing that the comparison landscape cannot settle.

- **The saturation table in every renderer.** `plan.ts` and the HTML report both print positioning territories with saturation, current position, computed opportunity and a one-line rationale naming which comparisons produced the count, alongside the existing comparison landscape table.

- **The module registry** (`modules/registry.ts`), specified in Phase 1's plan but not built until now. Eighteen `ModuleSpec` rows, each with a `key`, a `label`, what it analyses from specification section 21, and an `activates(signals)` predicate. `deriveSignals` reads only `scope.objective`, `scope.decision`, audience text, `scope.channels`, `scope.comparison_applicable` and captured asset types and paths, never `Entity.type`. Three modules (`positioning`, `audience`, `messaging`) activate unconditionally; `competitive_landscape` reads `comparison_applicable` directly; the rest read keyword and asset-type signals. See `docs/decisions/0010-signal-based-module-activation.md`.

- **`clearfelt-review modules <run>`**, printing the deterministic suggestion for `review-onboard` to consult and argue with before writing `plan.json`.

- **Module selection validated for completeness, not just shape.** `checkModuleSelection` in `validate/integrity.ts` rejects a plan using a key the registry does not define, a key listed as both activated and dormant, or a registry module the plan never classifies at all. That last rule does the most work: "a reader should see what you chose not to look at" only holds if every module gets a verdict.

- **`invariant-19.test.ts`**, a grep-shaped test over production source rather than a semantic one: no file may compare or switch on an entity type field, and no file may string-compare against a fixed archetype vocabulary. Verified to actually fire by introducing a real violation and watching it fail before removing it.

- **`fixtures/commercial-saas`**, a second complete run, generated from `packages/core/src/testing/worked-example-saas.ts`, deliberately lighter than personal-brand rather than matching its depth. Proves the registry adapts rather than defaulting to one shape: it activates `pricing`, `offer` and `acquisition` where personal-brand leaves them dormant and vice versa for `content`, `credibility` and `discoverability`, checked directly by `fixtures.test.ts`. Its comparison landscape is deliberately crowded (two qualified comparisons contesting one territory) next to an uncontested white-space territory, the other half of the saturation table personal-brand alone only shows one side of. Its change tree roots on `signup_flow` alongside `website_page`, proving a non-website asset type renders correctly outside a unit test fixture.

- **`diff.ts`**, comparing two runs of the same subject. Reads only `Versioned.supersedes`, never id equality: `ids.ts` allocates fresh within every run, so an identical id in two runs means nothing and a diff tool that treated it as identity would be silently wrong. Scoped to comparisons, findings, opportunities, assumptions and recommendations; sources, observations, evidence and research questions are excluded because they are re-collected every run and would report near-total churn regardless of what actually changed. Reports what carried forward (via a real `supersedes` link), what is new, what quietly dropped out of the older run with nothing claiming to supersede it, and any `supersedes` pointing at an id that does not exist in the older run at all. Also surfaces feedback from the older run whose target was not visibly carried forward. See `docs/decisions/0011-cross-run-identity-is-supersedes-only.md`.

- **`clearfelt-review diff <run-a> <run-b>`**, and **`clearfelt-review init <slug> --previous <run>`**, which stamps `previous_run_id` and copies the previous run's `feedback.json` into the new one via the new `carryForwardFeedback`. The copy is a lookaside list for the reasoning layer to check candidates against by name, not a set of live references: the ids inside it still belong to the old run.

- **Rerun guidance in `review-onboard`, `review-analyse` and `review-recommend`**: read carried-forward feedback before re-proposing anything, and set `supersedes` on any comparison, finding, opportunity, assumption or recommendation that continues one from the previous run. Verified by hand against a constructed rerun of the personal-brand fixture, which is also how the guidance's necessity was confirmed: leaving `supersedes` unset made every substantively-unchanged item read as fully dropped and replaced, the correct behaviour given ADR 0011, but one that makes the guidance load-bearing rather than nice-to-have.

### Fixed

- An absence observation attributed to one source when it was established across five credited one page with work done across all of them, and made the finding built on it report as resting on a single source when it rested on five. A positive observation has one natural source and an absence does not; the model had quietly assumed every observation was the first kind. No fixture caught it, because the fixtures were written by the same reasoning that wrote the model.

- `research_question.stop_detail` was in the model and reached no output, so a reader saw "insufficient evidence" as a bare label with nothing to act on or disagree with. It now travels through coverage into every renderer. Found by a renderer test looking for the wrong string.

- The HTML report scrolled sideways at 390px while every unit test passed. `max-width` plus `justify-self` on `<main>` switched the grid item to fit-content sizing, so it sized to its content instead of its column. Content is now centred by an inner wrapper, with `min-width: 0` on the grid item so a wide table cannot blow the column out. Found by opening the page in a browser at that width, which is why `docs/DEVELOP.md` lists that as a pre-PR step rather than trusting the suite.

- Opening an evidence item built on an absence showed the absence but not the scope searched, leaving it one click deeper on the observation. An absence must not read as a bare claim anywhere it surfaces, so the scope now travels into that panel too.

- Research questions closed as `PARTIALLY_ANSWERED` could carry no `stop_reason`, which meant a question with real findings on it and real evidence still unresolved could look the same as one deliberately left open. Found while building the quality checks, where it first showed up as a defect in this project's own worked example and its own dogfood run. Moved from a Phase 2 quality caution into a validation rule (`entities.ts`), because a question that stopped without a machine-readable reason is a well-formedness problem, not a judgement call.

- The `derived`-finding-introduces-concepts check fired on every derived finding in the one real run available to test it against, because real analytical prose paraphrases constantly and the threshold was tuned against hand-written fixtures rather than real writing. Raised `NOVEL_TERM_LIMIT` from 3 to 5 against the real run's own novel-term counts, which cleared the paraphrase and kept the two genuinely borderline findings flagged.

- The circular-falsifier check treated "outcome X does not happen" as circular against "outcome X happens" only when the negation itself was the sole difference; a falsifier phrased as a null result ("indistinguishable from the preceding quarter") was not recognised as a failure condition because the shortfall-word list did not contain it. Widened the list; the underlying lesson is that a hand-written word list calibrated against invented fixtures will always be missing real phrasing.

- The dogfood run's one comparison predated `positioning_territories` and failed validation once the field became required. Named the territory it actually contests and removed the now-computed `saturation` from its opportunity's white-space block; the saturation table for that run now shows one contested-but-unassessed territory and the original run's flagship white-space claim, unchanged in substance.

- The dogfood run's `plan.json`, and the personal-brand fixture's, both predated the module registry and classified fewer than half of the eighteen modules. Both failed validation once `checkModuleSelection` required a verdict for every module. Completed both with real reasoning per module rather than a placeholder; the additions to the personal-brand fixture surface a small inconsistency worth naming: `conversion` stayed activated in the real run on grounds the deterministic suggestion did not offer (a keyword match on "contact" that the coarse text signal missed), which is exactly the "suggestion, not a verdict" design point working as intended rather than a bug.

### Notes

`prioritise.ts`'s low-confidence cap is currently unreachable: with the present weights, low confidence cannot score into the P0 band anyway. It is kept as a guarantee that survives a weight change, and the exhaustive test asserts the property rather than the mechanism.
