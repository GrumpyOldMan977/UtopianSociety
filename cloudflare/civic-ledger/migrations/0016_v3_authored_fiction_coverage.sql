-- Preserve the complete-work audit receipt and domain-by-domain fiction review
-- with each evaluation. Historical evaluations retain empty receipts and stay
-- distinguishable by their earlier evaluator and policy versions.
ALTER TABLE learning_evaluations ADD COLUMN coverage_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE learning_evaluations ADD COLUMN domain_reviews_json TEXT NOT NULL DEFAULT '[]';

-- Moral-Q observations of fiction must record how the narrative treats harm,
-- consent, autonomy, consequence, restoration, responsibility, and power.
ALTER TABLE learning_observations ADD COLUMN moral_treatment_json TEXT NOT NULL DEFAULT '[]';
