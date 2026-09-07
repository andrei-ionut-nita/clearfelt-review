---
name: review-analyse
description: Use after review-research has completed on a Clearfelt Review run, to turn evidence into findings, opportunities, white space, assumptions, unknowns and hypotheses. Runs the findings approval gate. Reads evidence only, never sources directly.
---

# review-analyse

Turn evidence into conclusions, and be explicit about how far each conclusion travels from its evidence.

Stage must be `findings_pending`.

## Read evidence, not sources

Work from `evidence.json`, `observations.json` and `comparisons.json`. Do not go back to the raw snapshots to form a conclusion. If the evidence does not support a finding, the answer is more research or a recorded unknown, not a closer reading of a page nobody wrote evidence about.

This separation is what stops the analysis quietly re-interpreting a source to fit a conclusion.

## Findings

A finding is a meaningful conclusion, not a restatement of an observation. "The headline says X" is an observation. "The proposition is organised around capability rather than consequence" is a finding.

**`claim_type` is the most important field you set.**

- `derived`: the finding restates what the evidence shows. Anyone reading the evidence would reach it.
- `inferred`: the finding goes beyond the evidence. It may be right and it does not follow automatically.
- `hypothesis`: a candidate explanation awaiting validation.

Get this right. "Competitor X raised prices 15%" supports the derived finding that published prices rose. The claim that customers will pay more is inferred, and labelling it derived is the most damaging thing you can do in this stage, because it survives every provenance check: the sources are real, the observations are real, and the conclusion still does not follow.

When a finding is `inferred`, record what it rests on in `assumption_ids`.

Set `contradicted_by` where evidence cuts against the finding. Do not resolve a contradiction by dropping the inconvenient evidence. Contradictions are often the most interesting result available, and a contradiction between the stated proposition and the published work is itself a finding worth writing.

Set `temporal_scope` so a historical pattern is not stated as a current fact.

On a rerun, set `supersedes` on a finding, opportunity or assumption that continues one from the previous run, naming its id. `clearfelt-review diff` only recognises continuity through this field, never through matching ids across runs, since ids are allocated fresh every time. If new evidence confirms, revises or overturns a previous finding, say which finding in `supersedes`, and say in the statement itself whether this run corroborates or contradicts it.

## Opportunities

An opportunity is a strategically useful possibility, not a restated weakness. "No case studies" is a finding. "The existing writing already contains the substance a proof page needs" is an opportunity.

For white space, set the `white_space` block: a `territory` in the same language the comparisons' `positioning_territories` use, and `current_position`, your judgement of where the subject stands there, grounded in the findings this opportunity cites. Do not set a saturation. `comparison-synthesis.ts` computes it from how many qualified comparisons contest that territory, per ADR 0009. "Nobody does this" is only as good as the comparison set behind it, and the count is exactly what makes it checkable rather than an impression: if research-comparisons.json shows three qualified competitors already naming that territory, the table will say so regardless of what this opportunity claims.

Name the territory exactly as a qualified comparison's `positioning_territories` names it, or the saturation table will show it as a separate, uncontested row next to the real one. If review-research has not yet named a matching territory on any comparison, that is worth flagging rather than silently proceeding: the white-space claim may be real, but it is currently unchecked.

## Assumptions, unknowns, hypotheses

Three different things, and collapsing them is how a review manufactures confidence:

- **Assumption**: an interpretation you are relying on because evidence is incomplete. Status `unvalidated` unless evidence actually validated it. Give a `validation_method` a person could carry out.
- **Unknown**: something the research could not establish. Say why, and how it could be resolved.
- **Hypothesis**: a candidate explanation awaiting validation, with a method.

Every research question that closed as `INSUFFICIENT_EVIDENCE`, `BLOCKED` or `no_evidence_available` should produce an unknown, or you have quietly dropped a gap.

## Gate 3: findings

```bash
clearfelt-review validate <run>
```

Then present, in plain language:

- what you found, marking clearly which conclusions are inferences
- what contradicts what
- where confidence is low and why
- what you could not establish at all

This gate exists because a wrong finding propagates into a plan someone may act on. Invite the user to challenge a finding before recommendations exist, not after.

When approved:

```bash
clearfelt-review approve <run> findings
```

Then hand over to `review-recommend`.

## Rules

- Never write recommendations or actions. The lifecycle will refuse them.
- Never write a finding with no evidence.
- Never label an inference as derived to make it sound stronger.
- Never drop contradicting evidence to make a finding cleaner.
- Never let a finding rest only on what the user told you.
