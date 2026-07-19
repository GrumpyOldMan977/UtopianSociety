PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ledger_entries (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  subject_name TEXT,
  subject_ref TEXT,
  occurred_at TEXT NOT NULL,
  utopian_date TEXT NOT NULL,
  gregorian_date TEXT NOT NULL,
  source_label TEXT NOT NULL,
  source_url TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  supersedes_id TEXT,
  previous_hash TEXT NOT NULL UNIQUE,
  integrity_hash TEXT NOT NULL UNIQUE,
  recorded_at TEXT NOT NULL,
  FOREIGN KEY (supersedes_id) REFERENCES ledger_entries(id)
);

CREATE INDEX IF NOT EXISTS idx_ledger_category_seq ON ledger_entries(category, seq DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_event_type_seq ON ledger_entries(event_type, seq DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_occurred_at ON ledger_entries(occurred_at DESC);

CREATE TRIGGER IF NOT EXISTS ledger_entries_immutable_update
BEFORE UPDATE ON ledger_entries
BEGIN
  SELECT RAISE(ABORT, 'Transparency Ledger entries are immutable; append a correction instead.');
END;

CREATE TRIGGER IF NOT EXISTS ledger_entries_immutable_delete
BEFORE DELETE ON ledger_entries
BEGIN
  SELECT RAISE(ABORT, 'Transparency Ledger entries cannot be deleted.');
END;

CREATE TABLE IF NOT EXISTS citizens (
  civic_id TEXT PRIMARY KEY,
  civic_name TEXT NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  standing TEXT NOT NULL CHECK (standing IN ('active', 'independent', 'revoked')),
  assessment_score INTEGER NOT NULL CHECK (assessment_score BETWEEN 0 AND 100),
  utopian_joined_date TEXT NOT NULL,
  gregorian_joined_date TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  exited_at TEXT,
  entry_ledger_id TEXT NOT NULL,
  exit_ledger_id TEXT,
  source_label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (entry_ledger_id) REFERENCES ledger_entries(id),
  FOREIGN KEY (exit_ledger_id) REFERENCES ledger_entries(id)
);

CREATE INDEX IF NOT EXISTS idx_citizens_standing ON citizens(standing);
CREATE INDEX IF NOT EXISTS idx_citizens_joined_at ON citizens(joined_at DESC);

CREATE VIEW IF NOT EXISTS population_summary AS
SELECT
  SUM(CASE WHEN standing = 'active' THEN 1 ELSE 0 END) AS active_population,
  SUM(CASE WHEN standing = 'independent' THEN 1 ELSE 0 END) AS independent_population,
  SUM(CASE WHEN standing = 'revoked' THEN 1 ELSE 0 END) AS revoked_population,
  COUNT(*) AS total_recorded
FROM citizens;
