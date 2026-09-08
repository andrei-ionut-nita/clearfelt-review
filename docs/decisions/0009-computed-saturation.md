# 0009. Saturation is computed from the comparison landscape, never authored

Date: 2026-09-07

## Context

Specification section 19 wants a saturation table: for each positioning territory, how crowded it is, where the subject stands, and what opportunity that combination represents. Section 40 forbids manufacturing precision the evidence does not support.

Before Phase 3, `Opportunity.white_space.saturation` was an authored `Level`, set by the same reasoning stage that decided the territory mattered in the first place. That is the same failure ADR 0003 names for priority: a judgement asserted about the landscape by the party most invested in the finding being interesting, with nothing to check it against.

The comparison set already carries what is needed to check it. Every qualified `Comparison` can name the positioning territories it contests, which means how crowded a territory is can be counted rather than asserted.

## Decision

`Comparison.positioning_territories: string[]` is a new field, populated during qualification alongside `type` and the overlap ratings.

`Opportunity.white_space.saturation` is removed from the model. `comparison-synthesis.ts` computes it: a weighted count of qualified comparisons contesting the territory, banded into a four-valued `Intensity` scale (`very_high` down to `low`), with the count and the names that produced it carried as a stated rationale.

`current_position` stays authored. It is a judgement about the subject's own standing, grounded in the findings behind the opportunity, the same way `Finding.importance` is authored rather than derived. Nothing in the comparison set can settle where the subject itself stands.

Only `qualified` comparisons count. A `proposed` comparison has not survived qualification yet, and letting it crowd a territory would let an unvetted candidate shape a strategic reading before anyone checked it belonged. A `rejected` comparison was found not to belong at all.

An `opportunity` rating (also four-valued) is then computed from saturation and position through a fixed lookup table, documented as one reasonable operationalisation of the section 19 example rather than a reproduction of its exact figures, which appear to draw on judgement beyond those two axes. Two properties hold by construction: opportunity never falls as position improves at fixed saturation, and never rises as saturation worsens at fixed position. Those are the properties worth trusting, not any individual cell.

## Consequences

A territory cannot be called uncontested by assertion. If a reasoning stage believes a territory is open, the comparison landscape has to actually be thin there, and the count is visible for a reader to check.

The four-valued `Intensity` scale is scoped to this module rather than folded into the three-valued `Level` used everywhere else in the model, because section 19's own example needs a "very high" saturation and a "very high" opportunity that three values cannot represent, and stretching `Level` to four values everywhere else would be a much larger change for one section's benefit.

Two categories from section 19's bullet list, emerging threats and benchmark strengths, are deliberately not classified here. Both need trend or benchmark-relationship evidence the model does not yet carry (a `Comparison.type: 'benchmark'` exists, but nothing yet distinguishes a benchmark that is pulling ahead from one that is standing still). Computing a classification that looked like it detected them would be manufacturing a signal, not deriving one. Recorded in `docs/ROADMAP.md` as a known limitation rather than faked.

Harder: territories are free-text strings, not a controlled vocabulary. Two comparisons naming close variants of the same territory ("technical leadership" and "technology leadership") will not be recognised as the same row. Normalising that automatically risks merging territories that are not actually the same claim, so this is left to the reasoning layer's discipline in qualification rather than solved mechanically, and stated here rather than silently accepted.

## Alternatives considered

**Keep saturation authored and add a mechanical check that flags it if it disagrees with a naive comparison count.** Rejected for the same reason ADR 0003 rejected the equivalent for priority: the warning would fire whenever the reasoning stage's judgement differed from the count, which is often, and get ignored.

**A fixed taxonomy of positioning territories.** Rejected because it reintroduces entity-type branching by the back door: the territories that matter for a personal brand's hiring positioning are not the ones that matter for a charity's donor proposition, and a fixed list would either be too narrow or would grow into a second product ontology.

## Update, Phase 8

The "Harder" paragraph above names a gap directly: two comparisons naming close variants of the same territory render as separate, uncontested rows, and normalising the strings automatically risks merging territories that are not actually the same claim. That risk is still real and this update does not remove it. It adds a caution instead of a merge, the same shape `docs/decisions/0011-cross-run-identity-is-supersedes-only.md`'s Phase 6 used for feedback matching.

`comparison-synthesis.ts` now computes `possible_duplicate_territories` alongside `rows`. Every pair of occupied rows, meaning at least one qualified comparison names each, is scored with `quality/text.ts`'s `similarity()`, and a pair scoring at or above 0.4, the same threshold Phase 6 uses in `diff.ts`, for consistency across the codebase's two uses of `similarity()` as a caution signal, is surfaced as a `TerritoryPossibleDuplicate`, naming both territory strings and every qualified comparison id behind each side.

Nothing here merges rows, changes saturation counts, or resolves the free-text design decision in the "Decision" section above: two near-duplicate territories still occupy two separate rows in the table, exactly as before. The caution is additive and can be ignored with no change to what the table asserts, only to what a reader is pointed toward checking. It is restricted to occupied rows on purpose: a territory named only by an opportunity's `white_space` has no comparison id to point at, and a caution naming only one real side is not the actionable pointer this exists to give.

## Update, Phase 9

The Consequences section above names emerging threats and benchmark strengths as deliberately unclassified, because both need evidence across two runs that this module structurally cannot see: `buildSaturationTable()` takes a single `Review`. That gap is now closed, but not here. `TerritoryClassification` and `classify()` are unchanged by this update, still single-run, still six values. The two categories are computed in `diff.ts` instead, as new `DiffReport.emerging_threats` and `DiffReport.benchmark_strengths` fields, following the same additive-caution shape as this file's own Phase 8 and `docs/decisions/0011-cross-run-identity-is-supersedes-only.md`'s Phase 6 and 7: a caution surfaced alongside a report, never a value this module's classification can take. See that ADR's Phase 9 update for the mechanism.

The one piece of this module's design that update reuses directly is `buildSaturationTable()` itself, called once per run and diffed territory by territory in `diff.ts`, which means the free-text territory-matching caveat two paragraphs up applies across runs exactly as it applies within one: a territory renamed between runs is invisible to the cross-run comparison too, for the same reason normalising it automatically remains rejected here.
