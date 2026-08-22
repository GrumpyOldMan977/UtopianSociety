PRAGMA foreign_keys = ON;

ALTER TABLE civic_profiles ADD COLUMN civic_title TEXT;
ALTER TABLE civic_profiles ADD COLUMN public_bio TEXT NOT NULL DEFAULT '';
ALTER TABLE civic_profiles ADD COLUMN avatar_asset_id TEXT;

ALTER TABLE contribution_positions ADD COLUMN available_slots INTEGER NOT NULL DEFAULT 1;
ALTER TABLE contribution_positions ADD COLUMN qualification_summary TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS civic_media_assets (
  asset_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('avatar', 'learning_evidence', 'healing_record', 'harmony_record')),
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  media_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 1 AND 10485760),
  encrypted INTEGER NOT NULL DEFAULT 0 CHECK (encrypted IN (0, 1)),
  encryption_iv TEXT,
  sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'replaced', 'deleted')),
  created_at TEXT NOT NULL,
  replaced_at TEXT,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_civic_media_assets_civic_purpose
ON civic_media_assets(civic_id, purpose, status, created_at DESC);

CREATE TABLE IF NOT EXISTS protected_documents (
  document_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  asset_id TEXT NOT NULL UNIQUE,
  record_domain TEXT NOT NULL CHECK (record_domain IN ('learning', 'healing', 'harmony')),
  consent_scope TEXT NOT NULL,
  retention_status TEXT NOT NULL DEFAULT 'retained' CHECK (retention_status IN ('retained', 'exported', 'deleted')),
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (asset_id) REFERENCES civic_media_assets(asset_id)
);

CREATE TABLE IF NOT EXISTS protected_document_access_log (
  access_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  civic_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('uploaded', 'read', 'evaluated', 'exported', 'deleted')),
  actor_label TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES protected_documents(document_id),
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_protected_document_access
ON protected_document_access_log(civic_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS contribution_time_entries (
  time_entry_id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL,
  civic_id TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes BETWEEN 1 AND 1440),
  work_date TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_asset_id TEXT,
  status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'submitted', 'affirmed', 'returned')),
  created_at TEXT NOT NULL,
  affirmed_at TEXT,
  FOREIGN KEY (assignment_id) REFERENCES contribution_assignments(assignment_id),
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (evidence_asset_id) REFERENCES civic_media_assets(asset_id)
);

CREATE INDEX IF NOT EXISTS idx_contribution_time_entries_assignment
ON contribution_time_entries(assignment_id, status, work_date);

CREATE TABLE IF NOT EXISTS civic_value_flows (
  flow_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  assignment_id TEXT,
  flow_type TEXT NOT NULL CHECK (flow_type IN ('earned', 'allocated', 'pooled', 'donated', 'returned', 'adjusted')),
  amount_micros INTEGER NOT NULL,
  balance_after_micros INTEGER NOT NULL,
  source_label TEXT NOT NULL,
  purpose TEXT NOT NULL,
  utopian_date TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (assignment_id) REFERENCES contribution_assignments(assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_civic_value_flows_civic
ON civic_value_flows(civic_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS learning_evaluations (
  evaluation_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'consented', 'processing', 'completed', 'needs_more_evidence', 'failed', 'superseded')),
  assessment_type TEXT NOT NULL DEFAULT 'automated_assessment',
  goal_text TEXT NOT NULL DEFAULT '',
  consented_at TEXT,
  model_name TEXT,
  model_response_id TEXT,
  summary TEXT NOT NULL DEFAULT '',
  confidence REAL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  supersedes_evaluation_id TEXT,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (supersedes_evaluation_id) REFERENCES learning_evaluations(evaluation_id)
);

CREATE TABLE IF NOT EXISTS learning_evaluation_documents (
  evaluation_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  PRIMARY KEY (evaluation_id, document_id),
  FOREIGN KEY (evaluation_id) REFERENCES learning_evaluations(evaluation_id),
  FOREIGN KEY (document_id) REFERENCES protected_documents(document_id)
);

CREATE TABLE IF NOT EXISTS learning_q_scores (
  score_id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL,
  civic_id TEXT NOT NULL,
  q_key TEXT NOT NULL CHECK (q_key IN ('intellectual', 'emotional', 'social', 'creative', 'adaptability', 'moral', 'physical', 'natural', 'technological', 'learning')),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  evidence_summary TEXT NOT NULL,
  evidence_citations_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY (evaluation_id) REFERENCES learning_evaluations(evaluation_id),
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_q_scores_civic
ON learning_q_scores(civic_id, created_at DESC);

CREATE TABLE IF NOT EXISTS learning_goals (
  goal_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  goal_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'withdrawn')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE TABLE IF NOT EXISTS usu_courses (
  course_id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tier_key TEXT NOT NULL,
  contribution_relevance TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('draft', 'available', 'paused', 'retired')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usu_course_prerequisites (
  course_id TEXT NOT NULL,
  prerequisite_course_id TEXT,
  q_key TEXT,
  minimum_score INTEGER,
  rationale TEXT NOT NULL,
  PRIMARY KEY (course_id, prerequisite_course_id, q_key),
  FOREIGN KEY (course_id) REFERENCES usu_courses(course_id),
  FOREIGN KEY (prerequisite_course_id) REFERENCES usu_courses(course_id),
  CHECK (
    (prerequisite_course_id IS NOT NULL AND q_key IS NULL AND minimum_score IS NULL)
    OR (prerequisite_course_id IS NULL AND q_key IS NOT NULL AND minimum_score BETWEEN 0 AND 100)
  )
);

CREATE TABLE IF NOT EXISTS usu_enrollments (
  enrollment_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'enrolled', 'active', 'completed', 'withdrawn')),
  enrolled_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (civic_id, course_id),
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (course_id) REFERENCES usu_courses(course_id)
);

CREATE TABLE IF NOT EXISTS learning_recommendations (
  recommendation_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  evaluation_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('strengthening', 'advancement', 'goal_based', 'exploration', 'prerequisite_bridge')),
  rationale TEXT NOT NULL,
  confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'saved', 'dismissed', 'enrolled')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (evaluation_id) REFERENCES learning_evaluations(evaluation_id),
  FOREIGN KEY (course_id) REFERENCES usu_courses(course_id)
);

CREATE TABLE IF NOT EXISTS healing_timeline (
  care_record_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('visit', 'care_note', 'allergy', 'immunization', 'self_report')),
  label TEXT NOT NULL,
  private_summary TEXT NOT NULL,
  occurred_on TEXT NOT NULL,
  document_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (document_id) REFERENCES protected_documents(document_id)
);

CREATE TABLE IF NOT EXISTS healing_prescriptions (
  prescription_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  medication_label TEXT NOT NULL,
  directions TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'discontinued')),
  prescribed_on TEXT NOT NULL,
  review_on TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE TABLE IF NOT EXISTS healing_appointment_requests (
  appointment_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  care_domain TEXT NOT NULL,
  preference_json TEXT NOT NULL DEFAULT '{}',
  private_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('draft', 'requested', 'scheduled', 'completed', 'cancelled')),
  scheduled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE TABLE IF NOT EXISTS harmony_findings (
  finding_id TEXT PRIMARY KEY,
  proceeding_id TEXT NOT NULL,
  civic_id TEXT NOT NULL,
  finding TEXT NOT NULL CHECK (finding IN ('responsibility_found', 'responsibility_not_found', 'mutual_resolution', 'dismissed')),
  private_summary TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  FOREIGN KEY (proceeding_id) REFERENCES harmony_proceedings(proceeding_id),
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE TABLE IF NOT EXISTS restoration_requirements (
  requirement_id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL,
  civic_id TEXT NOT NULL,
  requirement_label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'met', 'modified', 'withdrawn')),
  due_at TEXT,
  met_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (finding_id) REFERENCES harmony_findings(finding_id),
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE TABLE IF NOT EXISTS balance_indicators (
  indicator_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  domain_key TEXT NOT NULL,
  value_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('stable', 'watch', 'strained', 'unknown')),
  methodology TEXT NOT NULL,
  measured_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ftb_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  fiat_currency TEXT NOT NULL,
  fiat_holdings_minor INTEGER NOT NULL,
  import_summary_json TEXT NOT NULL DEFAULT '[]',
  export_summary_json TEXT NOT NULL DEFAULT '[]',
  methodology TEXT NOT NULL,
  measured_at TEXT NOT NULL
);
