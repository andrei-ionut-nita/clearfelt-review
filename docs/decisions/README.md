# Decisions

Two tiers.

- **ADR** (`NNNN-title.md`) for a decision that changes how existing pieces compose: a new abstraction, a boundary change, a shift in a contract. Start from `0000-template.md`.
- **Note** (`notes/NNNN-title.md`) for a lighter record of something purely additive.

Number both tiers sequentially within their own directory, starting at `0001`. `0000-template.md` is reserved for the template and is never a real decision.

Not everything needs one. Bug fixes, refactors that change no external contract, and dependency bumps do not.

## ADRs

- [0001: Files as canonical state](0001-files-as-canonical-state.md)
- [0002: Hand-written validators instead of a schema library](0002-hand-written-validators.md)
- [0003: Priority is computed, never authored](0003-computed-priority.md)
- [0004: The change tree is derived from assets](0004-derived-change-tree.md)
- [0005: The filesystem is the state machine](0005-filesystem-state-machine.md)
- [0006: User assertions are not evidence](0006-user-assertions-are-not-evidence.md)
- [0007: Findings declare their claim type](0007-claim-type.md)
- [0008: Validation and evaluation are different problems](0008-validation-is-not-evaluation.md)
- [0009: Saturation is computed from the comparison landscape, never authored](0009-computed-saturation.md)
- [0010: Module activation is signal-based, never entity-type based](0010-signal-based-module-activation.md)
- [0011: Cross-run identity is supersedes-only, never same-id](0011-cross-run-identity-is-supersedes-only.md)
- [0012: Outcome assessment is a new collection, written into the newer run](0012-outcome-assessment.md)

## Notes

- [0001: One package rather than a core and cli split](notes/0001-one-package.md)
- [0002: Falsifier folded into Measurement](notes/0002-falsifier-in-measurement.md)
- [0003: Absence observations name every source scanned](notes/0003-multi-source-absence.md)
