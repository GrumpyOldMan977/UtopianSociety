PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO civic_profiles (
  civic_id, civic_name, immigration_standing, learning_tier,
  contribution_status, residence_status, profile_visibility,
  created_at, updated_at
) VALUES (
  'USC-LOCAL-ADRETO', 'Adreto Nagdo Senoviros', 'active symbolic citizen',
  'Canopy · Aspirational development', 'seeking assignment', 'unassigned',
  'civic', '2026-07-21T00:00:00.000Z', '2026-07-21T00:00:00.000Z'
);

INSERT OR IGNORE INTO ccu_accounts (civic_id, balance_micros, updated_at)
VALUES ('USC-LOCAL-ADRETO', 0, '2026-07-21T00:00:00.000Z');

INSERT OR IGNORE INTO civic_accounts (
  account_id, civic_id, login_name, activation_certificate_number,
  password_salt, password_hash, password_iterations, status,
  failed_attempts, created_at, updated_at
) VALUES (
  'USA-LOCAL-ADRETO', 'USC-LOCAL-ADRETO', 'TheFounder',
  'USV-2026-492E91B113E4', NULL, NULL, 210000, 'pending_activation',
  0, '2026-07-21T00:00:00.000Z', '2026-07-21T00:00:00.000Z'
);

-- A clearly non-citizen fixture keeps the repeatable integration test from
-- altering Adreto's civic record.
INSERT OR IGNORE INTO civic_profiles (
  civic_id, civic_name, immigration_standing, learning_tier,
  contribution_status, residence_status, profile_visibility,
  created_at, updated_at
) VALUES (
  'USC-LOCAL-WORKFLOW-TEST', 'Local Workflow Test Record', 'test fixture',
  'unassigned', 'unassigned', 'unassigned', 'private',
  '2026-07-21T00:00:00.000Z', '2026-07-21T00:00:00.000Z'
);

INSERT OR IGNORE INTO ccu_accounts (civic_id, balance_micros, updated_at)
VALUES ('USC-LOCAL-WORKFLOW-TEST', 0, '2026-07-21T00:00:00.000Z');

INSERT OR IGNORE INTO civic_accounts (
  account_id, civic_id, login_name, activation_certificate_number,
  password_salt, password_hash, password_iterations, status,
  failed_attempts, created_at, updated_at
) VALUES (
  'USA-LOCAL-WORKFLOW-TEST', 'USC-LOCAL-WORKFLOW-TEST', 'LocalWorkflowTest',
  'USV-2026-000000000001', NULL, NULL, 210000, 'pending_activation',
  0, '2026-07-21T00:00:00.000Z', '2026-07-21T00:00:00.000Z'
);

INSERT OR IGNORE INTO learning_records (
  record_id, civic_id, tier_key, pathway_label, status, began_at, updated_at
) VALUES (
  'USL-LOCAL-ADRETO-CANOPY', 'USC-LOCAL-ADRETO', 'canopy',
  'Civic systems, corpus stewardship, and institutional design', 'active',
  '2026-07-21T00:00:00.000Z', '2026-07-21T00:00:00.000Z'
);

INSERT OR IGNORE INTO contribution_positions (
  position_id, title, sector_key, description, base_ccu_micros,
  sep_multiplier_millis, capacity_required, status, public_summary,
  created_at, updated_at
) VALUES
  (
    'USP-CORPUS-STEWARD', 'Corpus Continuity Steward', 'civic-record',
    'Review cross-document language, preserve provenance, and prepare transparent continuity corrections.',
    24000000, 1350, 'Sustained reading, careful documentation, and constitutional context',
    'open', 'Maintain coherence between the living Corpus, civic interfaces, and public revision record.',
    '2026-07-21T00:00:00.000Z', '2026-07-21T00:00:00.000Z'
  ),
  (
    'USP-LEARNING-MENTOR', 'Learning Path Mentor', 'learning',
    'Help a citizen connect present capacities and interests to a humane learning and contribution path.',
    18000000, 1150, 'Listening, educational guidance, and collaborative planning',
    'open', 'Support lifelong learning without turning early choices into permanent vocational sentences.',
    '2026-07-21T00:00:00.000Z', '2026-07-21T00:00:00.000Z'
  ),
  (
    'USP-SYSTEMS-OBSERVER', 'Public Systems Observer', 'custodianship',
    'Inspect a public-system status report and translate an observed need into a reviewable maintenance request.',
    16000000, 1250, 'Observation, plain-language reporting, and respect for public evidence',
    'open', 'Turn lived experience of infrastructure into accountable civic maintenance.',
    '2026-07-21T00:00:00.000Z', '2026-07-21T00:00:00.000Z'
  );

UPDATE civic_profiles
SET civic_title = CASE WHEN civic_id = 'USC-LOCAL-ADRETO' THEN 'Founder' ELSE civic_title END,
    public_bio = CASE
      WHEN civic_id = 'USC-LOCAL-ADRETO' AND public_bio = ''
      THEN 'Founder and Corpus Continuity Steward of the Utopian Society.'
      ELSE public_bio
    END,
    updated_at = '2026-07-23T00:00:00.000Z'
WHERE civic_id IN ('USC-LOCAL-ADRETO', 'USC-LOCAL-WORKFLOW-TEST');

UPDATE contribution_positions
SET base_ccu_micros = 0,
    available_slots = CASE position_id
      WHEN 'USP-CORPUS-STEWARD' THEN 2
      WHEN 'USP-LEARNING-MENTOR' THEN 4
      ELSE 3
    END,
    qualification_summary = CASE position_id
      WHEN 'USP-CORPUS-STEWARD' THEN 'Demonstrated continuity review, careful citation, and familiarity with the constitutional corpus.'
      WHEN 'USP-LEARNING-MENTOR' THEN 'Patient listening, educational guidance, and evidence of collaborative planning.'
      ELSE 'Clear observation, accessible reporting, and respect for public evidence.'
    END
WHERE position_id IN ('USP-CORPUS-STEWARD', 'USP-LEARNING-MENTOR', 'USP-SYSTEMS-OBSERVER');

INSERT OR IGNORE INTO ledger_entries (
  id, event_type, category, title, summary, actor_name, subject_name, subject_ref,
  occurred_at, utopian_date, gregorian_date, source_label, source_url,
  metadata_json, supersedes_id, previous_hash, integrity_hash, recorded_at
) VALUES (
  'USL-LOCAL-ADRETO-NATURALIZATION',
  'virtual_symbolic_citizenship_recorded',
  'citizenship',
  'Virtual symbolic citizenship recorded for Adreto Nagdo Senoviros',
  'The Founder completed the civic assessment, entered the voluntary oath, and became the first recorded virtual symbolic citizen.',
  'Immigration Civic Portal',
  'Adreto Nagdo Senoviros',
  'USC-LOCAL-ADRETO',
  '2026-07-16T00:00:00.000Z',
  'Spiraday, Solvane 7, Utopian Year 1',
  'July 16, 2026',
  'Local v3 Founder certificate reconstruction',
  '/circles/immigration',
  '{"certificateNumber":"USV-2026-492E91B113E4","assessmentScore":100,"standing":"active","localSimulation":true}',
  NULL,
  'LOCAL-V3-FOUNDER-GENESIS',
  'LOCAL-V3-FOUNDER-CERTIFICATE-INTEGRITY',
  '2026-07-16T00:00:00.000Z'
);

INSERT OR IGNORE INTO citizens (
  civic_id, civic_name, certificate_number, standing, assessment_score,
  utopian_joined_date, gregorian_joined_date, joined_at, entry_ledger_id,
  source_label, created_at, issuance_key, assessment_version
) VALUES (
  'USC-LOCAL-ADRETO',
  'Adreto Nagdo Senoviros',
  'USV-2026-492E91B113E4',
  'active',
  100,
  'Spiraday, Solvane 7, Utopian Year 1',
  'July 16, 2026',
  '2026-07-16T00:00:00.000Z',
  'USL-LOCAL-ADRETO-NATURALIZATION',
  'Local v3 Founder certificate reconstruction',
  '2026-07-16T00:00:00.000Z',
  'local-founder-certificate-reconstruction',
  'immigration-v2'
);

INSERT OR IGNORE INTO usu_courses (
  course_id, code, title, description, tier_key, contribution_relevance,
  status, created_at, updated_at
) VALUES
  (
    'USU-CIV-101', 'CIV-101', 'Civic Listening and Deliberation',
    'Practice evidence-aware listening, civic interpretation, and humane deliberation.',
    'trunk', 'Harmony, Learning, Contribution, and public deliberation',
    'available', '2026-07-23T00:00:00.000Z', '2026-07-23T00:00:00.000Z'
  ),
  (
    'USU-SYS-210', 'SYS-210', 'Living Systems and Civic Capacity',
    'Study ecological limits, public capacity, infrastructure, and the methods used by Balance.',
    'branches', 'Balance, Custodianship, Contribution, and Continuance review',
    'available', '2026-07-23T00:00:00.000Z', '2026-07-23T00:00:00.000Z'
  ),
  (
    'USU-RES-240', 'RES-240', 'Restoration, Harm, and Repair',
    'Learn the procedural and relational foundations of non-punitive restoration.',
    'branches', 'Harmony, Healing, and restorative civic practice',
    'available', '2026-07-23T00:00:00.000Z', '2026-07-23T00:00:00.000Z'
  ),
  (
    'USU-COR-330', 'COR-330', 'Corpus Continuity Stewardship',
    'Advanced practice in cross-document review, provenance, amendment, and transparent civic drafting.',
    'canopy', 'Corpus stewardship, constitutional review, and public continuity',
    'available', '2026-07-23T00:00:00.000Z', '2026-07-23T00:00:00.000Z'
  );

INSERT OR IGNORE INTO usu_course_prerequisites (
  course_id, prerequisite_course_id, q_key, minimum_score, rationale
) VALUES
  ('USU-SYS-210', NULL, 'natural', 45, 'A working foundation in ecological and systems reasoning supports the course.'),
  ('USU-RES-240', NULL, 'emotional', 45, 'Restorative practice requires emotional awareness and reflective listening.'),
  ('USU-COR-330', 'USU-CIV-101', NULL, NULL, 'Continuity stewardship builds on civic listening and deliberation.'),
  ('USU-COR-330', NULL, 'learning', 60, 'Advanced stewardship requires strong metacognitive learning practice.');

INSERT OR IGNORE INTO balance_indicators (
  indicator_id, label, domain_key, value_text, status, methodology, measured_at
) VALUES
  (
    'USBI-CIVIC-CAPACITY', 'Civic review capacity', 'civic-capacity',
    'Foundational local simulation', 'watch',
    'Compares open civic responsibilities with currently demonstrated steward capacity. No production decision is made from this value.',
    '2026-07-23T00:00:00.000Z'
  ),
  (
    'USBI-DATA-READINESS', 'Civic data readiness', 'information-systems',
    'Local-only schema in active development', 'watch',
    'Tracks whether core civic records have validated schemas, privacy boundaries, and tested workflows.',
    '2026-07-23T00:00:00.000Z'
  ),
  (
    'USBI-PRODUCTION-FREEZE', 'Public-site change exposure', 'continuance',
    'Production frozen during judging', 'stable',
    'Confirms that v3 civic development remains isolated from the public judged release.',
    '2026-07-23T00:00:00.000Z'
  );

INSERT OR IGNORE INTO ftb_snapshots (
  snapshot_id, fiat_currency, fiat_holdings_minor, import_summary_json,
  export_summary_json, methodology, measured_at
) VALUES (
  'USFTB-LOCAL-INITIAL',
  'USD',
  0,
  '[{"category":"Infrastructure and hosting","status":"simulation only"},{"category":"External goods","status":"not yet modeled"}]',
  '[{"category":"Creative and civic work","status":"not yet modeled"}]',
  'Local demonstrator only. Values are illustrative and do not represent held funds, prices, or real trade.',
  '2026-07-23T00:00:00.000Z'
);

INSERT OR REPLACE INTO balance_simulation_scenarios (
  scenario_id, label, basis_document, scenario_note,
  sustainable_population_capacity, operational_buffer_percent,
  civic_equilibrium_target, civic_equilibrium_lower, civic_equilibrium_upper,
  status, simulated_at
) VALUES (
  'USBS-FOUNDERS-YEAR-1',
  'Founders Year capacity exercise',
  'Charters'' Ratio Guidelines · annualized equilibrium method',
  'Population is read from the active Citizen Register. Every capacity, reserve, trend, constraint, and resource history below is an illustrative planning scenario.',
  120,
  20,
  1.0,
  0.95,
  1.05,
  'illustrative',
  '2026-07-25T00:00:00.000Z'
);

INSERT OR REPLACE INTO balance_resource_metrics (
  metric_id, scenario_id, domain_key, label, capacity_population,
  capacity_basis, reserve_text, trend_direction, constraint_text,
  status, history_json, methodology, sort_order
) VALUES
  (
    'USBR-FOOD', 'USBS-FOUNDERS-YEAR-1', 'food', 'Food production and reserves', 1200,
    'Simulated gardens, greenhouses, storage, and annualized consumption',
    '94 simulated days', 'rising', 'Greenhouse labor and seasonal storage',
    'stable', '[1040,1080,1115,1150,1180,1200]',
    'Capacity is expressed as the population supportable across a full Renewal Cycle with a quality and reserve margin.', 10
  ),
  (
    'USBR-WATER', 'USBS-FOUNDERS-YEAR-1', 'water', 'Water availability and treatment', 1450,
    'Simulated collection, treatment throughput, storage, and drought reserve',
    '126 simulated days', 'stable', 'Membrane replacement dependency',
    'stable', '[1320,1340,1375,1400,1430,1450]',
    'Uses the annualized Balance method; this is not an oceanic survey or measured South Pacific resource.', 20
  ),
  (
    'USBR-ENERGY', 'USBS-FOUNDERS-YEAR-1', 'energy', 'Energy generation and storage', 1300,
    'Simulated renewable generation, storage losses, peak demand, and maintenance',
    '11 simulated low-generation days', 'rising', 'Battery-cell replacement exposure',
    'stable', '[1080,1130,1175,1220,1260,1300]',
    'Capacity includes a reliability margin so peak demand does not consume the whole theoretical supply.', 30
  ),
  (
    'USBR-HOUSING', 'USBS-FOUNDERS-YEAR-1', 'housing', 'Housing capacity and accessibility', 1000,
    'Simulated completed dwellings, household distribution, repair load, and accessible reserve',
    '18% simulated accessible reserve', 'stable', 'Specialized accessibility retrofits',
    'watch', '[860,885,910,940,970,1000]',
    'Counts habitable capacity after maintenance and accessibility reserves rather than raw structures.', 40
  ),
  (
    'USBR-HEALING', 'USBS-FOUNDERS-YEAR-1', 'healing', 'Healing capacity', 500,
    'Two simulated practitioner-equivalents at the guideline optimum of 1 practitioner per 250 citizens',
    '15% quality margin', 'stable', 'Specialist and emergency coverage',
    'watch', '[420,440,455,470,485,500]',
    'Follows the Charters'' Ratio Guidelines: annualized throughput, quality modifier, and SEP range.', 50
  ),
  (
    'USBR-LEARNING', 'USBS-FOUNDERS-YEAR-1', 'learning', 'Learning capacity', 120,
    'Twelve simulated educator-equivalents at the guideline optimum of 1 educator per 10 active learners',
    '20% quality margin', 'rising', 'Educator formation is the present scenario bottleneck',
    'watch', '[70,78,86,96,108,120]',
    'This is the binding capacity in the scenario; low capacity prompts apprenticeships and incentives, never compulsory assignment.', 60
  ),
  (
    'USBR-WASTE', 'USBS-FOUNDERS-YEAR-1', 'waste', 'Waste processing and material recovery', 1100,
    'Simulated organic recovery, reuse, hazardous handling, and maintenance downtime',
    '22% simulated throughput reserve', 'stable', 'Specialized hazardous processing',
    'stable', '[980,1000,1020,1050,1080,1100]',
    'Capacity is reduced from technical maximum to preserve redundancy and safe maintenance windows.', 70
  ),
  (
    'USBR-ECOLOGY', 'USBS-FOUNDERS-YEAR-1', 'ecology', 'Ecological pressure', 975,
    'Simulated land, marine, emissions, biodiversity, and renewal constraints',
    '25% simulated ecological buffer', 'falling', 'Imported material footprint',
    'watch', '[1060,1045,1030,1010,990,975]',
    'A falling capacity trend represents a deliberately cautious scenario, not an observed ecological decline.', 80
  ),
  (
    'USBR-CONTRIBUTION', 'USBS-FOUNDERS-YEAR-1', 'contribution', 'Available contribution coordination', 200,
    'One simulated coordinator-equivalent at the guideline optimum of 1 coordinator per 200 contributors',
    '20% quality margin', 'stable', 'Cross-trained continuity coverage',
    'watch', '[150,160,170,180,190,200]',
    'The scenario applies the Contribution ratio as relational coordination capacity, not compulsory labor capacity.', 90
  ),
  (
    'USBR-IMPORTS', 'USBS-FOUNDERS-YEAR-1', 'imports', 'Import dependency resilience', 900,
    'Simulated essential import exposure and domestic replacement capacity',
    '78% simulated domestic coverage', 'rising', 'Medical, computing, and battery components',
    'watch', '[760,785,810,835,865,900]',
    'Shows the population supportable during external-market interruption under the simulated replacement program.', 100
  );

INSERT OR REPLACE INTO ftb_trade_metrics (
  metric_id, snapshot_id, metric_key, label, value_minor, value_percent,
  value_text, trend_text, risk_status, methodology, sort_order
) VALUES
  (
    'USFTBM-RESERVES', 'USFTB-LOCAL-INITIAL', 'external-reserves', 'External currency reserves',
    25000000, NULL, '$250,000 scenario', 'Three-month simulated reserve',
    'stable', 'Illustrative treasury balance for exercising FTB controls; no funds are held.', 10
  ),
  (
    'USFTBM-IMPORTS', 'USFTB-LOCAL-INITIAL', 'monthly-imports', 'Monthly import spending',
    1840000, NULL, '$18,400 scenario', '3.4% simulated increase',
    'watch', 'Illustrative monthly demand across medical, technical, infrastructure, and enrichment goods.', 20
  ),
  (
    'USFTBM-EXPORTS', 'USFTB-LOCAL-INITIAL', 'monthly-exports', 'Monthly export earnings',
    1490000, NULL, '$14,900 scenario', '1.8% simulated increase',
    'stable', 'Illustrative external receipts from creative, technical, educational, and specialist work.', 30
  ),
  (
    'USFTBM-BALANCE', 'USFTB-LOCAL-INITIAL', 'trade-balance', 'Monthly trade balance',
    -350000, NULL, '−$3,500 scenario', 'Deficit under review',
    'watch', 'Exports less imports in the same simulated reference month.', 40
  ),
  (
    'USFTBM-DEPENDENCY', 'USFTB-LOCAL-INITIAL', 'import-dependency', 'Imported-goods dependency',
    NULL, 22, '22% scenario', 'Falling through replacement',
    'watch', 'Share of modeled essential demand that cannot yet be met internally.', 50
  ),
  (
    'USFTBM-REPLACEMENT', 'USFTB-LOCAL-INITIAL', 'domestic-replacement', 'Domestic replacement availability',
    NULL, 61, '61% scenario', 'Rising',
    'stable', 'Share of modeled imported categories with a technically viable internal alternative.', 60
  ),
  (
    'USFTBM-PRICE', 'USFTB-LOCAL-INITIAL', 'external-price-change', 'External market price change',
    NULL, 3.4, '+3.4% scenario', 'Thirty-day illustrative index',
    'watch', 'Weighted example change across the simulated import basket.', 70
  ),
  (
    'USFTBM-RISK', 'USFTB-LOCAL-INITIAL', 'supply-risk', 'Supply-chain risk',
    NULL, NULL, 'Watch', 'Medical sensors and battery cells',
    'watch', 'Highest modeled exposure among essential imported categories.', 80
  );

INSERT OR REPLACE INTO ftb_product_adjustments (
  adjustment_id, snapshot_id, product_label, category,
  external_price_minor, shipping_cost_minor, adjustment_percent,
  final_ccu_micros, internal_alternative, reason, risk_status, sort_order
) VALUES
  (
    'USFTBA-MEDICAL-SENSOR', 'USFTB-LOCAL-INITIAL', 'Diagnostic sensor array', 'Medical',
    68000, 8500, -25, 573750000,
    'Repair and shared-clinic allocation',
    'Essential care input receives a reduced FTB adjustment and shared-use preference.', 'watch', 10
  ),
  (
    'USFTBA-SOLAR-CONTROLLER', 'USFTB-LOCAL-INITIAL', 'Solar storage controller', 'Infrastructure',
    42000, 6200, -15, 409700000,
    'Locally serviceable controller retrofit',
    'Infrastructure continuity reduces the adjustment while encouraging maintainable internal alternatives.', 'stable', 20
  ),
  (
    'USFTBA-COMPUTE-NODE', 'USFTB-LOCAL-INITIAL', 'Civic compute node', 'Technology',
    195000, 24000, 10, 2409000000,
    'Refurbished shared compute cluster',
    'External scarcity and energy cost add a simulated adjustment; shared internal use remains preferred.', 'watch', 30
  );

INSERT OR IGNORE INTO residences (
  residence_id, label, capacity, occupied, accessibility_json, status, created_at, updated_at
) VALUES (
  'USR-GARDEN-COMMONS-01', 'Garden Commons · Demonstration dwelling', 2, 0,
  '["step-free approach","adjustable lighting","quiet room"]', 'available',
  '2026-07-21T00:00:00.000Z', '2026-07-21T00:00:00.000Z'
);
