import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const appOrigin = process.env.CIVIC_PORTAL_LOCAL_ORIGIN || "http://localhost:9877";
const civicApi = `${appOrigin}/api/civic`;
const testFilePath = process.env.LEARNING_TEST_FILE?.trim();
const skipAi = process.env.LEARNING_SKIP_AI === "1";
let sessionToken = "";

async function jsonRequest(url, { method = "GET", body, authenticated = true } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authenticated && sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};
  assert.ok(response.ok, `${method} ${url} failed: ${result.error || response.status}`);
  return result;
}

const login = await jsonRequest(`${civicApi}/v3/auth/login`, {
  method: "POST",
  authenticated: false,
  body: {
    loginName: "LocalWorkflowTest",
    password: "Local workflow test password 2026!",
    certificateNumber: "USV-2026-000000000001",
  },
});
sessionToken = login.sessionToken;

const evidence = testFilePath
  ? await readFile(testFilePath)
  : Buffer.from([
      "Synthetic Learning evaluation evidence for a local integration test.",
      "The learner has completed coursework in mathematics, writing, ecology, ethics, and information systems.",
      "They have facilitated small-group discussions, repaired computers, documented civic procedures, and mentored peers.",
      "They describe adapting a lesson after feedback, resolving a disagreement through listening, and maintaining a daily walking practice.",
      "This document is not a real transcript and must not be treated as one.",
    ].join("\n"), "utf8");
const evidenceName = testFilePath ? basename(testFilePath) : "synthetic-learning-evidence.txt";
const evidenceType = testFilePath?.toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/plain";
const evidenceHash = createHash("sha256").update(evidence).digest("hex");
assert.ok(evidence.byteLength <= 10 * 1024 * 1024, "Learning test file exceeds the civic portal's 10 MB document limit.");

const form = new FormData();
form.set("domain", "learning");
form.set("consent", "Local validation evidence retained only long enough to test encrypted upload, retrieval, and optional Learning assessment.");
form.set("file", new File([evidence], evidenceName, { type: evidenceType }));
const uploadResponse = await fetch(`${civicApi}/v3/documents`, {
  method: "POST",
  headers: { Authorization: `Bearer ${sessionToken}` },
  body: form,
});
const uploadText = await uploadResponse.text();
const uploaded = uploadText ? JSON.parse(uploadText) : {};
assert.ok(uploadResponse.ok, `Learning evidence upload failed: ${uploaded.error || uploadResponse.status}`);

const acceptedContract = await jsonRequest(`${civicApi}/v3/learning/evidence-contracts`, {
  method: "POST",
  body: {
    documentId: uploaded.documentId,
    documentType: "other",
    authorOrIssuer: "Local QA fixture",
    relationshipToCitizen: "Synthetic evidence created only to validate the local Learning workflow.",
    authorshipState: "institutional",
    namedSubjects: [],
    fictionalSubjects: [],
    allowedChannels: ["observed"],
    permittedScope: ["intellectual"],
    includedSections: "The complete synthetic fixture.",
    excludedSections: "",
    autobiographicalStatus: "not_applicable",
    sensitivityClass: "ordinary",
    citizenContext: "Disposable local QA citizen; no production or retained citizen record is involved.",
    verificationClass: "directly_observed",
    evidencePeriodStart: "2026-08-05",
    evidencePeriodEnd: "2026-08-05",
    evidencePeriodPrecision: "day",
    evidencePeriodAuthority: "corroborated_context",
    evidencePeriodBasis: "Generated during the dated local QA run.",
    printedDocumentDate: "",
    citizenAttestation: "I authorize this synthetic fixture only for the isolated local QA workflow.",
    accepted: true,
  },
});
assert.ok(acceptedContract.contract?.contractId, "The Learning evidence contract was not accepted.");

try {
  const downloadResponse = await fetch(`${civicApi}/v3/documents/${uploaded.documentId}/content`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  assert.ok(downloadResponse.ok, `Learning evidence retrieval failed: ${downloadResponse.status}`);
  const downloaded = Buffer.from(await downloadResponse.arrayBuffer());
  const downloadedHash = createHash("sha256").update(downloaded).digest("hex");
  assert.equal(downloaded.byteLength, evidence.byteLength, "Decrypted Learning evidence length differs from the original.");
  assert.equal(downloadedHash, evidenceHash, "Decrypted Learning evidence differs from the original.");

  if (skipAi) {
    const recorded = await jsonRequest(`${civicApi}/v3/learning/evaluations/record`, {
      method: "POST",
      body: {
        documentIds: [uploaded.documentId],
        summary: "A disposable local observation supports one domain; all unsupported domains must remain Pending.",
        goalText: "Verify supported-only Ten-Q persistence without invoking AI.",
        modelName: "local-qa-no-ai",
        modelResponseId: "",
        confidence: 0.8,
        recommendations: [],
        qScores: [{
          qKey: "intellectual",
          score: 82,
          confidence: 0.8,
          evidenceKind: "contextual",
          temporalContext: "adult_current",
          evidenceWeight: 0.75,
          interpretiveBasis: "A bounded synthetic QA observation supports this domain only.",
          evidenceSummary: "The fixture demonstrates deterministic reasoning used solely for endpoint validation.",
          evidenceCitations: ["Synthetic QA fixture, complete text."],
          reportedStandardScore: null,
          reportedPercentile: null,
          normalizedEstimateMethod: "Direct local QA fixture estimate; not a citizen assessment.",
          domainScope: "domain_limited",
          domainLabel: "reasoning",
        }],
        observations: [{
          documentId: uploaded.documentId,
          contractId: acceptedContract.contract.contractId,
          actualSubject: "Local QA fixture citizen",
          subjectType: "citizen",
          evidenceChannel: "observed",
          primaryQKey: "intellectual",
          secondaryQKey: "",
          primarySubdomainKey: "reasoning",
          secondarySubdomainKey: "",
          secondaryJustification: "",
          sourceFact: "The synthetic fixture contains a deterministic reasoning claim for endpoint validation.",
          observableFeature: "The fixture presents a bounded claim and a reproducible checksum that can be inspected independently.",
          rubricConnection: "Following a deterministic verification procedure is relevant to the Intellectual-Q reasoning subdomain.",
          contextualInterpretation: "This is disposable QA evidence and is not a real citizen finding.",
          tenQInference: "The fixture supports one provisional Intellectual Q observation.",
          limitations: "This synthetic record validates persistence only and cannot establish a real citizen's intellectual capacity.",
          alternativeExplanations: "The successful result may reflect the deliberately simple fixture rather than performance on a complex task.",
          scoringRationale: "The bounded estimate and moderate interval exercise the scoring contract without asserting a real assessment.",
          boundedCitation: "Synthetic QA fixture, complete text.",
          estimate: 82,
          rangeLow: 76,
          rangeHigh: 87,
          confidence: 0.8,
          evidenceWeight: 0.75,
          evidenceKind: "observed_behavior",
          temporalContext: "adult_current",
          evidencePeriodStart: "2026-08-05",
          evidencePeriodEnd: "2026-08-05",
          admissionStatus: "admitted",
          rejectionReason: "",
          verificationState: "directly_observed",
        }],
      },
    });
    assert.equal(recorded.profileScores.length, 10);
    assert.equal(recorded.profileScores.filter((score) => score.status === "pending").length, 9);
    assert.equal(recorded.profileScores.find((score) => score.qKey === "intellectual")?.score, 82);
    console.log(JSON.stringify({
      passed: true,
      encryptedUploadRoundTrip: true,
      mediaType: evidenceType,
      byteSize: evidence.byteLength,
      aiEvaluation: "skipped",
      partialScorePersistence: true,
      pendingDomainCount: 9,
    }, null, 2));
    process.exitCode = 0;
  } else {
  const assessment = await jsonRequest(`${appOrigin}/api/learning/evaluate`, {
    method: "POST",
    body: {
      documentIds: [uploaded.documentId],
      goalText: "Identify useful next courses while preserving the distinction between absent evidence and low ability.",
      consent: true,
    },
  });
  assert.ok(assessment.qScores.length <= 10);
  assert.ok(assessment.qScores.every((score) => Number.isFinite(score.score)));
  assert.equal(assessment.rightsImpact, "none");
  console.log(JSON.stringify({
    passed: true,
    evaluationId: assessment.evaluationId,
    scoreCount: assessment.qScores.length,
    recommendationCount: assessment.recommendations.length,
    confidence: assessment.confidence,
  }, null, 2));
  }
} finally {
  await jsonRequest(`${civicApi}/v3/documents/${uploaded.documentId}`, { method: "DELETE" });
}
