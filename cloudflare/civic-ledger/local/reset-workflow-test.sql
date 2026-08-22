PRAGMA foreign_keys = ON;

-- This reset is deliberately scoped to the clearly labelled non-citizen QA
-- fixture. Adreto's civic record and every other citizen record are untouched.
BEGIN TRANSACTION;

-- The Transparency Ledger is intentionally append-only, including in local
-- development. QA entries remain as an auditable record and are isolated by
-- the fixture civic ID and actor label.

DELETE FROM assessment_attempts
WHERE source_label = 'Local QA · automated immigration assessment';

DELETE FROM restoration_requirements
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST'
   OR finding_id IN (
     SELECT finding_id FROM harmony_findings
     WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST'
   );

DELETE FROM harmony_findings
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST'
   OR proceeding_id IN (
     SELECT proceeding_id FROM harmony_proceedings
     WHERE harm_id IN (
       SELECT harm_id FROM harms
       WHERE reporting_civic_id = 'USC-LOCAL-WORKFLOW-TEST'
          OR responding_civic_id = 'USC-LOCAL-WORKFLOW-TEST'
     )
   );

DELETE FROM harmony_proceedings
WHERE harm_id IN (
  SELECT harm_id FROM harms
  WHERE reporting_civic_id = 'USC-LOCAL-WORKFLOW-TEST'
     OR responding_civic_id = 'USC-LOCAL-WORKFLOW-TEST'
);

DELETE FROM harms
WHERE reporting_civic_id = 'USC-LOCAL-WORKFLOW-TEST'
   OR responding_civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM healing_appointment_requests
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM healing_prescriptions
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM healing_timeline
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM learning_challenges
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM learning_recommendations
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM learning_q_scores
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM learning_observations
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM learning_evaluation_documents
WHERE evaluation_id IN (
  SELECT evaluation_id FROM learning_evaluations
  WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST'
);

UPDATE learning_evaluations
SET supersedes_evaluation_id = NULL
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM learning_evaluations
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

UPDATE learning_evidence_contracts
SET supersedes_contract_id = NULL
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM learning_evidence_contracts
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM learning_profile_versions
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM learning_goals
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM learning_records
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM usu_enrollments
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM protected_document_access_log
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST'
   OR document_id IN (
     SELECT document_id FROM protected_documents
     WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST'
   );

DELETE FROM protected_documents
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM civic_private_identity_audit
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM civic_private_name_variants
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM civic_private_identities
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM civic_public_recognitions
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM civic_requests
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM residence_assignments
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM civic_value_flows
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM ccu_transactions
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM contribution_time_entries
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM contribution_assignments
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM civic_sessions
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

DELETE FROM civic_media_assets
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

UPDATE ccu_accounts
SET balance_micros = 0,
    updated_at = '2026-07-21T00:00:00.000Z'
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

UPDATE civic_accounts
SET activation_certificate_number = 'USV-2026-000000000001',
    password_salt = NULL,
    password_hash = NULL,
    status = 'pending_activation',
    failed_attempts = 0,
    locked_until = NULL,
    last_login_at = NULL,
    updated_at = '2026-07-21T00:00:00.000Z'
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

UPDATE civic_profiles
SET civic_name = 'Local Workflow Test Record',
    immigration_standing = 'test fixture',
    learning_tier = 'unassigned',
    contribution_status = 'unassigned',
    residence_status = 'unassigned',
    profile_visibility = 'private',
    civic_title = NULL,
    public_bio = '',
    avatar_asset_id = NULL,
    updated_at = '2026-07-21T00:00:00.000Z'
WHERE civic_id = 'USC-LOCAL-WORKFLOW-TEST';

COMMIT;
