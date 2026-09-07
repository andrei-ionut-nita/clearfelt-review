# dropped-assumption

The finding says it rests on an assumption; the recommendation does not.

Trips `recommendation.drops_assumption` and nothing else.

This run passes `validate` completely. That is the point: it is a
well-formed review that a reader should not act on.

```bash
node packages/core/dist/cli.js validate fixtures/adversarial/dropped-assumption
node packages/core/dist/cli.js quality  fixtures/adversarial/dropped-assumption
```
