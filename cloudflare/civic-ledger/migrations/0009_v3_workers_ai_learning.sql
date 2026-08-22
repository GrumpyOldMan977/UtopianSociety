PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ai_usage_daily (
  usage_date TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_neurons REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
