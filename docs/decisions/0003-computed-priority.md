# 0003. Priority is computed, never authored

Date: 2026-09-07

## Context

Specification section 25 forbids one arbitrary overall score and requires independent dimensions: impact, effort, confidence, urgency. It also requires the user to be able to understand why something is P0.

An LLM asked to produce a prioritised list will produce one. It will also produce priorities that do not follow from the dimensions it just assigned, because nothing forces consistency between the two.

## Decision

`priority` is absent from the `Recommendation` type. `prioritise.ts` computes it from the four dimensions, with stated weights, explicit caps, and a rationale string on every result.

Validation treats a `priority` field appearing on a recommendation as an error rather than ignoring it.

## Consequences

The reasoning layer cannot assert a P0 it has not earned. If it wants a higher priority it must argue for higher impact or urgency, which are individually checkable claims, rather than asserting a conclusion.

Every priority is explainable by construction, because the rationale is generated alongside the band.

Harder: the weights are now a design decision that someone will disagree with. That is the intent. They are stated in one place at the top of the module so the disagreement is about a visible number rather than about a model's mood.

Rejecting an authored `priority` rather than ignoring it matters: silently dropping it would let a reasoning stage believe it had set a priority and never learn otherwise.

## Alternatives considered

**Let the LLM propose a priority, and warn when it disagrees with the computation.** Rejected because the warning would fire constantly and be ignored, and because there is no case where the authored value should win.
