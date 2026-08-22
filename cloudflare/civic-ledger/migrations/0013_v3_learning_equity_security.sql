PRAGMA foreign_keys = ON;

-- Private identity is deliberately separate from the ordinary civic profile.
-- Ciphertext is produced with the same AES-256-GCM key used for protected files.
CREATE TABLE IF NOT EXISTS civic_private_identities (
  civic_id TEXT PRIMARY KEY,
  legal_name_ciphertext TEXT,
  legal_name_iv TEXT,
  chosen_name TEXT NOT NULL DEFAULT '',
  identity_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE TABLE IF NOT EXISTS civic_private_name_variants (
  variant_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  variant_ciphertext TEXT NOT NULL,
  variant_iv TEXT NOT NULL,
  variant_kind TEXT NOT NULL CHECK (variant_kind IN (
    'former_name', 'initials', 'historical_spelling', 'documented_misspelling', 'other'
  )),
  verification_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'withdrawn')),
  created_at TEXT NOT NULL,
  withdrawn_at TEXT,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_private_name_variants_civic
ON civic_private_name_variants(civic_id, status);

CREATE TABLE IF NOT EXISTS civic_private_identity_audit (
  audit_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'variant_added', 'variant_withdrawn')),
  actor_label TEXT NOT NULL,
  changed_fields_json TEXT NOT NULL DEFAULT '[]',
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_private_identity_audit
ON civic_private_identity_audit(civic_id, occurred_at DESC);

-- A citizen accepts an immutable evidence contract before interpretation.
-- Corrections create a new row that points to the contract it supersedes.
CREATE TABLE IF NOT EXISTS learning_evidence_contracts (
  contract_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  supersedes_contract_id TEXT,
  contract_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'withdrawn')),
  document_type TEXT NOT NULL CHECK (document_type IN (
    'standardized_assessment', 'school_record', 'employment_record',
    'certification', 'authored_autobiographical_essay',
    'authored_non_autobiographical_essay', 'authored_fiction',
    'technical_project', 'creative_portfolio', 'personal_reflection',
    'third_party_evaluation', 'collaborative_work', 'clinical_context',
    'context_only', 'other'
  )),
  author_or_issuer TEXT NOT NULL,
  relationship_to_citizen TEXT NOT NULL,
  authorship_state TEXT NOT NULL CHECK (authorship_state IN (
    'citizen_author', 'citizen_subject', 'co_author', 'third_party', 'institutional', 'unknown'
  )),
  named_subjects_json TEXT NOT NULL DEFAULT '[]',
  fictional_subjects_json TEXT NOT NULL DEFAULT '[]',
  allowed_channels_json TEXT NOT NULL DEFAULT '[]',
  permitted_scope_json TEXT NOT NULL DEFAULT '[]',
  included_sections TEXT NOT NULL DEFAULT '',
  excluded_sections TEXT NOT NULL DEFAULT '',
  autobiographical_status TEXT NOT NULL CHECK (autobiographical_status IN (
    'yes', 'no', 'mixed', 'not_applicable', 'unknown'
  )),
  sensitivity_class TEXT NOT NULL CHECK (sensitivity_class IN (
    'ordinary', 'personal', 'sensitive', 'clinical_restricted'
  )),
  citizen_context TEXT NOT NULL DEFAULT '',
  verification_class TEXT NOT NULL CHECK (verification_class IN (
    'self_submitted', 'citizen_reviewed', 'externally_verified', 'directly_observed'
  )),
  identity_match_state TEXT NOT NULL CHECK (identity_match_state IN (
    'matched', 'probable', 'unresolved', 'not_applicable', 'mismatch_review'
  )),
  identity_match_method TEXT NOT NULL DEFAULT '',
  identity_match_confidence REAL NOT NULL DEFAULT 0
    CHECK (identity_match_confidence BETWEEN 0 AND 1),
  evidence_period_start TEXT,
  evidence_period_end TEXT,
  evidence_period_precision TEXT NOT NULL DEFAULT 'unknown' CHECK (evidence_period_precision IN (
    'day', 'month', 'year', 'academic_period', 'life_stage', 'unknown'
  )),
  evidence_period_authority TEXT NOT NULL DEFAULT 'unknown' CHECK (evidence_period_authority IN (
    'printed_source', 'issuer_metadata', 'corroborated_context',
    'citizen_declared', 'machine_inferred', 'unknown'
  )),
  evidence_period_basis TEXT NOT NULL DEFAULT '',
  printed_document_date TEXT,
  raw_extraction_hash TEXT,
  reviewed_transcript_hash TEXT,
  structured_diff_json TEXT NOT NULL DEFAULT '{}',
  extraction_method TEXT NOT NULL DEFAULT '',
  page_count INTEGER,
  citizen_attestation TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (document_id) REFERENCES protected_documents(document_id),
  FOREIGN KEY (supersedes_contract_id) REFERENCES learning_evidence_contracts(contract_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_contract_document
ON learning_evidence_contracts(civic_id, document_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_contract_supersedes
ON learning_evidence_contracts(supersedes_contract_id);

-- Observations keep source fact, interpretation, inference, channel, subject,
-- and deterministic profile effect separate and contestable.
CREATE TABLE IF NOT EXISTS learning_observations (
  observation_id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL,
  civic_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  actual_subject TEXT NOT NULL,
  subject_type TEXT NOT NULL CHECK (subject_type IN (
    'citizen', 'third_party', 'fictional_character', 'institution', 'unknown'
  )),
  evidence_channel TEXT NOT NULL CHECK (evidence_channel IN (
    'declared', 'demonstrated', 'observed'
  )),
  primary_q_key TEXT NOT NULL CHECK (primary_q_key IN (
    'intellectual', 'emotional', 'social', 'creative', 'adaptability',
    'moral', 'physical', 'natural', 'technological', 'learning'
  )),
  secondary_q_key TEXT CHECK (
    secondary_q_key IS NULL OR secondary_q_key IN (
      'intellectual', 'emotional', 'social', 'creative', 'adaptability',
      'moral', 'physical', 'natural', 'technological', 'learning'
    )
  ),
  primary_subdomain_key TEXT NOT NULL,
  secondary_subdomain_key TEXT,
  secondary_justification TEXT NOT NULL DEFAULT '',
  source_fact TEXT NOT NULL,
  contextual_interpretation TEXT NOT NULL,
  ten_q_inference TEXT NOT NULL,
  bounded_citation TEXT NOT NULL,
  estimate INTEGER NOT NULL CHECK (estimate BETWEEN 0 AND 100),
  range_low INTEGER NOT NULL CHECK (range_low BETWEEN 0 AND 100),
  range_high INTEGER NOT NULL CHECK (range_high BETWEEN 0 AND 100),
  confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  evidence_weight REAL NOT NULL CHECK (evidence_weight BETWEEN 0 AND 1),
  evidence_kind TEXT NOT NULL,
  temporal_context TEXT NOT NULL,
  evidence_period_start TEXT,
  evidence_period_end TEXT,
  admission_status TEXT NOT NULL CHECK (admission_status IN (
    'admitted', 'rejected', 'pending_review', 'excluded_by_citizen'
  )),
  rejection_reason TEXT NOT NULL DEFAULT '',
  verification_state TEXT NOT NULL DEFAULT 'self_submitted',
  evaluator_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (evaluation_id) REFERENCES learning_evaluations(evaluation_id),
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (document_id) REFERENCES protected_documents(document_id),
  FOREIGN KEY (contract_id) REFERENCES learning_evidence_contracts(contract_id),
  CHECK (range_low <= estimate AND estimate <= range_high),
  CHECK (secondary_q_key IS NULL OR secondary_q_key != primary_q_key),
  CHECK (
    secondary_q_key IS NULL
    OR (length(trim(secondary_justification)) >= 20 AND secondary_subdomain_key IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_learning_observations_profile
ON learning_observations(civic_id, primary_q_key, evidence_channel, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_observations_evaluation
ON learning_observations(evaluation_id, admission_status);

CREATE TABLE IF NOT EXISTS learning_profile_versions (
  profile_version_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  evaluator_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  evidence_set_hash TEXT NOT NULL,
  summary TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (civic_id, version_number),
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_profile_versions
ON learning_profile_versions(civic_id, version_number DESC);

CREATE TABLE IF NOT EXISTS learning_challenges (
  challenge_id TEXT PRIMARY KEY,
  civic_id TEXT NOT NULL,
  evaluation_id TEXT,
  observation_id TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN (
    'correction', 'context', 'dispute', 'exclude', 'reconsideration', 'counterevidence'
  )),
  citizen_statement TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'under_review', 'resolved', 'withdrawn'
  )),
  resolution TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (civic_id) REFERENCES civic_profiles(civic_id),
  FOREIGN KEY (evaluation_id) REFERENCES learning_evaluations(evaluation_id),
  FOREIGN KEY (observation_id) REFERENCES learning_observations(observation_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_challenges_civic
ON learning_challenges(civic_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS learning_q_subdomains (
  q_key TEXT NOT NULL,
  subdomain_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  permissible_evidence TEXT NOT NULL,
  prohibited_inference TEXT NOT NULL,
  minimum_breadth INTEGER NOT NULL DEFAULT 2,
  policy_version TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (q_key, subdomain_key, policy_version)
);

INSERT OR IGNORE INTO learning_q_subdomains (
  q_key, subdomain_key, label, description, permissible_evidence,
  prohibited_inference, minimum_breadth, policy_version, sort_order
) VALUES
  ('intellectual', 'reasoning', 'Reasoning', 'Analysis, inference, and problem framing.', 'Bounded demonstrations, examinations, and attributable assessment results.', 'Diagnosis, educational access, or cultural familiarity alone.', 2, 'learning-equity-v1', 1),
  ('intellectual', 'knowledge_integration', 'Knowledge integration', 'Combining information into a coherent model.', 'Authored work, projects, examinations, and observed application.', 'Topic choice alone.', 2, 'learning-equity-v1', 2),
  ('intellectual', 'critical_evaluation', 'Critical evaluation', 'Testing claims, assumptions, and evidence.', 'Arguments, reviews, research, and supervised exercises.', 'Agreement with an evaluator.', 2, 'learning-equity-v1', 3),
  ('emotional', 'emotional_perception', 'Emotional perception', 'Recognizing emotional information with appropriate uncertainty.', 'Direct reflection, supervised exercises, or attributable observation.', 'Diagnosis, fiction characters, or stereotypes.', 2, 'learning-equity-v1', 1),
  ('emotional', 'emotional_regulation', 'Emotional regulation', 'Demonstrated management of emotional response under relevant conditions.', 'Longitudinal demonstrated or attributable observed evidence.', 'A single adverse event or clinical label.', 2, 'learning-equity-v1', 2),
  ('emotional', 'reflective_awareness', 'Reflective awareness', 'Distinguishing feeling, inference, intention, and consequence.', 'Authored reflection and supervised demonstration.', 'Stated emotion alone as proof of conduct.', 2, 'learning-equity-v1', 3),
  ('social', 'communication', 'Communication', 'Making meaning accessible to other people.', 'Authored communication, collaboration, and attributable observation.', 'Popularity, conformity, or extroversion.', 2, 'learning-equity-v1', 1),
  ('social', 'perspective_coordination', 'Perspective coordination', 'Working across distinct viewpoints and needs.', 'Collaborative work and bounded multi-perspective reasoning.', 'Fictional characterization as lived conduct.', 2, 'learning-equity-v1', 2),
  ('social', 'cooperation', 'Cooperation', 'Participating reciprocally toward a shared purpose.', 'Verified collaboration or attributable observation.', 'Social diagnosis or group membership.', 2, 'learning-equity-v1', 3),
  ('creative', 'original_synthesis', 'Original synthesis', 'Producing a novel, coherent combination of ideas or forms.', 'Authored work, portfolios, designs, and projects.', 'Novel subject matter without demonstrated creation.', 2, 'learning-equity-v1', 1),
  ('creative', 'craft_development', 'Craft development', 'Sustained revision and control of a chosen medium.', 'Versioned work, portfolios, and completed performance.', 'Taste or evaluator preference.', 2, 'learning-equity-v1', 2),
  ('creative', 'generative_range', 'Generative range', 'Creating viable alternatives under constraints.', 'Design tasks, authored work, and supervised exercises.', 'Unusual beliefs or identity.', 2, 'learning-equity-v1', 3),
  ('adaptability', 'strategy_revision', 'Strategy revision', 'Changing approach in response to evidence.', 'Version history, projects, and attributable observation.', 'Hardship or instability alone.', 2, 'learning-equity-v1', 1),
  ('adaptability', 'transfer', 'Transfer', 'Applying learning in a new context.', 'Cross-context performance and projects.', 'Change in circumstance without demonstrated response.', 2, 'learning-equity-v1', 2),
  ('adaptability', 'recovery_learning', 'Recovery and learning', 'Using setbacks to improve later action.', 'Longitudinal evidence with a demonstrable later response.', 'Trauma, poverty, illness, or diagnosis.', 2, 'learning-equity-v1', 3),
  ('physical', 'embodied_skill', 'Embodied skill', 'Coordinated performance of physical or manual tasks.', 'Demonstration, certification, or attributable observation.', 'Body type, disability, or health status.', 2, 'learning-equity-v1', 1),
  ('physical', 'somatic_awareness', 'Somatic awareness', 'Using bodily feedback appropriately in action.', 'Supervised practice and citizen-declared experience clearly labeled.', 'Medical diagnosis or appearance.', 2, 'learning-equity-v1', 2),
  ('physical', 'safe_practice', 'Safe practice', 'Applying safety and care in embodied activity.', 'Training, performance, and attributable observation.', 'Health limitation as inability.', 2, 'learning-equity-v1', 3),
  ('natural', 'ecological_observation', 'Ecological observation', 'Accurate observation of living and environmental systems.', 'Field work, projects, research, and demonstrated classification.', 'Mentioning nature or preferring naturalism.', 2, 'learning-equity-v1', 1),
  ('natural', 'systems_stewardship', 'Systems stewardship', 'Reasoning about interdependence, limits, and care.', 'Verified practice, research, and applied planning.', 'Ideological agreement about nature.', 2, 'learning-equity-v1', 2),
  ('natural', 'pattern_classification', 'Pattern and classification', 'Recognizing and organizing natural-system patterns.', 'Demonstrations, assessments, and field records.', 'Topic vocabulary alone.', 2, 'learning-equity-v1', 3),
  ('technological', 'tool_fluency', 'Tool fluency', 'Using technical tools to achieve a purpose.', 'Projects, demonstrations, credentials, and attributable work.', 'Tool ownership or occupational title alone.', 2, 'learning-equity-v1', 1),
  ('technological', 'systems_reasoning', 'Systems reasoning', 'Understanding interacting technical components and constraints.', 'Designs, troubleshooting, code, and applied explanations.', 'Jargon or product preference.', 2, 'learning-equity-v1', 2),
  ('technological', 'technical_creation', 'Technical creation', 'Building, adapting, or repairing a functioning artifact.', 'Versioned projects and supervised performance.', 'Claims without an inspectable artifact or observation.', 2, 'learning-equity-v1', 3),
  ('learning', 'acquisition', 'Acquisition', 'Taking in new knowledge or skill.', 'Longitudinal education, demonstration, and attributable observation.', 'One verbal index as broad Learning Q.', 3, 'learning-equity-v1', 1),
  ('learning', 'retention', 'Retention', 'Maintaining and retrieving knowledge over time.', 'Repeated or longitudinal evidence.', 'A single exposure.', 3, 'learning-equity-v1', 2),
  ('learning', 'application', 'Application', 'Using learning in relevant practice.', 'Projects, work, examinations, and supervised tasks.', 'Course attendance alone.', 3, 'learning-equity-v1', 3),
  ('learning', 'transfer', 'Transfer', 'Extending learning to a different context.', 'Cross-context projects and observations.', 'Verbal comprehension alone.', 3, 'learning-equity-v1', 4),
  ('moral', 'ethical_perception', 'Ethical perception', 'Recognizing ethically relevant facts and affected persons.', 'Bounded reasoning or attributable conduct evidence.', 'Ideology, religion, politics, sexuality, or civic loyalty.', 4, 'learning-equity-v1', 1),
  ('moral', 'perspective_taking', 'Perspective-taking', 'Representing the interests and standing of others.', 'Multi-perspective reasoning and attributable conduct.', 'Fictional characterization as personal conduct.', 4, 'learning-equity-v1', 2),
  ('moral', 'consent_autonomy', 'Consent and autonomy reasoning', 'Respecting voluntary choice, boundaries, and personhood.', 'Explicit reasoning or attributable conduct.', 'Agreement with one relationship model.', 4, 'learning-equity-v1', 3),
  ('moral', 'harm_recognition', 'Harm recognition', 'Identifying injury, risk, and avoidable coercion.', 'Reasoning, restoration work, or attributable conduct.', 'Harmony history as a concealed punishment score.', 4, 'learning-equity-v1', 4),
  ('moral', 'proportionality', 'Proportionality', 'Relating response to context, severity, and repair.', 'Case reasoning or attributable responsibility.', 'Punitive preference or conformity.', 4, 'learning-equity-v1', 5),
  ('moral', 'fairness_consistency', 'Fairness and consistency', 'Applying reasons consistently while noticing relevant difference.', 'Comparative reasoning and attributable decisions.', 'One disputed conclusion.', 4, 'learning-equity-v1', 6),
  ('moral', 'epistemic_integrity', 'Truthfulness and epistemic integrity', 'Representing evidence, uncertainty, and error honestly.', 'Versioned work, corrections, and attributable conduct.', 'Unpopular claims or criticism.', 4, 'learning-equity-v1', 7),
  ('moral', 'accountability', 'Accountability', 'Recognizing and responding to one''s role in consequences.', 'Attributed conduct and restorative response.', 'Accusation, conviction, or anonymous report alone.', 4, 'learning-equity-v1', 8),
  ('moral', 'restorative_capacity', 'Restorative capacity', 'Participating in proportionate repair and reintegration.', 'Completed restorative practice or attributable observation.', 'Secret evidence or unresolved allegation.', 4, 'learning-equity-v1', 9),
  ('moral', 'responsible_power', 'Responsible use of power', 'Using authority with restraint and answerability.', 'Documented decisions and attributable observation.', 'Office, rank, or status alone.', 4, 'learning-equity-v1', 10),
  ('moral', 'epistemic_humility', 'Epistemic humility', 'Revising conclusions and acknowledging uncertainty.', 'Versioned reasoning, correction, and attributable conduct.', 'Agreement with the evaluator.', 4, 'learning-equity-v1', 11),
  ('moral', 'respect_personhood', 'Respect for personhood', 'Treating persons as ends with equal dignity.', 'Explicit reasoning and attributable conduct.', 'Identity, belief, culture, or consensual values.', 4, 'learning-equity-v1', 12);
