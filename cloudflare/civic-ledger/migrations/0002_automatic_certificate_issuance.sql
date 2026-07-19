ALTER TABLE citizens ADD COLUMN issuance_key TEXT;
ALTER TABLE citizens ADD COLUMN assessment_version TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_citizens_issuance_key
ON citizens(issuance_key)
WHERE issuance_key IS NOT NULL;
