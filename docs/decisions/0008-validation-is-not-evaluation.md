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

**Evaluation** (`quality/`, arriving in Phase 2) is a report, not a gate, and splits again:

- Mechanical checks in code: a recommendation restating its finding, a missing or circular falsifier, an unvalidated assumption dependency, duplicate recommendations, a finding on a single source, a `derived` finding introducing a new concept, generic-recommendation phrase detection.
- Judgement criteria in `quality/rubric.md`, expressed as **named failure categories, not a score**.

## Consequences

There is no "this review scored 87". A fixture fails because "the recommendation was generic, insufficiently evidenced and not falsifiable", which is regression-testable as prompts evolve and is honest about what was actually assessed.

This follows `clearfelt-writing`'s ADR 0001, deterministic scoring rather than LLM judgement, applied to the part that can be made deterministic, and refuses to fake the part that cannot. Specification section 40 forbids manufacturing precision, and a generated quality score is exactly that.

Harder: quality regressions need human attention on fixtures rather than a number in CI. That is the honest cost.

## Alternatives considered

**An LLM judge producing a 0-100 score.** Rejected on two grounds: the number would be treated as meaningful when it is not reproducible, and it would let a quality regression pass CI at 84 instead of 87 without anyone reading the review.
