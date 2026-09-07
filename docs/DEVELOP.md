# Developing

## Setup

```
pnpm install
```

Node >=22.12, pnpm 11.5.0 (pinned via `packageManager`).

## Running things

```
pnpm run preflight     lint, em-dash check, typecheck, test
pnpm run test:watch
pnpm run build
node packages/core/dist/cli.js
```

The CLI runs from `dist`, so build before smoke testing it.

## A smoke run end to end

```
node packages/core/dist/cli.js init acme --root /tmp/cfr
node packages/core/dist/cli.js stage    /tmp/cfr/acme/<run-id> scope_pending
node packages/core/dist/cli.js approve  /tmp/cfr/acme/<run-id> scope
node packages/core/dist/cli.js validate /tmp/cfr/acme/<run-id>
```

## Tests

Co-located as `*.test.ts` beside the code they cover. Run from the repository root: the vitest include glob is `packages/*/src/**/*.test.ts`, so running `pnpm vitest` from inside a package finds nothing. That is deliberate over a repo-wide glob, which is how `clearfelt-diagram` once silently stopped running an entire package's tests.

Fixtures are built with `packages/core/src/testing/factory.ts`. Every builder returns a **valid** entity, so a test that wants to prove one rule fires breaks exactly one field. Building invalid fixtures by hand produces tests that pass for the wrong reason.

`makeValidReview()` has a test asserting it validates cleanly. If that ever fails, every test built on it becomes meaningless, so fix it before anything else.

## Adding a validation rule

1. Shape-only? `validate/entities.ts`, in the validator for that type.
2. Needs another collection? `validate/integrity.ts`.
3. Give it a stable `code`, so a test can assert that specific rule fired rather than "some error happened".
4. Add a test that breaks exactly one field of a valid fixture and asserts the code.

## Adding a collection

Add a row to `COLLECTIONS` in `model/index.ts`, a field to `Review`, a default in `store.ts`, a validator, and an entry in `lifecycle.ts`'s stage table. The registry is the bridge; nothing else keeps its own list of filenames.

## Before opening a PR

1. `pnpm run preflight` clean.
2. `pnpm run build` clean.
3. Actually run the CLI against a seeded run and read the output. Tests assert structure; they do not tell you whether a trace is readable.
4. No em-dash characters anywhere you wrote.
5. If your change alters how existing pieces compose, write an ADR in `docs/decisions/`. Purely additive changes take a Note.
6. If you touched `prioritise.ts` weights, re-read `prioritise.test.ts`: the exhaustive cap tests exist because a weight change can silently make a band reachable that should not be.
