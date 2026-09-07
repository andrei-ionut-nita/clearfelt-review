# 0001. Files as canonical state

Date: 2026-09-07

## Context

The product models an intelligence graph: sources, observations, evidence, findings, opportunities, recommendations, actions. The word "graph" invites a graph database, and the word "evidence" invites embeddings and a vector store for retrieval.

Specification section 9 forbids both unless a demonstrated requirement appears, and names the preferred architecture: the coding agent is the reasoning layer, and local structured files are the canonical state.

## Decision

Canonical state is a directory of JSON files per run, plus snapshots of retrieved content. No graph database, no vector database, no embeddings, no ORM.

The conceptual graph is expressed as id references between plain arrays. `trace.ts` walks it with two edge tables.

## Consequences

Easier: the whole state is inspectable with `cat`, diffable with `git`, repairable in an editor, and testable without fixtures needing a running service. A reviewer can read a run.

Harder: queries that a graph database would answer in one traversal are hand-written walks. At current scale, one run holding hundreds of entities, this is not a real cost.

A future reader should not "upgrade" this to a database because the data looks graph-shaped. The requirement to change is a query the file representation genuinely cannot serve at the sizes actually seen, not an aesthetic preference for the right-looking tool.

## Alternatives considered

**SQLite.** Real appeal: referential integrity for free via foreign keys. Rejected because the integrity we care about is largely semantic rather than relational, "a finding must cite evidence" is not a foreign key, and the loss of plain-text diffability is significant for a product whose output must be auditable.

**Neo4j or Graphiti.** No traversal in the product is deep enough to need one.
