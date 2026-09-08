# 0008. Validation and evaluation are different problems

Date: 2026-09-07

## Context

A run can be structurally perfect and analytically worthless:

```
valid JSON -> valid references -> real URLs -> real observations
   -> terrible analysis -> terrible recommendations
```

Validation answers "is this recommendation well-formed?". It cannot answer "is this recommendation any good?". Treating a green validation run as a quality signal is the most likely route to shipping an impressive pipeline that produces mediocre reviews.

Specification section 47 requires evaluation from day one.

## Decision

Two separate mechanisms, which must not be merged.

**Validation** (`validate/`) is a gate. Errors block rendering. It checks shape, references, lifecycle consistency and evidence discipline.

**Evaluation** (`quality/`) is a report, not a gate, and splits again:

- Mechanical checks in code: a recommendation restating its finding, a missing or circular falsifier, an unvalidated assumption dependency, duplicate recommendations, a finding whose evidence has no independent corroboration, a `derived` finding introducing a concept absent from its evidence, a finding stated as current whose evidence is entirely historical, research closed for want of evidence that nonetheless produced a finding, and generic-recommendation phrase detection against specification section 78's list.
- Judgement criteria in `quality/rubric.md`, expressed as **named failure categories, not a score**.

## Consequences

There is no "this review scored 87". A fixture fails because "the recommendation was generic, insufficiently evidenced and not falsifiable", which is regression-testable as prompts evolve and is honest about what was actually assessed.

This follows `clearfelt-writing`'s ADR 0001, deterministic scoring rather than LLM judgement, applied to the part that can be made deterministic, and refuses to fake the part that cannot. Specification section 40 forbids manufacturing precision, and a generated quality score is exactly that.

Harder: quality regressions need human attention on fixtures rather than a number in CI. That is the honest cost.

## Alternatives considered

**An LLM judge producing a 0-100 score.** Rejected on two grounds: the number would be treated as meaningful when it is not reproducible, and it would let a quality regression pass CI at 84 instead of 87 without anyone reading the review.

## Update, Phase 2

Shipped as `quality/contract.ts`, `quality/checks.ts` and `quality/rubric.md`, exercised against thirteen adversarial fixtures under `fixtures/adversarial/`, each a run that passes `validate` completely and trips exactly one quality check.

Running it against a real, live site (see `docs/ROADMAP.md`, "Now") did what a mechanism like this is supposed to do: it found two real recommendations missing `audience_relevance` on their supporting findings and two research questions closed without a `stop_reason`, all genuine gaps in that run's own data, not in the checker. Both are now fixed in the run, and the second was promoted from a quality caution into a validation error (`entities.ts`), because a question that stopped without saying why is a well-formedness problem, not a judgement call. The corroboration-illusory and inference-unjustified checks flagged four more items, correctly, as cautions rather than defects: a single-source finding that has no second source to find, and two findings whose derived claim_type stretched slightly past its evidence in ways a reader should see and decide about, not a machine.

## Update, Phase 3

`docs/ROADMAP.md`'s "Next" item 1 called for calibrating `NOVEL_TERM_LIMIT` (`quality/checks.ts`), `SHORTFALL_MARKERS`/`NEGATION_MARKERS` and `GENERIC_PHRASES` (`quality/text.ts`) against a fresh real run, because the Phase 6 widening of `GENERIC_PHRASES` had been done by inspection alone, with no real run behind it. A new run was executed end to end against `https://www.oxfam.org.uk/` (a genuinely new subject, not a re-run of the andreinita run Phase 2 had already mined), through all four gated stages, producing 8 findings, 3 opportunities, 4 recommendations and 6 actions from 13 retrieved sources.

What the run actually taught, by mismatch:

- **`audience_relevance` recurred.** `quality`'s output contract flagged the same "who is affected?" gap on three fresh recommendations that Phase 2 found on the andreinita run. This is not a new list-widening finding, it is the existing check generalising correctly to unseen content, which is itself worth recording: the check works, the gap is a habit of drafting, not a hole in the checker.
- **`NOVEL_TERM_LIMIT = 5` caught three genuine cases of overreach in this run's own finding text**, not false positives: a "derived" finding that named a petition's subject ("climate") when the evidence never said so, one that claimed a contrast with "an open amount field" nobody observed, and one that folded a claim about research completeness ("no independently-published verification... was retrieved in this pass") into a `derived` statement instead of stating it as a limitation. All three were real drift from evidence to conclusion, caught correctly, and fixed by rewording rather than by touching the threshold. Once reworded, `inference_unjustified` produced zero cautions on this run's other five derived findings. This is evidence the threshold is calibrated correctly on real text, not evidence it needs to move.
- **`GENERIC_PHRASES` and `SHORTFALL_MARKERS`/`NEGATION_MARKERS` produced no new signal**, in either direction. No recommendation in this run needed a phrase the list doesn't have, and every falsifier correctly passed `statesAFailureCondition`. This is a genuine limitation of a single-run calibration pass, not a clean bill of health: the four recommendations were written carefully enough that they were unlikely to reproduce consultant-theatre phrasing regardless of the list's completeness. The list-matching approach for `GENERIC_PHRASES` remains structurally one phrase behind whatever wasn't in a given run's text; nothing in this pass changed that.
- **No case this run warranted promoting a caution into a `validate/` error.** Unlike Phase 2's `stop_reason` gap, everything found here was either a genuine drafting gap (fixed in the run) or a correct caution (left as a caution): a `blocked` retrieval (WaterAid, Cloudflare 403 on two attempts) recorded honestly rather than guessed at, and two findings resting on one non-independent source each, correctly flagged rather than silently accepted.

No changes were made to `text.ts` or `checks.ts` as a result of this pass. The fixes were all in the run's own data (findings reworded to match their evidence, `audience_relevance` added, a second evidence item gathered for a thin research question), which is itself the finding: on this run, the calibration signal said "the checks are working, the draft needs tightening" rather than "the checks are missing something." A future pass should not read this as "the lists are now proven complete": one run, one subject, one drafting style narrows what can be learned, and `GENERIC_PHRASES` in particular has structural reasons (noted in `docs/ROADMAP.md`) to need revisiting again regardless of how many literal strings get added to it.

## Update, Phase 4

`docs/ROADMAP.md`'s "Next" item 1 called for moving `GENERIC_PHRASES` off literal string matching, per Phase 3's finding above: a literal list is structurally always one phrase behind whatever a run's text happened not to use, and no amount of appending strings fixes that. Shipped in `quality/text.ts`'s `genericPhrasesIn`.

**What changed, and what didn't.** `GENERIC_PHRASES` itself is unchanged, still a plain literal list. Phase 3's complaint was about the matching, not the list: the list is a reasonable seed vocabulary of consultant-theatre phrases, and nothing about switching how a piece of text is checked against it required touching the vocabulary. `genericPhrasesIn` now reports a phrase as present when either the existing literal substring check matches (kept, since it is cheap and exact) or a new fuzzy check does.

**What "fuzzy" means here, concretely.** `similarity()` elsewhere compares two whole, comparably-sized strings, a territory name against a territory name. A generic phrase is 2-4 words; `recommended_change` is an arbitrary-length sentence. Calling `similarity(phrase, recommended_change)` directly would be swamped by every unrelated word in the sentence inflating the union side of the Jaccard score, so the fuzzy check instead slides a window matched to the phrase's own length across the target text's content terms and scores each window against the phrase with the same `similarity()` used everywhere else:

1. Take the phrase's content terms (via the existing `contentTerms`, so already stemmed and stopword-filtered). Call the count `k`.
2. If `k < 2`, skip the fuzzy path for that phrase. `leverage ai` is the one phrase in the list where this fires: `"ai"` is two letters and `contentTerms` already drops anything under three as noise-length, leaving one content term, `leverage`, a word too common to window-match on its own without flagging unrelated writing. The literal check still catches `leverage ai` written out; only the fuzzy path is skipped.
3. Build the target text's content terms in their original order, duplicates kept (`contentTermSequence`, new; `contentTerms` itself returns a deduplicating `Set` because its other callers, `similarity` and `novelTerms`, do set arithmetic and have no use for a sequence).
4. Slide a window of `k` and, separately, `k + 1` terms across that sequence. `k` alone catches reordering (`similarity` is order-insensitive) and inflection (terms are already stemmed) with no tolerance for anything else in the window; `k + 1` additionally tolerates exactly one unrelated word landing between or around the phrase's own terms, `strengthen the client's brand` for `strengthen the brand`. Going further, `k + 2` and beyond, was considered and rejected: it starts admitting genuine partial matches (see the threshold reasoning below) rather than a tightly-bounded phrase-plus-one-word case.
5. Score each window against the phrase with `similarity()`, the same primitive Phase 6 uses for territory and feedback matching. If any window scores at or above the threshold, the phrase counts as matched.

**Threshold: 0.6, not the existing 0.4.** `diff.ts` and `comparison-synthesis.ts` use 0.4 for `POSSIBLE_MATCH_THRESHOLD` / `POSSIBLE_DUPLICATE_TERRITORY_THRESHOLD`, but both are cautions: an additive, cross-run hint that a human glances at and dismisses or acts on, cheap to get slightly wrong in either direction. `recommendation.generic_language` is a `defect`, feeding a quality report about whether a recommendation is specific enough to ship. A false positive there is a machine telling a person their concretely-worded recommendation is generic theatre, which costs more than a missed caution does. Every phrase in the current list has at most 3 content terms, which bounds the fuzzy scores available: a window missing one of a 2-term phrase's terms scores at most 1/3 ($\approx$0.33), and missing one of a 3-term phrase's terms scores at most 0.5. A window carrying every one of the phrase's own terms, in any order or inflection, with at most one extra word admitted (the `k + 1` case) scores at least $k/(k+1)$, 0.667 for the list's many 2-term phrases and 0.75 for its 3-term ones. 0.6 sits in the gap between the two: above every partial match the current list can produce, at or below every full match. In effect, for this list, the threshold currently behaves close to binary, a window either carries the whole phrase (however reordered or inflected, with room for one word of padding) or it doesn't; that is a property of this list's short phrase lengths, not of the threshold itself; a future phrase with 5 content terms would let 0.6 start admitting graded partial matches (4 of 5 terms scores 4/6 $\approx$0.667), which is the intended behaviour of a similarity threshold and not a special case to design around now.

**False positives, and staying visible rather than silently swallowed.** The concern this phase was asked to reason through explicitly: does fuzzy matching flag `build trust with your audience through better product decisions` as `build trust`? Yes, exactly as often as the literal check already did, since the words `build trust` appear verbatim in that sentence; this is not a new false positive the fuzzy path introduces. The fuzzy path's own false-positive risk is narrower: a window that shares only some of a phrase's terms with unrelated surrounding text. The 0.6 threshold was chosen specifically to keep that below the matching bar (see above), verified in `quality.test.ts` with a checkout-flow recommendation that shares the word "optimise" with `optimise the funnel` but nothing else, and is not flagged. `genericPhrasesIn` still returns the matched canonical phrases from `GENERIC_PHRASES`, not the raw window text, exactly as before: `checkGenericLanguage` (`checks.ts`) still shows a reader which phrase tripped, so a false positive, should one occur on real text the way Phase 3's literal-list gaps did, stays visible and correctable rather than silently swallowed.

**Not yet re-run against a live site.** Phase 3 is the calibration pass this responds to; this phase implements the mechanism it called for but does not itself re-run the checker against a fresh subject. That is the natural next calibration point once one is available, the same as `NOVEL_TERM_LIMIT` in Phase 3.
