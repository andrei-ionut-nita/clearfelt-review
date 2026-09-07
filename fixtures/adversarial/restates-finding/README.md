# restates-finding

The change is the finding with an imperative verb in front of it.

Trips `recommendation.restates_finding` and nothing else.

This run passes `validate` completely. That is the point: it is a
well-formed review that a reader should not act on.

```bash
node packages/core/dist/cli.js validate fixtures/adversarial/restates-finding
node packages/core/dist/cli.js quality  fixtures/adversarial/restates-finding
```
