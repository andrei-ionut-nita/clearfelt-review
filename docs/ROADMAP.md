# Roadmap

Work deliberately not built, recorded with the reasoning so it is not re-litigated in six weeks.

## Not built, by choice

**Caching and parallel research.** Both are performance work on a pipeline whose bottleneck is currently judgement, not throughput. Adding them now would optimise a system we do not yet know produces good reviews.

**Hosted persistence, an API, team collaboration.** Spec section 70 asks for architectural compatibility, not implementation. The canonical model is plain JSON with versioning fields already present, which is what compatibility means here.

**Monitoring and alerting.** Depends on repeated runs being meaningful, which depends on the diff engine, which depends on having run the pipeline enough times to know what a meaningful change looks like.

**A graph or vector database.** See `decisions/0001-files-as-canonical-state.md`. This is a constraint, not a gap.

## Not built, blocked

**Token and cost accounting.** `RunObservability` records wall time, sources, retrievals, failures and search iterations, and deliberately omits tokens and money. A Claude Code skill cannot read its own spend, and a field holding a guessed number is worse than an absent one because it would be reported as though it were measured. This becomes buildable if a real measurement path appears, not before.

## What the first real run taught us

Run against a real, live site on 2026-09-07 (identifying detail deliberately omitted from this document). Recorded here because the point of a dogfood run is to fix the general system, not the specific analysis.

**The system declined to reproduce the specification's own example.** Specification section 74 sketches a finding that the subject's positioning leads on technical capability and should be reframed around technology economics. The real site was already economics-led throughout, and the review said so. That the illustrative conclusion did not survive contact with evidence is the single most reassuring result available.

**Two of the reviewer's own hypotheses were falsified mid-run**, and the research log records both. An initial keyword scan suggested testimonials were present; they were CSS rules for a blockquote style. A working assumption that third-party proof was missing was wrong: vendor-published case studies exist and the homepage links to them twice.

**No P0 emerged, correctly.** A site that is already strong should not produce an urgent recommendation, and the computed bands did not invent one.

**The ontology gap it surfaced** is recorded in `decisions/notes/0003-multi-source-absence.md`.

**Still open.** There is no way to record that a recommendation from a previous run has since been implemented, which is what makes the specification's example look stale rather than wrong. That belongs with the diff engine in Phase 5.

## What Phase 2 found in the same run

Ran `clearfelt-review quality` against the same dogfood run once it shipped. It surfaced four categories of real issue, not tool noise:

**Two recommendations had dropped the audience.** `R-0001` and `R-0002` rested on findings that never stated `audience_relevance`, so the output contract's "who or what is affected?" question went unanswered even though the recommendations themselves clearly had an audience in mind. The uncertainty had not survived the trip from finding to recommendation. Fixed by adding the field to the findings; the underlying analysis did not change, only what it declared.

**Two research questions had stopped without a formal reason.** Both carried a `stop_detail` explaining exactly why in prose, and both were missing the `stop_reason` enum value the model actually checks. This is a stronger finding than it looks: the reasoning layer knew why it stopped and simply did not fill in the structured field, which is precisely the gap between "an audit trail exists" and "the process is auditable" that the research ledger is supposed to close. Promoted from a Phase 2 quality caution into a validation error once found, because a question that stopped without a machine-readable reason is a well-formedness problem, not a judgement call: see `decisions/0008-validation-is-not-evaluation.md`.

**The novel-concept check needed calibrating against real prose, not just fixtures.** Adversarial fixtures write findings by hand and can make the leap from evidence to conclusion as blatant or as subtle as the test needs. Real findings paraphrase constantly: "the site" for "the homepage and the advisory page", "consequences" for "business-critical", both legitimate summarising rather than unjustified inference. At the fixture-tuned threshold, the check fired on every derived finding in the run, which teaches a reader to stop reading it. Raised `NOVEL_TERM_LIMIT` from 3 to 5 against this run's actual novel-term counts, which left the two genuinely borderline findings flagged (one enumerating categories of endorsement the evidence did not itself list; one inferring audience search behaviour from a claim about discoverable results) and cleared the two that were paraphrase. The adversarial fixture that exercises this check introduces enough new vocabulary to trip either threshold, so raising it did not weaken the regression test.

**A falsifier phrased as a null result was not recognised as one.** `R-0001`'s falsifier said outcome would be "indistinguishable from" the prior state, a legitimate failure condition the shortfall-word list did not contain. Added `indistinguishable`, `unaffected`, `unmoved`, `identical` and `same` to the list. The lesson generalises: a hand-written word list calibrated against invented fixtures will always be missing real phrasing, and the fix each time is to widen the list against a real run rather than assume the check is complete.

Net result: zero defects in the run once its own real gaps were fixed, five honest cautions left standing, and one rule moved from evaluation to validation because a live run showed it belonged there. This is what "quality evaluation decides whether the product is worth broadening" was supposed to produce: not a score, but a specific list of what to go and fix, some of it in the run and some of it in the checker.

## Known limitations, stated rather than papered over

**Fabricated sources cannot be prevented.** Requiring a snapshot and content hash for every fetched source makes fabrication visible on inspection: someone can open the snapshot and see whether it is real. Nothing in code can prove a page was actually visited. This is a mitigation, not a solution, and the docs should keep saying so.

**Unjustified inference is only partly catchable.** `claim_type` makes the leap declarable, and a mechanical check can catch a `derived` finding introducing a concept absent from its evidence. The subtle cases, where the inference is plausible and wrong, need a human or an adversarial fixture. This is the central quality risk in the product.

**Two of section 19's own categories are not classified.** "Emerging threats" and "benchmark strengths" both need trend or benchmark-relationship evidence the model does not yet carry: a comparison marked `type: 'benchmark'` exists, but nothing distinguishes one pulling ahead from one standing still. A classification that pretended to detect either from a single saturation-and-position snapshot would be manufacturing a signal, not computing one. Left unclassified rather than faked; see `decisions/0009-computed-saturation.md`.

**Positioning territories are free text, not a controlled vocabulary.** Two comparisons naming close variants of the same territory will not be recognised as the same row in the saturation table, and the model has no mechanism to catch it. A fixed taxonomy was considered and rejected, because the territories that matter for one entity's positioning are not the ones that matter for another's, and a fixed list would reintroduce the entity-type branching invariant 19 bans. This is left to discipline in qualification: `review-research`'s guidance is to reuse a territory name exactly, and there is currently no check that it did.

## What Phase 4 built and found

The module registry did not exist before this phase. `Plan.activated_modules` and `Plan.dormant_modules` were free-form key-and-reason pairs the reasoning layer wrote from nothing, with no table to check the keys against. `modules/registry.ts` closes that: eighteen predicates over signals from the objective, decision, audience text and captured assets, and a validation rule requiring every module to get a verdict, not only the ones the reasoning layer happened to think of.

Fixing both fixtures to satisfy that completeness rule surfaced a real, small design point rather than a bug: the dogfood run kept `conversion` activated on grounds ("the site has an explicit contact and advisory path") the deterministic suggestion did not itself offer, because the coarse keyword match missed "contact" in the way it appeared. That is the "suggestion, not a verdict" design working as intended, recorded so a future session does not read the divergence as drift.

`fixtures/commercial-saas` is the one new fixture this phase built, deliberately lighter than personal-brand, chosen to prove two things at once: the registry genuinely activates a different module set for a different decision, and the change tree genuinely roots on more than one asset type (`signup_flow` alongside `website_page`) outside a unit test. Both are checked directly by tests rather than asserted in prose.

**Five archetypes remained unbuilt after this phase: charity, NGO, government, product, professional services.** Deliberately deferred rather than rushed to fill out the list from the original plan; two archetypes already proved the mechanism adapts, and a third, fourth and fifth fixture at the time would have mostly added breadth to a claim already checked, not tested a new failure mode. Built in Phase 6 once that judgement was revisited; see "What Phase 6 built" below.

## What Phase 5 built

The last phase in the original plan. `diff.ts` compares two runs of the same subject, and `clearfelt-review init --previous <run>` carries `feedback.json` forward so a correction survives a rerun.

The design question that mattered was not whether to build a diff, it was what "the same entity across two runs" could possibly mean when `ids.ts` allocates every id fresh, starting at `0001`, inside each run's own files. Two runs of the same slug will very often produce the same id for two completely unrelated things by pure coincidence of allocation order. A diff engine that matched on id equality would look like a careful comparison and be silently wrong on almost every real rerun. `docs/decisions/0011-cross-run-identity-is-supersedes-only.md` records the decision: identity across runs exists only where the newer run explicitly claims it with `Versioned.supersedes`, never by string equality of ids.

**Verified by constructing a rerun by hand**, since a live second research pass against a real site was not available this session. Copied `fixtures/personal-brand` into a second run directory, gave it a new run id and `previous_run_id`, and set `supersedes` on exactly one recommendation and one finding while leaving everything else with unchanged ids and unchanged content. `clearfelt-review diff` reported the two linked items as carried forward and reported every other item, byte-identical or not, as dropped and replaced. That is not a bug in the check; it is ADR 0011 working exactly as designed, and it is also the reason the rerun guidance added to all three skills this phase says `supersedes` is not optional bookkeeping.

**A real limitation, stated rather than smoothed over.** `feedback_still_open` can only recognise a correction as addressed through a `supersedes` link. It has no way to recognise that a reasoning layer silently honoured a rejection by simply not re-proposing the same candidate, and no way to recognise a candidate re-proposed and re-rejected under a fresh id as evidence the correction was respected, because either would require exactly the same-id matching ADR 0011 rejects for good reason. Whether feedback was actually respected in spirit, as opposed to mechanically linked, is a judgement for a human reading `quality/rubric.md`'s categories, not something this mechanism can fully automate.

**Outcome measurement stays open.** The original plan's Phase 5 description named "outcome measurement against each recommendation's measurement block, closing review to action to measurement to next review." The mechanism this phase builds gets partway there: a later run's finding can `supersede` an earlier recommendation and state in its evidence-backed claim whether the falsifier held. What it does not do, and what the lifecycle deliberately does not allow, is retroactively mark an old run's `Action.status` as `done`: `actions` is not writable once a run reaches `complete`, and that immutability is ADR 0005's whole point, a finished run is a historical record. Closing the loop happens through the evidence pipeline of the next run, not by editing the last one, and that is a design position worth a future session re-reading before "fixing" it.

## What Phase 6 built

Not new capability. A hardening pass over the gaps Phase 5's writeup above named as real rather than as deliberate design positions, and the one piece of scope Phase 4 explicitly deferred.

**The five remaining archetype fixtures**, `fixtures/charity`, `fixtures/ngo`, `fixtures/government`, `fixtures/product` and `fixtures/professional-services`, closing out the seven the original plan named. `ngo` is the one fixture in the repository where `scope.comparison_applicable` is false, exercising the explicit no-comparison decision specification section 51 requires, which no other fixture had exercised end to end before this. Each of the five activates a module combination none of the other six fixtures do, checked directly by `fixtures.test.ts` rather than asserted in prose: `government` is the only one to pair `accessibility` with `discoverability`, `product` is the only one to activate `operations`, `professional-services` activates `credibility` and `reputation` together while leaving `pricing` dormant.

**A narrower, not closed, `feedback_still_open` blind spot.** The gap named above is still real: same-id matching stays rejected, on purpose, per ADR 0011. What changed is `diff.ts` now also computes a similarity score, via the same `quality/text.ts` used for the near-duplicate-recommendation check, between an open feedback item's target label and every unlinked new item in the newer run. A close match is surfaced as a caution, "possibly related, unlinked", never as a claim of identity, and never used to close `feedback_still_open` itself. It gives a human reading the diff something concrete to check for the "re-proposed and re-rejected under a fresh id" case. The "silently honoured by not re-proposing anything" case still has no candidate to point at and is still genuinely open.

**A summary line for the collections `diff.ts` still does not diff.** Sources, observations, evidence and research questions stay excluded from the item-by-item diff, correctly, for the reason ADR 0011 gives: near-total churn on every rerun regardless of what actually changed. `renderDiffAscii` now prints one count per excluded collection, before and after, so a reader can see whether the evidence base moved at all without wading through noise a full diff of those collections would produce.

**A wider, not exhaustive, generic-phrase list.** `quality/checks.ts`'s mechanical checks catch the obvious cases and always will; `quality/text.ts`'s `GENERIC_PHRASES` grew by inspection this phase rather than against a fresh real run, which is the same limitation Phase 2's writeup already named for the underlying check. Recorded again here rather than treated as closed: the next real run against real output is still the calibration this list actually needs.
