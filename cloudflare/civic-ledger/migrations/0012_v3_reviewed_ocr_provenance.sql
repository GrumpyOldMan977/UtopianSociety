ALTER TABLE protected_documents ADD COLUMN source_document_id TEXT;
ALTER TABLE protected_documents ADD COLUMN derivation_method TEXT NOT NULL DEFAULT 'original'
  CHECK (derivation_method IN ('original', 'citizen_reviewed_ocr'));
ALTER TABLE protected_documents ADD COLUMN review_status TEXT NOT NULL DEFAULT 'not_required'
  CHECK (review_status IN ('not_required', 'reviewed'));
ALTER TABLE protected_documents ADD COLUMN reviewed_at TEXT;
ALTER TABLE protected_documents ADD COLUMN extraction_confidence REAL
  CHECK (extraction_confidence IS NULL OR extraction_confidence BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_protected_documents_source
ON protected_documents(civic_id, source_document_id, derivation_method);
