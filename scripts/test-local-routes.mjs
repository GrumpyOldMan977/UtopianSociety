import assert from "node:assert/strict";

const origin = process.env.CIVIC_PORTAL_LOCAL_ORIGIN || "http://localhost:9877";
const retiredOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];

const criticalRoutes = [
  "/",
  "/blogs-essays",
  "/charters-codices",
  "/circles",
  "/circles/healing",
  "/circles/immigration",
  "/circles/learning",
  "/citizens/adreto-nagdo-senoviros",
  "/corpus/about",
  "/login",
  "/lore",
  "/lore/birth-of-the-moon",
  "/portal",
  "/proceedings-calendar",
  "/system-review",
  "/transparency-ledger",
  "/utopian-society",
];

const failureText = [
  "Unhandled Script Error",
  "Network connection lost",
  "Internal Server Error",
  "Application error",
];

function internalPath(href) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  let url;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  if (
    url.pathname.startsWith("/api/")
    || url.pathname.startsWith("/_next/")
    || url.pathname.startsWith("/_vinext/")
    || /\.(?:avif|css|gif|ico|jpe?g|js|json|map|mp3|mp4|pdf|png|svg|webp|woff2?)$/i.test(url.pathname)
  ) return null;
  return `${url.pathname}${url.search}`;
}

async function inspectRoute(route) {
  const response = await fetch(new URL(route, origin), {
    headers: { Accept: "text/html" },
    redirect: "follow",
  });
  const html = await response.text();
  assert.equal(response.status, 200, `${route} returned HTTP ${response.status}.`);
  for (const marker of failureText) {
    assert.equal(html.includes(marker), false, `${route} rendered "${marker}".`);
  }
  for (const retired of retiredOrigins) {
    assert.equal(html.includes(retired), false, `${route} still contains retired local origin ${retired}.`);
  }
  const links = [...html.matchAll(/\shref=(?:"([^"]+)"|'([^']+)')/gi)]
    .map((match) => internalPath(match[1] || match[2]))
    .filter(Boolean);
  return { route, bytes: Buffer.byteLength(html), links: [...new Set(links)] };
}

const queue = [...criticalRoutes];
const queued = new Set(queue);
const inspected = new Map();

while (queue.length) {
  const route = queue.shift();
  const result = await inspectRoute(route);
  inspected.set(route, result);
  for (const link of result.links) {
    if (!queued.has(link) && queued.size < 160) {
      queued.add(link);
      queue.push(link);
    }
  }
}

console.log(JSON.stringify({
  passed: true,
  origin,
  criticalRouteCount: criticalRoutes.length,
  inspectedRouteCount: inspected.size,
  routes: [...inspected.values()].map(({ route, bytes }) => ({ route, bytes })),
}, null, 2));
