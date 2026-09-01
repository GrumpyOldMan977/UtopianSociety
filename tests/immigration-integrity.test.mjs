import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("dynamic naturalization attempts have a database-enforced one-certificate relationship", async () => {
  const migration = await source("cloudflare/civic-ledger/migrations/0022_v4_immigration_assessment_integrity.sql");
  const worker = await source("cloudflare/civic-ledger/src/index.js");
  assert.match(migration, /ADD COLUMN assessment_attempt_id TEXT/);
  assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS idx_citizens_assessment_attempt_id/);
  assert.match(worker, /citizenByAssessmentAttempt/);
  assert.match(worker, /assessment_already_issued/);
});

test("certificate issuance provisions the profile foundation before its foreign-keyed login", async () => {
  const worker = await source("cloudflare/civic-ledger/src/index.js");
  const start = worker.indexOf("const issuanceStatements = [prepared.statement, citizenStatement]");
  const foundation = worker.indexOf("issuanceStatements.push(...civicProfileFoundationStatements", start);
  const account = worker.indexOf("INSERT INTO civic_accounts", foundation);
  assert.ok(start >= 0 && foundation > start && account > foundation);
  assert.match(worker, /INSERT OR IGNORE INTO ccu_accounts/);
});

test("authenticated practice assessments cannot issue certificates or change population", async () => {
  const migration = await source("cloudflare/civic-ledger/migrations/0022_v4_immigration_assessment_integrity.sql");
  const worker = await source("cloudflare/civic-ledger/src/index.js");
  const client = await source("app/components/ImmigrationApplication.tsx");
  assert.match(migration, /CHECK \(purpose IN \('naturalization', 'practice'\)\)/);
  assert.match(worker, /practice_assessment_no_issuance/);
  assert.match(worker, /requireCivicSession\(request, env\)/);
  assert.match(client, /No declaration, oath, certificate, citizen record, or population change can result/);
  assert.match(client, /Return to my Civic Profile/);
});

test("assessment visibility separates exact Founder analytics from thresholded public reporting", async () => {
  const migration = await source("cloudflare/civic-ledger/migrations/0022_v4_immigration_assessment_integrity.sql");
  const worker = await source("cloudflare/civic-ledger/src/index.js");
  const studio = await source("app/components/EditorialStudio.tsx");
  assert.match(migration, /'TIS-IMMIGRATION', 'immigration-assessments'/);
  assert.match(worker, /PUBLIC_ASSESSMENT_OUTCOME_THRESHOLD = 5/);
  assert.match(worker, /outcomes withheld below/);
  assert.match(worker, /syncAssessmentTransparencySummary/);
  assert.match(worker, /immigration_assessment_summary/);
  assert.match(studio, /Founder-only aggregate/);
  assert.match(studio, /Naturalization attempts/);
  assert.match(studio, /Practice attempts/);
});
