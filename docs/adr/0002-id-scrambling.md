# ADR 0002 — Base62 + keyed deterministic scrambling (no code column)

## Status

Accepted

## Context

We need short, collision-free codes that are not trivially enumerable (/1, /2, /3 …).
We also want a single DB write on create (no insert-then-update for code), so we must not store a code column.

## Decision

- Database generates numeric `id` (BIGINT identity).
- Derive public code at runtime:
  - `publicId = scramble(id)` using a reversible keyed permutation (e.g., Feistel over 64-bit).
  - `code = Base62(publicId)`.
- Redirect lookup:
  - decode Base62 -> publicId
  - unscramble -> id
  - single DB select by id

Secret key is provided via env var `SHORTENER_SCRAMBLE_KEY` (never hardcoded).

## Consequences

Pros:

- No collisions
- Anti-enumeration
- Create = 1 insert
- Redirect = 1 select
  Cons:
- Key management matters; key rotation changes mappings (needs a strategy later).
