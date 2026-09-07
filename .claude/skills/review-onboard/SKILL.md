---
name: review-onboard
description: Use when starting a Clearfelt Review, or when the user says "review my site", "review this company", "run a Clearfelt Review", or asks what should change about an entity's positioning, proposition or digital presence. Captures scope, decision, entities, assets and comparisons, selects analysis modules, generates research questions, and runs the first two approval gates. Always the first skill in a review.
---

# review-onboard

Turn a request into a scoped, gated research plan. Nothing is researched until the user has approved what you understood and what you intend to investigate.

## Before anything

```bash
clearfelt-review init <slug> [--depth quick|standard|deep]
```

This prints the run directory. Every path below is relative to it. Stage is `initialized`.

## What you must establish

Ask as little as possible. Infer the rest and show your work: specification section 11 forbids putting the user through a consultancy questionnaire, and section 55 requires them to be able to correct what you inferred.

The minimum you cannot infer:

1. **What is being reviewed.** An entity, with a URL if it has one.
2. **The objective.** What they are trying to achieve.
3. **The decision.** What decision this research must help someone make. If the user has not framed one, propose one and let them correct it. A review without a decision produces "here are 47 interesting things we found".

Infer and present for correction: audiences, geography, channels, exclusions, and candidate comparisons.

## Write, in order

**`entities.json`.** The subject, role `subject`. Comparison entities come later, in research.

**`assets.json`.** What exists. For a website, retrieve enough to record real pages: path, title, and the source that shows it exists. Structure before meaning, per specification section 8. Do not invent an asset you have not seen.

**`user-assertions.json`.** Anything the user told you as fact. "Our main competitor is X." "Our customers care about price." These are `UA-` entries with status `to_validate`, not findings and not evidence. This is the single most important thing this skill does: a user statement written anywhere else contaminates the whole chain while passing every integrity check.

**`scope.json`.** Objective, decision, audiences, exclusions, depth, budget. Exclusions matter as much as inclusions: without them the research universe expands on every iteration. If comparison genuinely does not apply, set `comparison_applicable: false` and say why.

Then move to the scope gate and present it:

```bash
clearfelt-review stage <run> scope_pending
```

## Gate 1: scope

Show the user, in plain language:

- what you understood them to be reviewing
- the decision you think this supports
- who you think the audience is
- what you are deliberately leaving out
- what they told you, listed as claims you intend to test rather than as facts

Wait for them. When they approve:

```bash
clearfelt-review approve <run> scope
```

## Then plan

**`research-questions.json`.** Explicit questions, one `module` each, state `OPEN`. Derive them from `decision.evidence_required`: a question that does not help make the decision does not belong.

**`comparisons.json`.** Candidates only, status `proposed`. Anything the user named carries `proposed_by: 'user'` and the `user_assertion_id` it came from. Anything you propose carries `proposed_by: 'system'` and a real reason in `why_included`. Do not silently add competitors.

**`plan.json`.** Your interpretation of the objective, the modules you activated with reasons, the modules you left dormant with reasons, the comparison plan, and the gaps you already expect. Dormant modules matter: a reader should see what you chose not to look at.

Module selection is driven by objective, audience, decision and available evidence. Never by entity type. There is no branch on "is this a personal website".

## Gate 2: research plan

Show:

```text
Objective: ...
Decision: ...

We will investigate:
  positioning, competitive landscape, credibility, ...

We will not investigate:
  pricing (no commercial offer is sold here)
  ...

Comparisons: 1 supplied, 8 to discover
Expected gaps: no analytics access, so conversion cannot be observed
```

When approved:

```bash
clearfelt-review approve <run> research-plan
```

Then hand over to `review-research`.

## Rules

- Never write `findings.json`. The lifecycle will refuse it, and wanting to is a sign you have skipped ahead.
- Never record a user statement as evidence or as a finding.
- Never invent an asset, a page, or a competitor you have not observed.
- Ids are allocated by the CLI and by convention `PREFIX-0001` upward. Do not reuse one.
- Run `clearfelt-review validate <run>` before each gate. Fix what it reports.
