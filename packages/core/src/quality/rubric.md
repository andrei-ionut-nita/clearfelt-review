# Review quality rubric

Named failure categories, not a score.

Specification section 40 rejects "overall score: 73/100" for the reviews this
system produces, and the same reasoning applies to the review of the review. A
number invites comparison between two runs that were never comparable, and it
hides which of ten different problems produced it. A named category tells you
what to go and fix.

A category is either **mechanical**, meaning `quality/checks.ts` detects it and
a regression test can hold it, or **judged**, meaning only a reader can tell.
The judged half is the more important half, and no amount of work on the
mechanical half will substitute for it.

## How to use this

Attach expectations to a fixture: this run should trip exactly these categories.
That is what makes the rubric regression-testable as the skills and prompts
evolve. `fixtures/adversarial/` does this for the mechanical categories, one run
per category, each tripping exactly one.

For a real run, read the categories in order. Structural failures make the
analytical ones unreadable, and analytical failures make the actionable ones
irrelevant.

## Structural

Validity and traceability are `validate`'s job, not this rubric's. Nothing
renders from an invalid run, so a structural failure never reaches quality
evaluation. Listed here only so the tiers are complete.

## Analytical

### evidence_thin
*Mechanical:* `question.sufficient_below_evidence_floor`.
*Judged:* the evidence exists and is not load-bearing. A single homepage
paragraph supporting a claim about market positioning is thin regardless of how
many evidence records point at it.

### inference_unjustified
*Mechanical:* `finding.derived_introduces_concepts`.
*Judged:* the finding declares `inferred` honestly, and the inference is still
not warranted. "Competitor X raised prices 15%" to "customers will pay more" is
labelled correctly and remains a leap. This is the failure that survives every
provenance check, and the mechanical check catches only the blatant cases where
the leap brought new vocabulary with it.

### temporal_confusion
*Mechanical:* `finding.current_from_historical_evidence`.
*Judged:* evidence marked `current` that is stale in practice. A page retrieved
today can describe a service withdrawn last year.

### corroboration_illusory
*Mechanical:* `finding.no_independent_corroboration`.
*Judged:* sources marked `independent` that are not. Two consultancies citing
the same industry report are independent by the field and dependent in fact.
The mechanical check can only trust the classification it is given.

### research_overclaimed
*Mechanical:* `question.closed_without_reason`,
`question.insufficient_but_produced_findings`.
*Judged:* research that stopped at the first plausible answer. `sufficient` is
the easiest stop reason to write and the hardest to earn, and a ledger full of
it with three searches behind each question is a research process that agreed
with itself.

### absence_read_as_fact
*Judged only.* An absence observation that a finding has quietly converted into
a claim. The model keeps `search_scope` on the observation, and every renderer
shows it, but nothing mechanical can stop a finding phrased as "they do not
publish pricing" when the observation said "no pricing found across four pages".
Read the findings that rest on absence observations and check the phrasing.

### comparison_hollow
*Judged only.* A comparison set assembled from entities that look similar rather
than entities the audience actually considers for this decision. The most common
version is competitors of the subject rather than alternatives for the audience,
and it is invisible to every check because the records are all well formed.

## Actionable

### recommendation_generic
*Mechanical:* `recommendation.generic_language`.
*Judged:* specific-sounding advice that is still generic. Naming a page does not
make "improve the copy on /about" executable.

### recommendation_circular
*Mechanical:* `recommendation.restates_finding`.
*Judged:* the recommendation restates the finding in genuinely different words.
Ask what a reader would do differently on Monday morning knowing only the
finding, versus knowing the recommendation. If the answer is nothing, it is
circular however it is phrased.

### recommendation_untestable
*Mechanical:* `recommendation.circular_falsifier`,
`recommendation.falsifier_states_success`.
*Judged:* a falsifier that is well formed and unmeasurable in practice, or one
whose review period is so long that nobody will ever check.

### recommendation_duplicated
*Mechanical:* `recommendation.near_duplicate`.
*Judged:* several recommendations that are one intervention split up to make the
plan look substantial.

### uncertainty_dropped
*Mechanical:* `recommendation.drops_assumption`,
`recommendation.rests_on_unvalidated_assumption`.
*Judged:* uncertainty that survives into the model and is buried by tone. A
recommendation carrying its assumption ids correctly, written in language that
gives no hint anything is unresolved, has satisfied the check and defeated its
purpose.

### outcome_unaddressed
*Mechanical:* `outcome_assessment.failed_without_followup`.
*Judged:* whether the absence of a follow-up recommendation is a genuine
decision to leave a failed hypothesis alone, or an oversight. The mechanical
check only sees that nothing in this run supersedes the assessed
recommendation; it cannot tell the two apart, on purpose, the same restraint
`feedback_still_open` already applies to a rejection nothing acknowledges. See
docs/decisions/0012-outcome-assessment.md.

### decision_unserved
*Judged only.* The single most important question, and the one nothing can
automate. `scope.decision` says what someone has to decide. Read the brief and
ask whether the person named in `decision_maker` could make that decision better
having read it. A review can pass every check above, answer all ten contract
questions, and still not bear on the decision it exists to support.
