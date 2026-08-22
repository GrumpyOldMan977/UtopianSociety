PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS civic_public_recognitions (
  recognition_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  circle_key TEXT NOT NULL,
  recognition_type TEXT NOT NULL CHECK (
    recognition_type IN ('achievement', 'recognition', 'service', 'office')
  ),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  issued_by TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  utopian_date TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'public' CHECK (status IN ('public', 'withdrawn')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_civic_public_recognitions_profile
ON civic_public_recognitions(civic_id, status, issued_at DESC);
