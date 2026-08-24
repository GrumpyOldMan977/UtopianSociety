-- Required multi-location weather management for the public civic wire.

CREATE TABLE IF NOT EXISTS ticker_weather_locations (
  location_id TEXT PRIMARY KEY,
  location_key TEXT NOT NULL UNIQUE,
  source_id TEXT NOT NULL DEFAULT 'TIS-WEATHER' REFERENCES ticker_sources(source_id),
  label TEXT NOT NULL,
  latitude REAL NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude REAL NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  conditions_mode TEXT NOT NULL DEFAULT 'combined' CHECK (conditions_mode IN ('land', 'marine', 'combined')),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  priority INTEGER NOT NULL DEFAULT 10 CHECK (priority BETWEEN -100 AND 100),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN -1000 AND 1000),
  treatment TEXT NOT NULL DEFAULT 'standard' CHECK (treatment IN ('standard', 'vellum', 'alternating', 'urgent', 'pulse')),
  refresh_minutes INTEGER NOT NULL DEFAULT 5 CHECK (refresh_minutes BETWEEN 5 AND 1440),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  last_checked_at TEXT,
  last_success_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ticker_weather_locations_rotation
  ON ticker_weather_locations(status, enabled, priority DESC, sort_order ASC);

ALTER TABLE ticker_feed_items ADD COLUMN weather_location_id TEXT;
CREATE INDEX IF NOT EXISTS idx_ticker_feed_weather_location
  ON ticker_feed_items(weather_location_id, is_current, fetched_at DESC);

INSERT OR IGNORE INTO ticker_weather_locations (
  location_id, location_key, source_id, label, latitude, longitude, timezone,
  conditions_mode, enabled, status, priority, sort_order, treatment,
  refresh_minutes, created_by, updated_by, created_at, updated_at
) VALUES (
  'TIW-SPG', 'south-pacific-gyre', 'TIS-WEATHER', 'South Pacific Gyre',
  -32, -120, 'UTC', 'combined', 1, 'active', 10, 20, 'standard', 5,
  'Utopian Society Civic Platform', 'Utopian Society Civic Platform',
  '2026-08-23T00:00:00.000Z', '2026-08-23T00:00:00.000Z'
);

UPDATE ticker_sources
SET label = 'Weather locations', enabled = 1, status = 'active', priority = 10,
    item_limit = 10, updated_at = '2026-08-23T00:00:00.000Z', archived_at = NULL
WHERE source_id = 'TIS-WEATHER';

UPDATE ticker_sources
SET enabled = 1, status = 'active', priority = 10,
    updated_at = '2026-08-23T00:00:00.000Z', archived_at = NULL
WHERE source_id = 'TIS-REFERENCE-TIME';

CREATE TRIGGER IF NOT EXISTS ticker_required_source_update_guard
BEFORE UPDATE OF enabled, status ON ticker_sources
WHEN OLD.source_id IN ('TIS-WEATHER', 'TIS-REFERENCE-TIME')
  AND (NEW.enabled <> 1 OR NEW.status <> 'active')
BEGIN
  SELECT RAISE(ABORT, 'required_ticker_source');
END;

CREATE TRIGGER IF NOT EXISTS ticker_required_source_delete_guard
BEFORE DELETE ON ticker_sources
WHEN OLD.source_id IN ('TIS-WEATHER', 'TIS-REFERENCE-TIME')
BEGIN
  SELECT RAISE(ABORT, 'required_ticker_source');
END;

CREATE TRIGGER IF NOT EXISTS ticker_weather_last_active_update_guard
BEFORE UPDATE OF enabled, status ON ticker_weather_locations
WHEN OLD.enabled = 1 AND OLD.status = 'active'
  AND (NEW.enabled <> 1 OR NEW.status <> 'active')
  AND (SELECT COUNT(*) FROM ticker_weather_locations WHERE enabled = 1 AND status = 'active') <= 1
BEGIN
  SELECT RAISE(ABORT, 'at_least_one_weather_location_required');
END;

CREATE TRIGGER IF NOT EXISTS ticker_weather_last_active_delete_guard
BEFORE DELETE ON ticker_weather_locations
WHEN OLD.enabled = 1 AND OLD.status = 'active'
  AND (SELECT COUNT(*) FROM ticker_weather_locations WHERE enabled = 1 AND status = 'active') <= 1
BEGIN
  SELECT RAISE(ABORT, 'at_least_one_weather_location_required');
END;

PRAGMA optimize;
