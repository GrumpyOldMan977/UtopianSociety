-- Expand every Learning observation into an independently reviewable audit chain.
-- Existing observations remain historical and receive empty legacy fields; they
-- must be rerun under evaluator v3 before the expanded explanation is available.
ALTER TABLE learning_observations ADD COLUMN observable_feature TEXT NOT NULL DEFAULT '';
ALTER TABLE learning_observations ADD COLUMN rubric_connection TEXT NOT NULL DEFAULT '';
ALTER TABLE learning_observations ADD COLUMN limitations TEXT NOT NULL DEFAULT '';
ALTER TABLE learning_observations ADD COLUMN alternative_explanations TEXT NOT NULL DEFAULT '';
ALTER TABLE learning_observations ADD COLUMN scoring_rationale TEXT NOT NULL DEFAULT '';
