# 0007. Findings declare their claim type

Date: 2026-09-07

## Context

Provenance checking catches fabricated sources. It does not catch the more dangerous failure, which is real evidence supporting an unjustified leap:

> Evidence: Competitor X raised published prices by 15%.
> Bad finding: Customers are willing to pay more.

Every check passes. The source is real, the observation is real, the evidence is real, and the conclusion does not follow. A reader has no way to see the leap, because the finding reads exactly like one that merely restates its evidence.

## Decision

`Finding.claim_type` is required, and is one of:

- `derived`: restates what the evidence shows
- `inferred`: goes beyond it
- `hypothesis`: a candidate explanation awaiting validation

The trace walk prefixes a finding's label with its claim type, and renderers must make an inference visually distinct from a derivation.

## Consequences

The leap becomes visible at every level of output, including the terminal. A reader can weigh a chain of inferences differently from a chain of derivations, which is the judgement they need to make and previously could not.

A mechanical quality check becomes possible in a later phase: a `derived` finding that introduces a concept absent from its evidence claims is mislabelled. That catches the crude cases.

It does not catch the subtle ones, where the inference is plausible and wrong. `docs/ROADMAP.md` records this as the central quality risk in the product rather than implying the field solves it.

## Alternatives considered

**Use `confidence` for this.** Rejected because they are orthogonal. A confident inference and a tentative derivation are different things, and collapsing them loses the distinction that matters.
