PRAGMA foreign_keys = ON;

ALTER TABLE learning_q_scores ADD COLUMN evidence_kind TEXT NOT NULL DEFAULT 'contextual'
  CHECK (evidence_kind IN (
    'standardized_assessment',
    'formal_academic',
    'occupational_history',
    'authored_work',
    'observed_behavior',
    'self_report',
    'contextual',
    'insufficient'
  ));

ALTER TABLE learning_q_scores ADD COLUMN temporal_context TEXT NOT NULL DEFAULT 'undated'
  CHECK (temporal_context IN (
    'adult_current',
    'adult_historical',
    'adolescent',
    'childhood',
    'undated'
  ));

ALTER TABLE learning_q_scores ADD COLUMN evidence_weight REAL NOT NULL DEFAULT 0
  CHECK (evidence_weight BETWEEN 0 AND 1);

ALTER TABLE learning_q_scores ADD COLUMN interpretive_basis TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_learning_q_scores_profile
ON learning_q_scores(civic_id, q_key, created_at DESC);
