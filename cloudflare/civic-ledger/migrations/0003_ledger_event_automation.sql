ALTER TABLE ledger_entries ADD COLUMN event_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_event_key
ON ledger_entries(event_key)
WHERE event_key IS NOT NULL;
