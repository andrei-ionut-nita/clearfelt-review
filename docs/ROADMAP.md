# Roadmap

Where this is going, and why the things that are not built yet are not built yet. For what already shipped and when, see `CHANGELOG.md`; this document only tracks what is ahead, what is deliberately behind, and what is out of scope.

## Now

All six phases from the original plan are built, plus a Phase 6 hardening pass: the deterministic model, lifecycle and validation; quality evaluation as a separate mechanism from validation; computed saturation over the comparison landscape; signal-based module selection, checked for completeness; a cross-run diff engine; and seven archetype fixtures proving the registry adapts rather than defaulting to one shape. See `README.md` for the full picture.

**Validated against a real, live site**, not only fixtures. The run declined to reproduce the specification's own illustrative example once the evidence did not support it, two of the reviewer's own working hypotheses were falsified mid-run and the research log shows both, and no P0 was invented where none was earned. That the system produced a *different* answer than its own worked example, when reality disagreed with the example, is the result worth trusting.

**Outcome measurement, closed** (`docs/decisions/0012-outcome-assessment.md`). A new `OutcomeAssessment` collection, written into the newer run rather than mutating the one being assessed, gives a rerun a dedicated place to say whether a past recommendation was implemented and, once enough time has genuinely passed, whether it worked, keeping "we measured X" and "the recommendation worked" as separate fields rather than one conflated sentence. `clearfelt-review rerun <previous-run>` makes a rerun first-class: it does what `init --previous` already did plus prints the previous run's recommendations and falsifiers, so the reasoning layer knows what to assess before it writes anything. `diff.ts` gained `outcome_assessments`, following the same additive-report precedent as Phase 6/7/9, plus `source_changes`, a `content_hash` comparison by URL that answers "did anything actually change" before any `review_period` math. `stage <run> complete` now renders `output/{brief.md,plan.md,report.html,review.json}` automatically, closing the same "a skill agreeing in its prompt" gap ADR 0005 exists to close elsewhere.

**Run against two real subjects it had never seen**, not only the fixture it was designed against. A rerun of `andreinita.co` one day after its first review, before any of three review periods had elapsed and with nothing on the site actually changed, is close to the most common real rerun shape there is, and it surfaced five real gaps a synthetic fixture could not have: `diff` read an unimplemented-but-still-live recommendation as abandoned; the mechanism waited for a review period to elapse when a `content_hash` comparison already had the answer for free; a summarising fetch tool nearly became the source of record for a `fetch`-claimed snapshot; an outcome-heavy, recommendation-light run's brief and HTML led with "no recommendations produced" instead of what it actually found; and nothing checked a written `recommendation_run_id` against the run's own `previous_run_id`. All five are fixed, documented in `docs/decisions/0012-outcome-assessment.md`'s "Update: findings from a real rerun". A first-time run against `ft.com`, structurally unlike every fixture (a large commercial subject behind bot protection that a plain fetch could not get past), separately confirmed the pipeline generalises without a workaround beyond swapping the retrieval method.

## Next

Roughly in priority order. Each of these is scoped, not speculative: the design question is understood, only the work is outstanding.

- **A real evaluation corpus, and inference-quality hardening.** The roadmap's own quality risk is unchanged by the above: "unjustified inference is only partly catchable," and a fixture built to prove a mechanism works is not built to be wrong in a way nobody anticipated, which is exactly what running against real subjects just demonstrated. More real subjects, reviewed and reran deliberately rather than as a side effect of testing something else, is what would keep surfacing gaps like the five above.
- **Monitoring and alerting on rerun results.** Two real reruns now exist (`andreinita.co`, and the `fixtures/charity-rerun` pair). `diff.ts` having been run against real subjects is no longer the blocker; knowing what a meaningful change looks like across more than one real pair still is.
- **Hosted persistence, an API, team collaboration.** The canonical model is already architecturally compatible: plain JSON with versioning fields present from day one (ADR 0001, Note 0002). Nothing here requires a model change, only a decision that the product needs it.
- **Caching and parallel research.** Performance work on a pipeline whose bottleneck is currently judgement, not throughput. Optimising it now would tune a system before knowing which parts of it produce good reviews.

An external draft (ChatGPT, prompted blind with no view of this repo) also proposed a ~14-item plan for this section; audited against the actual codebase, twelve of those items were already built and shipped, one (near-duplicate territory merging) turned out to be a decision already closed on purpose rather than a gap, and one (property-based archetype expectations, `packages/core/src/testing/archetype-expectations.ts`) was real and has since been built.

## Later

Nothing is currently held back here.

## Won't build, unless the constraint changes

- **A graph or vector database.** Files are canonical state on purpose (`decisions/0001-files-as-canonical-state.md`). This is a constraint the architecture depends on, not a gap waiting to be filled.
- **Token and cost accounting.** A Claude Code skill cannot reliably read its own spend, and a guessed number reported as a measured one is worse than an absent field. Buildable the day a real measurement path exists; not before.
- **Provable, fabrication-proof sourcing.** Requiring a snapshot and content hash for every fetched source makes fabrication visible on inspection, not impossible. No code can prove a page was actually visited. Documented as a standing limitation rather than something a future release will "fix".

## Known limitations

Open questions the architecture is honest about rather than silent on.

- **Unjustified inference is only partly catchable.** `claim_type` makes the evidence-to-conclusion leap declarable, and a mechanical check catches a `derived` finding that introduces a concept absent from its evidence. A plausible-but-wrong inference still needs a human, or a sharper adversarial fixture, to catch. This is the central quality risk in the product, not a corner case.
- **An unacknowledged silently-honoured rejection is still indistinguishable from a dropped one.** Phase 7 (`docs/decisions/0011-cross-run-identity-is-supersedes-only.md`) gave `review-recommend` a way to record "I saw this and am deliberately leaving it unaddressed" as a new `acknowledge` feedback entry, and `diff.ts` now reports it as `feedback_acknowledged`, separate from `feedback_still_open`. Nothing forces that entry to be written, on purpose: an item nobody acknowledges stays exactly as ambiguous as before, which is the honest state of a rerun that genuinely did not say why.
- **Near-duplicate territory names are flagged, never merged.** `docs/decisions/0009-computed-saturation.md` (Phase 8) adds a `similarity()`-based caution, `possible_duplicate_territories`, for pairs of occupied rows scoring above the same threshold Phase 6 uses for feedback. Reconciling a flagged pair by hand, renaming one comparison's territory to match the other during qualification, is still left to the reasoning layer's discipline; nothing here merges rows automatically, on purpose.
- **Two of specification section 19's saturation categories are cautions, not classifications.** "Emerging threats" and "benchmark strengths" need trend or benchmark-relationship evidence across two runs that `TerritoryClassification` structurally cannot see from one. Phase 9 (`docs/decisions/0011-cross-run-identity-is-supersedes-only.md`) computes them additively in `diff.ts` instead, as `DiffReport.emerging_threats` and `DiffReport.benchmark_strengths`, available only when a valid previous run exists. `classify()` itself is unchanged and remains single-run.
- **The evidentiary collections are not diffed item by item, on purpose.** `diff.ts` shows a count delta for sources, observations, evidence and research questions rather than a full diff, because they are re-collected every run and a full diff would report near-total churn regardless of what actually changed (`docs/decisions/0011-cross-run-identity-is-supersedes-only.md`).
