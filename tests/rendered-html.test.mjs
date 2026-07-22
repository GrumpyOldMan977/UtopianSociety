import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Utopian Society frontispiece", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Utopian Society Corpus<\/title>/i);
  assert.match(html, /Enter the living corpus/);
  assert.match(html, /Utopian[\s\S]*Reference Time/);
  assert.match(html, /Five interlocking rings/i);
  assert.match(html, /Live civic wire/);
  assert.match(html, /BETA · Civic portal under active construction/);
  assert.match(html, /Weather: Open-Meteo/);
  assert.match(html, /Headlines: BBC News/);
  assert.doesNotMatch(html, /Current site/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Codex is working/i);
});

test("server-renders Learning as a citizen-facing civic portal", async () => {
  const response = await render("/circles/learning");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Circle of Learning/);
  assert.match(html, /Begin with an action, not a legal document/);
  assert.match(html, /Ten mirrors reflecting one mind/);
  assert.match(html, /Utopian Society University/);
  assert.match(html, /Shape a path through the Tree of Knowledge/);
  assert.match(html, /sends nothing anywhere/);
  assert.match(html, /Plain language opens the door/);
});

test("server-renders Immigration as an operational civic portal", async () => {
  const response = await render("/circles/immigration");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Immigration · Civic Portal/);
  assert.match(html, /Begin symbolic application/);
  assert.match(html, /Citizen exit/);
  assert.match(html, /From Hopeful to Citizen/);
  assert.match(html, /Begin the 100-question assessment/);
  assert.match(html, /Preview certificate design/);
  assert.match(html, /no assessment result, citizenship standing, certificate number, or ledger record is issued/i);
  assert.match(html, /Citizenship entered freely may be left freely/);
  assert.match(html, /recognizes symbolic online citizenship/);
  assert.match(html, /Immigration Codex/);
});

test("server-renders the complete seven-Circle civic directory", async () => {
  const response = await render("/circles");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Every body in the weave/);
  for (const circle of ["Contribution", "Learning", "Healing", "Harmony", "Custodianship", "Balance", "Defense"]) {
    assert.match(html, new RegExp(`Circle of ${circle}`));
  }
  assert.match(html, /Independent within the domain\. Bound by the weave/);
});

test("server-renders Healing as a consent-led civic portal", async () => {
  const response = await render("/circles/healing");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Four dimensions, one sovereign life/);
  assert.match(html, /Consent governs care/);
  assert.match(html, /Prepare a care request/);
  assert.match(html, /sends nothing, stores nothing/);
  assert.match(html, /Circle of Healing Charter/);
  assert.match(html, /href="\/circles\/healing\/sexual-reproductive-care"/);
});

test("Healing is reachable reciprocally from its constitutional and Charter sources", async () => {
  for (const route of [
    "/corpus/article-viii-continuance-medical-ethics",
    "/corpus/circle-of-healing-charter",
  ]) {
    const response = await render(route);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /href="\/circles\/healing"/);
    assert.match(html, /Enter the Circle of Healing/);
  }
});

test("server-renders Sexual & Reproductive Care as an adult consent-led portal", async () => {
  const response = await render("/circles/healing/sexual-reproductive-care");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Pleasure belongs within health/);
  assert.match(html, /Care has many forms—and none is assumed/);
  assert.match(html, /Sacred surrogacy/);
  assert.match(html, /Erotic service practice/);
  assert.match(html, /Consent is the first clinical instrument/);
  assert.match(html, /sends, stores, and diagnoses nothing/);
  assert.match(html, /Adult services only/);
  assert.match(html, /Sexual Expression Codex/);
});

test("server-renders Time and Observance without making it an eighth Circle", async () => {
  const response = await render("/circles/time-observance");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The Utopian calendar/);
  assert.match(html, /not an eighth Circle/i);
  assert.match(html, /Thirteen months|13/);
  assert.match(html, /Convert Gregorian to Utopian time/);
});

test("server-renders a distinct civic instrument for every remaining portal", async () => {
  const expected = {
    harmony: ["A proceeding moves toward repair", "Public calendars identify proceeding type"],
    contribution: ["Need, ability, rest, and learning", "Food &amp; cultivation"],
    balance: ["Every indicator carries uncertainty", "Water continuity"],
    custodianship: ["Infrastructure becomes trustworthy", "Civic knowledge"],
    defense: ["Preparedness should calm the public", "Crisis Ring"],
    affirmation: ["Recognition records truth", "Human witness"],
  };
  for (const [slug, phrases] of Object.entries(expected)) {
    const response = await render(`/circles/${slug}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    for (const phrase of phrases) assert.match(html, new RegExp(phrase));
    assert.match(html, /sends nothing, stores nothing/);
  }
});

test("server-renders Article XVII as a visibly unratified Draft v2.2", async () => {
  const response = await render("/corpus/article-xvii-governance-structure-circles");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Constitution Draft v2\.2/);
  assert.match(html, /Seven Foundational Circles/);
  assert.match(html, /Councils.*independent domain authority within their Circle/is);
  assert.match(html, /Restoration Codex/);
  assert.match(html, /older text uses “Criminal Codex,” it shall be read as “Restoration Codex”/i);
});

test("server-renders the complete West Ring archive with local post routes", async () => {
  const response = await render("/blogs-essays");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The local archive/);
  assert.match(html, /27[\s\S]{0,30}entries/);
  assert.match(html, /href="\/blogs-essays\/the-fornax"/);
  assert.match(html, /href="\/blogs-essays\/an-introspection-into-my-identity"/);
  assert.match(html, /The whole working record/);
  assert.match(html, /Minday, Solvane 11, Utopian Year 1/);
  assert.match(html, /Percepday, Solvane 6, Utopian Year 1/);
});

test("server-renders imported essays in the new local manuscript template", async () => {
  const response = await render("/blogs-essays/the-feral-child");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The Feral Child/);
  assert.match(html, /West Ring/);
  assert.match(html, /Corpus provenance/);
  assert.match(html, /\/images\/posts\//);
  assert.match(html, /Return to Blogs &amp; Essays/);
  assert.match(html, /View the source edition/);
});

test("server-renders an imported entry without an assigned WordPress feature image", async () => {
  const response = await render("/blogs-essays/the-fornax");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The Fornax/);
  assert.match(html, /post-frontispiece/);
  assert.match(html, /Older entry/);
});

test("the civic registry, artwork, responsive safeguards, and local-only prototypes remain internally consistent", async () => {
  const navigation = await readFile(new URL("../app/lib/circle-navigation.ts", import.meta.url), "utf8");
  assert.equal(navigation.match(/tier: "foundational"/g)?.length, 7, "the registry must contain exactly seven Foundational Circles");

  const civicCss = await readFile(new URL("../app/civic-completion.css", import.meta.url), "utf8");
  const artwork = [
    "circle-harmony-hero-v1.png",
    "circle-contribution-hero-v1.png",
    "circle-balance-hero-v1.png",
    "circle-custodianship-hero-v1.png",
    "circle-defense-hero-v1.png",
    "circle-affirmation-hero-v1.png",
    "time-observance-hero-v1.png",
  ];
  for (const filename of artwork) {
    assert.match(civicCss, new RegExp(filename.replaceAll(".", "\\.")), `${filename} is not referenced by the civic design`);
    await access(new URL(`../public/images/circles/${filename}`, import.meta.url));
  }
  assert.match(civicCss, /@media\(max-width:900px\)/);
  assert.match(civicCss, /@media\(max-width:620px\)/);

  const globals = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(globals, /prefers-reduced-motion:reduce/);

  const interactiveFiles = await Promise.all([
    "CivicActionStudio.tsx", "CivicPortalFeature.tsx", "TimeObservanceCalendar.tsx", "LearningCivicStudio.tsx",
    "ImmigrationApplication.tsx", "ImmigrationThreshold.tsx", "CitizenshipExit.tsx", "HealingWholePerson.tsx", "SexualCareExplorer.tsx",
  ].map((filename) => readFile(new URL(`../app/components/${filename}`, import.meta.url), "utf8")));
  const interactionSource = interactiveFiles.join("\n");
  assert.doesNotMatch(interactionSource, /localStorage|sessionStorage|indexedDB|XMLHttpRequest|navigator\.sendBeacon|fetch\(|\.submit\(|FormData/);
  assert.match(interactionSource, /aria-controls/);
  assert.match(interactionSource, /role="region"/);
  assert.match(interactionSource, /ArrowRight/);
  assert.match(interactionSource, /Return to today/);
});

test("every discoverable internal page link and fragment resolves locally", async () => {
  const queue = ["/", "/circles", "/utopian-society", "/charters-codices", "/blogs-essays"];
  const visited = new Map();
  const fragments = [];

  while (queue.length) {
    const route = queue.shift();
    if (visited.has(route)) continue;
    assert.ok(visited.size < 250, "internal crawl exceeded its safety limit");

    const response = await render(route);
    assert.equal(response.status, 200, `internal route ${route} returned ${response.status}`);
    const html = await response.text();
    visited.set(route, html);

    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const raw = match[1].replaceAll("&amp;", "&");
      if (!raw || raw === "#" || /^(?:https?:|mailto:|tel:|javascript:)/i.test(raw)) continue;
      const target = new URL(raw, `http://localhost${route}`);
      if (target.origin !== "http://localhost") continue;
      if (target.pathname.startsWith("/assets/") || /\.(?:css|js|png|jpe?g|webp|svg|ico|woff2?)$/i.test(target.pathname)) continue;
      const targetRoute = `${target.pathname}${target.search}`;
      if (target.hash) fragments.push({ from: route, route: targetRoute, id: decodeURIComponent(target.hash.slice(1)) });
      if (!visited.has(targetRoute) && !queue.includes(targetRoute)) queue.push(targetRoute);
    }
  }

  for (const fragment of fragments) {
    const html = visited.get(fragment.route);
    assert.ok(html, `fragment target ${fragment.route} from ${fragment.from} was not rendered`);
    const escaped = fragment.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(html, new RegExp(`(?:id|name)="${escaped}"`), `missing #${fragment.id} on ${fragment.route}, linked from ${fragment.from}`);
  }
});
