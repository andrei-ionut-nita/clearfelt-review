# 0006. User assertions are not evidence

Date: 2026-09-07

## Context

Onboarding asks the user for known comparisons, audiences and context. They will say things like "our main competitor is Example Consulting" or "our customers care mainly about price".

Neither is evidence. Both are hypotheses worth investigating.

Written straight into `findings.json`, they pass every referential integrity check, because the references are all real. What has happened is that the user's own belief has been laundered into a finding and handed back to them as research. It is the most damaging failure available to this product, because the output is confident, traceable, and circular.

## Decision

User statements enter as `UserAssertion` (`UA-`) with a status: `to_validate`, `corroborated`, `contradicted`, `accepted_untested`, `rejected`.

The chain is: user says, assertion, research question, research, evidence, finding.

Two integrity rules enforce it:

- A finding whose supporting evidence traces only to `user_supplied` sources is an error.
- An assertion marked `corroborated` whose evidence traces only to `user_supplied` sources is an error, because that corroborates nothing.

User-supplied comparisons carry `proposed_by: 'user'` and must name the assertion they came from, so they stay proposals to investigate rather than hardening into established competitors.

## Consequences

The system can accept everything a user tells it without any of it becoming a conclusion. `accepted_untested` exists for context worth keeping that nobody intends to verify, so honest shortcuts stay visible instead of being disguised as findings.

Harder: onboarding must create assertions rather than facts, and the research stage must actually test them. That work is the difference between research and transcription.

## Alternatives considered

**Trust the user on comparisons specifically, since they know their market.** Rejected because specification section 11 explicitly says users should not be required to know their own competitive landscape, and the cases where a user is wrong about a competitor are exactly the cases where the review is most valuable.
