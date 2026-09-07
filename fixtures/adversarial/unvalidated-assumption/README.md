# unvalidated-assumption

A confident recommendation resting on something nobody established.

Trips `recommendation.rests_on_unvalidated_assumption` and nothing else.

This run passes `validate` completely. That is the point: it is a
well-formed review that a reader should not act on.

```bash
node packages/core/dist/cli.js validate fixtures/adversarial/unvalidated-assumption
node packages/core/dist/cli.js quality  fixtures/adversarial/unvalidated-assumption
```
