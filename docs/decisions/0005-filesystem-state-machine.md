# 0005. The filesystem is the state machine

Date: 2026-09-07

## Context

Specification section 55 requires three human approval gates: scope, research plan, findings. The findings gate matters most, because a wrong finding that reaches the recommendation stage propagates into a plan someone might act on.

The obvious implementation is to instruct each skill to check the gate before proceeding. That is not enforcement. Prompts drift, get compacted out of context, and get edited by whoever is in a hurry.

## Decision

`lifecycle.ts` holds a table of which collections are writable in which run stage. `store.ts` consults it before every write and refuses ones the stage does not permit, with an error naming the stage that would have allowed it.

`validate/integrity.ts` independently checks that a run's contents are consistent with its approvals, so a hand-edited or bypassed run cannot smuggle recommendations past the findings gate either.

## Consequences

A reasoning stage cannot write findings while researching, or recommendations before findings are approved. The guarantee holds regardless of what any prompt says.

`run` and `feedback` are writable in every stage: `run` is how the stage itself advances, and a user must be able to record a correction at any point without rewinding the run.

`writeCollection` takes a `bypassLifecycle` option for the CLI's own transitions and for fixture construction. Every use is a deliberate decision to give up the guarantee, which is why it is named that way rather than something comfortable.

Harder: the stage table is another thing to update when adding a collection. `docs/DEVELOP.md` lists it in the checklist.

## Alternatives considered

**Enforce in the CLI only.** Rejected because the CLI is not the only writer; a skill can write a file directly, and the check belongs at the point of contact with the disk.

**No enforcement, rely on validation after the fact.** Rejected because by then the work has been done, and the natural response to a late error is to approve the gate retroactively.
