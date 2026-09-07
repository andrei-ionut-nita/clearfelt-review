# 0002. Falsifier folded into Measurement

Date: 2026-09-07

A separate `rationale_test` block on `Recommendation`, holding hypothesis, validation method and falsifier, was considered.

It was folded into `Measurement` instead, because `validation_method` would have appeared in both and the two copies would drift. `Measurement` now carries `kind`, `hypothesis`, `success_metric`, `baseline`, `target`, `validation_method`, `falsifier` and `review_period`.

`falsifier` is required. A recommendation that cannot be wrong is not worth much, and requiring the field is what turns "AI recommends things" into "AI proposes testable interventions".

`baseline` accepts `unknown` deliberately. Inventing a baseline to make the block look complete is the failure the field exists to prevent.
