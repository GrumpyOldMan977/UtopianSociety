PRAGMA foreign_keys = ON;

-- Assessment selections are retained for auditability; applicant answers are
-- scored in memory and are never written to D1.
CREATE TABLE IF NOT EXISTS assessment_attempts (
  attempt_id TEXT PRIMARY KEY,
  assessment_version TEXT NOT NULL,
  selection_fingerprint TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('started', 'passed', 'not_passed', 'expired', 'issued')),
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  category_scores_json TEXT,
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  completed_at TEXT,
  issued_civic_id TEXT,
  source_label TEXT NOT NULL,
  FOREIGN KEY (issued_civic_id) REFERENCES citizens(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status_expires
ON assessment_attempts(status, expires_at);

CREATE TABLE IF NOT EXISTS assessment_attempt_questions (
  attempt_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal BETWEEN 1 AND 101),
  category_key TEXT NOT NULL,
  question_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  option_order_json TEXT,
  PRIMARY KEY (attempt_id, ordinal),
  UNIQUE (attempt_id, question_id),
  FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(attempt_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_attempt_category
ON assessment_attempt_questions(attempt_id, category_key, ordinal);

CREATE TABLE IF NOT EXISTS civic_profiles (
  civic_id TEXT PRIMARY KEY,
  civic_name TEXT NOT NULL,
  immigration_standing TEXT NOT NULL DEFAULT 'hopeful',
  learning_tier TEXT NOT NULL DEFAULT 'unassigned',
  contribution_status TEXT NOT NULL DEFAULT 'unassigned',
  residence_status TEXT NOT NULL DEFAULT 'unassigned',
  profile_visibility TEXT NOT NULL DEFAULT 'private' CHECK (profile_visibility IN ('private', 'civic', 'public')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_records (
  record_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  tier_key TEXT NOT NULL,
  pathway_label TEXT,
  status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'paused', 'completed')),
  began_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_records_civic_status
ON learning_records(civic_id, status);

CREATE TABLE IF NOT EXISTS contribution_positions (
  position_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sector_key TEXT NOT NULL,
  description TEXT NOT NULL,
  base_ccu_micros INTEGER NOT NULL CHECK (base_ccu_micros >= 0),
  sep_multiplier_millis INTEGER NOT NULL DEFAULT 1000 CHECK (sep_multiplier_millis > 0),
  capacity_required TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paused', 'filled', 'retired')),
  public_summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contribution_positions_status_sector
ON contribution_positions(status, sector_key);

CREATE TABLE IF NOT EXISTS contribution_assignments (
  assignment_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  position_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('offered', 'accepted', 'active', 'submitted', 'affirmed', 'declined', 'completed')),
  accepted_at TEXT,
  submitted_at TEXT,
  affirmed_at TEXT,
  affirmed_by TEXT,
  evidence_summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (position_id) REFERENCES contribution_positions(position_id)
);

CREATE INDEX IF NOT EXISTS idx_contribution_assignments_civic_status
ON contribution_assignments(civic_id, status);

CREATE TABLE IF NOT EXISTS ccu_accounts (
  civic_id TEXT PRIMARY KEY,
  balance_micros INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE TABLE IF NOT EXISTS ccu_transactions (
  transaction_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  assignment_id TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('contribution_credit', 'enrichment_debit', 'adjustment', 'reversal')),
  amount_micros INTEGER NOT NULL,
  balance_after_micros INTEGER NOT NULL,
  description TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (assignment_id) REFERENCES contribution_assignments(assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_ccu_transactions_civic_created
ON ccu_transactions(civic_id, created_at DESC);

CREATE TABLE IF NOT EXISTS residences (
  residence_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  occupied INTEGER NOT NULL DEFAULT 0 CHECK (occupied >= 0),
  accessibility_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS residence_assignments (
  residence_assignment_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  residence_id TEXT NOT NULL,
  began_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'ended')),
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (residence_id) REFERENCES residences(residence_id)
);

CREATE TABLE IF NOT EXISTS civic_requests (
  request_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  circle_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'reviewing', 'approved', 'alternative_offered', 'declined', 'withdrawn', 'completed')),
  public_summary TEXT NOT NULL,
  private_details_json TEXT NOT NULL DEFAULT '{}',
  decision_summary TEXT,
  decided_by TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  decided_at TEXT,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_civic_requests_civic_status
ON civic_requests(civic_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS harms (
  harm_id TEXT PRIMARY KEY,
  reporting_civic_id TEXT NOT NULL,
  responding_civic_id TEXT,
  privacy_level TEXT NOT NULL CHECK (privacy_level IN ('private', 'participants', 'procedural_public')),
  public_summary TEXT NOT NULL,
  private_details_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('draft', 'reported', 'triage', 'mediation', 'restoration', 'resolved', 'withdrawn')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (reporting_civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (responding_civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE TABLE IF NOT EXISTS harmony_proceedings (
  proceeding_id TEXT PRIMARY KEY,
  harm_id TEXT NOT NULL UNIQUE,
  scheduled_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('unscheduled', 'scheduled', 'held', 'continued', 'resolved', 'cancelled')),
  public_calendar_label TEXT NOT NULL,
  private_procedure_json TEXT NOT NULL DEFAULT '{}',
  decision_summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (harm_id) REFERENCES harms(harm_id)
);

CREATE TABLE IF NOT EXISTS publications (
  publication_id TEXT PRIMARY KEY,
  wordpress_id INTEGER,
  slug TEXT NOT NULL UNIQUE,
  publication_type TEXT NOT NULL CHECK (publication_type IN ('post', 'page', 'announcement')),
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  canonical_url TEXT,
  source_modified_at TEXT,
  synchronized_at TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ticker_announcements (
  announcement_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'active', 'expired', 'archived')),
  starts_at TEXT,
  ends_at TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ticker_announcements_status_window
ON ticker_announcements(status, starts_at, ends_at, priority DESC);

CREATE TABLE IF NOT EXISTS editorial_sync_state (
  source_key TEXT PRIMARY KEY,
  cursor_value TEXT,
  last_success_at TEXT,
  last_attempt_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('never', 'running', 'succeeded', 'failed')),
  message TEXT
);
