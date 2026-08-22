PRAGMA foreign_keys = ON;

ALTER TABLE publications ADD COLUMN excerpt TEXT NOT NULL DEFAULT '';
ALTER TABLE publications ADD COLUMN content_markdown TEXT NOT NULL DEFAULT '';
ALTER TABLE publications ADD COLUMN featured_image TEXT;
ALTER TABLE publications ADD COLUMN author_name TEXT NOT NULL DEFAULT 'Adreto Nagdo Senoviros';
ALTER TABLE publications ADD COLUMN publication_date TEXT;
ALTER TABLE publications ADD COLUMN utopian_date TEXT;
ALTER TABLE publications ADD COLUMN gregorian_date TEXT;
ALTER TABLE publications ADD COLUMN created_at TEXT;
ALTER TABLE publications ADD COLUMN updated_at TEXT;

CREATE INDEX IF NOT EXISTS idx_publications_status_type_updated
ON publications(status, publication_type, updated_at DESC);

INSERT OR IGNORE INTO editorial_sync_state (
  source_key, cursor_value, last_success_at, last_attempt_at, status, message
) VALUES (
  'wordpress-public-archive', NULL, NULL, NULL, 'never',
  'Awaiting the first local WordPress archive inventory.'
);

INSERT OR IGNORE INTO editorial_sync_state (
  source_key, cursor_value, last_success_at, last_attempt_at, status, message
) VALUES (
  'wordpress-publish-bridge', NULL, NULL, NULL, 'never',
  'Local drafts remain isolated until a reviewed WordPress handoff is authorized.'
);
