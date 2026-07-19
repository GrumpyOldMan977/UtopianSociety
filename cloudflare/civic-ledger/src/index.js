const PUBLIC_ORIGINS = new Set([
  "https://utopiansocietycorpus.org",
  "https://www.utopiansocietycorpus.org",
  "https://utopian-society-corpus-v2.gt90v12.chatgpt.site",
  "http://localhost:3000",
  "http://localhost:3001",
]);

const encoder = new TextEncoder();

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = origin && PUBLIC_ORIGINS.has(origin) ? origin : "https://utopiansocietycorpus.org";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request, value, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  for (const [name, content] of Object.entries(corsHeaders(request))) headers.set(name, content);
  return new Response(JSON.stringify(value), { ...init, headers });
}

function cleanText(value, maxLength, required = true) {
  const result = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (required && !result) throw new Error("A required text field is missing.");
  if (result.length > maxLength) throw new Error(`A text field exceeds ${maxLength} characters.`);
  return result;
}

async function digest(value) {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function secureEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([digest(left), digest(right)]);
  let difference = 0;
  for (let index = 0; index < leftHash.length; index += 1) {
    difference |= leftHash.charCodeAt(index) ^ rightHash.charCodeAt(index);
  }
  return difference === 0;
}

async function requireAdmin(request, env) {
  const supplied = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!env.LEDGER_ADMIN_KEY || !supplied || !(await secureEqual(supplied, env.LEDGER_ADMIN_KEY))) {
    throw new Response("Unauthorized", { status: 401, headers: corsHeaders(request) });
  }
}

function canonicalEntry(entry, previousHash, id, recordedAt) {
  return JSON.stringify({
    id,
    eventType: entry.eventType,
    category: entry.category,
    title: entry.title,
    summary: entry.summary,
    actorName: entry.actorName,
    subjectName: entry.subjectName || null,
    subjectRef: entry.subjectRef || null,
    occurredAt: entry.occurredAt,
    utopianDate: entry.utopianDate,
    gregorianDate: entry.gregorianDate,
    sourceLabel: entry.sourceLabel,
    sourceUrl: entry.sourceUrl || null,
    metadata: entry.metadata || {},
    supersedesId: entry.supersedesId || null,
    previousHash,
    recordedAt,
  });
}

function normalizeEntry(input) {
  return {
    eventType: cleanText(input.eventType, 80),
    category: cleanText(input.category, 80),
    title: cleanText(input.title, 180),
    summary: cleanText(input.summary, 2000),
    actorName: cleanText(input.actorName, 160),
    subjectName: cleanText(input.subjectName, 160, false),
    subjectRef: cleanText(input.subjectRef, 160, false),
    occurredAt: cleanText(input.occurredAt, 40),
    utopianDate: cleanText(input.utopianDate, 120),
    gregorianDate: cleanText(input.gregorianDate, 80),
    sourceLabel: cleanText(input.sourceLabel, 180),
    sourceUrl: cleanText(input.sourceUrl, 500, false),
    metadata: input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata) ? input.metadata : {},
    supersedesId: cleanText(input.supersedesId, 80, false),
  };
}

async function prepareEntry(env, rawEntry) {
  const entry = normalizeEntry(rawEntry);
  const latest = await env.DB.prepare("SELECT integrity_hash FROM ledger_entries ORDER BY seq DESC LIMIT 1").first();
  const previousHash = latest?.integrity_hash || "GENESIS";
  const id = `USL-${crypto.randomUUID()}`;
  const recordedAt = new Date().toISOString();
  const integrityHash = await digest(canonicalEntry(entry, previousHash, id, recordedAt));
  const statement = env.DB.prepare(`
    INSERT INTO ledger_entries (
      id, event_type, category, title, summary, actor_name, subject_name, subject_ref,
      occurred_at, utopian_date, gregorian_date, source_label, source_url, metadata_json,
      supersedes_id, previous_hash, integrity_hash, recorded_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)
  `).bind(
    id, entry.eventType, entry.category, entry.title, entry.summary, entry.actorName,
    entry.subjectName || null, entry.subjectRef || null, entry.occurredAt, entry.utopianDate,
    entry.gregorianDate, entry.sourceLabel, entry.sourceUrl || null, JSON.stringify(entry.metadata),
    entry.supersedesId || null, previousHash, integrityHash, recordedAt,
  );
  return { entry, id, integrityHash, previousHash, recordedAt, statement };
}

async function appendLedgerEntry(env, rawEntry) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const prepared = await prepareEntry(env, rawEntry);
    try {
      await prepared.statement.run();
      return prepared;
    } catch (error) {
      if (attempt === 2 || !String(error).includes("UNIQUE")) throw error;
    }
  }
  throw new Error("The ledger chain could not be extended.");
}

function publicEntry(row) {
  return {
    sequence: row.seq,
    id: row.id,
    eventType: row.event_type,
    category: row.category,
    title: row.title,
    summary: row.summary,
    actorName: row.actor_name,
    subjectName: row.subject_name,
    subjectRef: row.subject_ref,
    occurredAt: row.occurred_at,
    utopianDate: row.utopian_date,
    gregorianDate: row.gregorian_date,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    metadata: JSON.parse(row.metadata_json || "{}"),
    supersedesId: row.supersedes_id,
    previousHash: row.previous_hash,
    integrityHash: row.integrity_hash,
    recordedAt: row.recorded_at,
  };
}

async function listLedger(request, env, url) {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 25));
  const cursor = Number(url.searchParams.get("cursor")) || Number.MAX_SAFE_INTEGER;
  const category = url.searchParams.get("category")?.trim();
  const statement = category
    ? env.DB.prepare("SELECT * FROM ledger_entries WHERE seq < ?1 AND category = ?2 ORDER BY seq DESC LIMIT ?3").bind(cursor, category, limit + 1)
    : env.DB.prepare("SELECT * FROM ledger_entries WHERE seq < ?1 ORDER BY seq DESC LIMIT ?2").bind(cursor, limit + 1);
  const result = await statement.all();
  const rows = result.results || [];
  const hasMore = rows.length > limit;
  const entries = rows.slice(0, limit).map(publicEntry);
  return json(request, {
    entries,
    nextCursor: hasMore ? entries.at(-1)?.sequence : null,
    immutable: true,
  }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}

async function population(request, env) {
  const summary = await env.DB.prepare("SELECT active_population, independent_population, revoked_population, total_recorded FROM population_summary").first();
  const latest = await env.DB.prepare("SELECT civic_name, certificate_number, utopian_joined_date, gregorian_joined_date FROM citizens WHERE standing = 'active' ORDER BY joined_at DESC LIMIT 1").first();
  return json(request, {
    active: Number(summary?.active_population || 0),
    independent: Number(summary?.independent_population || 0),
    revoked: Number(summary?.revoked_population || 0),
    totalRecorded: Number(summary?.total_recorded || 0),
    latestCitizen: latest ? {
      civicName: latest.civic_name,
      certificateNumber: latest.certificate_number,
      utopianDate: latest.utopian_joined_date,
      gregorianDate: latest.gregorian_joined_date,
    } : null,
    definition: "Active virtual symbolic citizens recorded in the public Transparency Ledger.",
  }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}

async function listCitizens(request, env, url) {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const result = await env.DB.prepare(`
    SELECT civic_id, civic_name, certificate_number, standing, assessment_score,
           utopian_joined_date, gregorian_joined_date, joined_at, exited_at, source_label
    FROM citizens ORDER BY joined_at DESC LIMIT ?1
  `).bind(limit).all();
  return json(request, { citizens: result.results || [] }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}

async function createCitizen(request, env, input) {
  const civicName = cleanText(input.civicName, 160);
  const certificateNumber = cleanText(input.certificateNumber, 100);
  const assessmentScore = Number(input.assessmentScore);
  if (!Number.isInteger(assessmentScore) || assessmentScore < 0 || assessmentScore > 100) throw new Error("Assessment score is invalid.");
  const entryInput = {
    eventType: "citizenship_granted",
    category: "citizenship",
    title: `Virtual symbolic citizenship recorded for ${civicName}`,
    summary: cleanText(input.summary || `${civicName} demonstrated civic comprehension, entered the virtual oath freely, and was recorded as an active virtual symbolic citizen.`, 2000),
    actorName: cleanText(input.actorName || "Immigration Civic Office", 160),
    subjectName: civicName,
    subjectRef: certificateNumber,
    occurredAt: cleanText(input.joinedAt, 40),
    utopianDate: cleanText(input.utopianDate, 120),
    gregorianDate: cleanText(input.gregorianDate, 80),
    sourceLabel: cleanText(input.sourceLabel, 180),
    sourceUrl: cleanText(input.sourceUrl, 500, false),
    metadata: { certificateNumber, assessmentScore, standing: "active" },
  };
  const prepared = await prepareEntry(env, entryInput);
  const civicId = `USC-${crypto.randomUUID()}`;
  const citizenStatement = env.DB.prepare(`
    INSERT INTO citizens (
      civic_id, civic_name, certificate_number, standing, assessment_score,
      utopian_joined_date, gregorian_joined_date, joined_at, entry_ledger_id,
      source_label, created_at
    ) VALUES (?1, ?2, ?3, 'active', ?4, ?5, ?6, ?7, ?8, ?9, ?10)
  `).bind(
    civicId, civicName, certificateNumber, assessmentScore, entryInput.utopianDate,
    entryInput.gregorianDate, entryInput.occurredAt, prepared.id, entryInput.sourceLabel,
    prepared.recordedAt,
  );
  await env.DB.batch([prepared.statement, citizenStatement]);
  return { civicId, ledgerId: prepared.id, certificateNumber };
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method === "GET" && path === "/") return json(request, { service: "Utopian Society Civic Ledger", status: "operational", version: 1 });
  if (request.method === "GET" && path === "/health") return json(request, { ok: true, service: "civic-ledger" });
  if (request.method === "GET" && path === "/v1/ledger") return listLedger(request, env, url);
  if (request.method === "GET" && path === "/v1/population") return population(request, env);
  if (request.method === "GET" && path === "/v1/citizens") return listCitizens(request, env, url);

  if (request.method === "POST" && path === "/v1/admin/ledger") {
    await requireAdmin(request, env);
    const body = await request.json();
    const written = await appendLedgerEntry(env, body);
    return json(request, { entry: { id: written.id, integrityHash: written.integrityHash } }, { status: 201 });
  }

  if (request.method === "POST" && path === "/v1/admin/citizens") {
    await requireAdmin(request, env);
    const body = await request.json();
    const written = await createCitizen(request, env, body);
    return json(request, written, { status: 201 });
  }

  return json(request, { error: "Not found" }, { status: 404 });
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      if (error instanceof Response) return error;
      console.error(JSON.stringify({ level: "error", message: "civic-ledger-request-failed", error: String(error) }));
      const status = error instanceof SyntaxError ? 400 : 500;
      return json(request, { error: status === 400 ? "Invalid JSON request." : "The civic record could not complete this request." }, { status });
    }
  },
};
