PRAGMA foreign_keys = ON;

-- Local v3 authentication deliberately stores only salted password hashes.
-- The certificate serial is used once to activate a pending civic account.
CREATE TABLE IF NOT EXISTS civic_accounts (
  account_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL UNIQUE,
  login_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  activation_certificate_number TEXT NOT NULL,
  password_salt TEXT,
  password_hash TEXT,
  password_iterations INTEGER NOT NULL DEFAULT 210000,
  status TEXT NOT NULL CHECK (status IN ('pending_activation', 'active', 'locked')),
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_civic_accounts_login_status
ON civic_accounts(login_name, status);

CREATE TABLE IF NOT EXISTS civic_sessions (
  session_token_hash TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_civic_sessions_civic_expiry
ON civic_sessions(civic_id, expires_at);
