# 0010. Module activation is signal-based, never entity-type based

Date: 2026-09-07

## Context

Specification section 60 and product invariant 19 forbid `if entity.type === 'personal website'` anywhere in production code. The module registry is where that temptation is strongest: eighteen sections exist precisely because different reviews need different ones, and the fastest way to implement that is a lookup keyed on what kind of thing is being reviewed.

Before Phase 4, `modules/registry.ts` did not exist. `Plan.activated_modules` and `Plan.dormant_modules` were free-form key-and-reason pairs the reasoning layer wrote from nothing, with no registry to check the keys against and no mechanism proving the choice tracked the review rather than a habit formed on the first archetype tried.

## Decision

`modules/registry.ts` is a plain table of eighteen `ModuleSpec` rows, each carrying a key, a label, what it analyses (from specification section 21), and an `activates(signals: ModuleSignals): boolean` predicate.

`ModuleSignals` is derived once, by `deriveSignals`, from `scope.objective`, `scope.decision.statement`, `scope.decision.evidence_required`, every audience's name and description, `scope.channels`, `scope.comparison_applicable`, and the `type` and `path` of every asset captured so far. It is deliberately built only from what onboarding has by the time module selection happens, before any research exists: nothing here reads a finding, an evidence item or a source.

`Entity.type` is not part of `ModuleSignals` at all. Three modules (positioning, audience, messaging) activate unconditionally, because every review needs them regardless of subject. `competitive_landscape` reads `scope.comparison_applicable` directly, which specification section 51 already requires to be an explicit decision, rather than re-guessing it from keywords. Every other module activates on keyword and asset-type signals: `pricing` on "price", "cost", "fee", "tier"; `accessibility` on "accessibility", "wcag", "disability"; and so on.

`selectModules(review)` returns the deterministic suggestion. It does not decide for real. `review-onboard` reads it, writes its own reason for every module into `plan.json`, and can depart from the suggestion when the objective actually warrants it. `checkModuleSelection` in `validate/integrity.ts` enforces the mechanical half: every key in `activated_modules` or `dormant_modules` must be a real registry key, no key may appear in both, and every registry key must appear in one of the two lists. That last rule is the one doing the most work: "dormant modules matter, a reader should see what you chose not to look at" only holds if every module gets a verdict, not only the ones the reasoning layer happened to think of.

## Consequences

A charity review and a SaaS review activate genuinely different modules, and the difference is visible in the source as different keyword matches against the same text field, never as a branch on what the entity is. `modules/registry.test.ts` proves this directly: representative scope profiles for a hiring decision, a subscription-pricing decision, a donor-facing decision and a compliance-driven decision each produce a different activation set from the same eighteen predicates.

`invariant-19.test.ts` checks the stronger claim mechanically: no production file compares or switches on an entity type field, and no production file string-compares against a fixed archetype vocabulary. It is a grep-shaped test on purpose, over a semantic one: the thing being guarded against is a literal pattern in the source.

Harder: keyword matching is coarse. "The market for advisory services" and "putting this on the market" would both trip the `market` module, and there is no attempt at disambiguation here beyond the stopword-free substring match `comparison-synthesis.ts`'s text primitives already accept as a limitation. This is stated rather than hidden: `selectModules` is a suggestion a human-equivalent reasoning stage is expected to correct, not an oracle.

## Alternatives considered

**A fixed per-archetype module list, selected by `Entity.type`.** The most direct implementation, and the one invariant 19 exists to forbid. It generalises by adding new archetypes rather than by adding new signals, which is exactly the branching the specification's own worked examples (a charity, a government service, a portfolio company) are chosen to stress-test against.

**Let the reasoning layer choose modules freely with no registry at all**, which is what the product actually did before this ADR. Rejected because nothing then stopped an invented module key from reaching `plan.json` and every downstream renderer, and nothing proved the registry a reader could point to as "why isn't accessibility covered" was ever actually consulted.
