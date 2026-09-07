# Roadmap

Work deliberately not built, recorded with the reasoning so it is not re-litigated in six weeks.

## Not built, by choice

**Caching and parallel research.** Both are performance work on a pipeline whose bottleneck is currently judgement, not throughput. Adding them now would optimise a system we do not yet know produces good reviews.

**Hosted persistence, an API, team collaboration.** Spec section 70 asks for architectural compatibility, not implementation. The canonical model is plain JSON with versioning fields already present, which is what compatibility means here.

**Monitoring and alerting.** Depends on repeated runs being meaningful, which depends on the diff engine, which depends on having run the pipeline enough times to know what a meaningful change looks like.

**A graph or vector database.** See `decisions/0001-files-as-canonical-state.md`. This is a constraint, not a gap.

## Not built, blocked

**Token and cost accounting.** `RunObservability` records wall time, sources, retrievals, failures and search iterations, and deliberately omits tokens and money. A Claude Code skill cannot read its own spend, and a field holding a guessed number is worse than an absent one because it would be reported as though it were measured. This becomes buildable if a real measurement path appears, not before.

## Known limitations, stated rather than papered over

**Fabricated sources cannot be prevented.** Requiring a snapshot and content hash for every fetched source makes fabrication visible on inspection: someone can open the snapshot and see whether it is real. Nothing in code can prove a page was actually visited. This is a mitigation, not a solution, and the docs should keep saying so.

**Unjustified inference is only partly catchable.** `claim_type` makes the leap declarable, and a mechanical check can catch a `derived` finding introducing a concept absent from its evidence. The subtle cases, where the inference is plausible and wrong, need a human or an adversarial fixture. This is the central quality risk in the product.
