import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("the local editorial index mirrors the current WordPress archive", async () => {
  const posts = JSON.parse(await source("app/data/wordpress-posts.json"));
  assert.equal(posts.length, 27);
  assert.ok(posts.every((post) => post.id && post.slug && post.date && post.sourceUrl));
});

test("blogs and essays present Utopian dates as the visible standard", async () => {
  const importedPosts = await source("app/lib/imported-posts.ts");
  const archivePage = await source("app/blogs-essays/page.tsx");
  const articlePage = await source("app/blogs-essays/[slug]/page.tsx");
  const latestEntries = await source("app/lib/latest-entries.ts");

  assert.match(importedPosts, /utopianDateLabel:\s*utopianDateLong/);
  assert.match(importedPosts, /gregorianDateLabel:\s*gregorianDateUTC/);
  assert.match(archivePage, /post\.utopianDateLabel/);
  assert.match(articlePage, />\{post\.utopianDateLabel\}<\/dd>/);
  assert.match(articlePage, /Gregorian archival reference:/);
  assert.match(latestEntries, /date:\s*post\.utopianDateLabel/);
  assert.doesNotMatch(archivePage, /post\.dateLabel/);
});

test("the WordPress bridge is local, review-gated, and incapable of remote writes", async () => {
  const worker = await source("cloudflare/civic-ledger/src/index.js");
  const studio = await source("app/components/EditorialStudio.tsx");
  const localConfig = await source("cloudflare/civic-ledger/wrangler.local.jsonc");
  const productionConfig = await source("cloudflare/civic-ledger/wrangler.jsonc");

  assert.match(worker, /wordpress-reviewed-handoff-v1/);
  assert.match(worker, /remoteWritesEnabled:\s*false/);
  assert.match(worker, /reviewRequired:\s*true/);
  assert.match(worker, /requireLocalV3\(request, env\)/);
  assert.match(studio, /No remote write path exists in this build/);
  assert.match(studio, /Download reviewed handoff manifest/);
  assert.match(localConfig, /"DEPLOYMENT_MODE":\s*"local-v3"/);
  assert.doesNotMatch(productionConfig, /"DEPLOYMENT_MODE":\s*"local-v3"/);
});

test("the public notice reflects the completed judging period", async () => {
  const ticker = await source("app/components/CivicTicker.tsx");
  assert.match(ticker, /V3 · Public site updated/);
  assert.match(ticker, /OpenAI Build Week judging complete · Awaiting results\./);
  assert.doesNotMatch(ticker, /Public site frozen for review/i);
});
