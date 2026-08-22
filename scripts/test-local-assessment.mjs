import assert from "node:assert/strict";
import { questionById } from "../cloudflare/civic-ledger/src/assessment-bank-v2.js";

const origin = process.env.CIVIC_LOCAL_ORIGIN || "http://127.0.0.1:8788";
const portalOrigin = "http://localhost:9877";
const headers = {
  "content-type": "application/json",
  origin: portalOrigin,
  "x-utopian-qa-run": "automated",
};

const startedResponse = await fetch(`${origin}/v2/immigration/assessment/start`, {
  method: "POST",
  headers,
  body: "{}",
});
assert.equal(startedResponse.status, 201, await startedResponse.clone().text());
const started = await startedResponse.json();
assert.equal(started.questions.length, 101);
assert.equal(started.questions.filter((question) => question.scored).length, 100);

const answers = started.questions.filter((question) => question.scored).map((question) => {
  const source = questionById(question.id);
  assert.ok(source, `Question ${question.id} is absent from the private bank.`);
  const correctText = source.options[source.correctOption];
  const optionIndex = question.options.indexOf(correctText);
  assert.notEqual(optionIndex, -1, `Question ${question.id} omitted its correct option.`);
  return { questionId: question.id, optionIndex };
});

const scoredResponse = await fetch(`${origin}/v2/immigration/assessment/score`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    attemptId: started.attemptId,
    answers,
    easterResponse: "African or European?",
  }),
});
assert.equal(scoredResponse.status, 200, await scoredResponse.clone().text());
const scored = await scoredResponse.json();
assert.equal(scored.score, 100);
assert.equal(scored.passed, true);
assert.equal(scored.answersRetained, false);
assert.equal(scored.easterEgg.recognized, true);
assert.equal(scored.categoryResults.length, 10);
assert.ok(scored.categoryResults.every((category) => category.correct === 10 && category.passed));

console.log(JSON.stringify({
  attemptId: started.attemptId,
  fingerprint: started.selectionFingerprint,
  score: scored.score,
  categoryScores: scored.categoryResults.map((category) => category.correct),
  answersRetained: scored.answersRetained,
  easterEggRecognized: scored.easterEgg.recognized,
}, null, 2));
