# Roadmap

Where this is going, and why the things that are not built yet are not built yet. For what already shipped and when, see `CHANGELOG.md`; this document only tracks what is ahead, what is deliberately behind, and what is out of scope.

## Now

All six phases from the original plan are built, plus a Phase 6 hardening pass: the deterministic model, lifecycle and validation; quality evaluation as a separate mechanism from validation; computed saturation over the comparison landscape; signal-based module selection, checked for completeness; a cross-run diff engine; and seven archetype fixtures proving the registry adapts rather than defaulting to one shape. See `README.md` for the full picture.

**Validated against a real, live site**, not only fixtures. The run declined to reproduce the specification's own illustrative example once the evidence did not support it, two of the reviewer's own working hypotheses were falsified mid-run and the research log shows both, and no P0 was invented where none was earned. That the system produced a *different* answer than its own worked example, when reality disagreed with the example, is the result worth trusting.

## Next

Roughly in priority order. Each of these is scoped, not speculative: the design question is understood, only the work is outstanding.

1. **Calibrate the mechanical quality checks against a fresh real run.** `NOVEL_TERM_LIMIT`, the shortfall-word list, and `GENERIC_PHRASES` have all been widened at least once against real output and at least once by inspection alone. Inspection finds plausible phrasing; only a real run finds what a hand-written list actually missed. This is the single highest-leverage next step, because it is the same method that already found and fixed four real defects in one earlier run (`docs/decisions/0008-validation-is-not-evaluation.md`).
2. **Narrow `feedback_still_open`'s remaining blind spot.** A similarity caution (Phase 6) now flags a re-proposed-and-rejected candidate under a fresh id. It still cannot tell a silently-honoured rejection, nothing re-proposed, from a rejection nobody acted on, because there is no candidate item to point at either way. Closing this needs a design decision, not just a wider check: possibly a required `review-recommend` note when a prior rejection is deliberately left unaddressed.
3. **A duplicate-territory check for the saturation table.** `positioning_territories` is free text so the table stays generalisable across archetypes, but two comparisons naming close variants of the same territory currently render as separate, uncontested rows. A `similarity()`-based caution, the same pattern Phase 6 used for feedback matching, is the likely shape: flag a near-duplicate territory name for a human to reconcile, never auto-merge it.
4. **Classify the two saturation categories the model cannot yet see.** "Emerging threats" and "benchmark strengths" (specification section 19) need trend or benchmark-relationship evidence over time that a single run's snapshot does not carry. This is blocked on having enough reruns of the same subject to compare against, which the diff engine now makes possible but does not yet do automatically.

## Later

Real, and not being actively worked toward, because something else has to be true first.

- **Outcome measurement, fully closed.** A later run's finding can already `supersede` an earlier recommendation and state whether its falsifier held. What is still missing is closing that loop automatically rather than by a reasoning layer choosing to write the right finding. Revisit only after ADR 0005's immutability position has been re-examined on purpose, not worked around.
- **Monitoring and alerting on rerun results.** Depends on `diff.ts` having been run enough times against real subjects to know what a meaningful change actually looks like, which depends on more real reruns existing than currently do.
- **Hosted persistence, an API, team collaboration.** The canonical model is already architecturally compatible: plain JSON with versioning fields present from day one (ADR 0001, Note 0002). Nothing here requires a model change, only a decision that the product needs it.
- **Caching and parallel research.** Performance work on a pipeline whose bottleneck is currently judgement, not throughput. Optimising it now would tune a system before knowing which parts of it produce good reviews.

## Won't build, unless the constraint changes

- **A graph or vector database.** Files are canonical state on purpose (`decisions/0001-files-as-canonical-state.md`). This is a constraint the architecture depends on, not a gap waiting to be filled.
- **Token and cost accounting.** A Claude Code skill cannot reliably read its own spend, and a guessed number reported as a measured one is worse than an absent field. Buildable the day a real measurement path exists; not before.
- **Provable, fabrication-proof sourcing.** Requiring a snapshot and content hash for every fetched source makes fabrication visible on inspection, not impossible. No code can prove a page was actually visited. Documented as a standing limitation rather than something a future release will "fix".

## Known limitations

Open questions the architecture is honest about rather than silent on.

- **Unjustified inference is only partly catchable.** `claim_type` makes the evidence-to-conclusion leap declarable, and a mechanical check catches a `derived` finding that introduces a concept absent from its evidence. A plausible-but-wrong inference still needs a human, or a sharper adversarial fixture, to catch. This is the central quality risk in the product, not a corner case.
- **`feedback_still_open` cannot see a silently-honoured rejection.** See "Next" above; a caution now narrows the adjacent case but this one is still fully open.
- **Positioning territories have no duplicate-detection.** See "Next" above.
- **Two of specification section 19's saturation categories are unclassified.** See "Next" above.
- **The evidentiary collections are not diffed item by item, on purpose.** `diff.ts` shows a count delta for sources, observations, evidence and research questions rather than a full diff, because they are re-collected every run and a full diff would report near-total churn regardless of what actually changed (`docs/decisions/0011-cross-run-identity-is-supersedes-only.md`).
