const PUBLIC_ORIGINS = new Set([
  "https://utopiansocietycorpus.org",
  "https://www.utopiansocietycorpus.org",
  "https://utopian-society-corpus-v2.gt90v12.chatgpt.site",
  "http://localhost:3000",
  "http://localhost:3001",
]);

const encoder = new TextEncoder();
const ASSESSMENT_VERSION = "immigration-v1";
const ASSESSMENT_QUESTION_COUNT = 100;
const ASSESSMENT_PASSING_SCORE = 90;
const CERTIFICATE_COLLISION_RETRIES = 6;
const UTOPIAN_EPOCH_UTC = Date.UTC(2026, 2, 20);
const DAY_IN_MS = 86_400_000;
const DEEP_BRIDGE_REMAINDERS = new Set([1, 5, 9, 13, 17, 22, 26, 30]);
const UTOPIAN_MONTHS = [
  "Florent", "Verdara", "Aureleth", "Ember", "Solvane", "Aura", "Branna",
  "Gleirn", "Fallon", "Dusken", "Nocturne", "Caldris", "Iskareth",
];
const UTOPIAN_WEEKDAYS = [
  "Convergeday", "Kineticday", "Conceptday", "Minday", "Emoday", "Percepday", "Spiraday",
];

class ClientError extends Error {
  constructor(message, status = 400, code = "invalid_request") {
    super(message);
    this.name = "ClientError";
    this.status = status;
    this.code = code;
  }
}

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
  if (required && !result) throw new ClientError("A required text field is missing.");
  if (result.length > maxLength) throw new ClientError(`A text field exceeds ${maxLength} characters.`);
  return result;
}

function requirePublicOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin || !PUBLIC_ORIGINS.has(origin)) {
    throw new ClientError("Certificate issuance is only available through the civic portal.", 403, "origin_not_allowed");
  }
}

async function readJson(request, maxBytes = 20_000) {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > maxBytes) throw new ClientError("The request is too large.", 413, "request_too_large");
  const body = await request.text();
  if (encoder.encode(body).byteLength > maxBytes) throw new ClientError("The request is too large.", 413, "request_too_large");
  try {
    return JSON.parse(body);
  } catch {
    throw new ClientError("Invalid JSON request.");
  }
}

function isDeepBridgeYear(year) {
  return DEEP_BRIDGE_REMAINDERS.has(((year % 33) + 33) % 33);
}

function utopianYearLength(year) {
  return isDeepBridgeYear(year) ? 366 : 365;
}

function formatUtopianDate(date) {
  const target = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  if (target < UTOPIAN_EPOCH_UTC) return "The Founding Interval";
  let year = 1;
  let yearStart = UTOPIAN_EPOCH_UTC;
  while (target >= yearStart + utopianYearLength(year) * DAY_IN_MS) {
    yearStart += utopianYearLength(year) * DAY_IN_MS;
    year += 1;
  }
  const dayOfYear = Math.floor((target - yearStart) / DAY_IN_MS);
  if (dayOfYear < 364) {
    const month = UTOPIAN_MONTHS[Math.floor(dayOfYear / 28)];
    const day = (dayOfYear % 28) + 1;
    const weekday = UTOPIAN_WEEKDAYS[(day - 1) % 7];
    return `${weekday}, ${month} ${day}, Utopian Year ${year}`;
  }
  return `Beyond the Week, The Bridging ${dayOfYear - 363}, Utopian Year ${year}`;
}

function formatGregorianDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function certificateNumber(date = new Date()) {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const randomHex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `USV-${date.getUTCFullYear()}-${randomHex}`;
}

function scoreAssessment(answers) {
  if (!Array.isArray(answers) || answers.length !== ASSESSMENT_QUESTION_COUNT) {
    throw new ClientError(`Exactly ${ASSESSMENT_QUESTION_COUNT} answers are required.`, 400, "assessment_incomplete");
  }
  let score = 0;
  answers.forEach((answer, index) => {
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
      throw new ClientError("Every assessment answer must identify one of the four choices.", 400, "assessment_invalid");
    }
    const questionId = index + 1;
    const correctIndex = (4 - (questionId % 4)) % 4;
    if (answer === correctIndex) score += 1;
  });
  return score;
}

async function verifyTurnstile(request, env, token, issuanceKey) {
  if (!env.TURNSTILE_SECRET) return;
  if (typeof token !== "string" || !token) {
    throw new ClientError("Complete the human verification before issuing the certificate.", 400, "turnstile_required");
  }
  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET);
  form.set("response", token);
  form.set("idempotency_key", issuanceKey);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) form.set("remoteip", remoteIp);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new ClientError("Human verification expired or could not be confirmed. Please try again.", 400, "turnstile_failed");
  }
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
    eventKey: entry.eventKey || null,
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
    eventKey: cleanText(input.eventKey, 160, false),
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
      id, event_key, event_type, category, title, summary, actor_name, subject_name, subject_ref,
      occurred_at, utopian_date, gregorian_date, source_label, source_url, metadata_json,
      supersedes_id, previous_hash, integrity_hash, recorded_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)
  `).bind(
    id, entry.eventKey || null, entry.eventType, entry.category, entry.title, entry.summary,
    entry.actorName, entry.subjectName || null, entry.subjectRef || null, entry.occurredAt,
    entry.utopianDate, entry.gregorianDate, entry.sourceLabel, entry.sourceUrl || null,
    JSON.stringify(entry.metadata), entry.supersedesId || null, previousHash, integrityHash,
    recordedAt,
  );
  return { entry, id, integrityHash, previousHash, recordedAt, statement };
}

async function entryByEventKey(env, eventKey) {
  if (!eventKey) return null;
  return env.DB.prepare("SELECT * FROM ledger_entries WHERE event_key = ?1 LIMIT 1").bind(eventKey).first();
}

async function appendLedgerEntry(env, rawEntry) {
  const normalized = normalizeEntry(rawEntry);
  const existing = await entryByEventKey(env, normalized.eventKey);
  if (existing) return { created: false, ...publicEntry(existing) };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const prepared = await prepareEntry(env, normalized);
    try {
      await prepared.statement.run();
      const row = await env.DB.prepare("SELECT * FROM ledger_entries WHERE id = ?1 LIMIT 1").bind(prepared.id).first();
      return { created: true, ...publicEntry(row) };
    } catch (error) {
      const concurrent = await entryByEventKey(env, normalized.eventKey);
      if (concurrent) return { created: false, ...publicEntry(concurrent) };
      if (attempt === 2 || !String(error).includes("UNIQUE")) throw error;
    }
  }
  throw new Error("The ledger chain could not be extended.");
}

function publicEntry(row) {
  return {
    sequence: row.seq,
    id: row.id,
    eventKey: row.event_key || null,
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

async function registerRelease(env, input) {
  const releaseKey = cleanText(input.releaseKey, 120);
  if (!/^[a-z0-9][a-z0-9:._/-]{2,119}$/i.test(releaseKey)) {
    throw new ClientError("The release key contains unsupported characters.", 400, "release_key_invalid");
  }
  if (!Array.isArray(input.entries) || input.entries.length < 1 || input.entries.length > 25) {
    throw new ClientError("A release must contain between 1 and 25 ledger entries.", 400, "release_entries_invalid");
  }

  const seen = new Set();
  const entries = [];
  for (let index = 0; index < input.entries.length; index += 1) {
    const supplied = input.entries[index];
    const eventKey = cleanText(supplied?.eventKey || `${releaseKey}:${index + 1}`, 160);
    if (seen.has(eventKey)) {
      throw new ClientError("A release cannot repeat an event key.", 400, "release_event_key_duplicate");
    }
    seen.add(eventKey);
    const metadata = supplied?.metadata && typeof supplied.metadata === "object" && !Array.isArray(supplied.metadata)
      ? supplied.metadata
      : {};
    entries.push(await appendLedgerEntry(env, {
      ...supplied,
      eventKey,
      metadata: { ...metadata, releaseKey },
    }));
  }

  console.log(JSON.stringify({
    level: "info",
    message: "ledger-release-registered",
    releaseKey,
    created: entries.filter((entry) => entry.created).length,
    existing: entries.filter((entry) => !entry.created).length,
  }));
  return { releaseKey, entries };
}

async function syncPublicReleaseManifests(env) {
  const listResponse = await fetch("https://api.github.com/repos/GrumpyOldMan977/UtopianSociety/contents/ledger/releases?ref=main", {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Utopian-Society-Civic-Ledger",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!listResponse.ok) throw new Error(`Release manifest listing failed with HTTP ${listResponse.status}.`);
  const files = await listResponse.json();
  if (!Array.isArray(files)) throw new Error("Release manifest listing was not an array.");

  let created = 0;
  let existing = 0;
  for (const file of files.filter((item) => item?.type === "file" && item.name?.endsWith(".json"))) {
    const manifestResponse = await fetch(file.download_url, {
      headers: { Accept: "application/json", "User-Agent": "Utopian-Society-Civic-Ledger" },
    });
    if (!manifestResponse.ok) throw new Error(`Release manifest ${file.name} failed with HTTP ${manifestResponse.status}.`);
    const result = await registerRelease(env, await manifestResponse.json());
    created += result.entries.filter((entry) => entry.created).length;
    existing += result.entries.filter((entry) => !entry.created).length;
  }
  console.log(JSON.stringify({ level: "info", message: "public-release-manifests-synchronized", created, existing }));
  return { created, existing };
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

function issuedCertificate(row) {
  return {
    serial: row.certificate_number,
    civicName: row.civic_name,
    score: Number(row.assessment_score),
    utopianDate: row.utopian_joined_date,
    gregorianDate: row.gregorian_joined_date,
  };
}

async function citizenByIssuanceKey(env, issuanceKey) {
  return env.DB.prepare(`
    SELECT civic_id, civic_name, certificate_number, standing, assessment_score,
           utopian_joined_date, gregorian_joined_date, joined_at, entry_ledger_id,
           issuance_key, assessment_version
    FROM citizens WHERE issuance_key = ?1 LIMIT 1
  `).bind(issuanceKey).first();
}

async function issueCertificate(request, env, input) {
  requirePublicOrigin(request);
  const civicName = cleanText(input.civicName, 160);
  const signature = cleanText(input.signature, 160);
  if (signature.toLocaleLowerCase() !== civicName.toLocaleLowerCase()) {
    throw new ClientError("The digital signature must match the civic name exactly.", 400, "signature_mismatch");
  }
  if (input.oathAccepted !== true) {
    throw new ClientError("The voluntary oath must be accepted before a certificate can be issued.", 400, "oath_required");
  }
  if (input.assessmentVersion !== ASSESSMENT_VERSION) {
    throw new ClientError("This assessment version is no longer accepted. Refresh the portal and try again.", 409, "assessment_version");
  }
  const issuanceKey = cleanText(input.issuanceKey, 80);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(issuanceKey)) {
    throw new ClientError("The issuance request identifier is invalid.", 400, "issuance_key_invalid");
  }

  const score = scoreAssessment(input.answers);
  if (score < ASSESSMENT_PASSING_SCORE) {
    throw new ClientError(`The server verified a score of ${score}%. A score of ${ASSESSMENT_PASSING_SCORE}% is required.`, 422, "assessment_not_passed");
  }

  const existing = await citizenByIssuanceKey(env, issuanceKey);
  if (existing) {
    if (existing.civic_name.toLocaleLowerCase() !== civicName.toLocaleLowerCase()) {
      throw new ClientError("This issuance request is already associated with a different civic name.", 409, "issuance_key_reused");
    }
    return {
      created: false,
      certificate: issuedCertificate(existing),
      civicId: existing.civic_id,
      ledgerId: existing.entry_ledger_id,
    };
  }

  await verifyTurnstile(request, env, input.turnstileToken, issuanceKey);

  for (let attempt = 0; attempt < CERTIFICATE_COLLISION_RETRIES; attempt += 1) {
    const now = new Date();
    const joinedAt = now.toISOString();
    const utopianDate = formatUtopianDate(now);
    const gregorianDate = formatGregorianDate(now);
    const serial = certificateNumber(now);
    const entryInput = {
      eventType: "citizenship_granted",
      category: "citizenship",
      title: `Virtual symbolic citizenship recorded for ${civicName}`,
      summary: `${civicName} demonstrated civic comprehension, entered the virtual oath freely, and was recorded as an active virtual symbolic citizen.`,
      actorName: "Immigration Civic Portal",
      subjectName: civicName,
      subjectRef: serial,
      occurredAt: joinedAt,
      utopianDate,
      gregorianDate,
      sourceLabel: "Immigration Civic Portal · automatic issuance v1",
      sourceUrl: `${request.headers.get("Origin")}/circles/immigration`,
      metadata: {
        certificateNumber: serial,
        assessmentScore: score,
        assessmentVersion: ASSESSMENT_VERSION,
        standing: "active",
        issuance: "server",
      },
    };
    const prepared = await prepareEntry(env, entryInput);
    const civicId = `USC-${crypto.randomUUID()}`;
    const citizenStatement = env.DB.prepare(`
      INSERT INTO citizens (
        civic_id, civic_name, certificate_number, standing, assessment_score,
        utopian_joined_date, gregorian_joined_date, joined_at, entry_ledger_id,
        source_label, created_at, issuance_key, assessment_version
      ) VALUES (?1, ?2, ?3, 'active', ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
    `).bind(
      civicId, civicName, serial, score, utopianDate, gregorianDate, joinedAt,
      prepared.id, entryInput.sourceLabel, prepared.recordedAt, issuanceKey,
      ASSESSMENT_VERSION,
    );

    try {
      await env.DB.batch([prepared.statement, citizenStatement]);
      return {
        created: true,
        certificate: { serial, civicName, score, utopianDate, gregorianDate },
        civicId,
        ledgerId: prepared.id,
      };
    } catch (error) {
      const concurrent = await citizenByIssuanceKey(env, issuanceKey);
      if (concurrent) {
        return {
          created: false,
          certificate: issuedCertificate(concurrent),
          civicId: concurrent.civic_id,
          ledgerId: concurrent.entry_ledger_id,
        };
      }
      if (!String(error).includes("UNIQUE") || attempt === CERTIFICATE_COLLISION_RETRIES - 1) throw error;
    }
  }
  throw new Error("A unique certificate number could not be reserved.");
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method === "GET" && path === "/") return json(request, { service: "Utopian Society Civic Ledger", status: "operational", version: 2 });
  if (request.method === "GET" && path === "/health") return json(request, { ok: true, service: "civic-ledger" });
  if (request.method === "GET" && path === "/v1/ledger") return listLedger(request, env, url);
  if (request.method === "GET" && path === "/v1/population") return population(request, env);
  if (request.method === "GET" && path === "/v1/citizens") return listCitizens(request, env, url);

  if (request.method === "POST" && path === "/v1/immigration/issue-certificate") {
    const body = await readJson(request);
    const written = await issueCertificate(request, env, body);
    return json(request, written, { status: written.created ? 201 : 200 });
  }

  if (request.method === "POST" && path === "/v1/admin/ledger") {
    await requireAdmin(request, env);
    const body = await readJson(request);
    const written = await appendLedgerEntry(env, body);
    return json(request, { entry: written }, { status: written.created ? 201 : 200 });
  }

  if (request.method === "POST" && path === "/v1/admin/releases") {
    await requireAdmin(request, env);
    const body = await readJson(request, 100_000);
    const written = await registerRelease(env, body);
    return json(request, written, { status: written.entries.some((entry) => entry.created) ? 201 : 200 });
  }

  if (request.method === "POST" && path === "/v1/admin/citizens") {
    await requireAdmin(request, env);
    const body = await readJson(request);
    const written = await createCitizen(request, env, body);
    return json(request, written, { status: 201 });
  }

  return json(request, { error: "Not found" }, { status: 404 });
}

const civicLedgerWorker = {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (error) {
      if (error instanceof Response) return error;
      console.error(JSON.stringify({ level: "error", message: "civic-ledger-request-failed", error: String(error) }));
      if (error instanceof ClientError) {
        return json(request, { error: error.message, code: error.code }, { status: error.status });
      }
      const status = error instanceof SyntaxError ? 400 : 500;
      return json(request, { error: status === 400 ? "Invalid JSON request." : "The civic record could not complete this request." }, { status });
    }
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(syncPublicReleaseManifests(env));
  },
};

export default civicLedgerWorker;
