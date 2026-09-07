# falsifier-states-success

The falsifier describes the outcome we want, which nothing can contradict.

Trips `recommendation.falsifier_states_success` and nothing else.

This run passes `validate` completely. That is the point: it is a
well-formed review that a reader should not act on.

```bash
node packages/core/dist/cli.js validate fixtures/adversarial/falsifier-states-success
node packages/core/dist/cli.js quality  fixtures/adversarial/falsifier-states-success
```
