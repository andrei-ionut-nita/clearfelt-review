# 0002. Hand-written validators instead of a schema library

Date: 2026-09-07

## Context

No project in the clearfelt family uses a schema library. `clearfelt-diagram` and `clearfelt-slide` both define models as plain TypeScript interfaces and validate with hand-written domain functions.

This project differs in a way that matters: its JSON is written by a reasoning layer, not authored in TypeScript. It is genuinely untrusted input, which is the classic case for zod or ajv. The convention deserved checking rather than inheriting.

## Decision

Keep the convention. No zod, no ajv, no valibot.

`validate/fields.ts` provides small checkers that push onto an issue list rather than throwing. `validate/entities.ts` is one validator per type. `validate/integrity.ts` holds everything cross-collection.

## Consequences

A schema library would have solved field shape, which is the easy half and about 200 lines here. The half that catches broken intelligence is referential and semantic integrity: a finding citing evidence that does not exist, a recommendation resting only on what the user told us, an absence observation with no search scope. None of that is expressible as a schema, so it would have been hand-written regardless, and the library would have been a second mechanism covering the smaller problem.

Hand-written checks also produce better errors. `ref.missing findings/F-0023 [evidence_ids]: references E-9999, which does not exist in this run` names both ends. A schema error names a path.

Harder: adding a field means touching a validator. This is mechanical and the tests catch omissions.

## Alternatives considered

**zod, deriving types from schemas.** Genuinely attractive for the single source of truth. Rejected because the derived types are harder to read than the current interfaces, and those interfaces carry the doc comments that explain why each field exists, which is a substantial part of how this codebase teaches itself to the next reader.
