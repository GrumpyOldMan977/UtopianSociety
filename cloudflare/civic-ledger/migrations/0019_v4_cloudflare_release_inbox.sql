PRAGMA foreign_keys = ON;

-- Civic release manifests are queued and archived inside the existing
-- Cloudflare R2 civic bucket. D1 remains the authoritative append-only ledger.
INSERT OR IGNORE INTO editorial_sync_state (
  source_key, cursor_value, last_success_at, last_attempt_at, status, message
) VALUES (
  'civic-release-inbox', NULL, NULL, NULL, 'never',
  'Awaiting the first Cloudflare R2 civic release manifest.'
);
