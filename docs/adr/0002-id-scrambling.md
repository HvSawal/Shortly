# ADR 0002 — Deterministic ID scrambling + Base62 codes (no code column)

## Status

Accepted

## Context

We want:

- Short codes that are not trivially enumerable (`/1`, `/2`, `/3`)
- Collision-free code generation
- Single DB insert (avoid insert+update)
- Fast redirect (single select)

## Decision

- DB generates numeric id (BIGINT identity)
- Compute public code from id:
  - `publicId = scramble(id, SHORTENER_SCRAMBLE_KEY)` using a reversible permutation
  - `code = Base62(publicId)`
- Do not store a `code` column
- On redirect:
  - `id = unscramble(Base62Decode(code))`
  - query by id

## Consequences

**Pros**

- Single insert
- Collision-free
- Prevents trivial enumeration
- Fast redirect (one select; cacheable)

**Cons**

- Secret key management required
- Key rotation changes mapping (requires migration strategy)

## Notes

- V1 uses a fixed key from env var `SHORTENER_SCRAMBLE_KEY`.
