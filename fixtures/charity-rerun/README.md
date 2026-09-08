# charity-rerun

A real rerun pair, produced by `clearfelt-review rerun`: this run and `fixtures/charity` (`riverbank-relief/r-20260907-001`), the first genuinely sequential two-run fixture in the repository. See `docs/decisions/0012-outcome-assessment.md`.

Generated with `node packages/core/dist/cli.js rerun fixtures/charity --root <tmp> --depth standard`, then hand-authored through the remaining stages: a minimal scope (comparison not applicable, since this run's objective is assessing the previous run's own recommendations), one source, two observations and two evidence items grounding two `OutcomeAssessment`s against `fixtures/charity`'s `R-0001` and `R-0002`.

`OA-0001` assesses `R-0001` (default the donation form to monthly) as `achieved`, falsifier not held. `OA-0002` assesses `R-0002` (state what a gift funds before the form) as `failed`, falsifier held, and deliberately has no superseding recommendation in this run, to demonstrate `quality`'s new `outcome_assessment.failed_without_followup` caution.

```bash
node packages/core/dist/cli.js validate fixtures/charity-rerun
node packages/core/dist/cli.js quality  fixtures/charity-rerun
node packages/core/dist/cli.js diff     fixtures/charity fixtures/charity-rerun
node packages/core/dist/cli.js trace    fixtures/charity-rerun OA-0001
node packages/core/dist/cli.js trace    fixtures/charity-rerun E-0002 --reverse
node packages/core/dist/cli.js render   fixtures/charity-rerun --format plan --out /tmp/plan.md
node packages/core/dist/cli.js render   fixtures/charity-rerun --format html --out /tmp/report.html
```
