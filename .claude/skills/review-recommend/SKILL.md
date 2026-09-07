---
name: review-recommend
description: Use after review-analyse has passed the findings gate on a Clearfelt Review run, to turn findings and opportunities into prioritised recommendations, concrete actions and a change tree, then render the executive brief, detailed plan and interactive HTML report. The final skill in a review.
---

# review-recommend

Turn conclusions into testable interventions, and render the outputs.

Stage must be `recommending`.

## Recommendations

Every recommendation cites at least one finding. A recommendation with no finding behind it is a guess with formatting.

**Do not set `priority`.** It does not exist as a field. Set `impact`, `effort`, `confidence` and `urgency` honestly and let `prioritise` compute the band. If you want something to be P0, argue for higher impact or urgency, which are claims a reader can check. Validation rejects an authored priority rather than ignoring it.

The four dimensions are independent. `confidence` here is confidence that this action follows from the analysis, which is not the confidence of the findings underneath it and not the reliability of the evidence under those.

`assumption_ids` must list any unvalidated assumption the recommendation depends on. Every renderer surfaces these, so a reader can see that a confident-looking recommendation rests on something nobody checked.

On a rerun, set `supersedes` naming the previous run's recommendation id whenever this one continues, revises or closes it out, including when the honest content is "this was implemented, here is what the evidence in this run says about whether it worked." `clearfelt-review diff` cannot tell a genuinely closed loop from a silently dropped recommendation any other way: without `supersedes`, the earlier recommendation just reads as abandoned.

## Measurement, and the falsifier

Every recommendation carries a `measurement` block. The field that matters most is `falsifier`: what result would show this recommendation was wrong.

A recommendation that cannot be wrong is not worth much. "Improve the messaging" has no falsifier. "Fewer readers restate the proposition correctly after the change than before" does.

`baseline` may be `unknown`, and often honestly is. Inventing a baseline to make the block look complete is the failure this field exists to prevent.

Pick `kind` to match what can actually be measured: `quantitative` where a number exists, `binary` where something either happened or did not, `qualitative` or `proxy` where the honest answer is a judgement or a stand-in.

## Actions

An action is a concrete change. Each belongs to exactly one recommendation, which is what keeps the change tree derivable.

`affected_assets` is where the change lands:

- `edit`, `remove`, `move`: must name an `asset_id` that exists in `assets.json`
- `new`: must carry a `proposed` block, since the asset does not exist yet
- `target` names the part of the asset, for example `hero`

This is what stops the change tree becoming a tree of invented strings. If an action edits something that is not in `assets.json`, either the research missed it or the action is imaginary. Both are worth knowing.

Set `horizon` (`now`, `next`, `later`) by dependency, not by calendar. Set `validation`: how someone knows the action is done.

## Then run the deterministic parts

```bash
clearfelt-review validate     <run>
clearfelt-review prioritise   <run>
clearfelt-review change-tree  <run>
clearfelt-review quality      <run>
```

Read the change tree. If it does not describe what you meant, the actions are wrong, not the tree. Fix the actions.

Read the priorities. If the computed band surprises you, either your dimension ratings were wrong or your intuition was. Both are worth a moment.

## Read the quality report, and take it personally

`quality` asks two things `validate` cannot.

The **output contract** asks whether each recommendation answers all ten questions: what is wrong, why it matters, what evidence proves it, what uncertainty remains, what should change, where, who is affected, what success looks like, how we will know, and what would prove it wrong. An unanswered question is a gap in the recommendation, not a gap in the report.

The **quality checks** name failure categories. Every defect is yours to fix:

- `recommendation.restates_finding`: you wrote the finding again with an imperative verb. Say what specifically changes.
- `recommendation.circular_falsifier`: your falsifier adds no observable condition the hypothesis did not already contain. Name the measurement, the threshold and the window.
- `recommendation.generic_language`: consultant theatre. The advice would fit any entity at all.
- `recommendation.near_duplicate`: one intervention split into two.
- `recommendation.drops_assumption`: a finding declared an assumption and your recommendation did not carry it. Uncertainty is supposed to travel.
- `finding.derived_introduces_concepts`: the finding claims to be derived and went past its evidence. Reword it, or set `claim_type` to `inferred`.
- `finding.current_from_historical_evidence`: a claim about now resting entirely on evidence about then.
- `question.insufficient_but_produced_findings`: research judged the evidence inadequate, and a finding rests on it anyway.

Cautions are different. A single non-independent source really can be the only source that exists, and an unvalidated assumption declared honestly is the system working. Read each one and decide; do not clear them by editing the model until it stops complaining.

Nothing here says the analysis is good. `packages/core/src/quality/rubric.md` names what only a reader can judge, and the last category in it, whether any of this bears on the decision the review exists to support, is the one that matters most.

## Render

```bash
clearfelt-review stage  <run> complete
clearfelt-review render <run> --format brief --out brief.md
clearfelt-review render <run> --format plan  --out plan.md
clearfelt-review render <run> --format html  --out report.html
clearfelt-review render <run> --format json  --out review.json
```

Rendering refuses to run on an invalid run, so fix validation errors first.

Open the HTML and look at it. Check that the drill-down resolves, that inferred findings read as inferences, and that the unknowns section is not empty when the research had gaps.

## Check the answer to "why?"

```bash
clearfelt-review trace <run> R-0001
clearfelt-review trace <run> S-0001 --reverse
```

If a recommendation cannot be walked back to a real source, the pipeline is incomplete for that recommendation, whatever the report looks like. Fix it before handing over.

## If this is a rerun

```bash
clearfelt-review diff <previous-run> <this-run>
```

Read the "dropped" section of every collection before handing over. Anything there either genuinely disappeared and that is worth a sentence in the brief, or it should have carried a `supersedes` link and does not yet. Read "Feedback from run A not visibly acted on" too: it names corrections the previous run recorded that this run has not visibly addressed.

## Rules

- Never author a priority.
- Never write a recommendation with no finding behind it.
- Never write an action with nowhere to land.
- Never write a falsifier that cannot fail.
- Never write the change tree by hand. It is derived.
- Never hand over a report you have not opened.
