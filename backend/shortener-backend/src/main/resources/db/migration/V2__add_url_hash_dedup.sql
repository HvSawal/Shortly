-- Adds url_hash for deterministic dedup of (normalized original_url + preview_enabled)
-- Also cleans up existing duplicates so we can safely add a UNIQUE index.

-- SHA-256 helper comes from pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE short_url
  ADD COLUMN IF NOT EXISTS url_hash VARCHAR(64);

-- Backfill url_hash for existing rows (assumes original_url already normalized by app)
UPDATE short_url
SET url_hash = encode(digest(original_url || '|' || preview_enabled::text, 'sha256'), 'hex')
WHERE url_hash IS NULL;

-- If duplicates already exist (same URL+preview created multiple times),
-- keep the smallest id as the canonical row and merge click_count into it.
WITH d AS (
  SELECT url_hash, MIN(id) AS keep_id, SUM(click_count) AS total_clicks
  FROM short_url
  GROUP BY url_hash
  HAVING COUNT(*) > 1
)
UPDATE short_url s
SET click_count = d.total_clicks
FROM d
WHERE s.id = d.keep_id;

-- Delete duplicate rows (keep only keep_id per url_hash)
WITH d AS (
  SELECT url_hash, MIN(id) AS keep_id
  FROM short_url
  GROUP BY url_hash
  HAVING COUNT(*) > 1
)
DELETE FROM short_url s
USING d
WHERE s.url_hash = d.url_hash
  AND s.id <> d.keep_id;

ALTER TABLE short_url
  ALTER COLUMN url_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_short_url_url_hash ON short_url(url_hash);