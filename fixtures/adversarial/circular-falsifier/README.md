# circular-falsifier

The falsifier restates the hypothesis, so no result can refute it.

Trips `recommendation.circular_falsifier` and nothing else.

This run passes `validate` completely. That is the point: it is a
well-formed review that a reader should not act on.

```bash
node packages/core/dist/cli.js validate fixtures/adversarial/circular-falsifier
node packages/core/dist/cli.js quality  fixtures/adversarial/circular-falsifier
```
