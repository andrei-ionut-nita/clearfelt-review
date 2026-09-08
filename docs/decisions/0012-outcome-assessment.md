# 0012. Outcome assessment is a new collection, written into the newer run

Date: 2026-09-08

## Context

`docs/ROADMAP.md`'s "Next" section named the gap directly: a later run's finding could already `supersede` an earlier recommendation and say in prose whether its falsifier held, but nothing gave that verdict a dedicated shape, so the loop only closed when a reasoning layer happened to write the right sentence. The roadmap tied revisiting this to ADR 0005's position on purpose: a `complete` run has nothing writable (`WRITABLE_BY_STAGE.complete = []`), so whatever closes the loop cannot mutate the run being assessed. It has to be a new, additive fact recorded somewhere else.

At the same time, no `rerun` command existed. `init --previous <run>` only stamped `previous_run_id` and copied `feedback.json` forward; nothing produced a second run of the same subject end to end, so there was no place a verdict about a first run's recommendations could naturally be written. The two gaps are one mechanism seen from two ends.

## Decision

A new collection, `outcome_assessments` (prefix `OA`, `model/outcome-assessment.ts`), lives entirely in the newer run. Each entry names `recommendation_id` and `recommendation_run_id`, the prior run's recommendation being assessed and which run it belongs to, a `verdict` (`achieved | failed | inconclusive | not_implemented`), `evidence_ids` grounded in this run's own evidence, and `measured` kept apart from `rationale`, the same discipline Evidence/Finding already models elsewhere: what was observed is not the same claim as what it means.

`recommendation_id` and `recommendation_run_id` are deliberately never resolved against anything in this run's own referential index (`validate/integrity.ts`). Per ADR 0001, a run directory must be complete and independently valid without a previous run's directory present on disk; checking the pointer would make that impossible. This is the same shape of pointer `Versioned.supersedes` already uses, a resolved reference to a specific, known prior run, not the same-id matching ADR 0011 rejected twice.

Writable in `recommending`, not `findings_pending`. An outcome verdict is a conclusion, the same shape as a `Finding`, which argued for `findings_pending` at first. But the skill that actually has whole-run visibility to write it is `review-recommend`, which runs in `recommending` and already reads the previous run via `diff` before handing over. ADR 0011 Phase 7 made the identical call for `acknowledge` feedback, for the identical reason: `review-onboard` runs before this run has any content to compare against, `review-recommend` runs last and sees the whole thing.

`diff.ts` does not add `outcome_assessments` to `DIFFABLE_COLLECTIONS`. That list's identity model is same-run-shape `supersedes`; an assessment doesn't supersede anything, it points backward by a different, already-resolved pointer. Instead it is an additive `DiffReport.outcome_assessments` field, following the exact precedent Phase 6, 7 and 9 already set (`feedback_acknowledged`, `emerging_threats`, `benchmark_strengths`): computed alongside the existing report, filtered to entries whose `recommendation_run_id` names the run being diffed, never fabricating a claim about a pair that isn't actually sequential.

A failed, falsifier-held assessment does not automatically flag or supersede the recommendation it assesses. `quality/checks.ts` gains one caution, `outcome_assessment.failed_without_followup`, for a failed verdict with no recommendation in the same run superseding it, surfaced for a human to act on. Nothing forces the follow-up to exist. ADR 0011 Phase 7 rejected making `acknowledge` mandatory for the same reason: a required field a reasoning layer fills in reflexively degrades into the boolean the design exists to avoid.

`clearfelt-review rerun <previous-run>` is new, in `rerun.ts` and `cli.ts`. It performs exactly what `init --previous` already did (`newRun`, `initRun`, `carryForwardFeedback`), plus one addition: it prints the previous run's recommendations with their falsifiers, so the reasoning layer knows what needs an assessment before it writes anything. It does not pre-populate entities, scope or comparisons as drafts, and does not auto-invoke `diff`. Both would move a judgement call onto the enforcement side of the line `lifecycle.ts` and the skills already keep sharply drawn.

## Consequences

Writing an assessment is now checkable, renderable and diffable rather than living only in a recommendation's free-text fields. `render/plan.ts`, `render/brief.ts` and the HTML report each gained an "Outcome assessments" section; `trace.ts` can walk an assessment forward to the evidence that grounds it, and reverse from that evidence back to the assessment.

Nothing forces an assessment to be written at all. A rerun that never assesses a single prior recommendation is exactly as valid as one that assesses all of them; the gap this closes is that there is now somewhere honest to put the verdict when the reasoning layer does write it, not a requirement that it always does. That restraint is deliberate, matching every other place in this codebase where a mandatory field was considered and rejected in favour of an honest absence.

`rerun`'s printed summary is guidance, not state. It is not written to disk, so nothing tracks whether it was read or acted on beyond what the resulting `outcome_assessments.json` shows.

Every existing committed fixture and real run directory needed `outcome-assessments.json` added (as `[]`), the same one-time cost every previous collection addition has paid, per `docs/DEVELOP.md`'s checklist.

## Alternatives considered

**Fold the verdict into `Recommendation.measurement`.** Rejected: `measurement` is evidence-shaped, a plan for how to know, per note 0002. Writing a verdict into it would blur the same distinction that note exists to keep separate, and it would require mutating the older run's own recommendation, which ADR 0005 already rules out.

**Rely only on a superseding `Recommendation`.** Rejected as sufficient on its own: a new recommendation is optional, and the honest outcome of "this failed, nothing further is recommended" should not require inventing one just to have somewhere to record the verdict.

**Add `outcome_assessments` to `DIFFABLE_COLLECTIONS`.** Rejected: that list's carried/new/dropped classification is built entirely on `supersedes` identity within the same collection shape. An assessment's cross-run pointer is a different kind of fact, already resolved at authoring time, and forcing it through the same machinery would either require it to supersede something (it doesn't) or silently misclassify it.

**Make `outcome_assessments` writable in `findings_pending`.** The initial draft of this decision put it there, matching its evidence-shaped nature. Corrected once the reasoning-layer pipeline was checked: `review-analyse` operates in `findings_pending` and has no visibility into a previous run at all; only `review-recommend`, in `recommending`, reads the diff against the prior run before handing over.

## Update: findings from a real rerun

The mechanism was run for real against `andreinita.co`, one day after the run it reruns, with none of the three prior recommendations' review periods elapsed and, as it turned out, nothing on the site changed at all. That is probably the single most common rerun shape: too early to measure anything, nothing implemented yet. Five gaps surfaced that no fixture had, because a fixture is built to prove the mechanism works, not to be wrong in a way nobody anticipated.

**`diff` read as abandonment for the common case, not just the rare one.** `diffCollection`'s `dropped` classification is correct: nothing superseded R-0001 through R-0003, so they are honestly dropped from A's perspective. But a reader skimming the collections section sees three "dropped" recommendations with no hint that they are still fully live and simply unimplemented; the only place that says so is the separate outcome-assessments section, further down. Fixed by joining, in `renderDiffAscii` only: a dropped recommendation with a matching `outcome_assessments` entry is annotated inline (`dropped R-0001 ... (assessed in <run>: not_implemented, OA-0001)`) rather than left to read the same as a recommendation nobody addressed at all. No change to `CollectionDiff`'s data shape: the join is presentational, computed from data the report already carried.

**Waiting for `review_period` was the wrong first move.** The cheaper, already-available signal is whether the tracked pages changed at all, answerable from `content_hash` with no waiting. Nothing computed this; it was done by hand with `curl` and `sha256sum`. Fixed with a new additive `DiffReport.source_changes` field: sources in both runs sharing a URL are compared by `content_hash` and reported `unchanged`, `changed`, or `unknown` (when either side lacks a hash). Matched by URL, not id, for the same reason `outcome_assessments` matches by `recommendation_run_id` rather than same-id: ids are never stable across runs. Not gated by `unrelated_runs`, unlike the trend fields (`emerging_threats`, `benchmark_strengths`): a shared URL's content either matches or it does not, regardless of whether B claims A as its previous run, so withholding it would hide a true fact rather than avoid a fabricated one.

**A summarising fetch tool nearly became the source of record.** The first retrieval pass used a tool that paraphrases a page on the way back, producing a fluent, plausible account that was almost trusted as-is. Only re-fetching the raw bytes surfaced the `content_hash` match that made the whole run's conclusion immediate and checkable rather than asserted. `review-research/SKILL.md` now says explicitly: retrieve actual bytes for anything claimed as `fetch`, or record `retrieval_method: 'manual'` honestly rather than claim `fetch` with a fabricated or absent hash.

**An empty `recommendations.json` read as an empty run.** The brief and HTML hero both led with "no recommendations produced," true but misleading when the run's actual content is three outcome verdicts. `render/brief.ts` and `render/html/index.ts` now lead with `outcome_assessments` (before "Primary opportunity" / "Top priorities" in the brief; before `context` in the HTML nav and body; a dedicated hero state, `outcomeHero`, replacing "no recommendations" when there are none but outcome assessments exist). `render/plan.ts` moved its own `outcomeAssessments` section to lead the detailed body, ahead of the to-do list. None of this fires on a normal first run, where `outcome_assessments` is empty and every changed function falls through to its previous behaviour unchanged.

**Nothing checked `recommendation_run_id` against `run.previous_run_id`.** It was correct by hand in this run; a copy-pasted wrong id would have validated cleanly and silently misattributed a verdict, with `diff` showing zero outcome assessments and no explanation, the one place this codebase's usual "never fail silently" discipline did not reach. Fixed with a warning (not an error, since a deliberate multi-generation assessment is unusual but not invalid) in `validate/integrity.ts`: `recommendation_run_id` should equal `run.previous_run_id` when the run has one.
