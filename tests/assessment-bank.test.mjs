import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assessmentCategories,
  assessmentQuestionBank,
  bankSummary,
  easterEggQuestion,
} from "../cloudflare/civic-ledger/src/assessment-bank-v2.js";

test("assessment v2 contains ten release-ready civic domains", () => {
  assert.equal(assessmentCategories.length, 10);
  assert.equal(assessmentQuestionBank.length, 400);
  for (const category of bankSummary()) {
    assert.equal(category.approvedQuestions, 40, `${category.label} does not meet the first-release minimum`);
    assert.equal(category.concepts, 10, `${category.label} cannot supply ten distinct concepts`);
  }
});

test("every assessment question is complete and cites a local corpus document", async () => {
  const pages = JSON.parse(await readFile(new URL("../app/data/wordpress-pages.json", import.meta.url), "utf8"));
  const localSlugs = new Set(pages.map((page) => page.slug));
  const civicDraftSources = new Set(["circle-of-harmony-charter", "circle-of-balance-charter"]);
  for (const question of assessmentQuestionBank) {
    assert.equal(question.options.length, 4, `${question.id} does not offer four choices`);
    assert.ok(question.prompt.length >= 15, `${question.id} has an incomplete prompt`);
    assert.ok(question.explanation.length >= 20, `${question.id} has an incomplete explanation`);
    assert.ok(localSlugs.has(question.sourceSlug) || civicDraftSources.has(question.sourceSlug), `${question.id} cites missing corpus slug ${question.sourceSlug}`);
    assert.equal(question.correctOption, 0);
  }
});

test("the swallow question is present, recognizable, and unscored", () => {
  assert.equal(easterEggQuestion.scored, false);
  assert.match(easterEggQuestion.prompt, /air-speed velocity of an unladen swallow/i);
  assert.equal(easterEggQuestion.recognizedResponse, "African or European?");
});

test("correct answers are absent from the browser assessment modules", async () => {
  const client = await readFile(new URL("../app/components/ImmigrationApplication.tsx", import.meta.url), "utf8");
  const publicTypes = await readFile(new URL("../app/lib/immigration-assessment.ts", import.meta.url), "utf8");
  assert.doesNotMatch(client, /correctIndex|correctOption|immigrationQuestions/);
  assert.doesNotMatch(publicTypes, /correctIndex|correctOption|distractors:/);
});
