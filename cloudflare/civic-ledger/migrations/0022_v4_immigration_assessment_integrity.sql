PRAGMA foreign_keys = ON;

-- Distinguish public naturalization attempts from authenticated practice runs.
-- Practice attempts are intentionally ineligible for certificate issuance.
ALTER TABLE assessment_attempts
  ADD COLUMN purpose TEXT NOT NULL DEFAULT 'naturalization'
  CHECK (purpose IN ('naturalization', 'practice'));

ALTER TABLE assessment_attempts
  ADD COLUMN civic_id TEXT;

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_purpose_started
  ON assessment_attempts(purpose, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_civic_started
  ON assessment_attempts(civic_id, started_at DESC)
  WHERE civic_id IS NOT NULL;

-- A passed dynamic assessment may create no more than one citizen record.
-- The nullable column keeps legacy/static certificates valid while making the
-- v2 issuance relationship enforceable even under concurrent requests.
ALTER TABLE citizens
  ADD COLUMN assessment_attempt_id TEXT;

UPDATE citizens
SET assessment_attempt_id = (
  SELECT attempt_id
  FROM assessment_attempts
  WHERE assessment_attempts.issued_civic_id = citizens.civic_id
  LIMIT 1
)
WHERE assessment_attempt_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM assessment_attempts
    WHERE assessment_attempts.issued_civic_id = citizens.civic_id
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_citizens_assessment_attempt_id
  ON citizens(assessment_attempt_id)
  WHERE assessment_attempt_id IS NOT NULL;

-- Immigration activity is a managed system source: public, configurable, and
-- separate from the two sources that must always remain active.
INSERT OR IGNORE INTO ticker_sources (
  source_id, source_key, label, source_type, endpoint_url, credit_url, prefix,
  enabled, status, priority, sort_order, treatment, item_limit, refresh_minutes,
  built_in, created_by, updated_by, created_at, updated_at
) VALUES (
  'TIS-IMMIGRATION', 'immigration-assessments', 'Immigration assessments',
  'system', NULL, '/circles/immigration', '', 1, 'active', 20, 35, 'standard',
  1, 5, 1, 'Utopian Society Civic Platform',
  'Utopian Society Civic Platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

PRAGMA optimize;
