# 0011. Cross-run identity is supersedes-only, never same-id

Date: 2026-09-07

## Context

Specification section 55 wants iteration: a rerun of the same subject that carries the previous run's corrections forward, and a way to see what changed since last time. `Versioned.supersedes` and `superseded_by` have been on every entity since day one for exactly this, per Note 0002, but nothing read them until Phase 5's `diff.ts`.

The obvious implementation of a rerun diff is wrong. `ids.ts` allocates every id fresh within a run, starting at `0001` for each collection, from whatever that run's own files currently hold. `F-0001` in one run and `F-0001` in a later run of the same slug are allocated completely independently and carry no relationship to each other whatsoever. A diff tool that matched on id equality across two run directories would report almost everything as "unchanged" purely by coincidence of allocation order, which is worse than reporting nothing: it would look like a careful comparison and be silently wrong.

## Decision

`diff.ts` never compares by id across the two runs it is given. The only fact that links an item in the newer run to one in the older run is an explicit `supersedes` pointer the newer run's author (`review-onboard` or `review-analyse`, depending on the collection) sets, naming the older run's id.

Everything else follows from that one rule:

- An item in the newer run with a `supersedes` pointing at a real id in the older run is **carried forward**.
- An item in the newer run with no such pointer, or one pointing at an id the older run does not have, is **new** (the latter is also flagged as a **broken link**, almost certainly a typo or a stale reference from copy-pasted reasoning).
- An item in the older run that nothing in the newer run claims to supersede is **dropped**, and is the section of the diff report worth reading first: it is where a reader finds out whether something disappeared on purpose or by accident.

The diff is scoped to five collections: comparisons, findings, opportunities, assumptions, recommendations. Sources, observations, evidence and research questions are excluded on purpose. They are re-collected on every run, so a naive diff of them would report close to 100% new and 100% dropped on almost every rerun, which teaches a reader to stop reading the tool rather than teaching them anything about what changed.

## Consequences

A rerun that changes nothing in substance but re-collects its evidence from scratch, which is the normal case, will show every analytical item as dropped-and-new unless the reasoning layer explicitly re-asserts continuity with `supersedes`. This was checked by hand against a constructed rerun of the personal-brand fixture: leaving `supersedes` unset on items that were substantively unchanged made them read as fully replaced, which is the correct and intended behaviour, not a bug to route around. The cost of that correctness is real: a reasoning layer that does not bother setting `supersedes` gets a diff report that is technically honest and practically useless. `review-onboard` and `review-recommend`'s guidance now says so directly.

`feedback_still_open` inherits the same discipline and the same limitation. It can only tell a reader that a correction's target was carried forward by a `supersedes` link; it cannot tell whether a reasoning layer silently re-honoured a rejection by simply not re-proposing the same candidate; nor can it recognise a candidate re-proposed and re-rejected under a fresh id as evidence the feedback was respected, because that would require exactly the same-id matching this ADR rejects. This is a real gap, not a subtle one, and it is stated here rather than glossed over: whether feedback was actually respected in spirit is a judgement a human reading `quality/rubric.md`'s categories has to make, not something this mechanism can fully automate.

## Update, Phase 6

`diff.ts` now imports `quality/text.ts`'s `similarity()` after all, which reads like a reversal of the alternative rejected below. It is not: the rejected alternative used similarity to decide identity, marking a match as carried forward. Phase 6's use never touches identity. It computes a similarity score between a still-open feedback item's target and every item the existing supersedes-only logic already classified as unlinked and new, and surfaces a close match as a labelled caution, "possibly related, unlinked", alongside the normal report. Nothing is marked carried, `feedback_still_open` is computed exactly as before, and the caution is additive: removing it would not change what the diff considers true, only what it points a reader toward checking. The distinction the paragraph below draws, between a false "carried forward" and a false "dropped and new", is exactly why the line was drawn where it was.

## Alternatives considered

**Match by content similarity** (the same `similarity()` used in `quality/text.ts`) rather than by explicit `supersedes`, to decide identity. Rejected because it would silently merge two findings that happen to use similar words but are not actually the same claim, which is a worse failure than reporting extra noise: a false "carried forward" hides a real change from the reader, where a false "dropped and new" only costs them a moment's confusion.

**Preserve ids across a rerun**, allocating from the previous run's high-water mark instead of starting fresh. Rejected because a run directory has to be a complete, self-contained, independently valid record per ADR 0001: an id scheme that depends on a previous run's state to allocate correctly is a run that cannot be understood, or even validated, on its own.
