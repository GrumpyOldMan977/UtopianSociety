import assert from "node:assert/strict";
import { questionById } from "../cloudflare/civic-ledger/src/assessment-bank-v2.js";

const origin = process.env.CIVIC_LOCAL_ORIGIN || "http://127.0.0.1:8788";
const portalOrigin = "http://localhost:9877";
const publicHeaders = {
  "content-type": "application/json",
  origin: portalOrigin,
  "x-utopian-qa-run": "automated",
};

async function civic(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: {
      ...publicHeaders,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json();
  return { response, payload };
}

function correctAnswers(attempt) {
  return attempt.questions.filter((question) => question.scored).map((question) => {
    const source = questionById(question.id);
    assert.ok(source, `Question ${question.id} is absent from the private bank.`);
    const optionIndex = question.options.indexOf(source.options[source.correctOption]);
    assert.notEqual(optionIndex, -1, `Question ${question.id} omitted its correct option.`);
    return { questionId: question.id, optionIndex };
  });
}

const populationBefore = (await civic("/v1/population")).payload.active;
const naturalizationStart = await civic("/v2/immigration/assessment/start", {
  method: "POST",
  body: { purpose: "naturalization" },
});
assert.equal(naturalizationStart.response.status, 201);
assert.equal(naturalizationStart.payload.purpose, "naturalization");
const naturalizationScore = await civic("/v2/immigration/assessment/score", {
  method: "POST",
  body: {
    attemptId: naturalizationStart.payload.attemptId,
    answers: correctAnswers(naturalizationStart.payload),
    easterResponse: "African or European?",
  },
});
assert.equal(naturalizationScore.response.status, 200);
assert.equal(naturalizationScore.payload.passed, true);

const civicName = "Local Certificate Integrity QA";
const issuanceKey = crypto.randomUUID();
const issuanceBody = {
  civicName,
  signature: civicName,
  oathAccepted: true,
  assessmentVersion: "immigration-v2",
  assessmentAttemptId: naturalizationStart.payload.attemptId,
  issuanceKey,
};
const issued = await civic("/v1/immigration/issue-certificate", { method: "POST", body: issuanceBody });
assert.equal(issued.response.status, 201);
assert.equal(issued.payload.created, true);
assert.ok(issued.payload.account?.activationToken);

const retry = await civic("/v1/immigration/issue-certificate", { method: "POST", body: issuanceBody });
assert.equal(retry.response.status, 200);
assert.equal(retry.payload.created, false);
assert.equal(retry.payload.civicId, issued.payload.civicId);

const reuse = await civic("/v1/immigration/issue-certificate", {
  method: "POST",
  body: { ...issuanceBody, issuanceKey: crypto.randomUUID() },
});
assert.equal(reuse.response.status, 409);
assert.equal(reuse.payload.code, "assessment_already_issued");

const login = await civic("/v3/auth/login", {
  method: "POST",
  body: {
    loginName: issued.payload.account.loginName,
    password: "Local-QA-Only-2026!",
    activationToken: retry.payload.account.activationToken,
  },
});
assert.equal(login.response.status, 200);
assert.ok(login.payload.sessionToken);

const practiceStart = await civic("/v2/immigration/assessment/start", {
  method: "POST",
  token: login.payload.sessionToken,
  body: { purpose: "practice" },
});
assert.equal(practiceStart.response.status, 201);
assert.equal(practiceStart.payload.purpose, "practice");
const practiceScore = await civic("/v2/immigration/assessment/score", {
  method: "POST",
  token: login.payload.sessionToken,
  body: {
    attemptId: practiceStart.payload.attemptId,
    answers: correctAnswers(practiceStart.payload),
    easterResponse: "African or European?",
  },
});
assert.equal(practiceScore.response.status, 200);
assert.equal(practiceScore.payload.purpose, "practice");
assert.equal(practiceScore.payload.passed, true);

const practiceIssuance = await civic("/v1/immigration/issue-certificate", {
  method: "POST",
  body: {
    ...issuanceBody,
    assessmentAttemptId: practiceStart.payload.attemptId,
    issuanceKey: crypto.randomUUID(),
  },
});
assert.equal(practiceIssuance.response.status, 409);
assert.equal(practiceIssuance.payload.code, "practice_assessment_no_issuance");

const populationAfter = (await civic("/v1/population")).payload.active;
assert.equal(populationAfter, populationBefore + 1);
const ticker = await civic("/v4/ticker");
const assessmentTicker = ticker.payload.items.find((item) => item.kind === "assessment");
assert.ok(assessmentTicker);
assert.match(assessmentTicker.label, /outcomes withheld below 5 completions/i);

console.log(JSON.stringify({
  naturalizationPassed: true,
  oneAttemptOneCertificate: true,
  idempotentRetry: true,
  civicProfileProvisioned: Boolean(issued.payload.account),
  practicePassedWithoutIssuance: true,
  populationChangedOnlyForNaturalization: true,
  privacyThresholdedTickerPresent: true,
}, null, 2));
