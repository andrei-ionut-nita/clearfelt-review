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

Run against a live site on 2026-09-07. Recorded here because the point of a dogfood run is to fix the general system, not the specific analysis.

**The system declined to reproduce the specification's own example.** Specification section 74 sketches a finding that the subject's positioning leads on technical capability and should be reframed around technology economics. The real site was already economics-led throughout, and the review said so. That the illustrative conclusion did not survive contact with evidence is the single most reassuring result available.

**Two of the reviewer's own hypotheses were falsified mid-run**, and the research log records both. An initial keyword scan suggested testimonials were present; they were CSS rules for a blockquote style. A working assumption that third-party proof was missing was wrong: vendor-published case studies exist and the homepage links to them twice.

**No P0 emerged, correctly.** A site that is already strong should not produce an urgent recommendation, and the computed bands did not invent one.

**The ontology gap it surfaced** is recorded in `decisions/notes/0003-multi-source-absence.md`.

**Still open.** There is no way to record that a recommendation from a previous run has since been implemented, which is what makes the specification's example look stale rather than wrong. That belongs with the diff engine in Phase 5.

## What Phase 2 found in the same run

Ran `clearfelt-review quality` against the same andreinita.co run once it shipped. It surfaced four categories of real issue, not tool noise:

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
