# duplicate-recommendations

One intervention split into two, so the plan looks more substantial.

Trips `recommendation.near_duplicate` and nothing else.

This run passes `validate` completely. That is the point: it is a
well-formed review that a reader should not act on.

```bash
node packages/core/dist/cli.js validate fixtures/adversarial/duplicate-recommendations
node packages/core/dist/cli.js quality  fixtures/adversarial/duplicate-recommendations
```
