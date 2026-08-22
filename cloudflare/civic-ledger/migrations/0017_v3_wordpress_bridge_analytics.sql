PRAGMA foreign_keys = ON;

-- WordPress remains the editorial origin. The civic Worker retains a
-- last-known-good, public-only rendering copy for the Cloudflare/Sites facade.
ALTER TABLE publications ADD COLUMN content_html TEXT NOT NULL DEFAULT '';
ALTER TABLE publications ADD COLUMN source_url TEXT;
ALTER TABLE publications ADD COLUMN reading_minutes INTEGER NOT NULL DEFAULT 1;
ALTER TABLE publications ADD COLUMN word_count INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_publications_wordpress_id
ON publications(wordpress_id)
WHERE wordpress_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_publications_public_archive
ON publications(status, publication_type, publication_date DESC);

INSERT OR IGNORE INTO editorial_sync_state (
  source_key, cursor_value, last_success_at, last_attempt_at, status, message
) VALUES (
  'wordpress-live-bridge', NULL, NULL, NULL, 'never',
  'Awaiting the first read-only synchronization from the WordPress editorial origin.'
);

-- Privacy-preserving first-party traffic totals. No IP address, user agent,
-- civic identity, session identifier, or full referrer URL is retained.
CREATE TABLE IF NOT EXISTS public_analytics_daily (
  day_utc TEXT NOT NULL,
  path TEXT NOT NULL,
  source_group TEXT NOT NULL,
  source_detail TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  PRIMARY KEY (day_utc, path, source_group, source_detail, medium, campaign)
);

CREATE INDEX IF NOT EXISTS idx_public_analytics_day_source
ON public_analytics_daily(day_utc DESC, source_group, views DESC);
