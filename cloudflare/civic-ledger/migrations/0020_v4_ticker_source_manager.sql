PRAGMA foreign_keys = ON;

-- The v3 ticker table could create notices, but it could not pause, order,
-- style, edit, or archive them from the Editorial Studio. Rebuild it with the
-- complete civic-wire lifecycle while retaining every existing record.
DROP INDEX IF EXISTS idx_ticker_announcements_status_window;
ALTER TABLE ticker_announcements RENAME TO ticker_announcements_v3;

CREATE TABLE ticker_announcements (
  announcement_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'expired', 'archived')),
  starts_at TEXT,
  ends_at TEXT,
  priority INTEGER NOT NULL DEFAULT 10 CHECK (priority BETWEEN -100 AND 100),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN -1000 AND 1000),
  treatment TEXT NOT NULL DEFAULT 'standard' CHECK (treatment IN ('standard', 'vellum', 'alternating', 'urgent', 'pulse')),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

INSERT INTO ticker_announcements (
  announcement_id, label, href, status, starts_at, ends_at, priority,
  sort_order, treatment, created_by, updated_by, created_at, updated_at, archived_at
)
SELECT
  announcement_id, label, href, status, starts_at, ends_at, priority,
  0, 'standard', created_by, created_by, created_at, updated_at,
  CASE WHEN status = 'archived' THEN updated_at ELSE NULL END
FROM ticker_announcements_v3;

DROP TABLE ticker_announcements_v3;

CREATE INDEX idx_ticker_announcements_status_window
ON ticker_announcements(status, starts_at, ends_at, priority DESC, sort_order ASC);

CREATE TABLE ticker_sources (
  source_id TEXT PRIMARY KEY,
  source_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('system', 'rss')),
  endpoint_url TEXT,
  credit_url TEXT,
  prefix TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  priority INTEGER NOT NULL DEFAULT 10 CHECK (priority BETWEEN -100 AND 100),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN -1000 AND 1000),
  treatment TEXT NOT NULL DEFAULT 'standard' CHECK (treatment IN ('standard', 'vellum', 'alternating', 'urgent', 'pulse')),
  item_limit INTEGER NOT NULL DEFAULT 3 CHECK (item_limit BETWEEN 1 AND 10),
  refresh_minutes INTEGER NOT NULL DEFAULT 5 CHECK (refresh_minutes BETWEEN 5 AND 1440),
  built_in INTEGER NOT NULL DEFAULT 0 CHECK (built_in IN (0, 1)),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  last_checked_at TEXT,
  last_success_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE INDEX idx_ticker_sources_rotation
ON ticker_sources(status, enabled, priority DESC, sort_order ASC);

CREATE INDEX idx_ticker_sources_refresh
ON ticker_sources(source_type, status, enabled, last_checked_at);

CREATE TABLE ticker_feed_items (
  item_id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  item_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  href TEXT,
  published_at TEXT,
  fetched_at TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0, 1)),
  suppressed INTEGER NOT NULL DEFAULT 0 CHECK (suppressed IN (0, 1)),
  suppressed_by TEXT,
  suppressed_at TEXT,
  FOREIGN KEY (source_id) REFERENCES ticker_sources(source_id)
);

CREATE INDEX idx_ticker_feed_items_current
ON ticker_feed_items(source_id, is_current, suppressed, published_at DESC, fetched_at DESC);

-- Built-in sources are ordinary managed records. They may be paused and
-- restyled in the Studio, while their implementation keys remain stable.
INSERT OR IGNORE INTO ticker_sources (
  source_id, source_key, label, source_type, endpoint_url, credit_url, prefix,
  enabled, status, priority, sort_order, treatment, item_limit, refresh_minutes,
  built_in, created_by, updated_by, created_at, updated_at
) VALUES
  ('TIS-POPULATION', 'population', 'Citizen population', 'system', NULL, '/citizens', '', 1, 'active', 30, 10, 'standard', 1, 5, 1, 'Utopian Society Civic Platform', 'Utopian Society Civic Platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TIS-WEATHER', 'south-pacific-weather', 'South Pacific Gyre weather', 'system', 'https://api.open-meteo.com/v1/forecast', 'https://open-meteo.com/', '', 1, 'active', 20, 20, 'standard', 1, 5, 1, 'Utopian Society Civic Platform', 'Utopian Society Civic Platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TIS-REFERENCE-TIME', 'utopian-reference-time', 'Utopian Reference Time', 'system', NULL, NULL, '', 1, 'active', 20, 30, 'standard', 1, 5, 1, 'Utopian Society Civic Platform', 'Utopian Society Civic Platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TIS-LEDGER', 'transparency-ledger', 'Transparency Ledger', 'system', NULL, '/transparency-ledger', '', 1, 'active', 20, 40, 'standard', 1, 5, 1, 'Utopian Society Civic Platform', 'Utopian Society Civic Platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TIS-BBC-WORLD', 'bbc-world', 'BBC World News', 'rss', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'https://www.bbc.com/news/world', 'World', 1, 'active', 10, 50, 'standard', 5, 5, 1, 'Utopian Society Civic Platform', 'Utopian Society Civic Platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Preserve the two formerly hard-coded notices as editable records so the
-- Editorial Studio can finally archive or revise them.
INSERT OR IGNORE INTO ticker_announcements (
  announcement_id, label, href, status, starts_at, ends_at, priority,
  sort_order, treatment, created_by, updated_by, created_at, updated_at
) VALUES
  ('UTA-V3-PUBLIC-UPDATE', 'V3 · Public site updated · OpenAI Build Week judging complete · Awaiting results.', '/transparency-ledger', 'active', NULL, NULL, 50, 10, 'standard', 'Utopian Society Civic Platform', 'Utopian Society Civic Platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('UTA-BUILD-WEEK-SUBMISSION', 'Local News · The Utopian Society enters OpenAI Build Week · View the public submission', 'https://devpost.com/software/the-utopian-society', 'active', NULL, NULL, 30, 20, 'standard', 'Utopian Society Civic Platform', 'Utopian Society Civic Platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

PRAGMA optimize;
