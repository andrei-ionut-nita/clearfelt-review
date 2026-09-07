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

Running it against the dogfood run described in `docs/ROADMAP.md`, "What the first real run taught us," did what a mechanism like this is supposed to do: it found two real recommendations missing `audience_relevance` on their supporting findings and two research questions closed without a `stop_reason`, all genuine gaps in that run's own data, not in the checker. Both are now fixed in the run, and the second was promoted from a quality caution into a validation error (`entities.ts`), because a question that stopped without saying why is a well-formedness problem, not a judgement call. The corroboration-illusory and inference-unjustified checks flagged four more items, correctly, as cautions rather than defects: a single-source finding that has no second source to find, and two findings whose derived claim_type stretched slightly past its evidence in ways a reader should see and decide about, not a machine.
