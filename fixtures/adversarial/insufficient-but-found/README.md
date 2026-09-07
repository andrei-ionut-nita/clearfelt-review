# insufficient-but-found

The research judged the evidence inadequate, then built a finding on it.

Trips `question.insufficient_but_produced_findings` and nothing else.

This run passes `validate` completely. That is the point: it is a
well-formed review that a reader should not act on.

```bash
node packages/core/dist/cli.js validate fixtures/adversarial/insufficient-but-found
node packages/core/dist/cli.js quality  fixtures/adversarial/insufficient-but-found
```
