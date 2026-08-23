PRAGMA foreign_keys = ON;

-- Certificates are civic artifacts, not authentication secrets. New civic
-- accounts receive a separate one-time activation token whose plaintext is
-- shown only in the issuance response and whose digest is retained here.
ALTER TABLE civic_accounts ADD COLUMN activation_token_hash TEXT;
ALTER TABLE civic_accounts ADD COLUMN activation_token_created_at TEXT;
