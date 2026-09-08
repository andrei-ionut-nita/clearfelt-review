# Roadmap

Where this is going, and why the things that are not built yet are not built yet. For what already shipped and when, see `CHANGELOG.md`; this document only tracks what is ahead, what is deliberately behind, and what is out of scope.

## Now

All six phases from the original plan are built, plus a Phase 6 hardening pass: the deterministic model, lifecycle and validation; quality evaluation as a separate mechanism from validation; computed saturation over the comparison landscape; signal-based module selection, checked for completeness; a cross-run diff engine; and seven archetype fixtures proving the registry adapts rather than defaulting to one shape. See `README.md` for the full picture.

**Validated against a real, live site**, not only fixtures. The run declined to reproduce the specification's own illustrative example once the evidence did not support it, two of the reviewer's own working hypotheses were falsified mid-run and the research log shows both, and no P0 was invented where none was earned. That the system produced a *different* answer than its own worked example, when reality disagreed with the example, is the result worth trusting.

## Next

Roughly in priority order. Each of these is scoped, not speculative: the design question is understood, only the work is outstanding.

- **Outcome measurement, fully closed.** A later run's finding can already `supersede` an earlier recommendation and state whether its falsifier held. What is still missing is closing that loop automatically rather than by a reasoning layer choosing to write the right finding. Revisit only after ADR 0005's immutability position has been re-examined on purpose, not worked around.
- **Monitoring and alerting on rerun results.** Depends on `diff.ts` having been run enough times against real subjects to know what a meaningful change actually looks like, which depends on more real reruns existing than currently do.
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
