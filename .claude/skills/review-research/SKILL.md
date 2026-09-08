---
name: review-research
description: Use after review-onboard has passed the research plan gate on a Clearfelt Review run, to gather sources, record observations, build evidence and qualify comparisons. Runs the iterative research loop with explicit stopping criteria. Never runs before the research plan is approved.
---

# review-research

Answer the open research questions, and be honest about the ones you cannot.

Stage must be `researching`. If it is not, the plan gate has not been approved and you are ahead of yourself.

## The loop

For each open question, highest priority first:

```text
question -> discovery -> candidate sources -> qualification
  -> retrieval (+ snapshot) -> extraction -> observation -> evidence -> assess coverage
```

A search result is not a source. A source is not evidence. A retrieved statement is an observation. Evidence is observations assembled to support a claim. Collapsing these is the failure specification section 5 exists to prevent, and the validator enforces the distinction.

## Recording intent, not just outcome

Before each research action, append to `research-log.json` under `actions`: what you are about to do and **why this is the sensible next move given what you already have**. Then append the outcome under `events`.

The rationale is what makes the research auditable rather than merely traceable. A reader needs to see why you searched what you searched, not only what you found.

Log failures with the same care as successes: paywalls, robots.txt blocks, dead links, unverifiable claims, contradictory results. An outcome of `blocked` or `insufficient` is a real result. Silently moving on turns a gap into an invisible hole.

## Sources

Every fetched source needs a snapshot and a content hash. Write the retrieved content to `snapshots/<source-id>.<ext>` and record `snapshot_path` and `content_hash`. Validation rejects a `fetch` source without them, because "this URL exists" and "this is what was there when we looked" are different claims and only the second is reproducible.

Retrieve the actual bytes for a source you intend to call `fetch`. A tool that summarises or paraphrases a page on the way back to you is convenient and produces a plausible-sounding account, but you have nothing to hash and nothing a later run can compare against, and a hash of the summary is not a hash of the page. If only a summarising tool is available, say so honestly: use `retrieval_method: 'manual'` and no `snapshot_path` or `content_hash`, rather than claiming `fetch` with a fabricated or omitted hash. This matters most on a rerun: `clearfelt-review diff` compares `content_hash` by URL across runs to answer "did anything actually change" before any `review_period` has elapsed, and that check is only as honest as the retrieval underneath it.

Set `independence` honestly. Two outlets reprinting one press release are `republished`, not two independent sources, and must name the source they derive from. Corroboration is counted over independent sources only, so getting this wrong inflates confidence exactly where the evidence is weakest.

Set `authority` per specification section 66: primary and official sources above reputable secondary ones, weak sources labelled as weak rather than excluded.

## Observations

Record what you actually saw, with a locator someone could check: a selector, a quote anchor, a page path.

Use `observation_type: 'absence'` when the finding is that something is not there, and record `search_scope`: where you looked. "No pricing found after checking /pricing, /product and /faq" is defensible. "They do not publish pricing" is not, and the validator will reject an absence with no scope.

Carry no interpretation in an observation. "The headline reads X" is an observation. "The positioning emphasises X" is not.

## Evidence

Assemble observations into claims. Set `temporal_scope` so a 2023 market figure is not read as a current fact. Set `reliability` from the source and the observation, not from how much you like the conclusion.

Where evidence bears on a user assertion, list it in `user_assertion_ids` and update the assertion's status. An assertion is `corroborated` only when evidence from a non-user source supports it: marking it corroborated on the strength of the user having said it twice is circular, and the validator rejects that too.

## Comparisons

Qualify the proposed candidates. For each, decide the relationship type, and record audience, objective and decision overlap. Reject the ones that do not survive, with a real reason in `why_rejected`. A rejected comparison stays in the file: it stops the same candidate being rediscovered next run, and it lets the user disagree with your judgement.

The test for a competitor is whether they compete for the same decision by the same audience, not whether they look similar.

Set `positioning_territories` on every qualified comparison: the territories it actually contests, in the entity's own language, not a fixed taxonomy ("technology economics" for a CTO, "impact per pound" for a charity). This is what makes the saturation table in `quality`-adjacent rendering computed rather than guessed: `comparison-synthesis.ts` counts how many qualified comparisons name a territory, so a reasoning stage cannot simply assert a territory is crowded or open. If you believe a territory is uncontested, the count has to actually be low, and that count is what a reader checks. Leave the array empty for a benchmark or aspirational comparison that is not contesting any positioning territory at all.

A `proposed` or `rejected` comparison's territories do not count toward saturation, so there is no reason to skip naming them on a candidate you have not yet qualified; only qualification makes them count.

## Stopping

Stop a question when one of these is true, and record which:

- `sufficient`: the question is answered and triangulated
- `diminishing_returns`: further sources are repeating what you have
- `budget_exhausted`: you hit the limit in `scope.budget`
- `blocked`: you could not get access
- `no_evidence_available`: it cannot be established from available material
- `contradictory`: sources genuinely disagree, which is itself a result

Set `state` to match, and write `stop_detail` explaining it in a sentence. "Insufficient evidence" as a bare label tells a reader nothing they can act on.

Do not research indefinitely. Do not mark a question `ANSWERED` because you are tired of it.

## Finishing

```bash
clearfelt-review validate <run>
clearfelt-review coverage <run>
clearfelt-review stage <run> findings_pending
```

Read the coverage output before handing over. If a priority question is unresolved, say so rather than letting the analysis stage discover it.

On a rerun, also run `clearfelt-review diff <previous-run> <this-run>` here, before findings. Its "Source content, matched by URL" section compares `content_hash` against the previous run's sources and tells you immediately which pages actually changed. A page reported `unchanged` needs no further research to conclude its outcome: nothing happened, so nothing can yet be measured, regardless of whether its `review_period` has elapsed.

## Rules

- Never write findings, opportunities or recommendations. That is the next stage, behind a gate.
- Never create a source you did not retrieve.
- Never cite an inference as an observation.
- Never let a user statement become evidence without independent support.
