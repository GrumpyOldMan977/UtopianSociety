PRAGMA foreign_keys = ON;

ALTER TABLE learning_q_scores ADD COLUMN reported_standard_score REAL
  CHECK (reported_standard_score IS NULL OR reported_standard_score BETWEEN 0 AND 200);

ALTER TABLE learning_q_scores ADD COLUMN reported_percentile REAL
  CHECK (reported_percentile IS NULL OR reported_percentile BETWEEN 0 AND 100);

ALTER TABLE learning_q_scores ADD COLUMN normalized_estimate_method TEXT NOT NULL DEFAULT '';

ALTER TABLE learning_q_scores ADD COLUMN domain_scope TEXT NOT NULL DEFAULT 'broad'
  CHECK (domain_scope IN ('broad', 'domain_limited'));

ALTER TABLE learning_q_scores ADD COLUMN domain_label TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_learning_q_scores_domain
ON learning_q_scores(civic_id, q_key, domain_scope, created_at DESC);
