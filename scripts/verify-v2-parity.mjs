import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const productionOrigin = process.env.PRODUCTION_ORIGIN || "https://utopiansocietycorpus.org";
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("parity", `${process.pid}-${Date.now()}`);
const { default: localWorker } = await import(workerUrl.href);

const posts = JSON.parse(await readFile(new URL("../app/data/wordpress-posts.json", import.meta.url), "utf8"));
const pages = JSON.parse(await readFile(new URL("../app/data/wordpress-pages.json", import.meta.url), "utf8"));

const staticRoutes = [
  ["/", "The Utopian Society"],
  ["/utopian-society", "Utopian Society"],
  ["/blogs-essays", "Blogs & Essays"],
  ["/charters-codices", "Charters & Codices"],
  ["/lore", "Lore"],
  ["/circles", "Every body in the weave"],
  ["/proceedings-calendar", "Proceedings Calendar"],
  ["/system-review", "System Review"],
  ["/transparency-ledger", "Transparency Ledger"],
  ["/circles/healing/sexual-reproductive-care", "Pleasure belongs within health"],
];

const circleRoutes = [
  "learning", "immigration", "healing", "harmony", "contribution", "balance",
  "custodianship", "defense", "affirmation", "time-observance",
].map((slug) => [`/circles/${slug}`, slug === "time-observance" ? "Utopian calendar" : "Circle"]);

const postRoutes = posts.map((post) => [`/blogs-essays/${post.slug}`, String(post.title).replace(/<[^>]+>/g, "")]);
const corpusRoutes = pages.map((page) => [`/corpus/${page.slug}`, String(page.title).replace(/<[^>]+>/g, "")]);
const routes = [...staticRoutes, ...circleRoutes, ...postRoutes, ...corpusRoutes];

function plainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", "\"")
    .replace(/\s+/g, " ")
    .trim();
}

async function renderLocal(pathname) {
  return localWorker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function inspectRoute([pathname, marker]) {
  const cacheBust = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const [local, production] = await Promise.all([
    renderLocal(pathname),
    fetch(`${productionOrigin}${pathname}${pathname.includes("?") ? "&" : "?"}parity=${cacheBust}`, {
      headers: { accept: "text/html", "cache-control": "no-cache" },
    }),
  ]);
  const [localHtml, productionHtml] = await Promise.all([local.text(), production.text()]);
  assert.equal(local.status, 200, `local ${pathname} returned ${local.status}`);
  assert.equal(production.status, 200, `production ${pathname} returned ${production.status}`);
  const localText = plainText(localHtml);
  const productionText = plainText(productionHtml);
  assert.ok(localText.includes(marker), `local ${pathname} is missing marker: ${marker}`);
  assert.ok(productionText.includes(marker), `production ${pathname} is missing marker: ${marker}`);
  return pathname;
}

const queue = [...routes];
const verified = [];
const workers = Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const route = queue.shift();
    if (!route) return;
    verified.push(await inspectRoute(route));
  }
});
await Promise.all(workers);

const [localTicker, productionTicker, productionPopulation, productionLedger] = await Promise.all([
  localWorker.fetch(new Request("http://localhost/api/ticker"), { ASSETS: { fetch: fetch } }, { waitUntil() {} }),
  fetch(`${productionOrigin}/api/ticker?parity=${Date.now()}`, { headers: { "cache-control": "no-cache" } }),
  fetch("https://utopian-civic-ledger.utopian-society-civic.workers.dev/v1/population"),
  fetch("https://utopian-civic-ledger.utopian-society-civic.workers.dev/v1/ledger?limit=1"),
]);

assert.equal(localTicker.status, 200, "local ticker API is unavailable");
assert.equal(productionTicker.status, 200, "production ticker API is unavailable");
assert.equal(productionPopulation.status, 200, "production population API is unavailable");
assert.equal(productionLedger.status, 200, "production ledger API is unavailable");

console.log(JSON.stringify({
  productionOrigin,
  verifiedAt: new Date().toISOString(),
  routeCount: verified.length,
  postCount: posts.length,
  corpusDocumentCount: pages.length,
  civicService: "operational",
  parity: "verified",
}, null, 2));
