CREATE TABLE IF NOT EXISTS balance_simulation_scenarios (
  scenario_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  basis_document TEXT NOT NULL,
  scenario_note TEXT NOT NULL,
  sustainable_population_capacity INTEGER NOT NULL CHECK (sustainable_population_capacity > 0),
  operational_buffer_percent REAL NOT NULL CHECK (operational_buffer_percent BETWEEN 0 AND 100),
  civic_equilibrium_target REAL NOT NULL DEFAULT 1.0,
  civic_equilibrium_lower REAL NOT NULL DEFAULT 0.95,
  civic_equilibrium_upper REAL NOT NULL DEFAULT 1.05,
  status TEXT NOT NULL CHECK (status IN ('illustrative', 'draft', 'retired')),
  simulated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS balance_resource_metrics (
  metric_id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  domain_key TEXT NOT NULL,
  label TEXT NOT NULL,
  capacity_population INTEGER NOT NULL CHECK (capacity_population > 0),
  capacity_basis TEXT NOT NULL,
  reserve_text TEXT NOT NULL DEFAULT '',
  trend_direction TEXT NOT NULL CHECK (trend_direction IN ('rising', 'stable', 'falling', 'unknown')),
  constraint_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('stable', 'watch', 'strained', 'unknown')),
  history_json TEXT NOT NULL DEFAULT '[]',
  methodology TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (scenario_id) REFERENCES balance_simulation_scenarios(scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_balance_resource_metrics_scenario
ON balance_resource_metrics(scenario_id, sort_order, domain_key);

CREATE TABLE IF NOT EXISTS ftb_trade_metrics (
  metric_id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  label TEXT NOT NULL,
  value_minor INTEGER,
  value_percent REAL,
  value_text TEXT NOT NULL DEFAULT '',
  trend_text TEXT NOT NULL DEFAULT '',
  risk_status TEXT NOT NULL CHECK (risk_status IN ('stable', 'watch', 'strained', 'unknown')),
  methodology TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (snapshot_id) REFERENCES ftb_snapshots(snapshot_id)
);

CREATE INDEX IF NOT EXISTS idx_ftb_trade_metrics_snapshot
ON ftb_trade_metrics(snapshot_id, sort_order, metric_key);

CREATE TABLE IF NOT EXISTS ftb_product_adjustments (
  adjustment_id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  product_label TEXT NOT NULL,
  category TEXT NOT NULL,
  external_price_minor INTEGER NOT NULL,
  shipping_cost_minor INTEGER NOT NULL,
  adjustment_percent REAL NOT NULL,
  final_ccu_micros INTEGER NOT NULL,
  internal_alternative TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL,
  risk_status TEXT NOT NULL CHECK (risk_status IN ('stable', 'watch', 'strained', 'unknown')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (snapshot_id) REFERENCES ftb_snapshots(snapshot_id)
);

CREATE INDEX IF NOT EXISTS idx_ftb_product_adjustments_snapshot
ON ftb_product_adjustments(snapshot_id, sort_order, category);
