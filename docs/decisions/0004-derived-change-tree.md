# 0004. The change tree is derived from assets

Date: 2026-09-07

## Context

The change tree is a first-class output and, per specification section 28, a key differentiator: it answers "where exactly should something change?".

It is also the single easiest place in the product for a hallucination to hide. A tree written as prose looks authoritative, is hard to check against the recommendations, and can contradict them without anyone noticing until someone tries to do the work.

## Decision

`change-tree.ts` derives the tree from every action's `affected_assets`, resolving `asset_id` against `assets.json`. It is never authored and never persisted.

`AffectedAsset` requires either an existing `asset_id` (for edit, remove, move) or a `proposed` block (for new). Validation rejects an affected asset with neither.

Each node carries the action, recommendation, finding and evidence ids that produced it.

## Consequences

The tree cannot say anything the actions do not. A node exists because an action put it there, and selecting it exposes the chain behind it, which is what specification section 29 requires.

Root labels are keyed on **asset** type, not entity type, so non-website subjects render as POSITIONING, PRODUCT, SERVICE and so on without reintroducing the entity-type branching that section 60 bans. A tree that only renders pages would make this a website auditor with extra steps.

Harder: an action must name where it lands before the tree can show it, which is more work for the reasoning layer than writing a tree directly. That work is the point.

## Alternatives considered

**Let the reasoning layer write the tree and validate it against the actions afterwards.** Rejected because the validation would be a diff between two representations of the same thing, and the fix for a mismatch would always be to regenerate the tree from the actions, which is what deriving it does in the first place.
