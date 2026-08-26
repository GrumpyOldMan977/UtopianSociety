import {
  ASSESSMENT_VERSION_V2,
  CATEGORY_PASSING_SCORE,
  OVERALL_PASSING_SCORE,
  QUESTIONS_PER_CATEGORY,
  SCORED_QUESTION_COUNT,
  assessmentCategories,
  bankSummary,
  easterEggQuestion,
  questionById,
  questionSourceHref,
  questionsForCategory,
} from "./assessment-bank-v2.js";
import {
  AUTHORED_FICTION_MORAL_TREATMENTS,
  AUTHORED_FICTION_Q_KEYS,
  LEARNING_EVALUATOR_VERSION,
  LEARNING_OBSERVATION_SCHEMA,
  LEARNING_POLICY_VERSION,
  learningContractScoreability,
  learningDocumentTypePolicy,
  learningScoresFromObservations,
  latestLearningObservationsByDocument,
  matchContractAttestedIdentity,
  matchPrivateIdentityText,
  normalizeEvidenceContract,
  normalizeLearningObservation,
  segmentAuthoredWork,
  synthesizeLearningEquityProfile,
} from "./learning-equity.js";

const PUBLIC_ORIGINS = new Set([
  "https://utopiansocietycorpus.org",
  "https://www.utopiansocietycorpus.org",
  "https://utopian-society-corpus-v2.gt90v12.chatgpt.site",
  "http://localhost:9877",
]);

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ASSESSMENT_VERSION_V1 = "immigration-v1";
const ASSESSMENT_QUESTION_COUNT = 100;
const ASSESSMENT_PASSING_SCORE = 90;
const ASSESSMENT_ATTEMPT_LIFETIME_MS = 2 * 60 * 60 * 1000;
const CERTIFICATE_COLLISION_RETRIES = 6;
// Cloudflare Workers Web Crypto rejects PBKDF2 iteration counts above 100,000.
// Keep new credentials portable between the local and production runtimes.
const PASSWORD_HASH_ITERATIONS = 100_000;
const CLOUDFLARE_PBKDF2_MAX_ITERATIONS = 100_000;
const CIVIC_SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;
const CIVIC_LOGIN_LOCK_MS = 5 * 60 * 1000;
const LEARNING_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const PORTRAIT_AI_MODEL = "@cf/black-forest-labs/flux-2-klein-9b";
const AI_DAILY_ALLOWANCE = 10_000;
const AI_PROTECTIVE_LIMIT = 9_000;
const AI_CONVERSION_ESTIMATE = 75;
const AI_PREFLIGHT_ESTIMATE = 650;
// FLUX.2 Klein 9B costs 1,363.64 neurons for the first 1024x1024 output MP
// plus 181.82 neurons per input MP. The browser sends a 496x496 crop.
const AI_PORTRAIT_ESTIMATE = 1_409;
const PORTRAIT_INPUT_MAX_BYTES = 2 * 1024 * 1024;
const RELEASE_INBOX_PREFIX = "ledger/releases/inbox/";
const RELEASE_ARCHIVE_PREFIX = "ledger/releases/archive/";
const RELEASE_MANIFEST_MAX_BYTES = 128 * 1024;
const RELEASE_INBOX_PAGE_SIZE = 100;
const RELEASE_INBOX_MAX_OBJECTS = 500;
const PORTRAIT_PROMPT = `Transform input image 0 into a dignified Renaissance anatomical-study colored-pencil portrait on warm ochre vellum. Preserve the person's facial identity, apparent age, skin tone, hair, glasses, beard, expression, and head angle with high fidelity. Use fine graphite and ink hatching, subtle hand-drawn contours, natural facial proportions, muted green, teal, and antique-gold color accents, and gentle parchment texture inspired by Leonardo da Vinci's manuscript studies. Keep the face centered and fully visible inside a circular-avatar-safe square composition. Do not add text, labels, signatures, symbols, insignia, extra people, extra limbs, hats, jewelry, uniforms, costumes, or invented objects. The result must be a polished civic portrait, not a photographic filter, embossing effect, relief, negative, or photocopy.`;
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

function isAllowedOrigin(origin) {
  return Boolean(origin && (
    PUBLIC_ORIGINS.has(origin)
    || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  ));
}

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
  const allowedOrigin = isAllowedOrigin(origin) ? origin : "https://utopiansocietycorpus.org";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, POST, PUT, PATCH, DELETE",
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

function cleanLongText(value, maxLength, required = false) {
  const result = typeof value === "string" ? value.trim().replace(/\r\n?/g, "\n") : "";
  if (required && !result) throw new ClientError("A required text field is missing.");
  if (result.length > maxLength) throw new ClientError(`A text field exceeds ${maxLength} characters.`);
  return result;
}

function boundedGeneratedText(value, maxLength, fallback = "") {
  const result = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : fallback;
  if (result.length <= maxLength) return result;
  const shortened = result.slice(0, Math.max(0, maxLength - 1)).trimEnd();
  return `${shortened}…`;
}

function requirePublicOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin)) {
    throw new ClientError("Certificate issuance is only available through the civic portal.", 403, "origin_not_allowed");
  }
}

function requireLocalV3(request, env) {
  if (env.DEPLOYMENT_MODE !== "local-v3") {
    throw new ClientError("This testing control is available only in the isolated local v3 environment.", 404, "local_v3_only");
  }
  requirePublicOrigin(request);
}

function civicV3Enabled(env) {
  return env.DEPLOYMENT_MODE === "local-v3" || env.DEPLOYMENT_MODE === "production";
}

function requireCivicV3(request, env) {
  if (!civicV3Enabled(env)) {
    throw new ClientError("The private civic portal is not enabled in this deployment.", 404, "civic_portal_unavailable");
  }
  requirePublicOrigin(request);
}

function isLocalV3(env) {
  return env.DEPLOYMENT_MODE === "local-v3";
}

function civicPageUrl(request, env, pathname) {
  const origin = request.headers.get("Origin");
  return isAllowedOrigin(origin)
    ? `${origin}${pathname}`
    : `${env.PUBLIC_SITE_ORIGIN || "https://utopiansocietycorpus.org"}${pathname}`;
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

function randomIndex(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) throw new Error("A positive random range is required.");
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  const value = new Uint32Array(1);
  do crypto.getRandomValues(value); while (value[0] >= limit);
  return value[0] % maxExclusive;
}

function shuffled(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const replacement = randomIndex(index + 1);
    [copy[index], copy[replacement]] = [copy[replacement], copy[index]];
  }
  return copy;
}

function publicAssessmentQuestion(question, ordinal, optionOrder) {
  const category = assessmentCategories.find((entry) => entry.key === question.category);
  return {
    ordinal,
    id: question.id,
    categoryKey: question.category,
    category: category?.label || question.category,
    prompt: question.prompt,
    options: optionOrder.map((canonicalIndex) => question.options[canonicalIndex]),
    source: {
      href: questionSourceHref(question),
      section: question.sourceSection,
    },
    scored: true,
  };
}

async function startAssessment(request, env) {
  requirePublicOrigin(request);
  const now = new Date();
  const attemptId = `USA-${crypto.randomUUID()}`;
  const qaRun = env.DEPLOYMENT_MODE === "local-v3"
    && request.headers.get("x-utopian-qa-run") === "automated";
  const selected = [];

  for (const category of assessmentCategories) {
    const approved = questionsForCategory(category.key);
    const byConcept = new Map();
    for (const question of approved) {
      const variants = byConcept.get(question.conceptId) || [];
      variants.push(question);
      byConcept.set(question.conceptId, variants);
    }
    if (approved.length < 40 || byConcept.size < QUESTIONS_PER_CATEGORY) {
      throw new Error(`Assessment category ${category.key} is below its release threshold.`);
    }
    const concepts = shuffled([...byConcept.values()]).slice(0, QUESTIONS_PER_CATEGORY);
    const categorySelection = shuffled(concepts.map((variants) => variants[randomIndex(variants.length)]));
    selected.push(...categorySelection);
  }

  const preparedQuestions = selected.map((question, index) => ({
    question,
    ordinal: index + 1,
    optionOrder: shuffled([0, 1, 2, 3]),
  }));
  const fingerprintMaterial = preparedQuestions.map(({ question, optionOrder }) => `${question.id}:${optionOrder.join("")}`).join("|");
  const fingerprint = await digest(fingerprintMaterial);
  const startedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + ASSESSMENT_ATTEMPT_LIFETIME_MS).toISOString();
  const attemptStatement = env.DB.prepare(`
    INSERT INTO assessment_attempts (
      attempt_id, assessment_version, selection_fingerprint, status,
      started_at, expires_at, source_label
    ) VALUES (?1, ?2, ?3, 'started', ?4, ?5, ?6)
  `).bind(
    attemptId,
    ASSESSMENT_VERSION_V2,
    fingerprint,
    startedAt,
    expiresAt,
    qaRun ? "Local QA · automated immigration assessment" : "Immigration Civic Assessment · randomized v2",
  );
  const questionStatements = preparedQuestions.map(({ question, ordinal, optionOrder }) => env.DB.prepare(`
    INSERT INTO assessment_attempt_questions (
      attempt_id, ordinal, category_key, question_id, concept_id, option_order_json
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `).bind(attemptId, ordinal, question.category, question.id, question.conceptId, JSON.stringify(optionOrder)));
  questionStatements.push(env.DB.prepare(`
    INSERT INTO assessment_attempt_questions (
      attempt_id, ordinal, category_key, question_id, concept_id, option_order_json
    ) VALUES (?1, 101, 'easter-egg', ?2, ?3, NULL)
  `).bind(attemptId, easterEggQuestion.id, easterEggQuestion.conceptId));
  await env.DB.batch([attemptStatement, ...questionStatements]);

  return {
    attemptId,
    version: ASSESSMENT_VERSION_V2,
    startedAt,
    expiresAt,
    selectionFingerprint: fingerprint,
    requirements: {
      scoredQuestions: SCORED_QUESTION_COUNT,
      overallPassingScore: OVERALL_PASSING_SCORE,
      questionsPerCategory: QUESTIONS_PER_CATEGORY,
      categoryPassingScore: CATEGORY_PASSING_SCORE,
    },
    categories: assessmentCategories,
    questions: [
      ...preparedQuestions.map(({ question, ordinal, optionOrder }) => publicAssessmentQuestion(question, ordinal, optionOrder)),
      { ordinal: 101, ...easterEggQuestion },
    ],
  };
}

async function assessmentAttempt(env, attemptId) {
  return env.DB.prepare(`
    SELECT attempt_id, assessment_version, selection_fingerprint, status, score,
           category_scores_json, started_at, expires_at, completed_at, issued_civic_id
    FROM assessment_attempts WHERE attempt_id = ?1 LIMIT 1
  `).bind(attemptId).first();
}

async function scoreAssessmentV2(request, env, input) {
  requirePublicOrigin(request);
  const attemptId = cleanText(input.attemptId, 80);
  const attempt = await assessmentAttempt(env, attemptId);
  if (!attempt || attempt.assessment_version !== ASSESSMENT_VERSION_V2) {
    throw new ClientError("This assessment attempt could not be found.", 404, "assessment_not_found");
  }
  if (attempt.status !== "started") {
    throw new ClientError("This assessment attempt has already been completed.", 409, "assessment_completed");
  }
  const now = new Date();
  if (Date.parse(attempt.expires_at) <= now.getTime()) {
    await env.DB.prepare("UPDATE assessment_attempts SET status = 'expired', completed_at = ?2 WHERE attempt_id = ?1").bind(attemptId, now.toISOString()).run();
    throw new ClientError("This assessment attempt expired. Begin a new assessment.", 410, "assessment_expired");
  }
  if (!Array.isArray(input.answers) || input.answers.length !== SCORED_QUESTION_COUNT) {
    throw new ClientError(`Exactly ${SCORED_QUESTION_COUNT} scored answers are required.`, 400, "assessment_incomplete");
  }

  const questionResult = await env.DB.prepare(`
    SELECT ordinal, category_key, question_id, option_order_json
    FROM assessment_attempt_questions
    WHERE attempt_id = ?1 AND ordinal <= 100
    ORDER BY ordinal ASC
  `).bind(attemptId).all();
  const rows = questionResult.results || [];
  if (rows.length !== SCORED_QUESTION_COUNT) throw new Error("The stored assessment selection is incomplete.");

  const answersById = new Map();
  for (const answer of input.answers) {
    const questionId = cleanText(answer?.questionId, 120);
    const optionIndex = Number(answer?.optionIndex);
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3 || answersById.has(questionId)) {
      throw new ClientError("Every question requires one valid, unique answer.", 400, "assessment_invalid");
    }
    answersById.set(questionId, optionIndex);
  }

  const categoryScores = Object.fromEntries(assessmentCategories.map((category) => [category.key, 0]));
  let score = 0;
  for (const row of rows) {
    const question = questionById(row.question_id);
    const submittedIndex = answersById.get(row.question_id);
    if (!question || submittedIndex === undefined) {
      throw new ClientError("The submitted answers do not match this assessment.", 400, "assessment_mismatch");
    }
    const order = JSON.parse(row.option_order_json || "[]");
    if (!Array.isArray(order) || order.length !== 4) throw new Error("The stored option order is invalid.");
    if (order[submittedIndex] === question.correctOption) {
      score += 1;
      categoryScores[row.category_key] += 1;
    }
  }
  const categoryResults = assessmentCategories.map((category) => ({
    key: category.key,
    label: category.label,
    correct: categoryScores[category.key],
    total: QUESTIONS_PER_CATEGORY,
    passed: categoryScores[category.key] >= CATEGORY_PASSING_SCORE,
  }));
  const passed = score >= OVERALL_PASSING_SCORE && categoryResults.every((result) => result.passed);
  const completedAt = now.toISOString();
  await env.DB.prepare(`
    UPDATE assessment_attempts
    SET status = ?2, score = ?3, category_scores_json = ?4, completed_at = ?5
    WHERE attempt_id = ?1 AND status = 'started'
  `).bind(attemptId, passed ? "passed" : "not_passed", score, JSON.stringify(categoryResults), completedAt).run();

  console.log(JSON.stringify({
    level: "info",
    message: "immigration-assessment-scored",
    attemptId,
    selectionFingerprint: attempt.selection_fingerprint,
    score,
    passed,
    easterEggRecognized: String(input.easterResponse || "").trim().toLocaleLowerCase() === easterEggQuestion.recognizedResponse.toLocaleLowerCase(),
  }));
  return {
    attemptId,
    version: ASSESSMENT_VERSION_V2,
    score,
    passed,
    categoryResults,
    requirements: {
      overallPassingScore: OVERALL_PASSING_SCORE,
      categoryPassingScore: CATEGORY_PASSING_SCORE,
    },
    easterEgg: {
      scored: false,
      recognized: String(input.easterResponse || "").trim().toLocaleLowerCase() === easterEggQuestion.recognizedResponse.toLocaleLowerCase(),
      response: easterEggQuestion.recognizedResponse,
    },
    answersRetained: false,
  };
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

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sha256Bytes(bytes) {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function civicFileKey(env) {
  if (!env.CIVIC_FILE_ENCRYPTION_KEY) {
    throw new ClientError("Protected local storage is not configured.", 503, "protected_storage_unavailable");
  }
  const keyBytes = base64ToBytes(env.CIVIC_FILE_ENCRYPTION_KEY);
  if (keyBytes.byteLength !== 32) throw new Error("CIVIC_FILE_ENCRYPTION_KEY must contain 32 bytes.");
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptCivicFile(env, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await civicFileKey(env), bytes);
  return { bytes: new Uint8Array(encrypted), iv: bytesToBase64(iv) };
}

async function decryptCivicFile(env, bytes, iv) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    await civicFileKey(env),
    bytes,
  );
  return new Uint8Array(decrypted);
}

async function encryptPrivateText(env, value) {
  const encrypted = await encryptCivicFile(env, encoder.encode(value));
  return { ciphertext: bytesToBase64(encrypted.bytes), iv: encrypted.iv };
}

async function decryptPrivateText(env, ciphertext, iv) {
  if (!ciphertext || !iv) return "";
  const bytes = await decryptCivicFile(env, base64ToBytes(ciphertext), iv);
  return new TextDecoder().decode(bytes);
}

async function privateIdentityForCitizen(env, civicId, includeLegalName = false) {
  const [identity, variants] = await Promise.all([
    env.DB.prepare(`
      SELECT * FROM civic_private_identities WHERE civic_id = ?1 LIMIT 1
    `).bind(civicId).first(),
    env.DB.prepare(`
      SELECT * FROM civic_private_name_variants
      WHERE civic_id = ?1 AND status = 'verified' ORDER BY created_at
    `).bind(civicId).all(),
  ]);
  const legalName = identity && includeLegalName
    ? await decryptPrivateText(env, identity.legal_name_ciphertext, identity.legal_name_iv)
    : "";
  const publicVariants = [];
  for (const row of variants.results || []) {
    publicVariants.push({
      variantId: row.variant_id,
      value: includeLegalName
        ? await decryptPrivateText(env, row.variant_ciphertext, row.variant_iv)
        : "",
      kind: row.variant_kind,
      verificationNote: row.verification_note,
      createdAt: row.created_at,
    });
  }
  return {
    configured: Boolean(identity?.legal_name_ciphertext),
    legalName,
    chosenName: identity?.chosen_name || "",
    identityVersion: Number(identity?.identity_version || 0),
    variants: publicVariants,
    updatedAt: identity?.updated_at || null,
  };
}

async function documentIdentityMatch(env, civicId, documentText, contract = null) {
  const identity = await privateIdentityForCitizen(env, civicId, true);
  if (!identity.configured) {
    return { state: "unresolved", method: "Private legal identity has not been configured.", confidence: 0 };
  }
  const candidates = [
    { value: identity.legalName, kind: "legal_name", reference: "legal identity" },
    ...(identity.chosenName ? [{
      value: identity.chosenName,
      kind: "chosen_name",
      reference: "chosen civic name",
    }] : []),
    ...identity.variants.map((variant) => ({
      value: variant.value,
      kind: variant.kind,
      reference: `verified private variant ${variant.variantId}`,
    })),
  ];
  const sourceMatch = matchPrivateIdentityText(documentText, candidates);
  if (sourceMatch.state === "matched") return sourceMatch;
  const contractMatch = matchContractAttestedIdentity(contract, candidates);
  return contractMatch || sourceMatch;
}

function isSupportedImage(mediaType, bytes) {
  if (mediaType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mediaType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (mediaType === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

function detectedImageMediaType(bytes) {
  for (const mediaType of ["image/png", "image/jpeg", "image/webp"]) {
    if (isSupportedImage(mediaType, bytes)) return mediaType;
  }
  return "";
}

function binaryResponse(request, bytes, mediaType, fileName, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", mediaType);
  headers.set("Content-Length", String(bytes.byteLength));
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "private, no-store");
  if (fileName) headers.set("Content-Disposition", `attachment; filename="${fileName.replace(/["\r\n]/g, "_")}"`);
  for (const [name, content] of Object.entries(corsHeaders(request))) headers.set(name, content);
  return new Response(bytes, { ...init, headers });
}

function civicSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publicContributionLabel(value) {
  const contribution = String(value || "").trim();
  if (!contribution || contribution === "unassigned") return "Not publicly listed";
  return contribution.replace(/^[^·:]+[·:]\s*/u, "").trim() || contribution;
}

function randomToken(byteLength = 32) {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(byteLength)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function cleanLoginName(value) {
  const loginName = typeof value === "string" ? value.trim() : "";
  if (!/^[A-Za-z0-9._-]{3,48}$/.test(loginName)) {
    throw new ClientError("Enter a civic login name using letters, numbers, periods, hyphens, or underscores.", 400, "login_name_invalid");
  }
  return loginName;
}

function cleanPassword(value) {
  if (typeof value !== "string" || value.length < 10 || value.length > 128) {
    throw new ClientError("The password must contain between 10 and 128 characters.", 400, "password_invalid");
  }
  return value;
}

function cleanCertificateNumber(value, required = false) {
  const certificate = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!certificate && !required) return "";
  if (!/^USV-\d{4}-[A-F0-9]{12}$/.test(certificate)) {
    throw new ClientError(
      "Enter a certificate number in the form USV-year-12 hexadecimal characters.",
      400,
      "certificate_number_invalid",
    );
  }
  return certificate;
}

function cleanActivationToken(value, required = false) {
  const token = typeof value === "string" ? value.trim() : "";
  if (!token && !required) return "";
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
    throw new ClientError(
      "Enter the complete one-time activation code issued with the civic login name.",
      400,
      "activation_token_invalid",
    );
  }
  return token;
}

async function derivePasswordHash(password, salt, iterations = PASSWORD_HASH_ITERATIONS) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt,
    iterations,
  }, material, 256);
  return [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function suggestedLoginName(civicName, certificateSerial) {
  const name = civicName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "").slice(0, 28) || "Citizen";
  return `${name}-${certificateSerial.replace(/[^A-Za-z0-9]/g, "").slice(-8)}`;
}

async function civicAccountByCivicId(env, civicId) {
  return env.DB.prepare(`
    SELECT account_id, civic_id, login_name, status
    FROM civic_accounts WHERE civic_id = ?1 LIMIT 1
  `).bind(civicId).first();
}

async function requireCurrentCivicPassword(env, civicId, suppliedPassword) {
  const password = cleanPassword(suppliedPassword);
  const account = await env.DB.prepare(`
    SELECT account_id, status, password_salt, password_hash, password_iterations
    FROM civic_accounts WHERE civic_id = ?1 LIMIT 1
  `).bind(civicId).first();
  if (!account
    || account.status !== "active"
    || !account.password_salt
    || !account.password_hash) {
    throw new ClientError(
      "This civic account is not available for identity verification.",
      403,
      "identity_reauthentication_unavailable",
    );
  }
  const derived = await derivePasswordHash(
    password,
    base64ToBytes(account.password_salt),
    Number(account.password_iterations),
  );
  if (!(await secureEqual(derived, account.password_hash))) {
    throw new ClientError(
      "The current civic password was not accepted. Private identity settings were not changed.",
      401,
      "identity_reauthentication_failed",
    );
  }
}

async function provisionPendingCivicAccount(env, civicId, civicName, certificateSerial, createdAt) {
  const existing = await civicAccountByCivicId(env, civicId);
  if (existing?.status === "active") return { account: existing, activationToken: null };

  const loginName = suggestedLoginName(civicName, certificateSerial);
  const activationToken = randomToken();
  const activationTokenHash = await digest(activationToken);
  if (existing) {
    await env.DB.prepare(`
      UPDATE civic_accounts
      SET activation_token_hash = ?2, activation_token_created_at = ?3, updated_at = ?3
      WHERE account_id = ?1 AND status = 'pending_activation'
    `).bind(existing.account_id, activationTokenHash, new Date().toISOString()).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO civic_accounts (
        account_id, civic_id, login_name, activation_certificate_number,
        password_salt, password_hash, password_iterations, status,
        failed_attempts, created_at, updated_at, activation_token_hash,
        activation_token_created_at
      ) VALUES (?1, ?2, ?3, ?4, NULL, NULL, ?5, 'pending_activation', 0, ?6, ?6, ?7, ?6)
    `).bind(
      `USA-${crypto.randomUUID()}`, civicId, loginName, certificateSerial,
      PASSWORD_HASH_ITERATIONS, createdAt, activationTokenHash,
    ).run();
  }
  return { account: await civicAccountByCivicId(env, civicId), activationToken };
}

async function recordFailedLogin(env, account, now) {
  const attempts = Number(account.failed_attempts || 0) + 1;
  const lockedUntil = attempts >= 5 ? new Date(now.getTime() + CIVIC_LOGIN_LOCK_MS).toISOString() : null;
  await env.DB.prepare(`
    UPDATE civic_accounts
    SET failed_attempts = ?2, locked_until = ?3, updated_at = ?4
    WHERE account_id = ?1
  `).bind(account.account_id, attempts >= 5 ? 0 : attempts, lockedUntil, now.toISOString()).run();
}

async function loginCivicAccount(request, env, input) {
  requireCivicV3(request, env);
  const loginName = cleanLoginName(input.loginName);
  const password = cleanPassword(input.password);
  const activationToken = cleanActivationToken(input.activationToken, false);
  const account = await env.DB.prepare(`
    SELECT a.*, p.civic_name
    FROM civic_accounts a
    JOIN civic_profiles p ON p.civic_id = a.civic_id
    WHERE a.login_name = ?1 COLLATE NOCASE
    LIMIT 1
  `).bind(loginName).first();
  if (!account) throw new ClientError("The civic login name or password was not accepted.", 401, "login_failed");

  const now = new Date();
  if (account.locked_until && new Date(account.locked_until).getTime() > now.getTime()) {
    throw new ClientError("This civic account is briefly locked after repeated unsuccessful attempts.", 429, "login_locked");
  }

  let activated = false;
  const credentialUpgraded = false;
  const storedIterations = Number(account.password_iterations || 0);
  const requiresCredentialUpgrade = env.DEPLOYMENT_MODE === "production"
    && account.status === "active"
    && storedIterations > CLOUDFLARE_PBKDF2_MAX_ITERATIONS;
  if (account.status === "pending_activation") {
    if (!account.activation_token_hash) {
      throw new ClientError(
        "This unactivated civic account predates private activation codes. Contact the civic administrator for a new one-time code.",
        409,
        "activation_support_required",
      );
    }
    const suppliedTokenHash = activationToken ? await digest(activationToken) : "";
    if (!activationToken || !(await secureEqual(suppliedTokenHash, account.activation_token_hash))) {
      await recordFailedLogin(env, account, now);
      throw new ClientError(
        "The one-time activation code was not accepted.",
        401,
        "activation_token_required",
      );
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await derivePasswordHash(password, salt);
    const activationResult = await env.DB.prepare(`
      UPDATE civic_accounts
      SET password_salt = ?2, password_hash = ?3, password_iterations = ?4,
          status = 'active', failed_attempts = 0, locked_until = NULL,
          activation_token_hash = NULL, activation_token_created_at = NULL,
          updated_at = ?5, last_login_at = ?5
      WHERE account_id = ?1 AND status = 'pending_activation'
        AND activation_token_hash = ?6
    `).bind(
      account.account_id, bytesToBase64(salt), passwordHash,
      PASSWORD_HASH_ITERATIONS, now.toISOString(), suppliedTokenHash,
    ).run();
    if (Number(activationResult.meta?.changes || 0) !== 1) {
      throw new ClientError(
        "This one-time activation code has already been used or replaced.",
        409,
        "activation_token_consumed",
      );
    }
    activated = true;
  } else {
    if (requiresCredentialUpgrade) {
      throw new ClientError(
        "This migrated civic account requires an administrator-assisted credential reset. A public certificate cannot authorize account recovery.",
        409,
        "credential_upgrade_support_required",
      );
    }
    if (account.status !== "active" || !account.password_salt || !account.password_hash) {
      throw new ClientError("This civic account is not available for login.", 403, "account_unavailable");
    }
    const passwordHash = await derivePasswordHash(password, base64ToBytes(account.password_salt), Number(account.password_iterations));
    if (!(await secureEqual(passwordHash, account.password_hash))) {
      await recordFailedLogin(env, account, now);
      throw new ClientError("The civic login name or password was not accepted.", 401, "login_failed");
    }
    await env.DB.prepare(`
      UPDATE civic_accounts
      SET failed_attempts = 0, locked_until = NULL, updated_at = ?2, last_login_at = ?2
      WHERE account_id = ?1
    `).bind(account.account_id, now.toISOString()).run();
  }

  const sessionToken = randomToken();
  const tokenHash = await digest(sessionToken);
  const expiresAt = new Date(now.getTime() + CIVIC_SESSION_LIFETIME_MS).toISOString();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM civic_sessions WHERE expires_at <= ?1 OR revoked_at IS NOT NULL").bind(now.toISOString()),
    env.DB.prepare(`
      INSERT INTO civic_sessions (
        session_token_hash, civic_id, created_at, expires_at, last_seen_at, revoked_at
      ) VALUES (?1, ?2, ?3, ?4, ?3, NULL)
    `).bind(tokenHash, account.civic_id, now.toISOString(), expiresAt),
  ]);
  return {
    activated,
    credentialUpgraded,
    civicId: account.civic_id,
    civicName: account.civic_name,
    loginName: account.login_name,
    sessionToken,
    expiresAt,
  };
}

async function requireCivicSession(request, env) {
  requireCivicV3(request, env);
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
    throw new ClientError("Sign in to open this private civic record.", 401, "civic_session_required");
  }
  const tokenHash = await digest(token);
  const now = new Date().toISOString();
  const session = await env.DB.prepare(`
    SELECT s.civic_id, s.session_token_hash, s.expires_at, a.status, a.login_name,
      COALESCE(p.civic_name, c.civic_name, a.login_name) AS civic_name
    FROM civic_sessions s
    JOIN civic_accounts a ON a.civic_id = s.civic_id
    LEFT JOIN civic_profiles p ON p.civic_id = s.civic_id
    LEFT JOIN citizens c ON c.civic_id = s.civic_id
    WHERE s.session_token_hash = ?1 AND s.revoked_at IS NULL
      AND s.expires_at > ?2 AND a.status = 'active'
    LIMIT 1
  `).bind(tokenHash, now).first();
  if (!session) throw new ClientError("This civic session has expired. Sign in again.", 401, "civic_session_expired");
  await env.DB.prepare("UPDATE civic_sessions SET last_seen_at = ?2 WHERE session_token_hash = ?1")
    .bind(tokenHash, now).run();
  return session;
}

async function requireEditorialAuthority(request, env) {
  const session = await requireCivicSession(request, env);
  const authorizedLogins = String(env.EDITORIAL_AUTHORIZED_LOGINS || "TheFounder")
    .split(",")
    .map((loginName) => loginName.trim().toLowerCase())
    .filter(Boolean);
  if (!authorizedLogins.includes(String(session.login_name || "").toLowerCase())) {
    throw new ClientError(
      "Editorial Studio is restricted to authorized representatives.",
      403,
      "editorial_authority_required",
    );
  }
  return session;
}

async function logoutCivicAccount(request, env) {
  const session = await requireCivicSession(request, env);
  await env.DB.prepare("UPDATE civic_sessions SET revoked_at = ?2 WHERE session_token_hash = ?1")
    .bind(session.session_token_hash, new Date().toISOString()).run();
  return { loggedOut: true };
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

const PUBLIC_LEDGER_PRIVATE_KEYS = new Set([
  "certificateNumber",
  "certificate_number",
  "activationToken",
  "activation_token",
  "activationTokenHash",
  "activation_token_hash",
]);

function publicLedgerMetadata(value) {
  if (Array.isArray(value)) return value.map(publicLedgerMetadata);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !PUBLIC_LEDGER_PRIVATE_KEYS.has(key))
    .map(([key, nestedValue]) => [key, publicLedgerMetadata(nestedValue)]));
}

function publicSubjectRef(value) {
  const reference = typeof value === "string" ? value : null;
  return reference && /^USV-\d{4}-[A-F0-9]{12}$/i.test(reference) ? null : reference;
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
    subjectRef: publicSubjectRef(row.subject_ref),
    occurredAt: row.occurred_at,
    utopianDate: row.utopian_date,
    gregorianDate: row.gregorian_date,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    metadata: publicLedgerMetadata(parseStoredJson(row.metadata_json, {})),
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

async function markReleaseInboxSync(env, values) {
  await env.DB.prepare(`
    INSERT INTO editorial_sync_state (
      source_key, cursor_value, last_success_at, last_attempt_at, status, message
    ) VALUES ('civic-release-inbox', ?2, ?3, ?1, ?4, ?5)
    ON CONFLICT(source_key) DO UPDATE SET
      cursor_value = COALESCE(excluded.cursor_value, editorial_sync_state.cursor_value),
      last_success_at = COALESCE(excluded.last_success_at, editorial_sync_state.last_success_at),
      last_attempt_at = excluded.last_attempt_at,
      status = excluded.status,
      message = excluded.message
  `).bind(
    values.attemptedAt,
    values.cursor || null,
    values.succeededAt || null,
    values.status,
    values.message,
  ).run();
}

async function listReleaseInboxObjects(env) {
  const objects = [];
  let cursor;
  do {
    const page = await env.CIVIC_FILES.list({
      prefix: RELEASE_INBOX_PREFIX,
      cursor,
      limit: RELEASE_INBOX_PAGE_SIZE,
    });
    objects.push(...page.objects);
    if (objects.length > RELEASE_INBOX_MAX_OBJECTS) {
      throw new Error(`The civic release inbox exceeds its ${RELEASE_INBOX_MAX_OBJECTS}-manifest safety limit.`);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects.sort((left, right) => left.key.localeCompare(right.key));
}

async function syncReleaseInbox(env) {
  const attemptedAt = new Date().toISOString();
  await markReleaseInboxSync(env, {
    attemptedAt,
    status: "running",
    message: "Reading pending civic release manifests from the Cloudflare R2 inbox.",
  });

  try {
    const objects = await listReleaseInboxObjects(env);
    let created = 0;
    let existing = 0;
    let archived = 0;
    let lastArchivedKey = null;
    const failures = [];

    for (const object of objects) {
      try {
        if (!object.key.endsWith(".json")) {
          throw new Error("Only JSON release manifests are accepted in the civic release inbox.");
        }
        if (object.size < 1 || object.size > RELEASE_MANIFEST_MAX_BYTES) {
          throw new Error(`Manifest size must be between 1 and ${RELEASE_MANIFEST_MAX_BYTES} bytes.`);
        }
        const stored = await env.CIVIC_FILES.get(object.key);
        if (!stored) throw new Error("Manifest disappeared before it could be read.");
        const bytes = await stored.arrayBuffer();
        if (bytes.byteLength < 1 || bytes.byteLength > RELEASE_MANIFEST_MAX_BYTES) {
          throw new Error(`Manifest size must be between 1 and ${RELEASE_MANIFEST_MAX_BYTES} bytes.`);
        }

        let manifest;
        try {
          manifest = JSON.parse(decoder.decode(bytes));
        } catch {
          throw new Error("Manifest is not valid JSON.");
        }
        const result = await registerRelease(env, manifest);
        created += result.entries.filter((entry) => entry.created).length;
        existing += result.entries.filter((entry) => !entry.created).length;

        const suffix = object.key.slice(RELEASE_INBOX_PREFIX.length);
        const archiveKey = `${RELEASE_ARCHIVE_PREFIX}${suffix}`;
        const synchronizedAt = new Date().toISOString();
        await env.CIVIC_FILES.put(archiveKey, bytes, {
          httpMetadata: { contentType: "application/json; charset=utf-8" },
          customMetadata: {
            releaseKey: result.releaseKey,
            synchronizedAt,
          },
        });
        await env.CIVIC_FILES.delete(object.key);
        archived += 1;
        lastArchivedKey = archiveKey;
      } catch (error) {
        failures.push({
          key: object.key,
          error: boundedGeneratedText(String(error?.message || error), 300, "Release manifest synchronization failed."),
        });
      }
    }

    if (failures.length) {
      const message = `${failures.length} release manifest${failures.length === 1 ? " remains" : "s remain"} in the R2 inbox after validation or registration failed.`;
      await markReleaseInboxSync(env, {
        attemptedAt,
        cursor: lastArchivedKey,
        status: "failed",
        message,
      });
      console.error(JSON.stringify({ level: "error", message: "civic-release-inbox-failed", failures }));
      throw new Error(message);
    }

    const synchronizedAt = new Date().toISOString();
    const message = objects.length
      ? `${archived} Cloudflare R2 release manifest${archived === 1 ? "" : "s"} synchronized and archived.`
      : "Cloudflare R2 release inbox checked; no pending manifests.";
    await markReleaseInboxSync(env, {
      attemptedAt,
      cursor: lastArchivedKey,
      succeededAt: synchronizedAt,
      status: "succeeded",
      message,
    });
    console.log(JSON.stringify({
      level: "info",
      message: "civic-release-inbox-synchronized",
      pending: objects.length,
      archived,
      created,
      existing,
    }));
    return { pending: objects.length, archived, created, existing, synchronizedAt };
  } catch (error) {
    const currentMessage = boundedGeneratedText(String(error?.message || error), 500, "Release inbox synchronization failed.");
    await markReleaseInboxSync(env, {
      attemptedAt,
      status: "failed",
      message: currentMessage,
    });
    throw error;
  }
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
  const latest = await env.DB.prepare("SELECT civic_name, utopian_joined_date, gregorian_joined_date FROM citizens WHERE standing = 'active' ORDER BY joined_at DESC LIMIT 1").first();
  return json(request, {
    active: Number(summary?.active_population || 0),
    independent: Number(summary?.independent_population || 0),
    revoked: Number(summary?.revoked_population || 0),
    totalRecorded: Number(summary?.total_recorded || 0),
    latestCitizen: latest ? {
      civicName: latest.civic_name,
      utopianDate: latest.utopian_joined_date,
      gregorianDate: latest.gregorian_joined_date,
    } : null,
    definition: "Active virtual symbolic citizens recorded in the public Transparency Ledger.",
  }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}

async function listCitizens(request, env, url) {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const result = await env.DB.prepare(`
    SELECT c.civic_id, c.civic_name, c.standing, c.assessment_score,
           c.utopian_joined_date, c.gregorian_joined_date, c.joined_at,
           c.exited_at, c.source_label, p.profile_visibility
    FROM citizens c
    LEFT JOIN civic_profiles p ON p.civic_id = c.civic_id
    ORDER BY c.joined_at DESC LIMIT ?1
  `).bind(limit).all();
  const citizens = (result.results || []).map((citizen) => ({
    civic_id: citizen.civic_id,
    civic_name: citizen.civic_name,
    standing: citizen.standing,
    assessment_score: citizen.assessment_score,
    utopian_joined_date: citizen.utopian_joined_date,
    gregorian_joined_date: citizen.gregorian_joined_date,
    joined_at: citizen.joined_at,
    exited_at: citizen.exited_at,
    source_label: citizen.source_label,
    public_profile: citizen.profile_visibility === "public",
    profile_slug: citizen.profile_visibility === "public" ? civicSlug(citizen.civic_name) : null,
  }));
  return json(request, { citizens }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}

async function createCitizen(request, env, input) {
  const civicName = cleanText(input.civicName, 160);
  const certificateNumber = cleanCertificateNumber(input.certificateNumber, true);
  const assessmentScore = Number(input.assessmentScore);
  if (!Number.isInteger(assessmentScore) || assessmentScore < 0 || assessmentScore > 100) throw new Error("Assessment score is invalid.");
  const entryInput = {
    eventType: "citizenship_granted",
    category: "citizenship",
    title: `Virtual symbolic citizenship recorded for ${civicName}`,
    summary: cleanText(input.summary || `${civicName} demonstrated civic comprehension, entered the virtual oath freely, and was recorded as an active virtual symbolic citizen.`, 2000),
    actorName: cleanText(input.actorName || "Immigration Civic Office", 160),
    subjectName: civicName,
    subjectRef: null,
    occurredAt: cleanText(input.joinedAt, 40),
    utopianDate: cleanText(input.utopianDate, 120),
    gregorianDate: cleanText(input.gregorianDate, 80),
    sourceLabel: cleanText(input.sourceLabel, 180),
    sourceUrl: cleanText(input.sourceUrl, 500, false),
    metadata: { assessmentScore, standing: "active" },
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
  if (![ASSESSMENT_VERSION_V1, ASSESSMENT_VERSION_V2].includes(input.assessmentVersion)) {
    throw new ClientError("This assessment version is no longer accepted. Refresh the portal and try again.", 409, "assessment_version");
  }
  const issuanceKey = cleanText(input.issuanceKey, 80);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(issuanceKey)) {
    throw new ClientError("The issuance request identifier is invalid.", 400, "issuance_key_invalid");
  }

  let score;
  let verifiedAttempt = null;
  if (input.assessmentVersion === ASSESSMENT_VERSION_V2) {
    const attemptId = cleanText(input.assessmentAttemptId, 80);
    verifiedAttempt = await assessmentAttempt(env, attemptId);
    if (!verifiedAttempt || verifiedAttempt.assessment_version !== ASSESSMENT_VERSION_V2) {
      throw new ClientError("The verified assessment attempt could not be found.", 404, "assessment_not_found");
    }
    if (!['passed', 'issued'].includes(verifiedAttempt.status)) {
      throw new ClientError("The assessment has not met both the overall and category standards.", 422, "assessment_not_passed");
    }
    score = Number(verifiedAttempt.score);
  } else {
    score = scoreAssessment(input.answers);
    if (score < ASSESSMENT_PASSING_SCORE) {
      throw new ClientError(`The server verified a score of ${score}%. A score of ${ASSESSMENT_PASSING_SCORE}% is required.`, 422, "assessment_not_passed");
    }
  }

  const existing = await citizenByIssuanceKey(env, issuanceKey);
  if (existing) {
    if (existing.civic_name.toLocaleLowerCase() !== civicName.toLocaleLowerCase()) {
      throw new ClientError("This issuance request is already associated with a different civic name.", 409, "issuance_key_reused");
    }
    const provisioned = civicV3Enabled(env)
      ? await provisionPendingCivicAccount(
        env, existing.civic_id, existing.civic_name, existing.certificate_number, existing.joined_at,
      )
      : null;
    return {
      created: false,
      certificate: issuedCertificate(existing),
      civicId: existing.civic_id,
      ledgerId: existing.entry_ledger_id,
      account: provisioned?.account ? {
        loginName: provisioned.account.login_name,
        activationRequired: provisioned.account.status === "pending_activation",
        activationToken: provisioned.activationToken,
      } : null,
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
      subjectRef: null,
      occurredAt: joinedAt,
      utopianDate,
      gregorianDate,
      sourceLabel: `Immigration Civic Portal · automatic issuance ${input.assessmentVersion === ASSESSMENT_VERSION_V2 ? "v2" : "v1"}`,
      sourceUrl: `${request.headers.get("Origin")}/circles/immigration`,
      metadata: {
        assessmentScore: score,
        assessmentVersion: input.assessmentVersion,
        assessmentAttemptId: verifiedAttempt?.attempt_id || null,
        selectionFingerprint: verifiedAttempt?.selection_fingerprint || null,
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
      input.assessmentVersion,
    );

    const issuanceStatements = [prepared.statement, citizenStatement];
    let activationToken = null;
    if (civicV3Enabled(env)) {
      activationToken = randomToken();
      const activationTokenHash = await digest(activationToken);
      issuanceStatements.push(env.DB.prepare(`
        INSERT INTO civic_accounts (
          account_id, civic_id, login_name, activation_certificate_number,
          password_salt, password_hash, password_iterations, status,
          failed_attempts, created_at, updated_at, activation_token_hash,
          activation_token_created_at
        ) VALUES (?1, ?2, ?3, ?4, NULL, NULL, ?5, 'pending_activation', 0, ?6, ?6, ?7, ?6)
      `).bind(
        `USA-${crypto.randomUUID()}`, civicId, suggestedLoginName(civicName, serial),
        serial, PASSWORD_HASH_ITERATIONS, joinedAt, activationTokenHash,
      ));
    }
    if (verifiedAttempt) {
      issuanceStatements.push(env.DB.prepare(`
        UPDATE assessment_attempts
        SET status = 'issued', issued_civic_id = ?2
        WHERE attempt_id = ?1 AND status = 'passed'
      `).bind(verifiedAttempt.attempt_id, civicId));
    }

    try {
      await env.DB.batch(issuanceStatements);
      const account = civicV3Enabled(env) ? await civicAccountByCivicId(env, civicId) : null;
      return {
        created: true,
        certificate: { serial, civicName, score, utopianDate, gregorianDate },
        civicId,
        ledgerId: prepared.id,
        account: account ? {
          loginName: account.login_name,
          activationRequired: true,
          activationToken,
        } : null,
      };
    } catch (error) {
      const concurrent = await citizenByIssuanceKey(env, issuanceKey);
      if (concurrent) {
        const provisioned = civicV3Enabled(env)
          ? await provisionPendingCivicAccount(
            env, concurrent.civic_id, concurrent.civic_name,
            concurrent.certificate_number, concurrent.joined_at,
          )
          : null;
        return {
          created: false,
          certificate: issuedCertificate(concurrent),
          civicId: concurrent.civic_id,
          ledgerId: concurrent.entry_ledger_id,
          account: provisioned?.account ? {
            loginName: provisioned.account.login_name,
            activationRequired: provisioned.account.status === "pending_activation",
            activationToken: provisioned.activationToken,
          } : null,
        };
      }
      if (!String(error).includes("UNIQUE") || attempt === CERTIFICATE_COLLISION_RETRIES - 1) throw error;
    }
  }
  throw new Error("A unique certificate number could not be reserved.");
}

function parseStoredJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function ccuFromMicros(value) {
  return Number(value || 0) / 1_000_000;
}

async function uploadProfileAvatar(request, env) {
  const session = await requireCivicSession(request, env);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new ClientError("Choose a profile image.", 400, "avatar_missing");
  if (file.size < 1 || file.size > 10 * 1024 * 1024) {
    throw new ClientError("Profile images may be up to 10 MB.", 413, "avatar_too_large");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isSupportedImage(file.type, bytes)) {
    throw new ClientError("Choose a valid JPG, PNG, or WebP image.", 400, "avatar_type_invalid");
  }
  const now = new Date().toISOString();
  const assetId = `USM-${crypto.randomUUID()}`;
  const objectKey = `profiles/${session.civic_id}/avatar/${assetId}`;
  const sha256 = await sha256Bytes(bytes);
  const current = await env.DB.prepare("SELECT avatar_asset_id FROM civic_profiles WHERE civic_id = ?1").bind(session.civic_id).first();
  await env.CIVIC_FILES.put(objectKey, bytes, {
    httpMetadata: { contentType: file.type },
    customMetadata: { civicId: session.civic_id, purpose: "avatar", sha256 },
  });
  const statements = [
    env.DB.prepare(`
      INSERT INTO civic_media_assets (
        asset_id, civic_id, purpose, object_key, original_name, media_type,
        byte_size, encrypted, encryption_iv, sha256, status, created_at
      ) VALUES (?1, ?2, 'avatar', ?3, ?4, ?5, ?6, 0, NULL, ?7, 'active', ?8)
    `).bind(assetId, session.civic_id, objectKey, file.name || "profile-image", file.type, file.size, sha256, now),
    env.DB.prepare("UPDATE civic_profiles SET avatar_asset_id = ?2, updated_at = ?3 WHERE civic_id = ?1")
      .bind(session.civic_id, assetId, now),
  ];
  if (current?.avatar_asset_id) {
    statements.push(env.DB.prepare("UPDATE civic_media_assets SET status = 'replaced', replaced_at = ?2 WHERE asset_id = ?1")
      .bind(current.avatar_asset_id, now));
  }
  await env.DB.batch(statements);
  return { assetId, mediaType: file.type, byteSize: file.size, uploadedAt: now };
}

async function generateProfilePortrait(request, env) {
  await requireCivicSession(request, env);
  const allowance = await aiAllowanceStatus(env);
  if (!allowance.configured) {
    throw new ClientError(
      "The Cloudflare portrait generator is not configured.",
      503,
      "workers_ai_unavailable",
    );
  }
  if (!allowance.portraitAvailable) {
    throw new ClientError(
      `The portal's protective AI allowance cannot cover another portrait today. Try again after ${allowance.resetAt}.`,
      429,
      "workers_ai_allowance_exhausted",
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    throw new ClientError("The cropped profile photograph could not be read.", 400, "portrait_crop_invalid");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > PORTRAIT_INPUT_MAX_BYTES) {
    throw new ClientError(
      "Send a valid JPG, PNG, or WebP crop no larger than 2 MB.",
      400,
      "portrait_crop_invalid",
    );
  }
  const inputBytes = new Uint8Array(await file.arrayBuffer());
  if (!isSupportedImage(file.type, inputBytes)) {
    throw new ClientError(
      "Send a valid JPG, PNG, or WebP crop.",
      400,
      "portrait_crop_invalid",
    );
  }

  const aiForm = new FormData();
  aiForm.append("input_image_0", new File([inputBytes], "civic-profile-crop", { type: file.type }));
  aiForm.append("prompt", PORTRAIT_PROMPT);
  aiForm.append("width", "1024");
  aiForm.append("height", "1024");
  const multipartResponse = new Response(aiForm);
  const multipartContentType = multipartResponse.headers.get("content-type");
  if (!multipartResponse.body || !multipartContentType) {
    throw new ClientError(
      "The portrait generator could not prepare this crop.",
      502,
      "portrait_generation_failed",
    );
  }

  let generated;
  try {
    generated = await env.AI.run(PORTRAIT_AI_MODEL, {
      multipart: {
        body: multipartResponse.body,
        contentType: multipartContentType,
      },
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    console.error(JSON.stringify({
      level: "error",
      message: "profile-portrait-ai-request-failed",
      model: PORTRAIT_AI_MODEL,
      error: detail,
    }));
    if (/3036|daily free allocation|10,?000 neurons|account limited/i.test(detail)) {
      await recordAiAccountLimit(env);
      throw new ClientError(
        `Cloudflare's daily AI allowance has been reached. Try again after ${allowance.resetAt}.`,
        429,
        "workers_ai_allowance_exhausted",
      );
    }
    throw new ClientError(
      "Cloudflare could not complete this portrait. Try another crop or try again later.",
      502,
      "portrait_generation_failed",
    );
  }

  const encoded = typeof generated?.image === "string"
    ? generated.image.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "")
    : "";
  if (!encoded) {
    throw new ClientError(
      "Cloudflare returned no portrait image.",
      502,
      "portrait_response_invalid",
    );
  }
  let outputBytes;
  try {
    outputBytes = base64ToBytes(encoded);
  } catch {
    throw new ClientError(
      "Cloudflare returned an unreadable portrait image.",
      502,
      "portrait_response_invalid",
    );
  }
  const mediaType = detectedImageMediaType(outputBytes);
  if (!mediaType) {
    throw new ClientError(
      "Cloudflare returned an unsupported portrait image.",
      502,
      "portrait_response_invalid",
    );
  }
  await recordAiUsage(env, {
    modelName: PORTRAIT_AI_MODEL,
    requestCount: 1,
    estimatedNeurons: AI_PORTRAIT_ESTIMATE,
  });
  return { bytes: outputBytes, mediaType };
}

async function profileAvatar(request, env) {
  const session = await requireCivicSession(request, env);
  const asset = await env.DB.prepare(`
    SELECT m.* FROM civic_profiles p
    JOIN civic_media_assets m ON m.asset_id = p.avatar_asset_id
    WHERE p.civic_id = ?1 AND m.status = 'active' LIMIT 1
  `).bind(session.civic_id).first();
  if (!asset) throw new ClientError("No profile image has been added.", 404, "avatar_not_found");
  const object = await env.CIVIC_FILES.get(asset.object_key);
  if (!object) throw new ClientError("The profile image could not be found in local storage.", 404, "avatar_object_missing");
  return binaryResponse(request, new Uint8Array(await object.arrayBuffer()), asset.media_type, null);
}

async function deleteProfileAvatar(request, env) {
  const session = await requireCivicSession(request, env);
  const asset = await env.DB.prepare(`
    SELECT m.* FROM civic_profiles p
    JOIN civic_media_assets m ON m.asset_id = p.avatar_asset_id
    WHERE p.civic_id = ?1 AND m.status = 'active' LIMIT 1
  `).bind(session.civic_id).first();
  if (!asset) return { deleted: false };
  const now = new Date().toISOString();
  await env.CIVIC_FILES.delete(asset.object_key);
  await env.DB.batch([
    env.DB.prepare("UPDATE civic_media_assets SET status = 'deleted', replaced_at = ?2 WHERE asset_id = ?1").bind(asset.asset_id, now),
    env.DB.prepare("UPDATE civic_profiles SET avatar_asset_id = NULL, updated_at = ?2 WHERE civic_id = ?1").bind(session.civic_id, now),
  ]);
  return { deleted: true };
}

const PROTECTED_MEDIA_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
]);

async function uploadProtectedDocument(request, env) {
  const session = await requireCivicSession(request, env);
  const form = await request.formData();
  const file = form.get("file");
  const domain = cleanText(form.get("domain"), 20);
  const consent = cleanText(form.get("consent"), 240);
  const sourceDocumentId = cleanText(form.get("sourceDocumentId") || "", 80, false) || null;
  const derivationMethod = cleanText(form.get("derivationMethod") || "original", 40);
  const reviewStatus = cleanText(form.get("reviewStatus") || "not_required", 30);
  const extractionConfidenceValue = form.get("extractionConfidence");
  const extractionConfidence = extractionConfidenceValue === null || extractionConfidenceValue === ""
    ? null
    : Number(extractionConfidenceValue);
  if (!(file instanceof File)) throw new ClientError("Choose a document to upload.", 400, "document_missing");
  if (!["learning", "healing", "harmony"].includes(domain)) {
    throw new ClientError("Choose a supported private-record domain.", 400, "document_domain_invalid");
  }
  if (!["original", "citizen_reviewed_ocr"].includes(derivationMethod)) {
    throw new ClientError("Choose a supported evidence derivation method.", 400, "document_derivation_invalid");
  }
  if (!["not_required", "reviewed"].includes(reviewStatus)) {
    throw new ClientError("Choose a supported evidence review status.", 400, "document_review_status_invalid");
  }
  if (extractionConfidence !== null
    && (!Number.isFinite(extractionConfidence) || extractionConfidence < 0 || extractionConfidence > 100)) {
    throw new ClientError("OCR confidence must be between 0 and 100.", 400, "document_ocr_confidence_invalid");
  }
  if (derivationMethod === "citizen_reviewed_ocr") {
    if (domain !== "learning" || file.type !== "text/plain" || !sourceDocumentId || reviewStatus !== "reviewed") {
      throw new ClientError(
        "A reviewed OCR transcript must be Learning text linked to its retained source scan.",
        400,
        "document_ocr_provenance_invalid",
      );
    }
    const source = await env.DB.prepare(`
      SELECT d.document_id, d.derivation_method, m.media_type
      FROM protected_documents d
      JOIN civic_media_assets m ON m.asset_id = d.asset_id
      WHERE d.document_id = ?1 AND d.civic_id = ?2
        AND d.record_domain = 'learning' AND d.retention_status != 'deleted'
      LIMIT 1
    `).bind(sourceDocumentId, session.civic_id).first();
    if (!source || source.derivation_method !== "original"
      || !["application/pdf", "image/jpeg", "image/png"].includes(source.media_type)) {
      throw new ClientError(
        "The OCR transcript source must be this citizen’s retained original PDF, JPG, or PNG.",
        400,
        "document_ocr_source_invalid",
      );
    }
  } else if (sourceDocumentId || reviewStatus !== "not_required" || extractionConfidence !== null) {
    throw new ClientError(
      "Original documents cannot claim OCR review metadata.",
      400,
      "document_original_provenance_invalid",
    );
  }
  if (!PROTECTED_MEDIA_TYPES.has(file.type)) {
    throw new ClientError("Use PDF, DOCX, TXT, JPG, or PNG for protected civic documents.", 400, "document_type_invalid");
  }
  if (file.size < 1 || file.size > 10 * 1024 * 1024) {
    throw new ClientError("Protected documents may be up to 10 MB.", 413, "document_too_large");
  }
  const plain = new Uint8Array(await file.arrayBuffer());
  if (file.type.startsWith("image/") && !isSupportedImage(file.type, plain)) {
    throw new ClientError("The uploaded image content does not match its declared type.", 400, "document_signature_invalid");
  }
  const encrypted = await encryptCivicFile(env, plain);
  const now = new Date().toISOString();
  const assetId = `USM-${crypto.randomUUID()}`;
  const documentId = `USD-${crypto.randomUUID()}`;
  const accessId = `USA-${crypto.randomUUID()}`;
  const objectKey = `protected/${session.civic_id}/${domain}/${assetId}.bin`;
  const purpose = domain === "learning" ? "learning_evidence" : `${domain}_record`;
  const sha256 = await sha256Bytes(plain);
  await env.CIVIC_FILES.put(objectKey, encrypted.bytes, {
    customMetadata: { civicId: session.civic_id, domain, encrypted: "AES-256-GCM", sha256 },
  });
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO civic_media_assets (
        asset_id, civic_id, purpose, object_key, original_name, media_type,
        byte_size, encrypted, encryption_iv, sha256, status, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8, ?9, 'active', ?10)
    `).bind(assetId, session.civic_id, purpose, objectKey, file.name || "protected-document", file.type, file.size, encrypted.iv, sha256, now),
    env.DB.prepare(`
      INSERT INTO protected_documents (
        document_id, civic_id, asset_id, record_domain, consent_scope, retention_status, created_at,
        source_document_id, derivation_method, review_status, reviewed_at, extraction_confidence
      ) VALUES (?1, ?2, ?3, ?4, ?5, 'retained', ?6, ?7, ?8, ?9, ?10, ?11)
    `).bind(
      documentId,
      session.civic_id,
      assetId,
      domain,
      consent,
      now,
      sourceDocumentId,
      derivationMethod,
      reviewStatus,
      reviewStatus === "reviewed" ? now : null,
      extractionConfidence,
    ),
    env.DB.prepare(`
      INSERT INTO protected_document_access_log (
        access_id, document_id, civic_id, action, actor_label, occurred_at
      ) VALUES (?1, ?2, ?3, 'uploaded', 'Citizen self-service', ?4)
    `).bind(accessId, documentId, session.civic_id, now),
  ]);
  return {
    documentId,
    originalName: file.name,
    mediaType: file.type,
    byteSize: file.size,
    domain,
    encrypted: true,
    createdAt: now,
    sourceDocumentId,
    derivationMethod,
    reviewStatus,
    reviewedAt: reviewStatus === "reviewed" ? now : null,
    extractionConfidence,
  };
}

async function downloadProtectedDocument(request, env, documentId) {
  const session = await requireCivicSession(request, env);
  const document = await env.DB.prepare(`
    SELECT d.*, m.object_key, m.original_name, m.media_type, m.encryption_iv
    FROM protected_documents d JOIN civic_media_assets m ON m.asset_id = d.asset_id
    WHERE d.document_id = ?1 AND d.civic_id = ?2 AND d.retention_status != 'deleted'
    LIMIT 1
  `).bind(documentId, session.civic_id).first();
  if (!document) throw new ClientError("This protected document could not be found.", 404, "document_not_found");
  const object = await env.CIVIC_FILES.get(document.object_key);
  if (!object) throw new ClientError("The protected document is missing from local storage.", 404, "document_object_missing");
  const bytes = await decryptCivicFile(env, new Uint8Array(await object.arrayBuffer()), document.encryption_iv);
  const now = new Date().toISOString();
  const accessPurpose = new URL(request.url).searchParams.get("purpose");
  const action = accessPurpose === "ocr" ? "read" : "exported";
  const actorLabel = accessPurpose === "ocr"
    ? "Citizen local OCR review"
    : "Citizen self-service";
  await env.DB.prepare(`
    INSERT INTO protected_document_access_log (
      access_id, document_id, civic_id, action, actor_label, occurred_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `).bind(`USA-${crypto.randomUUID()}`, documentId, session.civic_id, action, actorLabel, now).run();
  return binaryResponse(request, bytes, document.media_type, document.original_name);
}

async function deleteProtectedDocument(request, env, documentId) {
  const session = await requireCivicSession(request, env);
  const document = await env.DB.prepare(`
    SELECT d.document_id, d.asset_id, m.object_key
    FROM protected_documents d
    JOIN civic_media_assets m ON m.asset_id = d.asset_id
    WHERE d.document_id = ?1 AND d.civic_id = ?2 AND d.retention_status != 'deleted'
    LIMIT 1
  `).bind(documentId, session.civic_id).first();
  if (!document) return { deleted: false };
  const now = new Date().toISOString();
  await env.CIVIC_FILES.delete(document.object_key);
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE protected_documents
      SET retention_status = 'deleted', deleted_at = ?2
      WHERE document_id = ?1
    `).bind(documentId, now),
    env.DB.prepare(`
      UPDATE civic_media_assets
      SET status = 'deleted', replaced_at = ?2
      WHERE asset_id = ?1
    `).bind(document.asset_id, now),
    env.DB.prepare(`
      INSERT INTO protected_document_access_log (
        access_id, document_id, civic_id, action, actor_label, occurred_at
      ) VALUES (?1, ?2, ?3, 'deleted', 'Citizen self-service', ?4)
    `).bind(`USA-${crypto.randomUUID()}`, documentId, session.civic_id, now),
  ]);
  return { deleted: true };
}

function publicPosition(row) {
  return {
    positionId: row.position_id,
    title: row.title,
    sectorKey: row.sector_key,
    description: row.description,
    recordedHours: 0,
    sepMultiplier: Number(row.sep_multiplier_millis) / 1000,
    capacityRequired: row.capacity_required,
    status: row.status,
    publicSummary: row.public_summary,
    availableSlots: Number(row.available_slots || 0),
    qualificationSummary: row.qualification_summary || "",
  };
}

function publicAssignment(row) {
  return {
    assignmentId: row.assignment_id,
    civicId: row.civic_id,
    positionId: row.position_id,
    title: row.title,
    sectorKey: row.sector_key,
    status: row.status,
    recordedHours: Number(row.recorded_minutes || 0) / 60,
    sepMultiplier: Number(row.sep_multiplier_millis) / 1000,
    evidenceSummary: row.evidence_summary,
    acceptedAt: row.accepted_at,
    submittedAt: row.submitted_at,
    affirmedAt: row.affirmed_at,
    affirmedBy: row.affirmed_by,
  };
}

async function civicProfile(env, civicId) {
  return env.DB.prepare(`
    SELECT civic_id, civic_name, immigration_standing, learning_tier,
           contribution_status, residence_status, profile_visibility,
           civic_title, public_bio, avatar_asset_id, created_at, updated_at
    FROM civic_profiles WHERE civic_id = ?1 LIMIT 1
  `).bind(civicId).first();
}

async function visibleCivicProfileBySlug(env, slug) {
  const result = await env.DB.prepare(`
    SELECT civic_id, civic_name, immigration_standing, contribution_status,
           profile_visibility, civic_title, public_bio, avatar_asset_id, updated_at
    FROM civic_profiles
    WHERE profile_visibility IN ('civic', 'public')
    ORDER BY created_at
  `).all();
  return (result.results || []).find((profile) => civicSlug(profile.civic_name) === slug) || null;
}

async function publicCivicDirectory(env) {
  const result = await env.DB.prepare(`
    SELECT civic_name, immigration_standing, contribution_status, civic_title,
           public_bio, avatar_asset_id, updated_at
    FROM civic_profiles
    WHERE profile_visibility = 'public'
    ORDER BY civic_name COLLATE NOCASE
  `).all();
  return {
    citizens: (result.results || []).map((profile) => ({
      slug: civicSlug(profile.civic_name),
      civicName: profile.civic_name,
      civicTitle: profile.civic_title || "Citizen",
      publicBio: profile.public_bio || "",
      hasAvatar: Boolean(profile.avatar_asset_id),
      civicStanding: profile.immigration_standing || "Not publicly listed",
      primaryContribution: publicContributionLabel(profile.contribution_status),
      profileVisibility: "public",
      updatedAt: profile.updated_at,
    })),
  };
}

function publicRecognition(row) {
  return {
    recognitionId: row.recognition_id,
    circleKey: row.circle_key,
    recognitionType: row.recognition_type,
    title: row.title,
    summary: row.summary,
    issuedBy: row.issued_by,
    issuedAt: row.issued_at,
    utopianDate: row.utopian_date,
    sourceUrl: row.source_url || null,
  };
}

async function publicCivicProfile(env, slug) {
  const profile = await visibleCivicProfileBySlug(env, slug);
  if (!profile) throw new ClientError("This public civic profile is not available.", 404, "public_profile_not_found");
  const [recognitions, affirmedAssignments] = await Promise.all([
    env.DB.prepare(`
      SELECT recognition_id, circle_key, recognition_type, title, summary,
             issued_by, issued_at, utopian_date, source_url
      FROM civic_public_recognitions
      WHERE civic_id = ?1 AND status = 'public'
      ORDER BY issued_at DESC, created_at DESC
    `).bind(profile.civic_id).all(),
    env.DB.prepare(`
      SELECT a.assignment_id, a.affirmed_at, a.affirmed_by, p.title, p.public_summary
      FROM contribution_assignments a
      JOIN contribution_positions p ON p.position_id = a.position_id
      WHERE a.civic_id = ?1 AND a.status = 'affirmed'
      ORDER BY a.affirmed_at DESC
    `).bind(profile.civic_id).all(),
  ]);
  const circleRecognitions = (recognitions.results || []).map(publicRecognition);
  const contributionRecognitions = (affirmedAssignments.results || []).map((assignment) => ({
    recognitionId: `contribution-${assignment.assignment_id}`,
    circleKey: "contribution",
    recognitionType: "service",
    title: `Affirmed service: ${assignment.title}`,
    summary: assignment.public_summary || "Service was reviewed and affirmed through the Circle of Contribution.",
    issuedBy: assignment.affirmed_by || "Circle of Contribution",
    issuedAt: assignment.affirmed_at,
    utopianDate: assignment.affirmed_at ? formatUtopianDate(new Date(assignment.affirmed_at)) : "",
    sourceUrl: null,
  }));
  return {
    slug,
    civicName: profile.civic_name,
    civicTitle: profile.civic_title || "Citizen",
    publicBio: profile.public_bio || "",
    hasAvatar: Boolean(profile.avatar_asset_id),
    civicStanding: profile.immigration_standing || "Not publicly listed",
    primaryContribution: publicContributionLabel(profile.contribution_status),
    profileVisibility: profile.profile_visibility,
    recognitions: [...circleRecognitions, ...contributionRecognitions]
      .sort((left, right) => String(right.issuedAt || "").localeCompare(String(left.issuedAt || ""))),
    updatedAt: profile.updated_at,
  };
}

async function publicProfileAvatar(request, env, slug) {
  const profile = await visibleCivicProfileBySlug(env, slug);
  if (!profile?.avatar_asset_id) throw new ClientError("No public profile image is available.", 404, "public_avatar_not_found");
  const asset = await env.DB.prepare(`
    SELECT * FROM civic_media_assets
    WHERE asset_id = ?1 AND civic_id = ?2 AND purpose = 'avatar' AND status = 'active'
    LIMIT 1
  `).bind(profile.avatar_asset_id, profile.civic_id).first();
  if (!asset) throw new ClientError("No public profile image is available.", 404, "public_avatar_not_found");
  const object = await env.CIVIC_FILES.get(asset.object_key);
  if (!object) throw new ClientError("The public profile image could not be found.", 404, "public_avatar_object_missing");
  return binaryResponse(
    request,
    new Uint8Array(await object.arrayBuffer()),
    asset.media_type,
    null,
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}

async function savePublicProfilePresentation(request, env, input) {
  const session = await requireCivicSession(request, env);
  const civicTitle = cleanText(input.civicTitle, 100, false);
  const publicBio = cleanLongText(input.publicBio, 3_500, false);
  const profileVisibility = cleanText(input.profileVisibility, 16);
  if (!["private", "civic", "public"].includes(profileVisibility)) {
    throw new ClientError("Choose private, civic, or public profile visibility.", 400, "profile_visibility_invalid");
  }
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE civic_profiles
    SET civic_title = ?2, public_bio = ?3, profile_visibility = ?4, updated_at = ?5
    WHERE civic_id = ?1
  `).bind(session.civic_id, civicTitle || null, publicBio, profileVisibility, now).run();
  return {
    civicTitle: civicTitle || null,
    publicBio,
    profileVisibility,
    updatedAt: now,
  };
}

async function contributionPositions(env) {
  const result = await env.DB.prepare(`
    SELECT p.position_id, p.title, p.sector_key, p.description, p.base_ccu_micros,
           p.sep_multiplier_millis, p.capacity_required, p.status, p.public_summary,
           p.available_slots, p.qualification_summary
    FROM contribution_positions p
    WHERE p.status = 'open'
      AND p.available_slots > (
        SELECT COUNT(*) FROM contribution_assignments a
        WHERE a.position_id = p.position_id
          AND a.status IN ('accepted', 'active', 'submitted', 'affirmed')
      )
    ORDER BY sector_key, title
  `).all();
  return (result.results || []).map(publicPosition);
}

function aiUsageDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function aiResetAt(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
  )).toISOString();
}

async function aiAllowanceStatus(env, date = new Date()) {
  const usageDate = aiUsageDate(date);
  const row = await env.DB.prepare(`
    SELECT * FROM ai_usage_daily WHERE usage_date = ?1 LIMIT 1
  `).bind(usageDate).first();
  const used = Math.max(0, Number(row?.estimated_neurons || 0));
  const protectiveRemaining = Math.max(0, AI_PROTECTIVE_LIMIT - used);
  return {
    provider: "Cloudflare Workers AI",
    model: LEARNING_AI_MODEL,
    portraitModel: PORTRAIT_AI_MODEL,
    configured: Boolean(env.AI),
    available: Boolean(env.AI) && protectiveRemaining >= AI_PREFLIGHT_ESTIMATE,
    portraitAvailable: Boolean(env.AI) && protectiveRemaining >= AI_PORTRAIT_ESTIMATE,
    portraitEstimate: AI_PORTRAIT_ESTIMATE,
    dailyLimit: AI_DAILY_ALLOWANCE,
    protectiveLimit: AI_PROTECTIVE_LIMIT,
    used: Math.round(used * 100) / 100,
    remaining: Math.round(Math.max(0, AI_DAILY_ALLOWANCE - used) * 100) / 100,
    protectiveRemaining: Math.round(protectiveRemaining * 100) / 100,
    percentUsed: Math.min(100, Math.round((used / AI_PROTECTIVE_LIMIT) * 10_000) / 100),
    requestCount: Number(row?.request_count || 0),
    conversionCount: Number(row?.conversion_count || 0),
    resetAt: aiResetAt(date),
    scopeNote: "Estimated Learning and portrait use recorded by this Worker; other Cloudflare AI use is not visible here.",
  };
}

async function recordAiUsage(env, {
  modelName = LEARNING_AI_MODEL,
  requestCount = 0,
  conversionCount = 0,
  promptTokens = 0,
  completionTokens = 0,
  estimatedNeurons = 0,
}) {
  const now = new Date();
  await env.DB.prepare(`
    INSERT INTO ai_usage_daily (
      usage_date, provider, model_name, request_count, conversion_count,
      prompt_tokens, completion_tokens, estimated_neurons, updated_at
    ) VALUES (?1, 'cloudflare-workers-ai', ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    ON CONFLICT(usage_date) DO UPDATE SET
      model_name = CASE
        WHEN ai_usage_daily.model_name = excluded.model_name THEN excluded.model_name
        ELSE 'mixed'
      END,
      request_count = ai_usage_daily.request_count + excluded.request_count,
      conversion_count = ai_usage_daily.conversion_count + excluded.conversion_count,
      prompt_tokens = ai_usage_daily.prompt_tokens + excluded.prompt_tokens,
      completion_tokens = ai_usage_daily.completion_tokens + excluded.completion_tokens,
      estimated_neurons = ai_usage_daily.estimated_neurons + excluded.estimated_neurons,
      updated_at = excluded.updated_at
  `).bind(
    aiUsageDate(now),
    modelName,
    requestCount,
    conversionCount,
    Math.max(0, Math.round(promptTokens)),
    Math.max(0, Math.round(completionTokens)),
    Math.max(0, estimatedNeurons),
    now.toISOString(),
  ).run();
}

async function recordAiAccountLimit(env) {
  const now = new Date();
  await env.DB.prepare(`
    INSERT INTO ai_usage_daily (
      usage_date, provider, model_name, request_count, conversion_count,
      prompt_tokens, completion_tokens, estimated_neurons, updated_at
    ) VALUES (?1, 'cloudflare-workers-ai', 'account-limit', 0, 0, 0, 0, ?2, ?3)
    ON CONFLICT(usage_date) DO UPDATE SET
      model_name = 'account-limit',
      estimated_neurons = MAX(ai_usage_daily.estimated_neurons, excluded.estimated_neurons),
      updated_at = excluded.updated_at
  `).bind(aiUsageDate(now), AI_PROTECTIVE_LIMIT, now.toISOString()).run();
}

async function portalSnapshot(env, civicId) {
  const profile = await civicProfile(env, civicId);
  if (!profile) throw new ClientError("This local civic profile could not be found.", 404, "profile_not_found");

  const [
    learning, assignments, account, transactions, valueFlows, residence, requests, harms, ledger,
    certificate, evaluations, qScores, goals, courses, enrollments, recommendations, documents,
    healingTimeline, prescriptions, appointments, findings, restorations, indicators, ftb,
    livePopulation, balanceScenario, balanceResources, ftbMetrics, ftbAdjustments,
    aiAllowance,
  ] = await Promise.all([
    env.DB.prepare(`
      SELECT record_id, tier_key, pathway_label, status, began_at, completed_at, updated_at
      FROM learning_records WHERE civic_id = ?1 ORDER BY updated_at DESC
    `).bind(civicId).all(),
    env.DB.prepare(`
      SELECT a.*, p.title, p.sector_key, p.base_ccu_micros, p.sep_multiplier_millis,
             COALESCE((SELECT SUM(t.minutes) FROM contribution_time_entries t
               WHERE t.assignment_id = a.assignment_id AND t.status != 'returned'), 0) AS recorded_minutes
      FROM contribution_assignments a
      JOIN contribution_positions p ON p.position_id = a.position_id
      WHERE a.civic_id = ?1 ORDER BY a.created_at DESC
    `).bind(civicId).all(),
    env.DB.prepare("SELECT balance_micros, updated_at FROM ccu_accounts WHERE civic_id = ?1 LIMIT 1").bind(civicId).first(),
    env.DB.prepare(`
      SELECT transaction_id, assignment_id, transaction_type, amount_micros,
             balance_after_micros, description, created_at
      FROM ccu_transactions WHERE civic_id = ?1 ORDER BY created_at DESC LIMIT 24
    `).bind(civicId).all(),
    env.DB.prepare(`
      SELECT * FROM civic_value_flows WHERE civic_id = ?1 ORDER BY occurred_at DESC LIMIT 24
    `).bind(civicId).all(),
    env.DB.prepare(`
      SELECT r.residence_id, r.label, r.capacity, r.occupied, r.accessibility_json,
             r.status, ra.began_at, ra.status AS assignment_status
      FROM residence_assignments ra
      JOIN residences r ON r.residence_id = ra.residence_id
      WHERE ra.civic_id = ?1 AND ra.status = 'active' LIMIT 1
    `).bind(civicId).first(),
    env.DB.prepare(`
      SELECT request_id, request_type, circle_key, status, public_summary,
             decision_summary, created_at, updated_at, decided_at
      FROM civic_requests WHERE civic_id = ?1 ORDER BY created_at DESC LIMIT 24
    `).bind(civicId).all(),
    env.DB.prepare(`
      SELECT harm_id, privacy_level, public_summary, status, created_at, updated_at, resolved_at,
             CASE WHEN reporting_civic_id = ?1 THEN 'reported-by-citizen' ELSE 'reported-about-citizen' END AS relationship
      FROM harms WHERE reporting_civic_id = ?1 OR responding_civic_id = ?1
      ORDER BY created_at DESC LIMIT 24
    `).bind(civicId).all(),
    env.DB.prepare("SELECT * FROM ledger_entries WHERE subject_ref = ?1 ORDER BY seq DESC LIMIT 24").bind(civicId).all(),
    env.DB.prepare(`
      SELECT civic_name, certificate_number, standing, assessment_score,
             utopian_joined_date, gregorian_joined_date, joined_at, source_label
      FROM citizens WHERE civic_id = ?1 LIMIT 1
    `).bind(civicId).first(),
    env.DB.prepare("SELECT * FROM learning_evaluations WHERE civic_id = ?1 ORDER BY created_at DESC").bind(civicId).all(),
    env.DB.prepare("SELECT * FROM learning_q_scores WHERE civic_id = ?1 ORDER BY created_at DESC").bind(civicId).all(),
    env.DB.prepare("SELECT * FROM learning_goals WHERE civic_id = ?1 ORDER BY updated_at DESC").bind(civicId).all(),
    env.DB.prepare("SELECT * FROM usu_courses WHERE status = 'available' ORDER BY code").all(),
    env.DB.prepare(`
      SELECT e.*, c.code, c.title FROM usu_enrollments e JOIN usu_courses c ON c.course_id = e.course_id
      WHERE e.civic_id = ?1 ORDER BY e.updated_at DESC
    `).bind(civicId).all(),
    env.DB.prepare(`
      SELECT r.*, c.code, c.title FROM learning_recommendations r
      JOIN usu_courses c ON c.course_id = r.course_id
      WHERE r.civic_id = ?1 ORDER BY r.created_at DESC
    `).bind(civicId).all(),
    env.DB.prepare(`
      SELECT d.document_id, d.record_domain, d.consent_scope, d.retention_status, d.created_at,
             d.source_document_id, d.derivation_method, d.review_status, d.reviewed_at,
             d.extraction_confidence,
             m.original_name, m.media_type, m.byte_size
      FROM protected_documents d JOIN civic_media_assets m ON m.asset_id = d.asset_id
      WHERE d.civic_id = ?1 AND d.retention_status != 'deleted' ORDER BY d.created_at DESC
    `).bind(civicId).all(),
    env.DB.prepare("SELECT * FROM healing_timeline WHERE civic_id = ?1 ORDER BY occurred_on DESC").bind(civicId).all(),
    env.DB.prepare("SELECT * FROM healing_prescriptions WHERE civic_id = ?1 ORDER BY prescribed_on DESC").bind(civicId).all(),
    env.DB.prepare("SELECT * FROM healing_appointment_requests WHERE civic_id = ?1 ORDER BY created_at DESC").bind(civicId).all(),
    env.DB.prepare("SELECT * FROM harmony_findings WHERE civic_id = ?1 ORDER BY recorded_at DESC").bind(civicId).all(),
    env.DB.prepare("SELECT * FROM restoration_requirements WHERE civic_id = ?1 ORDER BY created_at DESC").bind(civicId).all(),
    env.DB.prepare("SELECT * FROM balance_indicators ORDER BY domain_key, label").all(),
    env.DB.prepare("SELECT * FROM ftb_snapshots ORDER BY measured_at DESC LIMIT 1").first(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM citizens WHERE standing = 'active'").first(),
    env.DB.prepare(`
      SELECT * FROM balance_simulation_scenarios
      WHERE status = 'illustrative'
      ORDER BY simulated_at DESC LIMIT 1
    `).first(),
    env.DB.prepare(`
      SELECT metric.*
      FROM balance_resource_metrics metric
      WHERE metric.scenario_id = (
        SELECT scenario_id FROM balance_simulation_scenarios
        WHERE status = 'illustrative'
        ORDER BY simulated_at DESC LIMIT 1
      )
      ORDER BY metric.sort_order, metric.label
    `).all(),
    env.DB.prepare(`
      SELECT metric.*
      FROM ftb_trade_metrics metric
      WHERE metric.snapshot_id = (
        SELECT snapshot_id FROM ftb_snapshots ORDER BY measured_at DESC LIMIT 1
      )
      ORDER BY metric.sort_order, metric.label
    `).all(),
    env.DB.prepare(`
      SELECT adjustment.*
      FROM ftb_product_adjustments adjustment
      WHERE adjustment.snapshot_id = (
        SELECT snapshot_id FROM ftb_snapshots ORDER BY measured_at DESC LIMIT 1
      )
      ORDER BY adjustment.sort_order, adjustment.product_label
    `).all(),
    aiAllowanceStatus(env),
  ]);
  const [
    evidenceContracts, learningObservations, learningProfileVersions,
    learningChallenges, learningSubdomains,
  ] = await Promise.all([
    env.DB.prepare(`
      SELECT * FROM learning_evidence_contracts
      WHERE civic_id = ?1 AND status = 'accepted'
      ORDER BY document_id, contract_version DESC
    `).bind(civicId).all(),
    env.DB.prepare(`
      SELECT o.*, e.status AS evaluation_status
      FROM learning_observations o
      JOIN learning_evaluations e ON e.evaluation_id = o.evaluation_id
      WHERE o.civic_id = ?1 ORDER BY o.created_at, o.observation_id
    `).bind(civicId).all(),
    env.DB.prepare(`
      SELECT * FROM learning_profile_versions
      WHERE civic_id = ?1 ORDER BY version_number DESC LIMIT 12
    `).bind(civicId).all(),
    env.DB.prepare(`
      SELECT * FROM learning_challenges
      WHERE civic_id = ?1 ORDER BY created_at DESC
    `).bind(civicId).all(),
    env.DB.prepare(`
      SELECT * FROM learning_q_subdomains
      WHERE policy_version = ?1 ORDER BY q_key, sort_order
    `).bind(LEARNING_POLICY_VERSION).all(),
  ]);
  const publicObservations = (learningObservations.results || []).map(publicLearningObservation);
  const latestContracts = [];
  const seenContractDocuments = new Set();
  for (const row of evidenceContracts.results || []) {
    if (seenContractDocuments.has(row.document_id)) continue;
    seenContractDocuments.add(row.document_id);
    latestContracts.push(publicLearningContract(row));
  }
  const equityProfileScores = publicObservations.length
    ? synthesizeLearningEquityProfile(publicObservations)
    : synthesizeLearningProfile(qScores.results || []);

  return {
    localSimulation: isLocalV3(env),
    persistence: isLocalV3(env) ? "isolated local D1 and encrypted local R2" : "production D1 and encrypted R2",
    aiAllowance,
    profile: {
      civicId: profile.civic_id,
      civicName: profile.civic_name,
      civicTitle: profile.civic_title,
      publicBio: profile.public_bio,
      hasAvatar: Boolean(profile.avatar_asset_id),
      immigrationStanding: profile.immigration_standing,
      learningTier: profile.learning_tier,
      contributionStatus: profile.contribution_status,
      residenceStatus: profile.residence_status,
      profileVisibility: profile.profile_visibility,
      updatedAt: profile.updated_at,
    },
    certificate: certificate ? {
      civicName: certificate.civic_name,
      serial: certificate.certificate_number,
      standing: certificate.standing,
      score: Number(certificate.assessment_score),
      utopianDate: certificate.utopian_joined_date,
      gregorianDate: certificate.gregorian_joined_date,
      issuedAt: certificate.joined_at,
      sourceLabel: certificate.source_label,
    } : null,
    learning: {
      records: learning.results || [],
      evaluations: evaluations.results || [],
      qScores: qScores.results || [],
      profileScores: equityProfileScores,
      goals: goals.results || [],
      recommendations: recommendations.results || [],
      documents: (documents.results || []).filter((row) => row.record_domain === "learning"),
      evidenceContracts: latestContracts,
      observations: publicObservations,
      profileVersions: (learningProfileVersions.results || []).map((row) => ({
        profileVersionId: row.profile_version_id,
        versionNumber: Number(row.version_number),
        evaluatorVersion: row.evaluator_version,
        policyVersion: row.policy_version,
        evidenceSetHash: row.evidence_set_hash,
        summary: row.summary,
        profile: parseStoredJson(row.profile_json, []),
        createdAt: row.created_at,
      })),
      challenges: learningChallenges.results || [],
      subdomains: learningSubdomains.results || [],
      policyVersion: LEARNING_POLICY_VERSION,
      evaluatorVersion: LEARNING_EVALUATOR_VERSION,
    },
    usu: {
      courses: courses.results || [],
      enrollments: enrollments.results || [],
    },
    contribution: {
      assignments: (assignments.results || []).map(publicAssignment),
      openPositions: await contributionPositions(env),
    },
    ccu: {
      balance: ccuFromMicros(account?.balance_micros),
      updatedAt: account?.updated_at || null,
      flows: (valueFlows.results || []).map((row) => ({
        flowId: row.flow_id,
        type: row.flow_type,
        amount: ccuFromMicros(row.amount_micros),
        balanceAfter: ccuFromMicros(row.balance_after_micros),
        source: row.source_label,
        purpose: row.purpose,
        utopianDate: row.utopian_date,
        occurredAt: row.occurred_at,
      })),
      transactions: (transactions.results || []).map((row) => ({
        transactionId: row.transaction_id,
        assignmentId: row.assignment_id,
        type: row.transaction_type,
        amount: ccuFromMicros(row.amount_micros),
        balanceAfter: ccuFromMicros(row.balance_after_micros),
        description: row.description,
        createdAt: row.created_at,
      })),
    },
    residence: residence ? {
      residenceId: residence.residence_id,
      label: residence.label,
      capacity: Number(residence.capacity),
      occupied: Number(residence.occupied),
      accessibility: parseStoredJson(residence.accessibility_json, []),
      status: residence.status,
      beganAt: residence.began_at,
    } : null,
    requests: requests.results || [],
    harmony: {
      harms: harms.results || [],
      findings: findings.results || [],
      restoration: restorations.results || [],
      documents: (documents.results || []).filter((row) => row.record_domain === "harmony"),
    },
    healing: {
      timeline: healingTimeline.results || [],
      prescriptions: prescriptions.results || [],
      appointments: appointments.results || [],
      documents: (documents.results || []).filter((row) => row.record_domain === "healing"),
    },
    balance: {
      livePopulation: Number(livePopulation?.total || 0),
      scenario: balanceScenario || null,
      resources: (balanceResources.results || []).map((resource) => ({
        ...resource,
        history: parseStoredJson(resource.history_json, []),
        history_json: undefined,
      })),
      indicators: indicators.results || [],
    },
    ftb: ftb ? {
      ...ftb,
      simulated: true,
      importSummary: parseStoredJson(ftb.import_summary_json, []),
      exportSummary: parseStoredJson(ftb.export_summary_json, []),
      import_summary_json: undefined,
      export_summary_json: undefined,
      metrics: ftbMetrics.results || [],
      adjustments: (ftbAdjustments.results || []).map((adjustment) => ({
        ...adjustment,
        final_ccu: ccuFromMicros(adjustment.final_ccu_micros),
      })),
    } : null,
    ledger: (ledger.results || []).map(publicEntry),
  };
}

async function acceptContributionAssignment(request, env, input) {
  const session = await requireCivicSession(request, env);
  const civicId = session.civic_id;
  const positionId = cleanText(input.positionId, 80);
  const idempotencyKey = cleanText(input.idempotencyKey, 100);
  const assignmentId = `USA-${(await digest(`accept:${civicId}:${positionId}:${idempotencyKey}`)).slice(0, 32)}`;
  const existing = await env.DB.prepare(`
    SELECT a.*, p.title, p.sector_key, p.base_ccu_micros, p.sep_multiplier_millis
    FROM contribution_assignments a JOIN contribution_positions p ON p.position_id = a.position_id
    WHERE a.assignment_id = ?1 LIMIT 1
  `).bind(assignmentId).first();
  if (existing) return { created: false, assignment: publicAssignment(existing) };

  const [profile, position] = await Promise.all([
    civicProfile(env, civicId),
    env.DB.prepare("SELECT * FROM contribution_positions WHERE position_id = ?1 AND status = 'open' LIMIT 1").bind(positionId).first(),
  ]);
  if (!profile) throw new ClientError("This local civic profile could not be found.", 404, "profile_not_found");
  if (!position) throw new ClientError("This contribution opening is no longer available.", 404, "position_not_found");

  const now = new Date();
  const event = await prepareEntry(env, {
    eventKey: `v3-local:${assignmentId}:accepted`,
    eventType: "contribution_assignment_accepted",
    category: "contribution",
    title: `${profile.civic_name} accepted ${position.title}`,
    summary: `${profile.civic_name} voluntarily accepted the local demonstration assignment “${position.title}.”`,
    actorName: profile.civic_name,
    subjectName: profile.civic_name,
    subjectRef: civicId,
    occurredAt: now.toISOString(),
    utopianDate: formatUtopianDate(now),
    gregorianDate: formatGregorianDate(now),
    sourceLabel: "Civic Portal · Contribution pathway",
    sourceUrl: civicPageUrl(request, env, "/portal"),
    metadata: { assignmentId, positionId, stage: "accepted", localSimulation: isLocalV3(env) },
  });
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO contribution_assignments (
        assignment_id, civic_id, position_id, status, accepted_at, created_at, updated_at
      ) VALUES (?1, ?2, ?3, 'accepted', ?4, ?4, ?4)
    `).bind(assignmentId, civicId, positionId, now.toISOString()),
    env.DB.prepare("UPDATE civic_profiles SET contribution_status = ?2, updated_at = ?3 WHERE civic_id = ?1")
      .bind(civicId, `accepted · ${position.title}`, now.toISOString()),
    event.statement,
  ]);
  const row = await env.DB.prepare(`
    SELECT a.*, p.title, p.sector_key, p.base_ccu_micros, p.sep_multiplier_millis
    FROM contribution_assignments a JOIN contribution_positions p ON p.position_id = a.position_id
    WHERE a.assignment_id = ?1 LIMIT 1
  `).bind(assignmentId).first();
  return { created: true, assignment: publicAssignment(row) };
}

async function submitContributionAssignment(request, env, assignmentId, input) {
  const session = await requireCivicSession(request, env);
  const civicId = session.civic_id;
  const evidenceSummary = cleanText(input.evidenceSummary, 1200);
  const assignment = await env.DB.prepare(`
    SELECT a.*, p.title, p.position_id,
      COALESCE((SELECT SUM(t.minutes) FROM contribution_time_entries t
        WHERE t.assignment_id = a.assignment_id AND t.status != 'returned'), 0) AS recorded_minutes
    FROM contribution_assignments a
    JOIN contribution_positions p ON p.position_id = a.position_id
    WHERE a.assignment_id = ?1 AND a.civic_id = ?2 LIMIT 1
  `).bind(assignmentId, civicId).first();
  if (!assignment) throw new ClientError("This contribution assignment could not be found.", 404, "assignment_not_found");
  if (["submitted", "affirmed", "completed"].includes(assignment.status)) {
    return { created: false, status: assignment.status };
  }
  if (!["accepted", "active"].includes(assignment.status)) {
    throw new ClientError("This assignment is not ready for submission.", 409, "assignment_not_ready");
  }
  if (Number(assignment.recorded_minutes || 0) < 1) {
    throw new ClientError("Record the time actually contributed before submitting evidence.", 409, "time_entry_required");
  }
  const profile = await civicProfile(env, civicId);
  const now = new Date();
  const event = await prepareEntry(env, {
    eventKey: `v3-local:${assignmentId}:submitted`,
    eventType: "contribution_evidence_submitted",
    category: "contribution",
    title: `Evidence submitted for ${assignment.title}`,
    summary: evidenceSummary,
    actorName: profile.civic_name,
    subjectName: profile.civic_name,
    subjectRef: civicId,
    occurredAt: now.toISOString(),
    utopianDate: formatUtopianDate(now),
    gregorianDate: formatGregorianDate(now),
    sourceLabel: "Civic Portal · Contribution pathway",
    sourceUrl: civicPageUrl(request, env, "/portal"),
    metadata: { assignmentId, positionId: assignment.position_id, stage: "submitted", localSimulation: isLocalV3(env) },
  });
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE contribution_assignments
      SET status = 'submitted', evidence_summary = ?2, submitted_at = ?3, updated_at = ?3
      WHERE assignment_id = ?1
    `).bind(assignmentId, evidenceSummary, now.toISOString()),
    env.DB.prepare("UPDATE civic_profiles SET contribution_status = ?2, updated_at = ?3 WHERE civic_id = ?1")
      .bind(civicId, `awaiting affirmation · ${assignment.title}`, now.toISOString()),
    event.statement,
  ]);
  return { created: true, status: "submitted" };
}

async function recordContributionTime(request, env, assignmentId, input) {
  const session = await requireCivicSession(request, env);
  const minutes = Number(input.minutes);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
    throw new ClientError("Record between 1 minute and 24 hours in a single time entry.", 400, "time_invalid");
  }
  const workDate = cleanText(input.workDate, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
    throw new ClientError("Use an ISO calendar date for the private time record.", 400, "work_date_invalid");
  }
  const description = cleanText(input.description, 600);
  const assignment = await env.DB.prepare(`
    SELECT a.assignment_id, a.status, p.title
    FROM contribution_assignments a JOIN contribution_positions p ON p.position_id = a.position_id
    WHERE a.assignment_id = ?1 AND a.civic_id = ?2 LIMIT 1
  `).bind(assignmentId, session.civic_id).first();
  if (!assignment) throw new ClientError("This contribution assignment could not be found.", 404, "assignment_not_found");
  if (!["accepted", "active"].includes(assignment.status)) {
    throw new ClientError("Time can be recorded only while an assignment is active.", 409, "assignment_not_active");
  }
  const now = new Date().toISOString();
  const entryId = `USTE-${crypto.randomUUID()}`;
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO contribution_time_entries (
        time_entry_id, assignment_id, civic_id, minutes, work_date,
        description, status, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'recorded', ?7)
    `).bind(entryId, assignmentId, session.civic_id, minutes, workDate, description, now),
    env.DB.prepare(`
      UPDATE contribution_assignments SET status = 'active', updated_at = ?2
      WHERE assignment_id = ?1 AND status = 'accepted'
    `).bind(assignmentId, now),
  ]);
  const total = await env.DB.prepare(`
    SELECT COALESCE(SUM(minutes), 0) AS total_minutes
    FROM contribution_time_entries
    WHERE assignment_id = ?1 AND status != 'returned'
  `).bind(assignmentId).first();
  return {
    created: true,
    timeEntryId: entryId,
    minutes,
    recordedHours: Number(total?.total_minutes || 0) / 60,
    title: assignment.title,
  };
}

const LEARNING_Q_KEYS = new Set([
  "intellectual", "emotional", "social", "creative", "adaptability",
  "moral", "physical", "natural", "technological", "learning",
]);

const LEARNING_Q_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    qScores: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          qKey: { type: "string", enum: [...LEARNING_Q_KEYS] },
          score: { type: "integer", minimum: 0, maximum: 100 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidenceKind: {
            type: "string",
            enum: [
              "standardized_assessment", "formal_academic", "occupational_history",
              "authored_work", "observed_behavior", "self_report", "contextual", "insufficient",
            ],
          },
          temporalContext: {
            type: "string",
            enum: ["adult_current", "adult_historical", "adolescent", "childhood", "undated"],
          },
          evidenceWeight: { type: "number", minimum: 0, maximum: 1 },
          interpretiveBasis: { type: "string" },
          evidenceSummary: { type: "string" },
          evidenceCitations: {
            type: "array",
            items: { type: "string" },
            maxItems: 8,
          },
        },
        required: [
          "qKey", "score", "confidence", "evidenceKind", "temporalContext",
          "evidenceWeight", "interpretiveBasis", "evidenceSummary", "evidenceCitations",
        ],
        additionalProperties: false,
      },
    },
    recommendations: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          courseId: { type: "string" },
          type: {
            type: "string",
            enum: ["strengthening", "advancement", "goal_based", "exploration", "prerequisite_bridge"],
          },
          rationale: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["courseId", "type", "rationale", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "confidence", "qScores", "recommendations"],
  additionalProperties: false,
};

function boundedLearningNumber(value, minimum, maximum, fallback = minimum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

const LEARNING_EVIDENCE_KINDS = new Set([
  "standardized_assessment", "formal_academic", "occupational_history",
  "authored_work", "observed_behavior", "self_report", "contextual", "insufficient",
]);

const LEARNING_TEMPORAL_CONTEXTS = new Set([
  "adult_current", "adult_historical", "adolescent", "childhood", "undated",
]);

const LEARNING_KIND_FACTORS = {
  standardized_assessment: 1,
  formal_academic: 0.85,
  occupational_history: 0.8,
  authored_work: 0.75,
  observed_behavior: 0.7,
  self_report: 0.5,
  contextual: 0.35,
  insufficient: 0,
};

const LEARNING_TIME_FACTORS = {
  adult_current: 1,
  adult_historical: 0.9,
  adolescent: 0.65,
  childhood: 0.4,
  undated: 0.6,
};

const LEARNING_NONSCORING_CLINICAL_PATTERN = /\b(?:CAARS|MMPI|MCMI|SRS|ADOS|IVA-?2|DSM|ADHD|autis(?:m|tic)|diagnos(?:is|ed|tic)|depress(?:ion|ive)|anxiety|trauma|clinical|treatment|therapy|psychotherap(?:y|ist)|psychiatr(?:y|ic|ist)|psychological|personality disorder)\b/i;

function reportedPercentile(value) {
  const text = typeof value === "string" ? value : "";
  const outOfHundred = text.match(/(?:higher|better)\s+than\s+(?:approximately\s+)?(\d{1,3})\s+out\s+of\s+100/i);
  const percentile = text.match(/\b(\d{1,3})(?:st|nd|rd|th)?\s+percentile\b/i);
  const result = Number(outOfHundred?.[1] || percentile?.[1]);
  return Number.isFinite(result) && result >= 0 && result <= 100 ? result : null;
}

function safeguardLearningScore(score) {
  const combinedEvidence = [
    score?.interpretiveBasis,
    score?.evidenceSummary,
    ...(Array.isArray(score?.evidenceCitations) ? score.evidenceCitations : []),
  ].filter(Boolean).join(" ");
  const qKey = score?.qKey;
  const evidenceKind = LEARNING_EVIDENCE_KINDS.has(score?.evidenceKind)
    ? score.evidenceKind
    : "insufficient";
  const clinicalOnly = LEARNING_NONSCORING_CLINICAL_PATTERN.test(combinedEvidence)
    && !/\bWAIS(?:-IV)?\b/i.test(combinedEvidence);
  if (clinicalOnly) {
    return {
      ...score,
      score: 50,
      confidence: 0,
      evidenceKind: "insufficient",
      evidenceWeight: 0,
      interpretiveBasis: "Clinical context excluded from Ten-Q scoring",
      evidenceSummary: "This material may provide care context, but it cannot raise or lower a Ten-Q score.",
      evidenceCitations: [],
    };
  }
  if (evidenceKind === "standardized_assessment") {
    const percentile = reportedPercentile(combinedEvidence);
    if (percentile !== null) {
      return {
        ...score,
        score: percentile,
        interpretiveBasis: `${boundedGeneratedText(score?.interpretiveBasis, 700)}; reported percentile used as the transparent Ten-Q evidence anchor`,
      };
    }
  }
  if (qKey === "moral" && !["authored_work", "observed_behavior", "occupational_history"].includes(evidenceKind)) {
    return {
      ...score,
      score: 50,
      confidence: 0,
      evidenceKind: "insufficient",
      evidenceWeight: 0,
      interpretiveBasis: "No direct ethical reasoning or conduct evidence",
      evidenceSummary: "Moral Q cannot be inferred from diagnosis, legal history, hardship, or general self-report.",
      evidenceCitations: [],
    };
  }
  return score;
}

function standardizedMetricNear(text, metricPattern) {
  if (typeof text !== "string") return { standardScore: null, percentile: null };
  for (const match of text.matchAll(metricPattern)) {
    const nearby = text.slice(match.index, match.index + 900);
    const compositeTable = nearby.match(
      /^(?:[^0-9]{0,30})(\d{2,3})\s+(\d{1,3})\s+\d{2,3}\s*[-–]\s*\d{2,3}\b/,
    );
    const tableStandardScore = Number(compositeTable?.[1]);
    const tablePercentile = Number(compositeTable?.[2]);
    if (
      Number.isFinite(tableStandardScore) && tableStandardScore >= 0 && tableStandardScore <= 200
      && Number.isFinite(tablePercentile) && tablePercentile >= 0 && tablePercentile <= 100
    ) {
      return { standardScore: tableStandardScore, percentile: tablePercentile };
    }
    const percentile = reportedPercentile(nearby);
    const narrativeStandardScore = Number(
      nearby.match(/\bscore\s+(?:is|of)\s+(\d{2,3})\b/i)?.[1],
    );
    if (percentile !== null) {
      return {
        standardScore: Number.isFinite(narrativeStandardScore) ? narrativeStandardScore : null,
        percentile,
      };
    }
  }
  return { standardScore: null, percentile: null };
}

function defaultLearningDomainLabel(evidenceKind) {
  return {
    standardized_assessment: "standardized learning-related measure",
    formal_academic: "formal academic performance",
    occupational_history: "applied workplace learning",
    authored_work: "self-directed knowledge integration",
    observed_behavior: "observed skill acquisition and transfer",
    self_report: "self-reported learning experience",
    contextual: "contextual learning evidence",
    insufficient: "",
  }[evidenceKind] || "unspecified learning domain";
}

function finalizeLearningAssessment(assessment, evidenceText) {
  const byKey = new Map(assessment.qScores.map((score) => [score.qKey, score]));
  const fsiq = standardizedMetricNear(
    evidenceText,
    /(?:Full\s+Scale(?:\s+IQ)?\s*\(?(?:FSIQ)\)?|\bFSIQ\b)/gi,
  );
  const vci = standardizedMetricNear(
    evidenceText,
    /(?:Verbal\s+Comprehension(?:\s+Index)?\s*\(?(?:VCI)\)?|\bVCI\b)/gi,
  );
  if (fsiq.percentile !== null) {
    byKey.set("intellectual", {
      qKey: "intellectual",
      score: fsiq.percentile,
      confidence: 0.9,
      evidenceKind: "standardized_assessment",
      temporalContext: "adult_historical",
      evidenceWeight: 1,
      interpretiveBasis: "Reported adult FSIQ percentile used as a normalized Intellectual Q estimate",
      evidenceSummary: `The selected assessment reports FSIQ standard score ${fsiq.standardScore ?? "not captured"} at percentile ${fsiq.percentile}.`,
      evidenceCitations: [`Selected assessment: FSIQ standard score ${fsiq.standardScore ?? "not captured"}; percentile ${fsiq.percentile}.`],
      reportedStandardScore: fsiq.standardScore,
      reportedPercentile: fsiq.percentile,
      normalizedEstimateMethod: "Direct percentile anchoring: normative percentile is used as the provisional 0-100 Ten-Q estimate; it is not the WAIS standard score and does not imply construct equivalence.",
      domainScope: "broad",
      domainLabel: "general intellectual functioning",
    });
  }
  if (vci.percentile !== null) {
    byKey.set("learning", {
      qKey: "learning",
      score: vci.percentile,
      confidence: 0.6,
      evidenceKind: "standardized_assessment",
      temporalContext: "adult_historical",
      evidenceWeight: 0.65,
      interpretiveBasis: "Reported adult VCI percentile used only as a verbal-conceptual Learning observation",
      evidenceSummary: `The selected assessment reports VCI standard score ${vci.standardScore ?? "not captured"} at percentile ${vci.percentile}; this supports verbal-conceptual learning and knowledge integration, not broad Learning Q.`,
      evidenceCitations: [`Selected assessment: VCI standard score ${vci.standardScore ?? "not captured"}; percentile ${vci.percentile}.`],
      reportedStandardScore: vci.standardScore,
      reportedPercentile: vci.percentile,
      normalizedEstimateMethod: "Domain-limited percentile anchoring: the VCI percentile is preserved as a verbal-conceptual observation and is not treated as a complete Learning Q.",
      domainScope: "domain_limited",
      domainLabel: "verbal-conceptual learning and knowledge integration",
    });
  }

  const qScores = [...LEARNING_Q_KEYS].map((qKey) => byKey.get(qKey));
  const supported = qScores.filter(
    (score) => score.confidence > 0 && score.evidenceWeight > 0 && score.evidenceKind !== "insufficient",
  );
  const supportedByKey = new Map(supported.map((score) => [score.qKey, score]));
  const broadSupported = supported.filter((score) => score.domainScope !== "domain_limited");
  const pendingCount = LEARNING_Q_KEYS.size - broadSupported.length;
  const supportedText = supported.map(
    (score) => score.domainScope === "domain_limited"
      ? `${score.domainLabel || "domain-limited learning"} observation at ${score.score}`
      : `${score.qKey[0].toUpperCase()}${score.qKey.slice(1)} Q at ${score.score}`,
  ).join(", ");
  const summary = supported.length
    ? `This assessment added partial evidence for ${supportedText}. ${pendingCount} Q${pendingCount === 1 ? "" : "s"} remain pending; pending is not a finding of low ability. Clinical diagnoses, symptoms, hardship, and legal history were excluded from scoring.`
    : "The selected evidence did not add a supported Ten-Q observation. Pending is not a finding of low ability.";
  const disallowedRecommendationPattern = /\b(?:difficult|deficit|disorder|symptom|attention|regulat(?:e|ion)|social interaction|diagnos|impair|weakness)\b/i;
  const recommendedQKeys = new Set();
  const recommendations = assessment.recommendations.flatMap((recommendation) => {
    const rationale = String(recommendation.rationale || "");
    if (disallowedRecommendationPattern.test(rationale)) return [];
    const qKey = [...supportedByKey.keys()].find((key) => new RegExp(`\\b${key}\\b`, "i").test(rationale));
    if (!qKey || recommendedQKeys.has(qKey)) return [];
    recommendedQKeys.add(qKey);
    const score = supportedByKey.get(qKey);
    const supportedLabel = score.domainScope === "domain_limited"
      ? `${score.domainLabel || "domain-limited learning"} observation`
      : `${qKey[0].toUpperCase()}${qKey.slice(1)} Q`;
    return [{
      ...recommendation,
      rationale: `Current accepted evidence supports a ${supportedLabel} at ${score.score}. This course is an optional next step, not a finding of deficiency or an obligation.`,
      confidence: Math.min(Number(recommendation.confidence) || 0, Number(score.confidence)),
    }];
  });
  const confidence = supported.length
    ? supported.reduce((sum, score) => sum + Number(score.confidence), 0) / supported.length
    : 0;
  return {
    ...assessment,
    summary,
    confidence,
    qScores,
    recommendations,
  };
}

function synthesizeLearningProfile(rows) {
  return [...LEARNING_Q_KEYS].map((qKey) => {
    const observations = (rows || [])
      .filter((row) => row.q_key === qKey && Number(row.confidence) > 0 && Number(row.evidence_weight) > 0)
      .map((row) => {
        const evidenceKind = LEARNING_EVIDENCE_KINDS.has(row.evidence_kind)
          ? row.evidence_kind
          : "contextual";
        const temporalContext = LEARNING_TEMPORAL_CONTEXTS.has(row.temporal_context)
          ? row.temporal_context
          : "undated";
        return {
          row,
          score: Number(row.score),
          weight: Number(row.confidence)
            * Number(row.evidence_weight)
            * LEARNING_KIND_FACTORS[evidenceKind]
            * LEARNING_TIME_FACTORS[temporalContext],
          temporalContext,
          evidenceKind,
          domainScope: row.domain_scope === "domain_limited" ? "domain_limited" : "broad",
          domainLabel: row.domain_label || "",
        };
      })
      .filter((item) => Number.isFinite(item.score) && item.weight > 0);
    if (!observations.length) {
      return {
        qKey,
        status: "pending",
        score: null,
        confidence: 0,
        rangeLow: null,
        rangeHigh: null,
        evidenceCount: 0,
        confidenceLabel: "Pending",
        confidenceExplanation: "No accepted evidence currently supports this Q. Pending is not a finding of low ability.",
        domainScope: qKey === "learning" ? "domain_limited" : "broad",
        domainLabel: "",
        reportedStandardScore: null,
        reportedPercentile: null,
        normalizedEstimateMethod: "",
        summary: "Insufficient accepted evidence. This is not a finding of low ability.",
      };
    }

    const adultWeight = observations
      .filter((item) => item.temporalContext.startsWith("adult_"))
      .reduce((sum, item) => sum + item.weight, 0);
    const childhoodWeight = observations
      .filter((item) => item.temporalContext === "childhood")
      .reduce((sum, item) => sum + item.weight, 0);
    const childhoodScale = adultWeight > 0 && childhoodWeight > adultWeight * 0.2
      ? (adultWeight * 0.2) / childhoodWeight
      : 1;
    const weighted = observations.map((item) => ({
      ...item,
      adjustedWeight: item.temporalContext === "childhood" ? item.weight * childhoodScale : item.weight,
    }));
    const totalWeight = weighted.reduce((sum, item) => sum + item.adjustedWeight, 0);
    const score = weighted.reduce((sum, item) => sum + item.score * item.adjustedWeight, 0) / totalWeight;
    const variance = weighted.reduce(
      (sum, item) => sum + item.adjustedWeight * ((item.score - score) ** 2),
      0,
    ) / totalWeight;
    const deviation = Math.sqrt(Math.max(0, variance));
    const agreement = Math.max(0.5, 1 - deviation / 50);
    const confidence = Math.min(0.95, (1 - Math.exp(-totalWeight / 1.5)) * agreement);
    const margin = Math.round((1 - confidence) * 15 + deviation / 2);
    const ranked = [...weighted].sort((a, b) => b.adjustedWeight - a.adjustedWeight);
    const summaries = [...new Set(
      ranked
        .map((item) => item.row.evidence_summary)
        .filter(Boolean),
    )].slice(0, 3);
    const domainLabels = [...new Set(
      observations.map((item) => item.domainLabel).filter(Boolean),
    )];
    const evidenceKinds = new Set(observations.map((item) => item.evidenceKind));
    const hasBroadObservation = observations.some((item) => item.domainScope === "broad");
    const hasAdultObservation = observations.some((item) => item.temporalContext.startsWith("adult_"));
    const learningHasBroadCoverage = qKey !== "learning"
      || hasBroadObservation
      || (
        observations.length >= 3
        && domainLabels.length >= 3
        && evidenceKinds.size >= 2
        && hasAdultObservation
      );
    const status = qKey === "learning" && !learningHasBroadCoverage
      ? "domain_limited"
      : "evidence_supported";
    const confidenceLabel = observations.length === 1 || status === "domain_limited"
      ? "Limited"
      : confidence < 0.55
        ? "Developing"
        : confidence < 0.75
          ? "Moderate"
          : "Strong";
    const confidenceExplanation = status === "domain_limited"
      ? `Evidence currently covers ${domainLabels.join(", ") || "one limited learning domain"}. Broad Learning Q remains pending until independent evidence covers at least three learning domains, at least two evidence types, and an adult context.`
      : `${observations.length} accepted observation${observations.length === 1 ? " contributes" : "s contribute"} to this estimate. Confidence reflects source reliability, quantity, agreement, temporal relevance, and domain coverage—not the probability that the citizen possesses this capacity.`;
    const primary = ranked[0].row;
    return {
      qKey,
      status,
      score: Math.round(score),
      confidence,
      rangeLow: Math.max(0, Math.round(score) - margin),
      rangeHigh: Math.min(100, Math.round(score) + margin),
      evidenceCount: observations.length,
      confidenceLabel,
      confidenceExplanation,
      domainScope: status === "domain_limited" ? "domain_limited" : "broad",
      domainLabel: domainLabels.join(", "),
      reportedStandardScore: primary.reported_standard_score ?? null,
      reportedPercentile: primary.reported_percentile ?? null,
      normalizedEstimateMethod: primary.normalized_estimate_method || "",
      summary: summaries.join(" "),
    };
  });
}

function meaningfulLearningText(value) {
  const text = typeof value === "string" ? value.replace(/\0/g, "").trim() : "";
  const words = text.match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || [];
  return {
    text,
    adequate: words.length >= 30 && text.replace(/[^A-Za-z0-9]/g, "").length >= 120,
  };
}

async function extractLearningDocument(env, document) {
  const object = await env.CIVIC_FILES.get(document.object_key);
  if (!object) {
    throw new ClientError(
      `The protected file “${document.original_name}” is missing from civic storage.`,
      404,
      "document_object_missing",
    );
  }
  const bytes = await decryptCivicFile(
    env,
    new Uint8Array(await object.arrayBuffer()),
    document.encryption_iv,
  );
  if (document.media_type === "text/plain") {
    const extracted = meaningfulLearningText(new TextDecoder().decode(bytes));
    if (!extracted.adequate) {
      throw new ClientError(
        `“${document.original_name}” does not contain enough readable text for an evidence-bound assessment.`,
        422,
        "learning_text_insufficient",
      );
    }
    return { ...extracted, conversionTokens: 0 };
  }
  if (!env.AI) {
    throw new ClientError("Cloudflare Workers AI is not configured for this civic environment.", 503, "workers_ai_unavailable");
  }
  let conversion;
  try {
    conversion = await env.AI.toMarkdown({
      name: document.original_name,
      blob: new Blob([bytes], { type: document.media_type }),
    }, {
      conversionOptions: {
        output: { format: "text" },
        image: { descriptionLanguage: "en" },
        pdf: { metadata: false },
      },
    });
  } catch (cause) {
    console.error(JSON.stringify({
      level: "error",
      message: "learning-document-conversion-unavailable",
      documentId: document.document_id,
      mediaType: document.media_type,
      error: cause instanceof Error ? cause.message : String(cause),
    }));
    throw new ClientError(
      "The Cloudflare document service is unavailable from this development environment. The document was not judged unreadable, no Learning score was generated, and no allowance was consumed.",
      503,
      "learning_conversion_unavailable",
    );
  }
  const result = Array.isArray(conversion) ? conversion[0] : conversion;
  if (!result || result.format === "error") {
    throw new ClientError(
      `Cloudflare could not read “${document.original_name}”. No Learning score was generated.`,
      422,
      "learning_conversion_failed",
    );
  }
  await recordAiUsage(env, {
    conversionCount: 1,
    estimatedNeurons: AI_CONVERSION_ESTIMATE,
  });
  const extracted = meaningfulLearningText(result.data);
  if (!extracted.adequate) {
    throw new ClientError(
      `“${document.original_name}” appears to be an image-only or unreadable scan. No score was generated. Upload legible JPG or PNG page images, or a text-searchable PDF.`,
      422,
      "scan_ocr_required",
    );
  }
  return { ...extracted, conversionTokens: Number(result.tokens || 0) };
}

function normalizeLearningAiResult(raw, courseIds) {
  const response = raw && typeof raw === "object" && "response" in raw ? raw.response : raw;
  let parsed = response;
  if (typeof response === "string") {
    const cleaned = response.trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new ClientError(
        "Cloudflare returned an unreadable assessment. No Learning record was changed.",
        502,
        "learning_ai_response_invalid",
      );
    }
  }
  if (!parsed || typeof parsed !== "object") {
    throw new ClientError(
      "Cloudflare returned an incomplete assessment. No Learning record was changed.",
      502,
      "learning_ai_response_invalid",
    );
  }
  const incomingScores = Array.isArray(parsed.qScores) ? parsed.qScores : [];
  const byKey = new Map(incomingScores.map((score) => [score?.qKey, score]));
  const qScores = [...LEARNING_Q_KEYS].map((qKey) => {
    const score = byKey.get(qKey) || {
      qKey,
      score: 50,
      confidence: 0,
      evidenceKind: "insufficient",
      temporalContext: "undated",
      evidenceWeight: 0,
      interpretiveBasis: "No direct evidence was returned for this Q",
      evidenceSummary: "Insufficient evidence; this neutral placeholder is not an inference of low ability.",
      evidenceCitations: [],
    };
    return safeguardLearningScore({
      qKey,
      score: Math.round(boundedLearningNumber(score?.score, 0, 100, 50)),
      confidence: boundedLearningNumber(score?.confidence, 0, 1, 0),
      evidenceKind: LEARNING_EVIDENCE_KINDS.has(score?.evidenceKind)
        ? score.evidenceKind
        : "insufficient",
      temporalContext: LEARNING_TEMPORAL_CONTEXTS.has(score?.temporalContext)
        ? score.temporalContext
        : "undated",
      evidenceWeight: boundedLearningNumber(score?.evidenceWeight, 0, 1, 0),
      interpretiveBasis: boundedGeneratedText(score?.interpretiveBasis, 800),
      evidenceSummary: boundedGeneratedText(
        score?.evidenceSummary || "Insufficient evidence; this neutral score is not an inference of low ability.",
        1200,
      ),
      evidenceCitations: (Array.isArray(score?.evidenceCitations) ? score.evidenceCitations : [])
        .filter((citation) => typeof citation === "string")
        .map((citation) => boundedGeneratedText(citation, 240))
        .slice(0, 8),
      reportedStandardScore: null,
      reportedPercentile: null,
      normalizedEstimateMethod: score?.qKey === "learning"
        ? "Domain-limited interpretation pending corroboration across additional learning modalities."
        : "Evidence-weighted provisional Ten-Q interpretation.",
      domainScope: score?.qKey === "learning" ? "domain_limited" : "broad",
      domainLabel: score?.qKey === "learning"
        ? defaultLearningDomainLabel(score?.evidenceKind)
        : "",
    });
  });
  const recommendations = (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
    .filter((item) => courseIds.has(item?.courseId))
    .filter((item) => !LEARNING_NONSCORING_CLINICAL_PATTERN.test(String(item?.rationale || "")))
    .filter((item) => boundedLearningNumber(item?.confidence, 0, 1, 0) > 0)
    .map((item) => ({
      courseId: item.courseId,
      type: ["strengthening", "advancement", "goal_based", "exploration", "prerequisite_bridge"].includes(item.type)
        ? item.type
        : "exploration",
      rationale: boundedGeneratedText(item.rationale, 1200),
      confidence: boundedLearningNumber(item.confidence, 0, 1, 0),
    }))
    .slice(0, 8);
  return {
    summary: boundedGeneratedText(parsed.summary, 4000),
    confidence: boundedLearningNumber(parsed.confidence, 0, 1, 0),
    qScores,
    recommendations,
  };
}

function parseLearningAiPayload(raw) {
  const response = raw && typeof raw === "object" && "response" in raw ? raw.response : raw;
  if (typeof response !== "string") {
    if (response && typeof response === "object") return response;
    throw new ClientError(
      "Cloudflare returned an incomplete interpretation. No Learning record was changed.",
      502,
      "learning_ai_response_invalid",
    );
  }
  const cleaned = response.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object") throw new Error("Not an object");
    return parsed;
  } catch {
    // Some Workers AI models occasionally wrap an otherwise valid structured
    // object in a short explanatory prefix/suffix. Recover only a complete,
    // balanced top-level object; never attempt to repair truncated JSON.
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = 0; index < cleaned.length; index += 1) {
      const character = cleaned[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
        continue;
      }
      if (character === "{") {
        if (depth === 0) start = index;
        depth += 1;
      } else if (character === "}" && depth > 0) {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          try {
            const parsed = JSON.parse(cleaned.slice(start, index + 1));
            if (parsed && typeof parsed === "object") return parsed;
          } catch {
            // Continue looking for a later complete top-level object.
          }
          start = -1;
        }
      }
    }
    throw new ClientError(
      "Cloudflare returned an unreadable interpretation. No Learning record was changed.",
      502,
      "learning_ai_response_invalid",
    );
  }
}

function normalizeLearningObservationResult(raw, courseIds, contractsByDocument, citizenLabel) {
  const parsed = parseLearningAiPayload(raw);
  const observations = (Array.isArray(parsed.observations) ? parsed.observations : [])
    .map((observation) => {
      const contract = contractsByDocument.get(observation?.documentId);
      if (!contract) {
        return normalizeLearningObservation(observation, {
          documentId: "",
          contractId: "",
          allowedChannels: [],
          permittedScope: [],
          sensitivityClass: "ordinary",
          documentType: "other",
          verificationClass: "self_submitted",
        }, citizenLabel);
      }
      return normalizeLearningObservation(observation, contract, citizenLabel);
    })
    .slice(0, 30);
  const recommendations = (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
    .filter((item) => courseIds.has(item?.courseId))
    .map((item) => ({
      courseId: item.courseId,
      type: ["strengthening", "advancement", "goal_based", "exploration", "prerequisite_bridge"].includes(item?.type)
        ? item.type
        : "exploration",
      rationale: boundedGeneratedText(item?.rationale, 1200),
      confidence: Math.max(0, Math.min(1, Number(item?.confidence) || 0)),
    }))
    .filter((item) => item.rationale && item.confidence > 0)
    .slice(0, 8);
  const admitted = observations.filter((observation) => observation.admissionStatus === "admitted");
  const admittedQNames = [...new Set(admitted.map((observation) => observation.primaryQKey))];
  const parsedDomainReviews = (Array.isArray(parsed.domainReviews) ? parsed.domainReviews : [])
    .filter((review) => AUTHORED_FICTION_Q_KEYS.includes(review?.qKey))
    .map((review) => ({
      qKey: review.qKey,
      status: ["supported", "insufficient", "not_applicable"].includes(review?.status)
        ? review.status : "insufficient",
      rationale: boundedGeneratedText(review?.rationale, 1_500),
      citations: (Array.isArray(review?.citations) ? review.citations : [])
        .map((value) => boundedGeneratedText(value, 300)).filter(Boolean).slice(0, 8),
      moralTreatment: [...new Set(
        (Array.isArray(review?.moralTreatment) ? review.moralTreatment : [])
          .filter((value) => AUTHORED_FICTION_MORAL_TREATMENTS.includes(value)),
      )].slice(0, 5),
    }));
  const domainReviews = AUTHORED_FICTION_Q_KEYS.map((qKey) => {
    const review = parsedDomainReviews.find((candidate) => candidate.qKey === qKey);
    if (!review) {
      return {
        qKey,
        status: "insufficient",
        rationale: "The evaluator did not return a domain-specific finding. This domain remains unsupported and did not affect the profile.",
        citations: [],
        moralTreatment: ["not_applicable"],
      };
    }
    if (qKey === "moral"
      && review.status === "supported"
      && (!review.moralTreatment.length
        || review.moralTreatment.every((value) => value === "not_applicable"))) {
      return {
        ...review,
        status: "insufficient",
        rationale: "Moral-Q remained unsupported because the response did not distinguish how the narrative treats harm, consent, autonomy, consequence, restoration, responsibility, or power.",
      };
    }
    return review;
  });
  return {
    summary: admitted.length
      ? `${admitted.length} source-bound observation${admitted.length === 1 ? " was" : "s were"} admitted for ${admittedQNames.join(", ")}. Rejected and review-pending interpretations were excluded from the derived profile.`
      : "No source-bound observations passed the deterministic integrity boundary. Rejected interpretations were retained for audit but did not alter the derived profile.",
    confidence: admitted.length
      ? Math.max(0, Math.min(1, Number(parsed.confidence) || 0))
      : 0,
    observations,
    recommendations,
    domainReviews,
    qScores: learningScoresFromObservations(admitted),
  };
}

const LEARNING_AUTHORED_SEGMENT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    themes: {
      type: "array",
      maxItems: 5,
      items: { type: "string" },
    },
    ethicalFraming: { type: "string" },
    authorialFeatures: {
      type: "array",
      maxItems: 2,
      items: {
        type: "object",
        properties: {
          qKey: { type: "string", enum: [...LEARNING_Q_KEYS] },
          subdomainKey: { type: "string" },
          sourcePassage: { type: "string" },
          observableFeature: { type: "string" },
          contextualInterpretation: { type: "string" },
          boundedCitation: { type: "string" },
          limitations: { type: "string" },
        },
        required: [
          "qKey", "subdomainKey", "sourcePassage", "observableFeature",
          "contextualInterpretation", "boundedCitation", "limitations",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "themes", "ethicalFraming", "authorialFeatures"],
  additionalProperties: false,
};

function learningAiUsage(raw, prompt) {
  const responseText = typeof raw?.response === "string"
    ? raw.response
    : JSON.stringify(raw?.response || raw || "");
  const usage = raw?.usage || {};
  const promptTokens = Number(usage.prompt_tokens || usage.input_tokens || Math.ceil(prompt.length / 4));
  const completionTokens = Number(usage.completion_tokens || usage.output_tokens || Math.ceil(responseText.length / 4));
  return {
    promptTokens,
    completionTokens,
    estimatedNeurons: (
      Math.max(0, promptTokens) * 4_119 / 1_000_000
      + Math.max(0, completionTokens) * 34_868 / 1_000_000
    ),
  };
}

async function runLearningAiJson(env, { prompt, schema, maxTokens, system }) {
  let raw;
  try {
    raw = await env.AI.run(LEARNING_AI_MODEL, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: schema },
      temperature: 0.1,
      max_tokens: maxTokens,
    });
  } catch (cause) {
    console.error(JSON.stringify({
      level: "error",
      message: "learning-ai-request-failed",
      error: cause instanceof Error ? cause.message : String(cause),
    }));
    throw new ClientError(
      "Cloudflare could not complete the Learning assessment. No Learning record was changed.",
      502,
      "learning_ai_failed",
    );
  }
  await recordAiUsage(env, { requestCount: 1, ...learningAiUsage(raw, prompt) });
  return { raw, parsed: parseLearningAiPayload(raw) };
}

async function analyzeAuthoredWorkCoverage(env, document) {
  const segments = segmentAuthoredWork(document.text, { maxChars: 56_000, minChars: 16_000 });
  const analyses = [];
  // Three concurrent model calls keep a long local evaluation responsive while
  // remaining comfortably below Workers' subrequest ceiling.
  for (let offset = 0; offset < segments.length; offset += 3) {
    const batch = segments.slice(offset, offset + 3);
    const results = await Promise.all(batch.map(async (segment, batchIndex) => {
      const sequence = offset + batchIndex + 1;
      const prompt = [
        "Map this complete segment of an authored literary work. This pass gathers evidence; it does not score the citizen.",
        `DOCUMENT: ${document.name}`,
        `DOCUMENT_ID: ${document.documentId}`,
        `SEGMENT: ${sequence} of ${segments.length}`,
        `STRUCTURAL_CONTEXT: ${segment.structuralLabel}`,
        `CHARACTER_RANGE: ${segment.start}-${segment.end}`,
        `DOCUMENT_TYPE_POLICY: ${JSON.stringify(learningDocumentTypePolicy(document.contract.documentType))}`,
        `ACCEPTED_EVIDENCE_CONTRACT: ${JSON.stringify(document.contract)}`,
        "Read every supplied word. Describe authorial construction, continuity, synthesis, craft, modeled systems, themes, and ethical framing. A character's action, emotion, dialogue, consent, harm, intelligence, or moral choice is story content, never the citizen-author's conduct or personal capacity.",
        "Return one concise summary (120 words maximum), at most three short themes, one concise ethical-framing statement, and at most two authorial features. Each feature must identify a feature constructed by the author, quote no more than 100 words of the bounded passage, explain the local context, state a limitation, and use the supplied structural context in its citation. Do not infer whether the author personally endorses depicted conduct; distinguish portrayal, interrogation, critique, consequence, and endorsement.",
        `SEGMENT_TEXT:\n${segment.text}`,
      ].join("\n\n");
      const { parsed } = await runLearningAiJson(env, {
        prompt,
        schema: LEARNING_AUTHORED_SEGMENT_SCHEMA,
        maxTokens: 900,
        system: "You are a literary evidence mapper. Analyze the authorial artifact, never a fictional character as the citizen. Return only the requested JSON structure.",
      });
      return {
        segmentId: segment.segmentId,
        sequence,
        structuralUnitId: segment.structuralUnitId,
        structuralLabel: segment.structuralLabel,
        structuralUnitIndex: segment.structuralUnitIndex,
        structuralUnitCount: segment.structuralUnitCount,
        chunkIndex: segment.chunkIndex,
        chunkCount: segment.chunkCount,
        coverageRegion: segment.coverageRegion,
        start: segment.start,
        end: segment.end,
        summary: boundedGeneratedText(parsed.summary, 800),
        themes: (Array.isArray(parsed.themes) ? parsed.themes : [])
          .map((value) => boundedGeneratedText(value, 180)).filter(Boolean).slice(0, 3),
        ethicalFraming: boundedGeneratedText(parsed.ethicalFraming, 600),
        authorialFeatures: (Array.isArray(parsed.authorialFeatures) ? parsed.authorialFeatures : [])
          .map((feature) => ({
            qKey: [...LEARNING_Q_KEYS].includes(feature?.qKey) ? feature.qKey : "creative",
            subdomainKey: boundedGeneratedText(feature?.subdomainKey, 100),
            sourcePassage: boundedGeneratedText(feature?.sourcePassage, 650),
            observableFeature: boundedGeneratedText(feature?.observableFeature, 500),
            contextualInterpretation: boundedGeneratedText(feature?.contextualInterpretation, 500),
            boundedCitation: boundedGeneratedText(feature?.boundedCitation, 300),
            limitations: boundedGeneratedText(feature?.limitations, 500),
          }))
          .filter((feature) => feature.sourcePassage && feature.observableFeature)
          .slice(0, 2),
      };
    }));
    analyses.push(...results);
  }
  const coveredCharacters = segments.reduce((sum, segment) => sum + segment.text.length, 0);
  return {
    mode: "chapter_aware_complete_work",
    sourceCharacters: document.text.length,
    coveredCharacters,
    coveragePercent: document.text.length ? Math.round((coveredCharacters / document.text.length) * 10_000) / 100 : 0,
    segmentCount: segments.length,
    structuralLabels: [...new Set(segments.map((segment) => segment.structuralLabel))],
    coverageReceipt: segments.map((segment) => ({
      segmentId: segment.segmentId,
      structuralUnitId: segment.structuralUnitId,
      structuralLabel: segment.structuralLabel,
      structuralUnitIndex: segment.structuralUnitIndex,
      structuralUnitCount: segment.structuralUnitCount,
      chunkIndex: segment.chunkIndex,
      chunkCount: segment.chunkCount,
      coverageRegion: segment.coverageRegion,
      start: segment.start,
      end: segment.end,
      analyzed: true,
    })),
    analyses,
  };
}

function publicLearningContract(row) {
  return {
    contractId: row.contract_id,
    documentId: row.document_id,
    supersedesContractId: row.supersedes_contract_id,
    contractVersion: Number(row.contract_version),
    status: row.status,
    documentType: row.document_type,
    authorOrIssuer: row.author_or_issuer,
    relationshipToCitizen: row.relationship_to_citizen,
    authorshipState: row.authorship_state,
    namedSubjects: parseStoredJson(row.named_subjects_json, []),
    fictionalSubjects: parseStoredJson(row.fictional_subjects_json, []),
    allowedChannels: parseStoredJson(row.allowed_channels_json, []),
    permittedScope: parseStoredJson(row.permitted_scope_json, []),
    includedSections: row.included_sections,
    excludedSections: row.excluded_sections,
    autobiographicalStatus: row.autobiographical_status,
    sensitivityClass: row.sensitivity_class,
    citizenContext: row.citizen_context,
    verificationClass: row.verification_class,
    identityMatchState: row.identity_match_state,
    identityMatchMethod: row.identity_match_method,
    identityMatchConfidence: Number(row.identity_match_confidence || 0),
    evidencePeriodStart: row.evidence_period_start,
    evidencePeriodEnd: row.evidence_period_end,
    evidencePeriodPrecision: row.evidence_period_precision,
    evidencePeriodAuthority: row.evidence_period_authority,
    evidencePeriodBasis: row.evidence_period_basis,
    printedDocumentDate: row.printed_document_date,
    rawExtractionHash: row.raw_extraction_hash,
    reviewedTranscriptHash: row.reviewed_transcript_hash,
    extractionMethod: row.extraction_method,
    pageCount: row.page_count === null ? null : Number(row.page_count),
    citizenAttestation: row.citizen_attestation,
    consentedAt: row.consented_at,
    createdAt: row.created_at,
  };
}

function publicLearningObservation(row) {
  return {
    observationId: row.observation_id,
    evaluationId: row.evaluation_id,
    evaluationStatus: row.evaluation_status || "",
    civicId: row.civic_id,
    documentId: row.document_id,
    contractId: row.contract_id,
    actualSubject: row.actual_subject,
    subjectType: row.subject_type,
    evidenceChannel: row.evidence_channel,
    primaryQKey: row.primary_q_key,
    secondaryQKey: row.secondary_q_key,
    primarySubdomainKey: row.primary_subdomain_key,
    secondarySubdomainKey: row.secondary_subdomain_key,
    secondaryJustification: row.secondary_justification,
    sourceFact: row.source_fact,
    observableFeature: row.observable_feature,
    rubricConnection: row.rubric_connection,
    contextualInterpretation: row.contextual_interpretation,
    tenQInference: row.ten_q_inference,
    limitations: row.limitations,
    alternativeExplanations: row.alternative_explanations,
    scoringRationale: row.scoring_rationale,
    boundedCitation: row.bounded_citation,
    estimate: Number(row.estimate),
    rangeLow: Number(row.range_low),
    rangeHigh: Number(row.range_high),
    confidence: Number(row.confidence),
    evidenceWeight: Number(row.evidence_weight),
    evidenceKind: row.evidence_kind,
    temporalContext: row.temporal_context,
    evidencePeriodStart: row.evidence_period_start,
    evidencePeriodEnd: row.evidence_period_end,
    admissionStatus: row.admission_status,
    rejectionReason: row.rejection_reason,
    moralTreatment: parseStoredJson(row.moral_treatment_json, []),
    verificationState: row.verification_state,
    evaluatorVersion: row.evaluator_version,
    policyVersion: row.policy_version,
    createdAt: row.created_at,
  };
}

async function createLearningEvidenceContract(request, env, input) {
  requireCivicV3(request, env);
  const session = await requireCivicSession(request, env);
  const documentId = cleanText(input.documentId, 100);
  const document = await env.DB.prepare(`
    SELECT d.*, m.original_name, m.media_type, m.sha256,
           source_media.sha256 AS source_sha256
    FROM protected_documents d
    JOIN civic_media_assets m ON m.asset_id = d.asset_id
    LEFT JOIN protected_documents source_document
      ON source_document.document_id = d.source_document_id
    LEFT JOIN civic_media_assets source_media
      ON source_media.asset_id = source_document.asset_id
    WHERE d.document_id = ?1 AND d.civic_id = ?2
      AND d.record_domain = 'learning' AND d.retention_status != 'deleted'
    LIMIT 1
  `).bind(documentId, session.civic_id).first();
  if (!document) {
    throw new ClientError("This Learning document is unavailable to the signed-in citizen.", 404, "learning_document_not_found");
  }

  const contract = normalizeEvidenceContract(input, documentId);
  if (!contract.authorOrIssuer || !contract.relationshipToCitizen) {
    throw new ClientError("Identify the author or issuer and the document's relationship to the citizen.", 400, "learning_contract_identity_required");
  }
  if (!contract.allowedChannels.length || !contract.permittedScope.length) {
    throw new ClientError("Choose at least one evidence channel and one permitted Q.", 400, "learning_contract_scope_required");
  }
  if (contract.citizenAttestation.length < 20 || input.accepted !== true) {
    throw new ClientError("Accept the evidence statement before evaluation.", 400, "learning_contract_attestation_required");
  }
  if (contract.documentType === "authored_fiction") {
    contract.allowedChannels = contract.allowedChannels.filter((channel) => channel === "demonstrated");
    if (!contract.allowedChannels.length) {
      throw new ClientError(
        "Authored fiction may be evaluated only as demonstrated authorial work, never as lived conduct.",
        400,
        "learning_contract_fiction_channel_invalid",
      );
    }
  }
  if (contract.documentType === "clinical_context") {
    contract.sensitivityClass = "clinical_restricted";
    contract.permittedScope = [];
  }

  const previous = await env.DB.prepare(`
    SELECT contract_id, contract_version FROM learning_evidence_contracts
    WHERE civic_id = ?1 AND document_id = ?2 AND status = 'accepted'
    ORDER BY contract_version DESC LIMIT 1
  `).bind(session.civic_id, documentId).first();
  const now = new Date().toISOString();
  const contractId = `USLC-${crypto.randomUUID()}`;
  const version = Number(previous?.contract_version || 0) + 1;
  const rawHash = document.derivation_method === "citizen_reviewed_ocr"
    ? document.source_sha256
    : document.sha256;
  const reviewedHash = document.derivation_method === "citizen_reviewed_ocr"
    ? document.sha256
    : null;
  const identityMatchState = contract.authorshipState === "citizen_subject"
    || contract.authorshipState === "citizen_author"
    ? "unresolved"
    : "not_applicable";
  const statements = [];
  if (previous?.contract_id) {
    statements.push(env.DB.prepare(`
      UPDATE learning_evidence_contracts SET status = 'withdrawn'
      WHERE contract_id = ?1
    `).bind(previous.contract_id));
  }
  statements.push(env.DB.prepare(`
    INSERT INTO learning_evidence_contracts (
      contract_id, civic_id, document_id, supersedes_contract_id,
      contract_version, status, document_type, author_or_issuer,
      relationship_to_citizen, authorship_state, named_subjects_json,
      fictional_subjects_json, allowed_channels_json, permitted_scope_json,
      included_sections, excluded_sections, autobiographical_status,
      sensitivity_class, citizen_context, verification_class,
      identity_match_state, identity_match_method, identity_match_confidence,
      evidence_period_start, evidence_period_end, evidence_period_precision,
      evidence_period_authority, evidence_period_basis, printed_document_date,
      raw_extraction_hash, reviewed_transcript_hash, structured_diff_json,
      extraction_method, page_count, citizen_attestation, consented_at, created_at
    ) VALUES (
      ?1, ?2, ?3, ?4, ?5, 'accepted', ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13,
      ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26,
      ?27, ?28, ?29, ?30, '{}', ?31, ?32, ?33, ?34, ?34
    )
  `).bind(
    contractId,
    session.civic_id,
    documentId,
    previous?.contract_id || null,
    version,
    contract.documentType,
    contract.authorOrIssuer,
    contract.relationshipToCitizen,
    contract.authorshipState,
    JSON.stringify(contract.namedSubjects),
    JSON.stringify(contract.fictionalSubjects),
    JSON.stringify(contract.allowedChannels),
    JSON.stringify(contract.permittedScope),
    contract.includedSections,
    contract.excludedSections,
    contract.autobiographicalStatus,
    contract.sensitivityClass,
    contract.citizenContext,
    contract.verificationClass,
    identityMatchState,
    identityMatchState === "unresolved"
      ? "Private legal-name comparison is pending citizen identity setup."
      : "No citizen-name comparison required.",
    0,
    contract.evidencePeriodStart,
    contract.evidencePeriodEnd,
    contract.evidencePeriodPrecision,
    contract.evidencePeriodAuthority,
    contract.evidencePeriodBasis,
    contract.printedDocumentDate,
    rawHash || null,
    reviewedHash || null,
    document.derivation_method === "citizen_reviewed_ocr" ? "browser_ocr_citizen_reviewed" : "original_upload",
    input.pageCount === null || input.pageCount === undefined
      ? null
      : Math.max(1, Math.min(1000, Math.round(Number(input.pageCount) || 1))),
    contract.citizenAttestation,
    now,
  ));
  await env.DB.batch(statements);
  const stored = await env.DB.prepare(`
    SELECT * FROM learning_evidence_contracts WHERE contract_id = ?1
  `).bind(contractId).first();
  return { created: true, contract: publicLearningContract(stored) };
}

async function createLearningChallenge(request, env, input) {
  requireCivicV3(request, env);
  const session = await requireCivicSession(request, env);
  const observationId = cleanText(input.observationId, 100);
  const challengeType = [
    "correction", "context", "dispute", "exclude", "reconsideration", "counterevidence",
  ].includes(input.challengeType) ? input.challengeType : "context";
  const citizenStatement = cleanText(input.citizenStatement, 2400);
  const observation = await env.DB.prepare(`
    SELECT observation_id, evaluation_id, admission_status
    FROM learning_observations
    WHERE observation_id = ?1 AND civic_id = ?2 LIMIT 1
  `).bind(observationId, session.civic_id).first();
  if (!observation) {
    throw new ClientError("This Learning observation is unavailable to the signed-in citizen.", 404, "learning_observation_not_found");
  }
  const challengeId = `USLCG-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare(`
      INSERT INTO learning_challenges (
        challenge_id, civic_id, evaluation_id, observation_id, challenge_type,
        citizen_statement, status, resolution, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'open', '', ?7, ?7)
    `).bind(
      challengeId,
      session.civic_id,
      observation.evaluation_id,
      observationId,
      challengeType,
      citizenStatement,
      now,
    ),
  ];
  if (challengeType === "exclude") {
    statements.push(env.DB.prepare(`
      UPDATE learning_observations
      SET admission_status = 'excluded_by_citizen',
          rejection_reason = 'Excluded from synthesis by the citizen pending review.'
      WHERE observation_id = ?1 AND civic_id = ?2
    `).bind(observationId, session.civic_id));
  }
  await env.DB.batch(statements);
  return {
    created: true,
    challengeId,
    observationId,
    challengeType,
    excludedFromSynthesis: challengeType === "exclude",
    status: "open",
    createdAt: now,
  };
}

async function getPrivateIdentity(request, env) {
  requireCivicV3(request, env);
  const session = await requireCivicSession(request, env);
  return privateIdentityForCitizen(env, session.civic_id, true);
}

async function savePrivateIdentity(request, env, input) {
  requireCivicV3(request, env);
  const session = await requireCivicSession(request, env);
  await requireCurrentCivicPassword(env, session.civic_id, input.currentPassword);
  const legalName = cleanText(input.legalName, 240);
  const chosenName = cleanText(input.chosenName || "", 240, false);
  const accepted = input.attested === true;
  if (!accepted) {
    throw new ClientError(
      "Confirm that the legal identity and documented variations are accurate before saving.",
      400,
      "private_identity_attestation_required",
    );
  }
  const suppliedVariants = (Array.isArray(input.variants) ? input.variants : [])
    .slice(0, 20)
    .map((variant) => ({
      value: cleanText(variant?.value, 240, false),
      kind: [
        "former_name", "initials", "historical_spelling", "documented_misspelling", "other",
      ].includes(variant?.kind) ? variant.kind : "other",
      verificationNote: cleanText(variant?.verificationNote || "", 500, false),
    }))
    .filter((variant) => variant.value);
  const encryptedLegalName = await encryptPrivateText(env, legalName);
  const encryptedVariants = [];
  for (const variant of suppliedVariants) {
    encryptedVariants.push({
      ...variant,
      encrypted: await encryptPrivateText(env, variant.value),
    });
  }
  const previous = await env.DB.prepare(`
    SELECT identity_version FROM civic_private_identities WHERE civic_id = ?1
  `).bind(session.civic_id).first();
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare(`
      INSERT INTO civic_private_identities (
        civic_id, legal_name_ciphertext, legal_name_iv, chosen_name,
        identity_version, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
      ON CONFLICT(civic_id) DO UPDATE SET
        legal_name_ciphertext = excluded.legal_name_ciphertext,
        legal_name_iv = excluded.legal_name_iv,
        chosen_name = excluded.chosen_name,
        identity_version = excluded.identity_version,
        updated_at = excluded.updated_at
    `).bind(
      session.civic_id,
      encryptedLegalName.ciphertext,
      encryptedLegalName.iv,
      chosenName,
      Number(previous?.identity_version || 0) + 1,
      now,
    ),
    env.DB.prepare(`
      UPDATE civic_private_name_variants
      SET status = 'withdrawn', withdrawn_at = ?2
      WHERE civic_id = ?1 AND status = 'verified'
    `).bind(session.civic_id, now),
  ];
  if (chosenName) {
    statements.push(env.DB.prepare(`
      UPDATE civic_profiles SET civic_name = ?2, updated_at = ?3
      WHERE civic_id = ?1
    `).bind(session.civic_id, chosenName, now));
  }
  for (const variant of encryptedVariants) {
    statements.push(env.DB.prepare(`
      INSERT INTO civic_private_name_variants (
        variant_id, civic_id, variant_ciphertext, variant_iv, variant_kind,
        verification_note, status, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'verified', ?7)
    `).bind(
      `USPN-${crypto.randomUUID()}`,
      session.civic_id,
      variant.encrypted.ciphertext,
      variant.encrypted.iv,
      variant.kind,
      variant.verificationNote,
      now,
    ));
  }
  statements.push(env.DB.prepare(`
    INSERT INTO civic_private_identity_audit (
      audit_id, civic_id, action, actor_label, changed_fields_json, occurred_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `).bind(
    `USPIA-${crypto.randomUUID()}`,
    session.civic_id,
    previous ? "updated" : "created",
    "Citizen through private Civic Profile",
    JSON.stringify(["legal_name", "chosen_name", "verified_name_variants"]),
    now,
  ));
  await env.DB.batch(statements);
  return {
    saved: true,
    identity: await privateIdentityForCitizen(env, session.civic_id, true),
    privacy: "Legal identity and variants are AES-256-GCM encrypted and never included in public profiles or AI prompts.",
  };
}

async function evaluateLearningDocuments(request, env, input) {
  const session = await requireCivicSession(request, env);
  if (input.consent !== true) {
    throw new ClientError(
      "Explicit consent is required before selected Learning evidence is sent to Cloudflare.",
      400,
      "learning_consent_required",
    );
  }
  const documentIds = [...new Set(
    (Array.isArray(input.documentIds) ? input.documentIds : [])
      .filter((value) => typeof value === "string")
      .map((value) => cleanText(value, 80)),
  )].slice(0, 4);
  if (!documentIds.length) {
    throw new ClientError("Choose at least one retained Learning document.", 400, "learning_documents_required");
  }
  if (documentIds.length > 3) {
    throw new ClientError("Assess no more than three Learning documents at once.", 400, "learning_document_limit");
  }
  const allowance = await aiAllowanceStatus(env);
  if (!allowance.configured) {
    throw new ClientError("Cloudflare Workers AI is not configured for this civic environment.", 503, "workers_ai_unavailable");
  }
  if (!allowance.available) {
    throw new ClientError(
      `The portal’s protective AI allowance is nearly exhausted. It resets at ${allowance.resetAt}.`,
      429,
      "workers_ai_allowance_exhausted",
    );
  }
  const rows = await env.DB.prepare(`
    SELECT d.document_id, d.civic_id, d.record_domain, d.retention_status,
           d.source_document_id, d.derivation_method, d.review_status,
           d.extraction_confidence,
           m.object_key, m.original_name, m.media_type, m.byte_size, m.encryption_iv,
           source_media.original_name AS source_original_name
    FROM protected_documents d
    JOIN civic_media_assets m ON m.asset_id = d.asset_id
    LEFT JOIN protected_documents source_document
      ON source_document.document_id = d.source_document_id
    LEFT JOIN civic_media_assets source_media
      ON source_media.asset_id = source_document.asset_id
    WHERE d.civic_id = ?1 AND d.record_domain = 'learning'
      AND d.retention_status != 'deleted' AND m.status = 'active'
  `).bind(session.civic_id).all();
  const byId = new Map((rows.results || []).map((row) => [row.document_id, row]));
  const requestedDocuments = documentIds.map((documentId) => byId.get(documentId));
  if (requestedDocuments.some((document) => !document)) {
    throw new ClientError("A selected Learning document is unavailable to this citizen.", 403, "learning_document_forbidden");
  }
  const reviewedSourceIds = new Set(
    requestedDocuments
      .filter((document) => (
        document.derivation_method === "citizen_reviewed_ocr"
        && document.review_status === "reviewed"
        && document.source_document_id
      ))
      .map((document) => document.source_document_id),
  );
  const documents = requestedDocuments.filter(
    (document) => !reviewedSourceIds.has(document.document_id),
  );
  const assessmentDocumentIds = documents.map((document) => document.document_id);
  const contractRows = await env.DB.prepare(`
    SELECT * FROM learning_evidence_contracts
    WHERE civic_id = ?1 AND status = 'accepted'
    ORDER BY document_id, contract_version DESC
  `).bind(session.civic_id).all();
  const contractsByDocument = new Map();
  for (const row of contractRows.results || []) {
    if (contractsByDocument.has(row.document_id)) continue;
    const contract = publicLearningContract(row);
    contractsByDocument.set(row.document_id, contract);
  }
  const missingContracts = documents.filter(
    (document) => !contractsByDocument.has(document.document_id),
  );
  if (missingContracts.length) {
    throw new ClientError(
      `Accept an evidence contract for ${missingContracts.map((document) => `“${document.original_name}”`).join(", ")} before evaluation.`,
      409,
      "learning_contract_required",
    );
  }
  const nonScoringDocuments = documents
    .map((document) => ({
      document,
      scoreability: learningContractScoreability(
        contractsByDocument.get(document.document_id),
      ),
    }))
    .filter(({ scoreability }) => !scoreability.scoreBearing);
  if (nonScoringDocuments.length) {
    const explanation = nonScoringDocuments
      .map(({ document, scoreability }) => `“${document.original_name}”: ${scoreability.reason}`)
      .join(" ");
    throw new ClientError(
      `${explanation} No AI allowance was used. Revise the evidence contract only if its classification is genuinely incorrect, or choose score-bearing evidence.`,
      422,
      "learning_contract_not_score_bearing",
    );
  }
  const totalBytes = documents.reduce((sum, document) => sum + Number(document.byte_size || 0), 0);
  if (totalBytes > 15 * 1024 * 1024) {
    throw new ClientError("Selected Learning evidence may total no more than 15 MB.", 413, "learning_evidence_too_large");
  }
  const extractedDocuments = [];
  let combinedLength = 0;
  for (const document of documents) {
    const extracted = await extractLearningDocument(env, document);
    const contract = contractsByDocument.get(document.document_id);
    const completeAuthoredCoverage = contract?.documentType === "authored_fiction"
      && extracted.text.length > 30_000;
    const remaining = Math.max(0, 70_000 - combinedLength);
    const text = completeAuthoredCoverage
      ? extracted.text
      : extracted.text.slice(0, Math.min(30_000, remaining));
    if (!text) break;
    if (contract && ["citizen_subject", "citizen_author", "co_author"].includes(contract.authorshipState)) {
      const identityMatch = await documentIdentityMatch(env, session.civic_id, text, contract);
      contract.identityMatchState = identityMatch.state;
      contract.identityMatchMethod = identityMatch.method;
      contract.identityMatchConfidence = identityMatch.confidence;
      await env.DB.prepare(`
        UPDATE learning_evidence_contracts
        SET identity_match_state = ?2, identity_match_method = ?3,
            identity_match_confidence = ?4
        WHERE contract_id = ?1
      `).bind(
        contract.contractId,
        identityMatch.state,
        identityMatch.method,
        identityMatch.confidence,
      ).run();
    }
    extractedDocuments.push({
      documentId: document.document_id,
      name: document.original_name,
      text,
      contract,
      completeAuthoredCoverage,
      provenance: document.derivation_method === "citizen_reviewed_ocr"
        ? `Citizen-reviewed OCR transcript derived from ${document.source_original_name || document.source_document_id}. OCR confidence before citizen correction: ${Number(document.extraction_confidence || 0).toFixed(1)}%.`
        : "Original retained evidence document.",
    });
    if (!completeAuthoredCoverage) combinedLength += text.length;
  }
  if (!extractedDocuments.length) {
    throw new ClientError("No readable Learning evidence was extracted. No score was generated.", 422, "learning_text_insufficient");
  }
  const coursesResult = await env.DB.prepare(`
    SELECT course_id, code, title, description, tier_key
    FROM usu_courses WHERE status = 'available' ORDER BY code
  `).all();
  const courses = coursesResult.results || [];
  const courseIds = new Set(courses.map((course) => course.course_id));
  const goalText = cleanText(input.goalText || "", 800, false);
  const profile = await civicProfile(env, session.civic_id);
  for (const document of extractedDocuments) {
    document.typePolicy = learningDocumentTypePolicy(document.contract?.documentType);
    document.coverage = document.completeAuthoredCoverage
      ? await analyzeAuthoredWorkCoverage(env, document)
      : {
          mode: "complete_direct",
          sourceCharacters: document.text.length,
          coveredCharacters: document.text.length,
          coveragePercent: 100,
          segmentCount: 1,
          structuralLabels: [],
          coverageReceipt: [{
            segmentId: "segment-001",
            structuralUnitId: "unit-001",
            structuralLabel: "Complete work",
            structuralUnitIndex: 1,
            structuralUnitCount: 1,
            chunkIndex: 1,
            chunkCount: 1,
            coverageRegion: "complete",
            start: 0,
            end: document.text.length,
            analyzed: true,
          }],
          analyses: [],
        };
    if (document.completeAuthoredCoverage) {
      document.contract.completeWorkStructuralLabels = [
        ...new Set(document.coverage.structuralLabels || []),
      ];
    }
  }
  const evidence = extractedDocuments.map((document) => [
    `DOCUMENT: ${document.name}`,
    `DOCUMENT_ID: ${document.documentId}`,
    `PROVENANCE: ${document.provenance}`,
    `DOCUMENT_TYPE_POLICY: ${JSON.stringify(document.typePolicy)}`,
    `COVERAGE_RECORD: ${JSON.stringify({
      mode: document.coverage.mode,
      sourceCharacters: document.coverage.sourceCharacters,
      coveredCharacters: document.coverage.coveredCharacters,
      coveragePercent: document.coverage.coveragePercent,
      segmentCount: document.coverage.segmentCount,
      structuralLabels: document.coverage.structuralLabels,
      coverageReceipt: document.coverage.coverageReceipt,
    })}`,
    `ACCEPTED_EVIDENCE_CONTRACT: ${JSON.stringify(document.contract)}`,
    document.completeAuthoredCoverage
      ? `COMPLETE_WORK_SEGMENT_ANALYSES:\n${JSON.stringify(document.coverage.analyses)}`
      : `DOCUMENT_TEXT:\n${document.text}`,
  ].join("\n")).join("\n\n---\n\n");
  const courseCatalog = courses.map((course) => (
    `${course.course_id} | ${course.code} | ${course.title} | ${course.tier_key} | ${course.description}`
  )).join("\n");
  const prompt = [
    "Extract source-bound observations for the Utopian Society Learning record. Do not return a complete Ten-Q profile and do not fill unsupported Qs.",
    `The citizen being evaluated is ${profile?.civic_name || "the signed-in citizen"}.`,
    "Each observation must name its actual subject. Admit only an observation whose subject is the citizen; mark characters, narrators, third parties, and institutions rejected.",
    "Obey each immutable ACCEPTED_EVIDENCE_CONTRACT. It controls authorship, subject, allowed channels, permitted Qs, included sections, excluded sections, sensitivity, time period, and citizen context.",
    "Build a complete audit chain for every observation. sourceFact must reproduce the full bounded, verbatim source passage needed to inspect the claim rather than a short paraphrase. observableFeature must identify the attributable feature actually visible in that passage. rubricConnection must explain exactly how that feature maps to the selected Q and subdomain. contextualInterpretation must explain the passage in its document context. tenQInference must state only the bounded capacity inference. limitations must name what this evidence cannot establish. alternativeExplanations must state at least one plausible competing interpretation or explain why the alternatives are narrow. scoringRationale must justify the estimate, interval, confidence, and evidence channel against the scoring anchors. boundedCitation must let a reviewer locate the passage. Each field must contain a substantive complete sentence and remain independently auditable.",
    "Every observation must return moralTreatment. Use ['not_applicable'] for non-Moral observations. A Moral-Q fiction observation must instead return one or more substantive narrative-treatment classifications from the schema; depiction alone is not endorsement.",
    "Assign exactly one primary Q and subdomain. A secondary Q is optional and requires a distinct subdomain plus a specific justification of at least twenty characters.",
    "The Ten Qs and their exact valid subdomains are: intellectual = reasoning, knowledge_integration, critical_evaluation; emotional = emotional_perception, emotional_regulation, reflective_awareness; social = communication, perspective_coordination, cooperation; creative = original_synthesis, craft_development, generative_range; adaptability = strategy_revision, transfer, recovery_learning; physical = embodied_skill, somatic_awareness, safe_practice; natural = ecological_observation, systems_stewardship, pattern_classification; technological = tool_fluency, systems_reasoning, technical_creation; learning = acquisition, retention, application, transfer; moral = ethical_perception, perspective_taking, consent_autonomy, harm_recognition, proportionality, fairness_consistency, epistemic_integrity, accountability, restorative_capacity, responsible_power, epistemic_humility, respect_personhood. The selected subdomain must belong to its selected Q.",
    "For each document, use only evidenceChannel values present in that document's accepted contract allowedChannels. If no authorized channel fits, omit the observation instead of returning an unauthorized channel.",
    "Declared means the citizen states something about self. Demonstrated means the citizen's attributable work or performance displays it. Observed means an attributable third party or institution records it.",
    "Authentication and identity matching establish provenance, not aptitude. Score only the bounded capacity actually evidenced in the document.",
    "For every admitted observation, estimate the strength of the specific demonstrated capacity in this evidence, not the citizen's whole-person Q. Use 1-39 only for direct, persistent difficulty under fair conditions; 40-54 for limited or emerging demonstration; 55-69 for clear functional demonstration; 70-84 for strong sustained or complex demonstration; 85-95 for exceptional repeated demonstration; and 96-99 only for extraordinary direct evidence. Never return 0 or 100 for an admitted observation. Unsupported capacity is omitted, rejected, or pending_review rather than scored zero.",
    "For every admitted observation, provide a non-degenerate rangeLow and rangeHigh around the estimate. Confidence measures confidence that the cited passage supports this bounded interpretation; it is not a score of the citizen's ability. Learning applies provenance weight deterministically after your response.",
    "Apply each document's DOCUMENT_TYPE_POLICY before selecting observations. Document type changes the admissible subject, interpretive lens, coverage requirement, and civic evidence weight; it is not merely a label.",
    "Authored fiction is judged as a complete literary artifact. It may demonstrate the citizen-author's narrative architecture, sustained continuity, craft, original synthesis, modeled systems, thematic development, perspective coordination, and explicit ethical reasoning in the work. Fictional events, characters, narrators, dialogue, and moral choices are never the citizen's lived conduct or personal attributes. Depiction is not endorsement. Every fiction observation must set actualSubject to the full citizen-author name, subjectType to citizen, evidenceChannel to demonstrated, and keep observableFeature, rubricConnection, tenQInference, and scoringRationale explicitly anchored to the authorial construction of the work.",
    "For authored fiction, complete one explicit domain review for each of these eight domains, even when the result is insufficient or not applicable: Creative = narrative architecture, worldbuilding, originality, voice, symbolism, and sustained craft; Intellectual = integration of civic, social, economic, technological, and philosophical systems; Moral = the narrative treatment of harm, consent, autonomy, consequence, responsibility, restoration, and power; Emotional = demonstrated construction of psychologically differentiated emotional states, never a claim about the author's own emotional regulation; Social = modeled interpersonal complexity, competing perspectives, dialogue, and social systems; Natural or Technological = substantive ecological or technological systems developed by the work; Learning = only actual drafts, revisions, or process evidence that demonstrate acquisition or transfer over time. Adaptability and Physical are outside the authored-fiction rubric unless separately evidenced by another source type.",
    "For every Moral-Q fiction review and observation, classify the narrative treatment using one or more of: harm_depicted, harm_endorsed, harm_challenged, harm_romanticized, harm_as_consequence_free_entertainment, harm_as_perseverance, harm_as_restoration, harm_as_responsibility, harm_as_social_failure, consent_and_autonomy, power_and_accountability. Depicting immoral conduct is not evidence of an immoral author; the evidence lies in the narrative's sustained treatment of that conduct.",
    `For every authored-fiction observation, tenQInference must begin "The citizen-author ${profile?.civic_name || "the signed-in citizen"} demonstrates..." and name the literary work, narrative construction, authorial craft, composition, or whole-work design that supplies the evidence. observableFeature, rubricConnection, and scoringRationale must use the same authorial-artifact boundary. If that sentence cannot be written truthfully, omit the observation.`,
    "When COVERAGE_RECORD mode is chapter_aware_complete_work, synthesize across every COMPLETE_WORK_SEGMENT_ANALYSIS. Do not base a whole-work observation on only the opening segments. Use citations distributed across the beginning, middle, and ending, and describe the coverage record in the summary. A document-level continuity or architecture claim requires support from multiple separated structural labels.",
    "Return no more than ten of the strongest source-bound observations across the selected documents and no more than four recommendations. Prefer a smaller complete audit chain over repetitive observations. Keep each audit-chain field to one or two substantive sentences and each quoted sourceFact to no more than 100 words.",
    "Autobiographical and non-autobiographical essays may demonstrate attributable writing craft, reasoning, synthesis, reflective interpretation, communication, knowledge integration, and sustained organization when the text directly displays them. An autobiographical essay's lived claims remain declared unless independently observed or corroborated. A proposition is not automatically lived behavior.",
    "Keep adult authored-artifact evidence separate from childhood events described inside that artifact. The adult's present craft, organization, synthesis, and reasoning may be demonstrated; remembered childhood behavior remains declared historical content unless independently corroborated.",
    "Social cooperation requires attributable coordination, joint activity, negotiation, or collaborative follow-through. Commentary about cooperation is not evidence that the citizen cooperated.",
    "Emotional regulation requires attributable strategy use, modulation, recovery, or sustained action under emotion. Naming feelings, comfort, refuge, shame, or sanctuary alone may support perception or reflection but not regulation.",
    "Learning Q requires attributable acquisition, retention, application, or transfer. Synthesis, eloquence, or already-possessed knowledge alone belongs under another Q unless the passage also demonstrates learning over time or across contexts.",
    "For Moral Q, distinguish ethical reasoning demonstrated in an authored artifact from lived moral conduct. Do not convert a reasoned proposition into a claim that the citizen behaved accordingly.",
    "Assess authored essays for Creative and Intellectual evidence when bounded passages demonstrate original synthesis, craft development, reasoning, knowledge integration, or critical evaluation. Do not omit those Qs merely because the artifact is autobiographical.",
    "An accepted authored artifact should receive at least one demonstrated observation when a bounded passage actually displays relevant craft, reasoning, synthesis, reflection, communication, knowledge integration, or sustained organization. Do not manufacture an observation merely because a file is authenticated; if nothing score-bearing is present, explain that limitation in the summary.",
    "Clinical, disability, trauma, poverty, homelessness, and legal material are context only and cannot raise or lower a Q. Do not diagnose or infer civic standing, employability, or human worth.",
    "A standardized score and its percentile are different measures. Quote the source fact; do not silently reinterpret one as the other.",
    "Learning Q requires evidence of acquisition, retention, application, or transfer. A verbal-comprehension score alone is only a domain-limited observation.",
    "Moral Q requires bounded evidence of ethical reasoning or attributable conduct. Ideology, religion, politics, sexuality, status, diagnosis, allegation, or fictional characterization are prohibited proxies.",
    "Use the evidence period and temporal context in the contract. Do not infer chronology from file creation time.",
    "Identity matching is performed locally before this prompt. If identityMatchState is probable, mismatch_review, or unresolved, mark citizen-subject observations pending_review rather than treating the document as verified or fraudulent.",
    "Mark uncertain subject, scope, provenance, or chronology pending_review rather than inventing certainty.",
    "The summary must describe only what the submitted evidence did and did not support. Do not prescribe remedial civic education or courses in the summary. Course suggestions belong only in recommendations.",
    "Recommend only course IDs in the supplied catalog. A goal may guide recommendations but cannot manufacture evidence.",
    `Citizen learning goal: ${goalText || "No goal supplied."}`,
    `AVAILABLE COURSES:\n${courseCatalog || "No courses are currently available."}`,
    `EVIDENCE:\n${evidence}`,
  ].join("\n\n");
  const boundedAssessmentSchema = JSON.parse(JSON.stringify(LEARNING_OBSERVATION_SCHEMA));
  boundedAssessmentSchema.properties.observations.maxItems = 10;
  boundedAssessmentSchema.properties.recommendations.maxItems = 4;
  const fictionOnlyAssessment = extractedDocuments.length > 0
    && extractedDocuments.every((document) => document.contract?.documentType === "authored_fiction");
  if (fictionOnlyAssessment) {
    const fictionQKeys = [...AUTHORED_FICTION_Q_KEYS];
    const fictionSubdomains = [
      "reasoning", "knowledge_integration", "critical_evaluation",
      "emotional_perception", "reflective_awareness",
      "communication", "perspective_coordination",
      "original_synthesis", "craft_development", "generative_range",
      "ecological_observation", "systems_stewardship", "pattern_classification",
      "tool_fluency", "systems_reasoning", "technical_creation",
      "ethical_perception", "perspective_taking", "consent_autonomy", "harm_recognition",
      "proportionality", "fairness_consistency", "epistemic_integrity", "accountability",
      "restorative_capacity", "responsible_power", "epistemic_humility", "respect_personhood",
      "acquisition", "retention", "application", "transfer",
    ];
    const observationProperties = boundedAssessmentSchema.properties.observations.items.properties;
    observationProperties.primaryQKey.enum = fictionQKeys;
    observationProperties.primarySubdomainKey.enum = fictionSubdomains;
    observationProperties.secondaryQKey.enum = ["", ...fictionQKeys];
    observationProperties.secondarySubdomainKey.enum = ["", ...fictionSubdomains];
    observationProperties.boundedCitation.description = "Cite at least three separated structural labels from the supplied coverage record, distributed across the work, in one semicolon-separated string.";
    boundedAssessmentSchema.properties.domainReviews = {
      type: "array",
      minItems: fictionQKeys.length,
      maxItems: fictionQKeys.length,
      items: {
        type: "object",
        properties: {
          qKey: { type: "string", enum: fictionQKeys },
          status: { type: "string", enum: ["supported", "insufficient", "not_applicable"] },
          rationale: { type: "string" },
          citations: { type: "array", maxItems: 8, items: { type: "string" } },
          moralTreatment: {
            type: "array",
            maxItems: 5,
            items: { type: "string", enum: AUTHORED_FICTION_MORAL_TREATMENTS },
          },
        },
        required: ["qKey", "status", "rationale", "citations", "moralTreatment"],
        additionalProperties: false,
      },
    };
    boundedAssessmentSchema.required.push("domainReviews");
  }
  let finalAiResult;
  try {
    finalAiResult = await runLearningAiJson(env, {
      prompt,
      schema: boundedAssessmentSchema,
      maxTokens: 6_000,
      system: "You are an evidence-bound educational assistant. Return only one complete JSON object matching the requested schema.",
    });
  } catch (cause) {
    if (!(cause instanceof ClientError) || cause.code !== "learning_ai_response_invalid") throw cause;
    // Preserve the already-completed manuscript coverage work and retry only
    // the bounded synthesis when a model response is truncated or malformed.
    finalAiResult = await runLearningAiJson(env, {
      prompt: `${prompt}\n\nThe prior synthesis exceeded a safe response boundary. Return at most six observations and two recommendations. Be concise, close every JSON structure, and do not add prose outside the JSON object.`,
      schema: boundedAssessmentSchema,
      maxTokens: 6_000,
      system: "You are an evidence-bound educational assistant. Return only one concise, complete JSON object matching the requested schema.",
    });
  }
  const { raw } = finalAiResult;
  const assessment = normalizeLearningObservationResult(
    raw,
    courseIds,
    contractsByDocument,
    profile?.civic_name || "the citizen",
  );
  const coverageStatements = extractedDocuments
    .filter((document) => document.coverage?.mode === "chapter_aware_complete_work")
    .map((document) => {
      const labels = Array.isArray(document.coverage.structuralLabels)
        ? document.coverage.structuralLabels
        : [];
      const span = labels.length > 1
        ? `${labels[0]} through ${labels[labels.length - 1]}`
        : labels[0] || "the complete manuscript";
      return `Complete-work coverage for ${document.name}: ${document.coverage.coveragePercent}% of ${document.coverage.sourceCharacters.toLocaleString("en-US")} source characters were examined in ${document.coverage.segmentCount} contiguous segments spanning ${span}.`;
    });
  if (coverageStatements.length) {
    assessment.summary = boundedGeneratedText(
      `${coverageStatements.join(" ")} ${assessment.summary}`,
      4_000,
    );
  }
  const recorded = await recordLearningEvaluation(request, env, {
    ...assessment,
    documentIds: assessmentDocumentIds,
    observations: assessment.observations,
    goalText,
    modelName: LEARNING_AI_MODEL,
    modelResponseId: raw?.request_id || raw?.id || null,
    coverage: extractedDocuments.map((document) => ({
      documentId: document.documentId,
      name: document.name,
      mode: document.coverage?.mode || "unknown",
      sourceCharacters: Number(document.coverage?.sourceCharacters || 0),
      coveredCharacters: Number(document.coverage?.coveredCharacters || 0),
      coveragePercent: Number(document.coverage?.coveragePercent || 0),
      segmentCount: Number(document.coverage?.segmentCount || 0),
      structuralLabels: Array.isArray(document.coverage?.structuralLabels)
        ? document.coverage.structuralLabels : [],
      coverageReceipt: Array.isArray(document.coverage?.coverageReceipt)
        ? document.coverage.coverageReceipt : [],
    })),
    domainReviews: assessment.domainReviews,
  });
  return {
    ...assessment,
    evaluationId: recorded.evaluationId,
    status: recorded.status,
    completedAt: recorded.completedAt,
    provider: "Cloudflare Workers AI",
    aiAllowance: await aiAllowanceStatus(env),
    coverage: extractedDocuments.map((document) => ({
      documentId: document.documentId,
      name: document.name,
      mode: document.coverage?.mode || "unknown",
      sourceCharacters: Number(document.coverage?.sourceCharacters || 0),
      coveredCharacters: Number(document.coverage?.coveredCharacters || 0),
      coveragePercent: Number(document.coverage?.coveragePercent || 0),
      segmentCount: Number(document.coverage?.segmentCount || 0),
      structuralLabels: Array.isArray(document.coverage?.structuralLabels)
        ? document.coverage.structuralLabels
        : [],
    })),
    rightsImpact: "none",
  };
}

async function createLearningGoal(request, env, input) {
  const session = await requireCivicSession(request, env);
  const goalText = cleanText(input.goalText, 800);
  const now = new Date().toISOString();
  const goalId = `USG-${crypto.randomUUID()}`;
  await env.DB.prepare(`
    INSERT INTO learning_goals (
      goal_id, civic_id, goal_text, status, created_at, updated_at
    ) VALUES (?1, ?2, ?3, 'active', ?4, ?4)
  `).bind(goalId, session.civic_id, goalText, now).run();
  return { created: true, goalId, goalText, status: "active", createdAt: now };
}

async function resetLearningProfile(request, env, input) {
  requireLocalV3(request, env);
  const session = await requireCivicSession(request, env);
  if (input.confirmation !== "RESET MY LEARNING PROFILE") {
    throw new ClientError(
      "Type RESET MY LEARNING PROFILE to confirm this local testing reset.",
      400,
      "learning_reset_confirmation_required",
    );
  }

  const now = new Date().toISOString();
  const countQueries = {
    challenges: "SELECT COUNT(*) AS total FROM learning_challenges WHERE civic_id = ?1",
    observations: "SELECT COUNT(*) AS total FROM learning_observations WHERE civic_id = ?1",
    profileVersions: "SELECT COUNT(*) AS total FROM learning_profile_versions WHERE civic_id = ?1",
    recommendations: "SELECT COUNT(*) AS total FROM learning_recommendations WHERE civic_id = ?1",
    qScores: "SELECT COUNT(*) AS total FROM learning_q_scores WHERE civic_id = ?1",
    evaluations: "SELECT COUNT(*) AS total FROM learning_evaluations WHERE civic_id = ?1",
  };
  const counts = {};
  for (const [key, sql] of Object.entries(countQueries)) {
    const row = await env.DB.prepare(sql).bind(session.civic_id).first();
    counts[key] = Number(row?.total || 0);
  }

  await env.DB.batch([
    env.DB.prepare("DELETE FROM learning_challenges WHERE civic_id = ?1").bind(session.civic_id),
    env.DB.prepare("DELETE FROM learning_observations WHERE civic_id = ?1").bind(session.civic_id),
    env.DB.prepare("DELETE FROM learning_recommendations WHERE civic_id = ?1").bind(session.civic_id),
    env.DB.prepare("DELETE FROM learning_q_scores WHERE civic_id = ?1").bind(session.civic_id),
    env.DB.prepare(`
      DELETE FROM learning_evaluation_documents
      WHERE evaluation_id IN (
        SELECT evaluation_id FROM learning_evaluations WHERE civic_id = ?1
      )
    `).bind(session.civic_id),
    env.DB.prepare("DELETE FROM learning_profile_versions WHERE civic_id = ?1").bind(session.civic_id),
    env.DB.prepare("DELETE FROM learning_evaluations WHERE civic_id = ?1").bind(session.civic_id),
    env.DB.prepare(`
      UPDATE civic_profiles
      SET learning_tier = 'Pending Evidence Review', updated_at = ?2
      WHERE civic_id = ?1
    `).bind(session.civic_id, now),
  ]);

  return {
    reset: true,
    resetAt: now,
    removed: counts,
    retained: {
      protectedDocuments: true,
      reviewedOcrTranscripts: true,
      evidenceContracts: true,
      learningGoals: true,
    },
  };
}

async function recordLearningEvaluation(request, env, input) {
  requireCivicV3(request, env);
  const session = await requireCivicSession(request, env);
  const summary = cleanText(input.summary, 4000);
  const goalText = cleanText(input.goalText || "", 800, false);
  const modelName = cleanText(input.modelName, 120);
  const modelResponseId = cleanText(input.modelResponseId || "", 160, false) || null;
  const confidence = Number(input.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new ClientError("The automated assessment confidence must be between 0 and 1.", 400, "learning_confidence_invalid");
  }
  const scores = Array.isArray(input.qScores) ? input.qScores : [];
  if (scores.length > 10 || new Set(scores.map((score) => score.qKey)).size !== scores.length) {
    throw new ClientError(
      "An automated assessment may store at most one supported score for each Ten-Q domain. Unsupported domains must remain Pending.",
      400,
      "learning_q_scores_invalid_set",
    );
  }
  for (const score of scores) {
    if (!LEARNING_Q_KEYS.has(score.qKey)
      || !Number.isInteger(Number(score.score))
      || Number(score.score) < 0
      || Number(score.score) > 100
      || !Number.isFinite(Number(score.confidence))
      || Number(score.confidence) < 0
      || Number(score.confidence) > 1
      || !LEARNING_EVIDENCE_KINDS.has(score.evidenceKind)
      || !LEARNING_TEMPORAL_CONTEXTS.has(score.temporalContext)
      || !Number.isFinite(Number(score.evidenceWeight))
      || Number(score.evidenceWeight) < 0
      || Number(score.evidenceWeight) > 1
      || !["broad", "domain_limited"].includes(score.domainScope)
      || (score.reportedStandardScore !== null
        && (!Number.isFinite(Number(score.reportedStandardScore))
          || Number(score.reportedStandardScore) < 0
          || Number(score.reportedStandardScore) > 200))
      || (score.reportedPercentile !== null
        && (!Number.isFinite(Number(score.reportedPercentile))
          || Number(score.reportedPercentile) < 0
          || Number(score.reportedPercentile) > 100))) {
      throw new ClientError("One or more Ten Q scores are invalid.", 400, "learning_q_score_invalid");
    }
  }
  const requestedDocumentIds = Array.isArray(input.documentIds)
    ? input.documentIds.map((value) => cleanText(value, 80)).slice(0, 12)
    : [];
  if (!requestedDocumentIds.length) {
    throw new ClientError("Choose at least one retained Learning document for the assessment.", 400, "learning_documents_required");
  }
  const ownedDocuments = await env.DB.prepare(`
    SELECT document_id FROM protected_documents
    WHERE civic_id = ?1 AND record_domain = 'learning'
      AND retention_status != 'deleted'
  `).bind(session.civic_id).all();
  const ownedIds = new Set((ownedDocuments.results || []).map((row) => row.document_id));
  if (requestedDocumentIds.some((documentId) => !ownedIds.has(documentId))) {
    throw new ClientError("A selected Learning document is not available to this citizen.", 403, "learning_document_forbidden");
  }
  const courseRows = await env.DB.prepare("SELECT course_id FROM usu_courses WHERE status = 'available'").all();
  const validCourses = new Set((courseRows.results || []).map((row) => row.course_id));
  const recommendations = (Array.isArray(input.recommendations) ? input.recommendations : [])
    .filter((item) => validCourses.has(item.courseId))
    .slice(0, 8);
  const observations = (Array.isArray(input.observations) ? input.observations : [])
    .filter((observation) => observation && typeof observation === "object")
    .slice(0, 30);
  const coverage = (Array.isArray(input.coverage) ? input.coverage : [])
    .filter((item) => item && ownedIds.has(item.documentId))
    .slice(0, requestedDocumentIds.length);
  const domainReviews = (Array.isArray(input.domainReviews) ? input.domainReviews : [])
    .filter((item) => item && AUTHORED_FICTION_Q_KEYS.includes(item.qKey))
    .slice(0, AUTHORED_FICTION_Q_KEYS.length);
  const acceptedContracts = await env.DB.prepare(`
    SELECT contract_id, document_id FROM learning_evidence_contracts
    WHERE civic_id = ?1 AND status = 'accepted'
  `).bind(session.civic_id).all();
  const contractDocuments = new Map(
    (acceptedContracts.results || []).map((row) => [row.contract_id, row.document_id]),
  );
  for (const observation of observations) {
    if (!ownedIds.has(observation.documentId)
      || contractDocuments.get(observation.contractId) !== observation.documentId) {
      throw new ClientError(
        "One or more Learning observations are not bound to this citizen's accepted evidence contract.",
        400,
        "learning_observation_contract_invalid",
      );
    }
  }
  const now = new Date().toISOString();
  const evaluationId = `USE-${crypto.randomUUID()}`;
  const evaluationStatus = scores.length > 0
    ? "completed"
    : "needs_more_evidence";
  let supersedesEvaluationId = null;
  if (requestedDocumentIds.length === 1) {
    const prior = await env.DB.prepare(`
      SELECT e.evaluation_id
      FROM learning_evaluations e
      JOIN learning_evaluation_documents d
        ON d.evaluation_id = e.evaluation_id
      WHERE e.civic_id = ?1 AND d.document_id = ?2
        AND e.status != 'superseded'
      ORDER BY e.created_at DESC, e.evaluation_id DESC
      LIMIT 1
    `).bind(session.civic_id, requestedDocumentIds[0]).first();
    supersedesEvaluationId = prior?.evaluation_id || null;
  }
  const statements = [
    env.DB.prepare(`
      INSERT INTO learning_evaluations (
        evaluation_id, civic_id, status, assessment_type, goal_text,
        consented_at, model_name, model_response_id, summary, confidence,
        created_at, completed_at, supersedes_evaluation_id,
        coverage_json, domain_reviews_json
      ) VALUES (
        ?1, ?2, ?9, 'automated_assessment', ?3, ?4, ?5, ?6, ?7, ?8,
        ?4, ?4, ?10, ?11, ?12
      )
    `).bind(
      evaluationId, session.civic_id, goalText, now, modelName,
      modelResponseId, summary, confidence, evaluationStatus,
      supersedesEvaluationId,
      JSON.stringify(coverage),
      JSON.stringify(domainReviews),
    ),
    env.DB.prepare(`
      UPDATE civic_profiles
      SET learning_tier = ?3, updated_at = ?2
      WHERE civic_id = ?1
    `).bind(
      session.civic_id,
      now,
      evaluationStatus === "completed" ? "Evidence Profile" : "Pending Evidence Review",
    ),
  ];
  if (supersedesEvaluationId) {
    statements.push(env.DB.prepare(`
      UPDATE learning_evaluations
      SET status = 'superseded'
      WHERE evaluation_id = ?1 AND civic_id = ?2
    `).bind(supersedesEvaluationId, session.civic_id));
  }
  for (const documentId of requestedDocumentIds) {
    statements.push(
      env.DB.prepare(`
        INSERT INTO learning_evaluation_documents (evaluation_id, document_id)
        VALUES (?1, ?2)
      `).bind(evaluationId, documentId),
      env.DB.prepare(`
        INSERT INTO protected_document_access_log (
          access_id, document_id, civic_id, action, actor_label, occurred_at
        ) VALUES (?1, ?2, ?3, 'evaluated', 'Automated Learning Assessment', ?4)
      `).bind(`USA-${crypto.randomUUID()}`, documentId, session.civic_id, now),
    );
  }
  for (const score of scores) {
    statements.push(env.DB.prepare(`
      INSERT INTO learning_q_scores (
        score_id, evaluation_id, civic_id, q_key, score, confidence,
        evidence_summary, evidence_citations_json, created_at,
        evidence_kind, temporal_context, evidence_weight, interpretive_basis,
        reported_standard_score, reported_percentile,
        normalized_estimate_method, domain_scope, domain_label
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13,
        ?14, ?15, ?16, ?17, ?18
      )
    `).bind(
      `USQ-${crypto.randomUUID()}`, evaluationId, session.civic_id,
      score.qKey, Number(score.score), Number(score.confidence),
      cleanText(score.evidenceSummary, 1200),
      JSON.stringify(Array.isArray(score.evidenceCitations) ? score.evidenceCitations.slice(0, 12) : []),
      now, score.evidenceKind, score.temporalContext,
      Number(score.evidenceWeight), cleanText(score.interpretiveBasis, 800),
      score.reportedStandardScore === null ? null : Number(score.reportedStandardScore),
      score.reportedPercentile === null ? null : Number(score.reportedPercentile),
      cleanText(score.normalizedEstimateMethod || "", 1200, false),
      score.domainScope,
      cleanText(score.domainLabel || "", 240, false),
    ));
  }
  for (const observation of observations) {
    statements.push(env.DB.prepare(`
      INSERT INTO learning_observations (
        observation_id, evaluation_id, civic_id, document_id, contract_id,
        actual_subject, subject_type, evidence_channel, primary_q_key,
        secondary_q_key, primary_subdomain_key, secondary_subdomain_key,
        secondary_justification, source_fact, observable_feature,
        rubric_connection, contextual_interpretation, ten_q_inference,
        limitations, alternative_explanations, scoring_rationale,
        bounded_citation, estimate, range_low, range_high,
        confidence, evidence_weight, evidence_kind, temporal_context,
        evidence_period_start, evidence_period_end, admission_status,
        rejection_reason, verification_state, evaluator_version, policy_version,
        created_at, moral_treatment_json
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14,
        ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26,
        ?27, ?28, ?29, ?30, ?31, ?32, ?33, ?34, ?35, ?36, ?37, ?38
      )
    `).bind(
      `USLO-${crypto.randomUUID()}`,
      evaluationId,
      session.civic_id,
      observation.documentId,
      observation.contractId,
      cleanText(observation.actualSubject, 240),
      observation.subjectType,
      observation.evidenceChannel,
      observation.primaryQKey,
      observation.secondaryQKey || null,
      observation.primarySubdomainKey,
      observation.secondarySubdomainKey || null,
      cleanText(observation.secondaryJustification || "", 800, false),
      cleanText(observation.sourceFact, 1800),
      cleanText(observation.observableFeature, 1800),
      cleanText(observation.rubricConnection, 1800),
      cleanText(observation.contextualInterpretation, 1800),
      cleanText(observation.tenQInference, 1800),
      cleanText(observation.limitations, 1800),
      cleanText(observation.alternativeExplanations, 1800),
      cleanText(observation.scoringRationale, 1800),
      cleanText(observation.boundedCitation, 700),
      Number(observation.estimate),
      Number(observation.rangeLow),
      Number(observation.rangeHigh),
      Number(observation.confidence),
      Number(observation.evidenceWeight),
      observation.evidenceKind,
      observation.temporalContext,
      observation.evidencePeriodStart || null,
      observation.evidencePeriodEnd || null,
      observation.admissionStatus,
      cleanText(observation.rejectionReason || "", 1000, false),
      observation.verificationState || "self_submitted",
      LEARNING_EVALUATOR_VERSION,
      LEARNING_POLICY_VERSION,
      now,
      JSON.stringify(Array.isArray(observation.moralTreatment)
        ? observation.moralTreatment.slice(0, 5) : []),
    ));
  }
  for (const recommendation of recommendations) {
    const recommendationType = [
      "strengthening", "advancement", "goal_based", "exploration", "prerequisite_bridge",
    ].includes(recommendation.type) ? recommendation.type : "exploration";
    const recommendationConfidence = Number(recommendation.confidence);
    statements.push(env.DB.prepare(`
      INSERT INTO learning_recommendations (
        recommendation_id, civic_id, evaluation_id, course_id,
        recommendation_type, rationale, confidence, status, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'suggested', ?8)
    `).bind(
      `USR-${crypto.randomUUID()}`, session.civic_id, evaluationId,
      recommendation.courseId, recommendationType,
      cleanText(recommendation.rationale, 1200),
      Number.isFinite(recommendationConfidence)
        ? Math.max(0, Math.min(1, recommendationConfidence))
        : confidence,
      now,
    ));
  }
  await env.DB.batch(statements);
  const allObservationRows = await env.DB.prepare(`
    SELECT o.*, e.status AS evaluation_status
    FROM learning_observations o
    JOIN learning_evaluations e ON e.evaluation_id = o.evaluation_id
    WHERE o.civic_id = ?1
    ORDER BY o.created_at, o.observation_id
  `).bind(session.civic_id).all();
  const allObservations = (allObservationRows.results || []).map(publicLearningObservation);
  const profileScores = synthesizeLearningEquityProfile(allObservations);
  const versionRow = await env.DB.prepare(`
    SELECT COALESCE(MAX(version_number), 0) AS latest
    FROM learning_profile_versions WHERE civic_id = ?1
  `).bind(session.civic_id).first();
  const versionNumber = Number(versionRow?.latest || 0) + 1;
  const evidenceSetHash = await digest(JSON.stringify(
    latestLearningObservationsByDocument(allObservations)
      .filter((observation) => observation.admissionStatus === "admitted")
      .map((observation) => ({
        observationId: observation.observationId,
        contractId: observation.contractId,
        estimate: observation.estimate,
        confidence: observation.confidence,
        evidenceWeight: observation.evidenceWeight,
        status: observation.admissionStatus,
      }))
      .sort((left, right) => left.observationId.localeCompare(right.observationId)),
  ));
  await env.DB.prepare(`
    INSERT INTO learning_profile_versions (
      profile_version_id, civic_id, version_number, evaluator_version,
      policy_version, evidence_set_hash, summary, profile_json, created_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
  `).bind(
    `USLP-${crypto.randomUUID()}`,
    session.civic_id,
    versionNumber,
    LEARNING_EVALUATOR_VERSION,
    LEARNING_POLICY_VERSION,
    evidenceSetHash,
    summary,
    JSON.stringify(profileScores),
    now,
  ).run();
  return {
    created: true,
    evaluationId,
    status: evaluationStatus,
    completedAt: now,
    observations,
    profileScores,
    profileVersion: versionNumber,
  };
}

async function requestUsuEnrollment(request, env, input) {
  const session = await requireCivicSession(request, env);
  const courseId = cleanText(input.courseId, 80);
  const course = await env.DB.prepare(`
    SELECT course_id, code, title FROM usu_courses
    WHERE course_id = ?1 AND status = 'available' LIMIT 1
  `).bind(courseId).first();
  if (!course) throw new ClientError("This course is not presently available.", 404, "course_not_found");
  const prerequisites = await env.DB.prepare(`
    SELECT p.*, c.code AS prerequisite_code
    FROM usu_course_prerequisites p
    LEFT JOIN usu_courses c ON c.course_id = p.prerequisite_course_id
    WHERE p.course_id = ?1
  `).bind(courseId).all();
  const latestScores = await env.DB.prepare(`
    SELECT s.q_key, s.score FROM learning_q_scores s
    JOIN learning_evaluations e ON e.evaluation_id = s.evaluation_id
    WHERE s.civic_id = ?1 AND e.status = 'completed'
    ORDER BY s.created_at DESC
  `).bind(session.civic_id).all();
  const scoreMap = new Map();
  for (const row of latestScores.results || []) {
    if (!scoreMap.has(row.q_key)) scoreMap.set(row.q_key, Number(row.score));
  }
  const completedCourses = await env.DB.prepare(`
    SELECT course_id FROM usu_enrollments
    WHERE civic_id = ?1 AND status = 'completed'
  `).bind(session.civic_id).all();
  const completedIds = new Set((completedCourses.results || []).map((row) => row.course_id));
  const unmet = [];
  for (const prerequisite of prerequisites.results || []) {
    if (prerequisite.prerequisite_course_id && !completedIds.has(prerequisite.prerequisite_course_id)) {
      unmet.push(`${prerequisite.prerequisite_code || "Required course"}: ${prerequisite.rationale}`);
    }
    if (prerequisite.q_key && (scoreMap.get(prerequisite.q_key) ?? -1) < Number(prerequisite.minimum_score)) {
      unmet.push(`${prerequisite.q_key} ${prerequisite.minimum_score}+: ${prerequisite.rationale}`);
    }
  }
  const now = new Date().toISOString();
  const enrollmentId = `USEN-${crypto.randomUUID()}`;
  const status = unmet.length ? "requested" : "enrolled";
  await env.DB.prepare(`
    INSERT INTO usu_enrollments (
      enrollment_id, civic_id, course_id, status, enrolled_at,
      created_at, updated_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
    ON CONFLICT(civic_id, course_id) DO UPDATE SET
      status = excluded.status,
      enrolled_at = excluded.enrolled_at,
      updated_at = excluded.updated_at
  `).bind(
    enrollmentId, session.civic_id, courseId, status,
    status === "enrolled" ? now : null, now,
  ).run();
  return { created: true, courseId, courseCode: course.code, status, unmetPrerequisites: unmet };
}

async function requestHealingAppointment(request, env, input) {
  const session = await requireCivicSession(request, env);
  const careDomain = cleanText(input.careDomain, 80);
  const privateReason = cleanText(input.privateReason, 1600);
  const preferredWindow = cleanText(input.preferredWindow || "", 200, false);
  const now = new Date().toISOString();
  const appointmentId = `USHAP-${crypto.randomUUID()}`;
  await env.DB.prepare(`
    INSERT INTO healing_appointment_requests (
      appointment_id, civic_id, care_domain, preference_json,
      private_reason, status, created_at, updated_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, 'requested', ?6, ?6)
  `).bind(
    appointmentId, session.civic_id, careDomain,
    JSON.stringify({ preferredWindow }), privateReason, now,
  ).run();
  return { created: true, appointmentId, status: "requested", createdAt: now };
}

async function reportHarmonyHarm(request, env, input) {
  const session = await requireCivicSession(request, env);
  const publicSummary = cleanText(input.publicSummary, 280);
  const privateDetails = cleanText(input.privateDetails, 2400);
  const respondingCivicId = cleanText(input.respondingCivicId || "", 80, false) || null;
  if (respondingCivicId) {
    const respondent = await civicProfile(env, respondingCivicId);
    if (!respondent) throw new ClientError("The responding civic profile could not be found.", 404, "respondent_not_found");
  }
  const now = new Date();
  const harmId = `USH-${crypto.randomUUID()}`;
  const profile = await civicProfile(env, session.civic_id);
  const event = await prepareEntry(env, {
    eventKey: `v3-local:${harmId}:reported`,
    eventType: "harm_reported",
    category: "harmony",
    title: "A private Harm report entered Harmony triage",
    summary: publicSummary,
    actorName: profile.civic_name,
    subjectName: profile.civic_name,
    subjectRef: session.civic_id,
    occurredAt: now.toISOString(),
    utopianDate: formatUtopianDate(now),
    gregorianDate: formatGregorianDate(now),
    sourceLabel: "Civic Portal · Harmony intake",
    sourceUrl: civicPageUrl(request, env, "/portal"),
    metadata: { harmId, privacyLevel: "participants", localSimulation: isLocalV3(env) },
  });
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO harms (
        harm_id, reporting_civic_id, responding_civic_id, privacy_level,
        public_summary, private_details_json, status, created_at, updated_at
      ) VALUES (?1, ?2, ?3, 'participants', ?4, ?5, 'reported', ?6, ?6)
    `).bind(
      harmId, session.civic_id, respondingCivicId, publicSummary,
      JSON.stringify({ narrative: privateDetails }), now.toISOString(),
    ),
    event.statement,
  ]);
  return { created: true, harmId, status: "reported", createdAt: now.toISOString() };
}

async function affirmContributionAssignment(request, env, assignmentId, input) {
  const session = await requireCivicSession(request, env);
  const civicId = session.civic_id;
  const idempotencyKey = cleanText(input.idempotencyKey, 100);
  const affirmedBy = cleanText(input.affirmedBy || "Circle of Affirmation · Local Steward", 160);
  const transactionId = `UST-${(await digest(`affirm:${assignmentId}:${idempotencyKey}`)).slice(0, 32)}`;
  const existing = await env.DB.prepare("SELECT * FROM ccu_transactions WHERE transaction_id = ?1 LIMIT 1").bind(transactionId).first();
  if (existing) {
    return { created: false, transactionId, amount: ccuFromMicros(existing.amount_micros), balanceAfter: ccuFromMicros(existing.balance_after_micros) };
  }
  const assignment = await env.DB.prepare(`
    SELECT a.*, p.title, p.position_id, p.base_ccu_micros, p.sep_multiplier_millis,
      COALESCE((SELECT SUM(t.minutes) FROM contribution_time_entries t
        WHERE t.assignment_id = a.assignment_id AND t.status IN ('recorded', 'submitted', 'affirmed')), 0) AS recorded_minutes
    FROM contribution_assignments a JOIN contribution_positions p ON p.position_id = a.position_id
    WHERE a.assignment_id = ?1 AND a.civic_id = ?2 LIMIT 1
  `).bind(assignmentId, civicId).first();
  if (!assignment) throw new ClientError("This contribution assignment could not be found.", 404, "assignment_not_found");
  if (assignment.status !== "submitted") {
    throw new ClientError("Only submitted contribution evidence can be affirmed.", 409, "assignment_not_submitted");
  }
  const [profile, account] = await Promise.all([
    civicProfile(env, civicId),
    env.DB.prepare("SELECT balance_micros FROM ccu_accounts WHERE civic_id = ?1 LIMIT 1").bind(civicId).first(),
  ]);
  if (!account) throw new ClientError("This citizen does not have a CCU account.", 409, "ccu_account_missing");
  const recordedMinutes = Number(assignment.recorded_minutes || 0);
  if (recordedMinutes < 1) {
    throw new ClientError("No contribution time is available for affirmation.", 409, "time_entry_required");
  }
  const amountMicros = Math.round((recordedMinutes / 60) * 1_000_000 * Number(assignment.sep_multiplier_millis) / 1000);
  const balanceAfterMicros = Number(account.balance_micros) + amountMicros;
  const now = new Date();
  const event = await prepareEntry(env, {
    eventKey: `v3-local:${assignmentId}:affirmed`,
    eventType: "contribution_affirmed",
    category: "contribution",
    title: `${assignment.title} affirmed` ,
    summary: `${profile.civic_name}’s contribution was affirmed at a ${Number(assignment.sep_multiplier_millis) / 1000} SEP multiplier, crediting ${ccuFromMicros(amountMicros)} CCUs.`,
    actorName: affirmedBy,
    subjectName: profile.civic_name,
    subjectRef: civicId,
    occurredAt: now.toISOString(),
    utopianDate: formatUtopianDate(now),
    gregorianDate: formatGregorianDate(now),
    sourceLabel: "Civic Portal · Contribution and Affirmation",
    sourceUrl: civicPageUrl(request, env, "/portal"),
    metadata: {
      assignmentId,
      positionId: assignment.position_id,
      transactionId,
      recordedHours: recordedMinutes / 60,
      sepMultiplier: Number(assignment.sep_multiplier_millis) / 1000,
      creditedCcu: ccuFromMicros(amountMicros),
      balanceAfterCcu: ccuFromMicros(balanceAfterMicros),
      localSimulation: isLocalV3(env),
    },
  });
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE contribution_assignments
      SET status = 'affirmed', affirmed_at = ?2, affirmed_by = ?3, updated_at = ?2
      WHERE assignment_id = ?1 AND status = 'submitted'
    `).bind(assignmentId, now.toISOString(), affirmedBy),
    env.DB.prepare(`
      INSERT INTO ccu_transactions (
        transaction_id, civic_id, assignment_id, transaction_type, amount_micros,
        balance_after_micros, description, idempotency_key, created_at
      ) VALUES (?1, ?2, ?3, 'contribution_credit', ?4, ?5, ?6, ?7, ?8)
    `).bind(
      transactionId, civicId, assignmentId, amountMicros, balanceAfterMicros,
      `${assignment.title} · ${recordedMinutes / 60} recorded hours × 1 CCU/hour × SEP ${Number(assignment.sep_multiplier_millis) / 1000}`,
      idempotencyKey, now.toISOString(),
    ),
    env.DB.prepare(`
      INSERT INTO civic_value_flows (
        flow_id, civic_id, assignment_id, flow_type, amount_micros,
        balance_after_micros, source_label, purpose, utopian_date,
        occurred_at, idempotency_key
      ) VALUES (?1, ?2, ?3, 'earned', ?4, ?5, ?6, ?7, ?8, ?9, ?10)
    `).bind(
      `USF-${crypto.randomUUID()}`, civicId, assignmentId, amountMicros, balanceAfterMicros,
      "Circle of Contribution · affirmed service", assignment.title, formatUtopianDate(now),
      now.toISOString(), `flow:${idempotencyKey}`,
    ),
    env.DB.prepare(`
      UPDATE contribution_time_entries
      SET status = 'affirmed', affirmed_at = ?2
      WHERE assignment_id = ?1 AND status IN ('recorded', 'submitted')
    `).bind(assignmentId, now.toISOString()),
    env.DB.prepare("UPDATE ccu_accounts SET balance_micros = ?2, updated_at = ?3 WHERE civic_id = ?1")
      .bind(civicId, balanceAfterMicros, now.toISOString()),
    env.DB.prepare("UPDATE civic_profiles SET contribution_status = ?2, updated_at = ?3 WHERE civic_id = ?1")
      .bind(civicId, `affirmed · ${assignment.title}`, now.toISOString()),
    event.statement,
  ]);
  return {
    created: true,
    transactionId,
    ledgerId: event.id,
    amount: ccuFromMicros(amountMicros),
    balanceAfter: ccuFromMicros(balanceAfterMicros),
  };
}

function publicAnnouncement(row) {
  return {
    announcementId: row.announcement_id,
    label: row.label,
    href: row.href,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    priority: Number(row.priority),
    sortOrder: Number(row.sort_order || 0),
    treatment: row.treatment || "standard",
    createdBy: row.created_by,
    updatedBy: row.updated_by || row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || null,
  };
}

const TICKER_TREATMENTS = new Set(["standard", "vellum", "alternating", "urgent", "pulse"]);
const TICKER_ANNOUNCEMENT_STATUSES = new Set(["draft", "scheduled", "active", "paused", "expired", "archived"]);
const TICKER_SOURCE_STATUSES = new Set(["active", "paused", "archived"]);
const TICKER_WEATHER_MODES = new Set(["land", "marine", "combined"]);
const REQUIRED_TICKER_SOURCE_IDS = new Set(["TIS-WEATHER", "TIS-REFERENCE-TIME"]);
const TICKER_FETCH_LIMIT = 512 * 1024;

function tickerTreatment(value, fallback = "standard") {
  return TICKER_TREATMENTS.has(value) ? value : fallback;
}

function tickerNumber(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, parsed)) : fallback;
}

function tickerActor(session) {
  return cleanText(session?.civic_name || session?.login_name || "Authorized civic representative", 160);
}

function tickerDestination(value) {
  const href = cleanText(value, 500, false);
  if (!href) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  let parsed;
  try {
    parsed = new URL(href);
  } catch {
    throw new ClientError("The ticker destination must be a Society path or secure HTTPS address.", 400, "ticker_destination_invalid");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new ClientError("The ticker destination must be a Society path or secure HTTPS address.", 400, "ticker_destination_invalid");
  }
  return parsed.toString();
}

function tickerRssUrl(value) {
  const raw = cleanText(value, 800);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ClientError("Enter a complete HTTPS RSS or Atom feed address.", 400, "ticker_source_url_invalid");
  }
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  const blockedName = hostname === "localhost"
    || [".localhost", ".local", ".internal", ".lan", ".home", ".test", ".invalid", ".nip.io", ".sslip.io", ".localtest.me"].some((suffix) => hostname.endsWith(suffix));
  const ipLiteral = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
    || /^\d+$/.test(hostname)
    || /^0x[0-9a-f]+$/i.test(hostname)
    || hostname.includes(":");
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || (parsed.port && parsed.port !== "443") || blockedName || ipLiteral) {
    throw new ClientError("RSS sources must use a public HTTPS hostname.", 400, "ticker_source_url_unsafe");
  }
  parsed.hash = "";
  return parsed.toString();
}

function publicTickerSource(row) {
  return {
    sourceId: row.source_id,
    sourceKey: row.source_key,
    label: row.label,
    sourceType: row.source_type,
    endpointUrl: row.endpoint_url || null,
    creditUrl: row.credit_url || null,
    prefix: row.prefix || "",
    enabled: Boolean(row.enabled),
    status: row.status,
    priority: Number(row.priority),
    sortOrder: Number(row.sort_order),
    treatment: row.treatment || "standard",
    itemLimit: Number(row.item_limit),
    refreshMinutes: Number(row.refresh_minutes),
    builtIn: Boolean(row.built_in),
    required: REQUIRED_TICKER_SOURCE_IDS.has(row.source_id),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    lastCheckedAt: row.last_checked_at || null,
    lastSuccessAt: row.last_success_at || null,
    lastError: row.last_error || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || null,
  };
}

function publicTickerWeatherLocation(row) {
  return {
    locationId: row.location_id,
    locationKey: row.location_key,
    sourceId: row.source_id,
    label: row.label,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    timezone: row.timezone || "UTC",
    conditionsMode: row.conditions_mode || "combined",
    enabled: Boolean(row.enabled),
    status: row.status,
    priority: Number(row.priority),
    sortOrder: Number(row.sort_order),
    treatment: row.treatment || "standard",
    refreshMinutes: Number(row.refresh_minutes),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    lastCheckedAt: row.last_checked_at || null,
    lastSuccessAt: row.last_success_at || null,
    lastError: row.last_error || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || null,
  };
}

function publicTickerFeedItem(row) {
  return {
    itemId: row.item_id,
    sourceId: row.source_id,
    weatherLocationId: row.weather_location_id || null,
    label: row.label,
    href: row.href || null,
    publishedAt: row.published_at || null,
    fetchedAt: row.fetched_at,
    current: Boolean(row.is_current),
    suppressed: Boolean(row.suppressed),
    suppressedBy: row.suppressed_by || null,
    suppressedAt: row.suppressed_at || null,
  };
}

function publicPublication(row) {
  return {
    publicationId: row.publication_id,
    wordpressId: row.wordpress_id,
    slug: row.slug,
    type: row.publication_type,
    title: row.title,
    status: row.status,
    canonicalUrl: row.canonical_url,
    excerpt: row.excerpt || "",
    contentMarkdown: row.content_markdown || "",
    contentHtml: row.content_html || "",
    featuredImage: row.featured_image,
    authorName: row.author_name || "Adreto Nagdo Senoviros",
    publicationDate: row.publication_date,
    utopianDate: row.utopian_date,
    gregorianDate: row.gregorian_date,
    sourceModifiedAt: row.source_modified_at,
    synchronizedAt: row.synchronized_at,
    sourceUrl: row.source_url,
    readingMinutes: Number(row.reading_minutes || 1),
    wordCount: Number(row.word_count || 0),
    metadata: parseStoredJson(row.metadata_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const DEFAULT_WORDPRESS_ORIGIN = "https://utopiansocietycorpus.wpcomstaging.com";
const DEFAULT_PUBLIC_SITE_ORIGIN = "https://utopiansocietycorpus.org";

function decodeWordpressText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#039;/gi, "'")
    .replace(/&hellip;/gi, "…")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&rsquo;|&lsquo;/gi, "’")
    .replace(/&rdquo;|&ldquo;/gi, "”")
    .replace(/\s+/g, " ")
    .trim();
}

function safeWordpressHtml(value) {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .slice(0, 500_000);
}

function wordpressUtcDate(value) {
  const source = String(value || "").trim();
  if (!source) return null;
  const normalized = /(?:Z|[+-]\d\d:\d\d)$/i.test(source) ? source : `${source}Z`;
  return Number.isNaN(Date.parse(normalized)) ? null : new Date(normalized).toISOString();
}

function wordpressTerms(post, taxonomy) {
  const groups = post?._embedded?.["wp:term"];
  if (!Array.isArray(groups)) return [];
  return groups.flat().filter((term) => term?.taxonomy === taxonomy).map((term) => decodeWordpressText(term.name)).filter(Boolean);
}

function normalizeWordpressPost(post, env, synchronizedAt) {
  const wordpressId = Number(post?.id);
  if (!Number.isInteger(wordpressId) || wordpressId < 1) throw new Error("WordPress returned a post without a valid numeric ID.");
  const slug = publicationSlug(post.slug);
  const title = decodeWordpressText(post?.title?.rendered).slice(0, 240);
  if (!title) throw new Error(`WordPress post ${wordpressId} has no usable title.`);
  const contentHtml = safeWordpressHtml(post?.content?.rendered);
  const plainContent = decodeWordpressText(contentHtml);
  const wordCount = plainContent ? plainContent.split(/\s+/).length : 0;
  const publicationDate = wordpressUtcDate(post.date_gmt || post.date);
  const sourceModifiedAt = wordpressUtcDate(post.modified_gmt || post.modified) || publicationDate;
  const publicOrigin = String(env.PUBLIC_SITE_ORIGIN || DEFAULT_PUBLIC_SITE_ORIGIN).replace(/\/$/, "");
  const featured = post?._embedded?.["wp:featuredmedia"]?.[0];
  const author = post?._embedded?.author?.[0];
  const excerpt = decodeWordpressText(post?.excerpt?.rendered || plainContent).slice(0, 600);
  return {
    publicationId: `WP-${wordpressId}`,
    wordpressId,
    slug,
    title,
    canonicalUrl: `${publicOrigin}/blogs-essays/${slug}`,
    sourceUrl: cleanText(post.link, 1_000, false) || `${String(env.WORDPRESS_ORIGIN || DEFAULT_WORDPRESS_ORIGIN).replace(/\/$/, "")}/${slug}/`,
    sourceModifiedAt,
    synchronizedAt,
    excerpt,
    contentHtml,
    featuredImage: cleanText(featured?.source_url, 1_000, false) || null,
    featuredAlt: cleanText(featured?.alt_text, 500, false),
    authorName: decodeWordpressText(author?.name) || "Adreto Nagdo Senoviros",
    publicationDate,
    utopianDate: publicationDate ? formatUtopianDate(new Date(publicationDate)) : null,
    gregorianDate: publicationDate ? formatGregorianDate(new Date(publicationDate)) : null,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 225)),
    wordCount,
    categories: wordpressTerms(post, "category"),
    tags: wordpressTerms(post, "post_tag"),
  };
}

async function fetchWordpressPage(env, page) {
  const origin = String(env.WORDPRESS_ORIGIN || DEFAULT_WORDPRESS_ORIGIN).replace(/\/$/, "");
  const endpoint = new URL(`${origin}/wp-json/wp/v2/posts`);
  endpoint.searchParams.set("status", "publish");
  endpoint.searchParams.set("per_page", "100");
  endpoint.searchParams.set("page", String(page));
  endpoint.searchParams.set("orderby", "modified");
  endpoint.searchParams.set("order", "desc");
  endpoint.searchParams.set("_embed", "author,wp:featuredmedia,wp:term");
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json", "User-Agent": "Utopian-Society-Publication-Bridge/1.0" },
    redirect: "follow",
  });
  const contentType = response.headers.get("Content-Type") || "";
  if (!response.ok || !contentType.toLowerCase().includes("json")) {
    throw new Error(`WordPress editorial origin returned HTTP ${response.status} (${contentType || "unknown content type"}).`);
  }
  const posts = await response.json();
  if (!Array.isArray(posts)) throw new Error("WordPress editorial origin returned an invalid post collection.");
  const totalPages = Math.max(1, Math.min(20, Number(response.headers.get("X-WP-TotalPages")) || 1));
  return { posts, totalPages };
}

async function markWordpressSync(env, values) {
  await env.DB.prepare(`
    UPDATE editorial_sync_state
    SET cursor_value = COALESCE(?2, cursor_value), last_success_at = COALESCE(?3, last_success_at),
        last_attempt_at = ?1, status = ?4, message = ?5
    WHERE source_key = 'wordpress-live-bridge'
  `).bind(values.attemptedAt, values.cursor || null, values.succeededAt || null, values.status, values.message).run();
}

async function syncWordpressArchive(env) {
  const attemptedAt = new Date().toISOString();
  await markWordpressSync(env, {
    attemptedAt,
    status: "running",
    message: "Reading published material from the WordPress editorial origin.",
  });
  try {
    const first = await fetchWordpressPage(env, 1);
    const sourcePosts = [...first.posts];
    for (let page = 2; page <= first.totalPages; page += 1) {
      sourcePosts.push(...(await fetchWordpressPage(env, page)).posts);
    }
    if (sourcePosts.length < 1) throw new Error("WordPress returned no published posts; the last-known-good archive was retained.");
    const synchronizedAt = new Date().toISOString();
    const posts = sourcePosts.map((post) => normalizeWordpressPost(post, env, synchronizedAt));
    const statements = [env.DB.prepare("DELETE FROM publications WHERE wordpress_id IS NOT NULL")];
    for (const post of posts) {
      statements.push(env.DB.prepare(`
        INSERT INTO publications (
          publication_id, wordpress_id, slug, publication_type, title, status,
          canonical_url, source_modified_at, synchronized_at, metadata_json,
          excerpt, content_markdown, featured_image, author_name, publication_date,
          utopian_date, gregorian_date, created_at, updated_at, content_html,
          source_url, reading_minutes, word_count
        ) VALUES (
          ?1, ?2, ?3, 'post', ?4, 'published', ?5, ?6, ?7, ?8,
          ?9, '', ?10, ?11, ?12, ?13, ?14, ?7, ?7, ?15, ?16, ?17, ?18
        )
      `).bind(
        post.publicationId, post.wordpressId, post.slug, post.title, post.canonicalUrl,
        post.sourceModifiedAt, post.synchronizedAt, JSON.stringify({
          categories: post.categories,
          tags: post.tags,
          featuredAlt: post.featuredAlt,
          source: "wordpress-live-bridge",
          editorialOrigin: env.WORDPRESS_ORIGIN || DEFAULT_WORDPRESS_ORIGIN,
        }),
        post.excerpt, post.featuredImage, post.authorName, post.publicationDate,
        post.utopianDate, post.gregorianDate, post.contentHtml, post.sourceUrl,
        post.readingMinutes, post.wordCount,
      ));
    }
    const newest = posts.map((post) => post.sourceModifiedAt || "").sort().at(-1) || synchronizedAt;
    statements.push(env.DB.prepare(`
      UPDATE editorial_sync_state
      SET cursor_value = ?1, last_success_at = ?2, last_attempt_at = ?2,
          status = 'succeeded', message = ?3
      WHERE source_key = 'wordpress-live-bridge'
    `).bind(newest, synchronizedAt, `${posts.length} published WordPress posts synchronized read-only.`));
    await env.DB.batch(statements);
    console.log(JSON.stringify({ level: "info", message: "wordpress-publications-synchronized", count: posts.length, newest }));
    return { synchronized: posts.length, synchronizedAt, newest, remoteWrites: false };
  } catch (error) {
    await markWordpressSync(env, {
      attemptedAt,
      status: "failed",
      message: boundedGeneratedText(String(error?.message || error), 500, "WordPress synchronization failed."),
    });
    throw error;
  }
}

async function listPublications(env, url) {
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const type = ["post", "page", "announcement"].includes(url.searchParams.get("type")) ? url.searchParams.get("type") : "post";
  const result = await env.DB.prepare(`
    SELECT * FROM publications
    WHERE status = 'published' AND publication_type = ?1
    ORDER BY COALESCE(publication_date, created_at) DESC
    LIMIT ?2
  `).bind(type, limit).all();
  return { publications: (result.results || []).map(publicPublication), lastKnownGood: true };
}

async function publicPublicationBySlug(env, slug) {
  const row = await env.DB.prepare(`
    SELECT * FROM publications WHERE slug = ?1 AND status = 'published' LIMIT 1
  `).bind(publicationSlug(slug)).first();
  if (!row) throw new ClientError("Publication not found.", 404, "publication_not_found");
  return { publication: publicPublication(row), lastKnownGood: true };
}

function publicAnalyticsPath(value) {
  const path = String(value || "").trim().split(/[?#]/)[0];
  if (!/^\/[a-z0-9_~!$&'()*+,;=:@%\/-]*$/i.test(path) || path.length > 500) {
    throw new ClientError("The analytics path is invalid.");
  }
  if (/^\/(?:portal|login|editorial|api)(?:\/|$)/.test(path)) {
    throw new ClientError("Private application paths are not measured.", 403, "private_path");
  }
  return path || "/";
}

function analyticsSource(input) {
  const ownHosts = new Set(["utopiansocietycorpus.org", "www.utopiansocietycorpus.org"]);
  const host = String(input.referrerHost || "").toLowerCase().replace(/^www\./, "").slice(0, 200);
  const utmSource = cleanText(input.utmSource, 100, false).toLowerCase();
  const medium = cleanText(input.utmMedium, 100, false).toLowerCase();
  const campaign = cleanText(input.utmCampaign, 160, false);
  if (utmSource) return { group: "campaign", detail: utmSource, medium, campaign };
  if (!host) return { group: "direct", detail: "", medium: "", campaign: "" };
  if (ownHosts.has(host) || host.endsWith(".utopiansocietycorpus.org")) return { group: "internal", detail: host, medium: "", campaign: "" };
  if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave)\./.test(host)) return { group: "search", detail: host, medium: "organic", campaign: "" };
  if (/(^|\.)(facebook|instagram|linkedin|reddit|x|twitter|threads|bsky)\./.test(host)) return { group: "social", detail: host, medium: "referral", campaign: "" };
  return { group: "referral", detail: host, medium: "referral", campaign: "" };
}

async function recordPublicAnalytics(request, env, input) {
  requirePublicOrigin(request);
  const path = publicAnalyticsPath(input.path);
  const source = analyticsSource(input);
  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(`
    INSERT INTO public_analytics_daily (
      day_utc, path, source_group, source_detail, medium, campaign, views
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1)
    ON CONFLICT(day_utc, path, source_group, source_detail, medium, campaign)
    DO UPDATE SET views = views + 1
  `).bind(day, path, source.group, source.detail, source.medium, source.campaign).run();
  return { recorded: true, aggregateOnly: true };
}

async function editorialAnalytics(request, env, url) {
  await requireEditorialAuthority(request, env);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days")) || 30));
  const since = new Date(Date.now() - (days - 1) * DAY_IN_MS).toISOString().slice(0, 10);
  const [totals, sources, paths, daily] = await Promise.all([
    env.DB.prepare(`SELECT COALESCE(SUM(views), 0) AS views FROM public_analytics_daily WHERE day_utc >= ?1`).bind(since).first(),
    env.DB.prepare(`SELECT source_group, source_detail, SUM(views) AS views FROM public_analytics_daily WHERE day_utc >= ?1 GROUP BY source_group, source_detail ORDER BY views DESC LIMIT 30`).bind(since).all(),
    env.DB.prepare(`SELECT path, SUM(views) AS views FROM public_analytics_daily WHERE day_utc >= ?1 GROUP BY path ORDER BY views DESC LIMIT 30`).bind(since).all(),
    env.DB.prepare(`SELECT day_utc, SUM(views) AS views FROM public_analytics_daily WHERE day_utc >= ?1 GROUP BY day_utc ORDER BY day_utc ASC`).bind(since).all(),
  ]);
  return {
    days,
    since,
    totalViews: Number(totals?.views || 0),
    sources: sources.results || [],
    paths: paths.results || [],
    daily: daily.results || [],
    privacy: "Aggregate page views only; no IP, civic identity, user agent, or full referrer URL is retained.",
  };
}

async function editorialStatus(request, env) {
  await requireEditorialAuthority(request, env);
  const [publicationCounts, announcementCounts, syncState, recentPublications, recentAnnouncements] = await Promise.all([
    env.DB.prepare(`
      SELECT publication_type, status, COUNT(*) AS count
      FROM publications GROUP BY publication_type, status ORDER BY publication_type, status
    `).all(),
    env.DB.prepare(`SELECT status, COUNT(*) AS count FROM ticker_announcements GROUP BY status ORDER BY status`).all(),
    env.DB.prepare(`SELECT * FROM editorial_sync_state ORDER BY source_key`).all(),
    env.DB.prepare(`SELECT * FROM publications ORDER BY COALESCE(updated_at, synchronized_at, source_modified_at) DESC LIMIT 12`).all(),
    env.DB.prepare(`SELECT * FROM ticker_announcements ORDER BY priority DESC, updated_at DESC LIMIT 12`).all(),
  ]);
  return {
    localSimulation: env.DEPLOYMENT_MODE === "local-v3",
    productionFrozen: env.PUBLIC_SITE_FROZEN === "true",
    wordpressBridge: {
      mode: "read-only scheduled synchronization",
      remoteWritesEnabled: false,
      purpose: "Keep WordPress and Jetpack as the editorial origin while the Cloudflare/Sites facade renders a last-known-good public copy.",
    },
    publicationCounts: publicationCounts.results || [],
    announcementCounts: announcementCounts.results || [],
    syncState: syncState.results || [],
    recentPublications: (recentPublications.results || []).map(publicPublication),
    recentAnnouncements: (recentAnnouncements.results || []).map(publicAnnouncement),
  };
}

async function wordpressHandoffManifest(request, env) {
  await requireEditorialAuthority(request, env);
  const result = await env.DB.prepare(`
    SELECT * FROM publications
    WHERE status = 'draft'
    ORDER BY COALESCE(updated_at, created_at, publication_date) ASC
  `).all();
  const publications = (result.results || []).map(publicPublication).map((publication) => ({
    publicationId: publication.publicationId,
    type: publication.type,
    title: publication.title,
    slug: publication.slug,
    excerpt: publication.excerpt,
    contentMarkdown: publication.contentMarkdown,
    featuredImage: publication.featuredImage,
    authorName: publication.authorName,
    proposedPublicationDate: publication.publicationDate,
    utopianDate: publication.utopianDate,
    gregorianReference: publication.gregorianDate,
    canonicalUrl: publication.canonicalUrl,
    metadata: publication.metadata,
  }));
  return {
    manifestVersion: "wordpress-reviewed-handoff-v1",
    generatedAt: new Date().toISOString(),
    localSimulation: isLocalV3(env),
    productionFrozen: env.PUBLIC_SITE_FROZEN === "true",
    remoteWritesEnabled: false,
    reviewRequired: true,
    target: "WordPress.com public editorial surface with Jetpack continuity",
    instructions: "Review every field, image, canonical slug, and Utopian date before enabling any future authenticated WordPress write.",
    count: publications.length,
    publications,
  };
}

async function listTickerAnnouncements(request, env, url) {
  await requireEditorialAuthority(request, env);
  const includeAll = url.searchParams.get("all") === "1";
  const now = new Date().toISOString();
  const result = includeAll
    ? await env.DB.prepare(`SELECT * FROM ticker_announcements ORDER BY priority DESC, updated_at DESC`).all()
    : await env.DB.prepare(`
        SELECT * FROM ticker_announcements
        WHERE status = 'active'
          AND (starts_at IS NULL OR starts_at <= ?1)
          AND (ends_at IS NULL OR ends_at > ?1)
        ORDER BY priority DESC, created_at ASC
      `).bind(now).all();
  return { announcements: (result.results || []).map(publicAnnouncement), localSimulation: isLocalV3(env) };
}

async function createTickerAnnouncement(request, env, input) {
  const session = await requireEditorialAuthority(request, env);
  const actorName = tickerActor(session);
  const label = cleanText(input.label, 240);
  const href = tickerDestination(input.href);
  const status = ["draft", "scheduled", "active", "paused"].includes(input.status) ? input.status : "draft";
  const priority = tickerNumber(input.priority, 10, -100, 100);
  const sortOrder = tickerNumber(input.sortOrder, 0, -1000, 1000);
  const treatment = tickerTreatment(input.treatment);
  const startsAt = cleanText(input.startsAt, 40, false) || null;
  const endsAt = cleanText(input.endsAt, 40, false) || null;
  if (status === "scheduled" && !startsAt) throw new ClientError("A scheduled notice needs a beginning date.");
  if (startsAt && Number.isNaN(Date.parse(startsAt))) throw new ClientError("The announcement start is not a valid date.");
  if (endsAt && Number.isNaN(Date.parse(endsAt))) throw new ClientError("The announcement end is not a valid date.");
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    throw new ClientError("The announcement must end after it begins.");
  }
  const now = new Date().toISOString();
  const announcementId = `UTA-${crypto.randomUUID()}`;
  const event = await prepareEntry(env, {
    eventKey: `civic-portal:${announcementId}:created`,
    eventType: "ticker_announcement_created",
    category: "editorial",
    title: "Civic-wire notice prepared",
    summary: label,
    actorName,
    subjectName: "The Utopian Society public civic wire",
    subjectRef: announcementId,
    occurredAt: now,
    utopianDate: formatUtopianDate(new Date(now)),
    gregorianDate: formatGregorianDate(new Date(now)),
    sourceLabel: "Editorial Studio · Civic wire",
    sourceUrl: civicPageUrl(request, env, "/editorial"),
    metadata: { announcementId, status, startsAt, endsAt, priority, sortOrder, treatment, localSimulation: isLocalV3(env) },
  });
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO ticker_announcements (
        announcement_id, label, href, status, starts_at, ends_at, priority, sort_order,
        treatment, created_by, updated_by, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10, ?11, ?11)
    `).bind(announcementId, label, href, status, startsAt, endsAt, priority, sortOrder, treatment, actorName, now),
    event.statement,
  ]);
  const row = await env.DB.prepare("SELECT * FROM ticker_announcements WHERE announcement_id = ?1").bind(announcementId).first();
  return { created: true, announcement: publicAnnouncement(row) };
}

async function updateTickerAnnouncement(request, env, announcementId, input) {
  const session = await requireEditorialAuthority(request, env);
  const actorName = tickerActor(session);
  const existing = await env.DB.prepare("SELECT * FROM ticker_announcements WHERE announcement_id = ?1")
    .bind(announcementId).first();
  if (!existing) throw new ClientError("That ticker notice was not found.", 404, "ticker_announcement_not_found");

  const label = Object.hasOwn(input, "label") ? cleanText(input.label, 240) : existing.label;
  const href = Object.hasOwn(input, "href") ? tickerDestination(input.href) : existing.href;
  const status = Object.hasOwn(input, "status") ? cleanText(input.status, 20) : existing.status;
  if (!TICKER_ANNOUNCEMENT_STATUSES.has(status)) throw new ClientError("Select a supported ticker status.");
  const startsAt = Object.hasOwn(input, "startsAt") ? cleanText(input.startsAt, 40, false) || null : existing.starts_at;
  const endsAt = Object.hasOwn(input, "endsAt") ? cleanText(input.endsAt, 40, false) || null : existing.ends_at;
  const priority = Object.hasOwn(input, "priority") ? tickerNumber(input.priority, 10, -100, 100) : Number(existing.priority);
  const sortOrder = Object.hasOwn(input, "sortOrder") ? tickerNumber(input.sortOrder, 0, -1000, 1000) : Number(existing.sort_order);
  const treatment = Object.hasOwn(input, "treatment") ? tickerTreatment(input.treatment, existing.treatment) : existing.treatment;
  if (status === "scheduled" && !startsAt) throw new ClientError("A scheduled notice needs a beginning date.");
  if (startsAt && Number.isNaN(Date.parse(startsAt))) throw new ClientError("The announcement start is not a valid date.");
  if (endsAt && Number.isNaN(Date.parse(endsAt))) throw new ClientError("The announcement end is not a valid date.");
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) throw new ClientError("The announcement must end after it begins.");

  const now = new Date().toISOString();
  const archivedAt = status === "archived" ? existing.archived_at || now : null;
  const eventType = status === "archived" && existing.status !== "archived"
    ? "ticker_announcement_archived"
    : existing.status === "archived" && status !== "archived"
      ? "ticker_announcement_restored"
      : "ticker_announcement_updated";
  const action = eventType.endsWith("archived") ? "archived" : eventType.endsWith("restored") ? "restored" : "updated";
  const event = await prepareEntry(env, {
    eventKey: `civic-portal:${announcementId}:${eventType}:${crypto.randomUUID()}`,
    eventType,
    category: "editorial",
    title: `Civic-wire notice ${action}`,
    summary: `${actorName} ${action} the civic-wire notice “${label}.”`,
    actorName,
    subjectName: label,
    subjectRef: announcementId,
    occurredAt: now,
    utopianDate: formatUtopianDate(new Date(now)),
    gregorianDate: formatGregorianDate(new Date(now)),
    sourceLabel: "Editorial Studio · Civic wire",
    sourceUrl: civicPageUrl(request, env, "/editorial"),
    metadata: { announcementId, previousStatus: existing.status, status, startsAt, endsAt, priority, sortOrder, treatment },
  });
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE ticker_announcements SET
        label = ?2, href = ?3, status = ?4, starts_at = ?5, ends_at = ?6,
        priority = ?7, sort_order = ?8, treatment = ?9, updated_by = ?10,
        updated_at = ?11, archived_at = ?12
      WHERE announcement_id = ?1
    `).bind(announcementId, label, href, status, startsAt, endsAt, priority, sortOrder, treatment, actorName, now, archivedAt),
    event.statement,
  ]);
  const row = await env.DB.prepare("SELECT * FROM ticker_announcements WHERE announcement_id = ?1")
    .bind(announcementId).first();
  return { updated: true, announcement: publicAnnouncement(row) };
}

function tickerSourceInput(input, existing = null) {
  const label = Object.hasOwn(input, "label") ? cleanText(input.label, 120) : existing?.label;
  const prefix = Object.hasOwn(input, "prefix") ? cleanText(input.prefix, 40, false) : existing?.prefix || "";
  const status = Object.hasOwn(input, "status") ? cleanText(input.status, 20) : existing?.status || "active";
  if (!TICKER_SOURCE_STATUSES.has(status)) throw new ClientError("Select a supported ticker-source status.");
  const endpointUrl = existing?.built_in
    ? existing.endpoint_url
    : Object.hasOwn(input, "endpointUrl") ? tickerRssUrl(input.endpointUrl) : existing?.endpoint_url;
  if (!endpointUrl && (!existing || existing.source_type === "rss")) throw new ClientError("An RSS source needs a feed address.");
  const creditUrl = Object.hasOwn(input, "creditUrl")
    ? tickerDestination(input.creditUrl)
    : existing?.credit_url || (endpointUrl ? new URL(endpointUrl).origin : null);
  const enabled = Object.hasOwn(input, "enabled") ? Boolean(input.enabled) : existing ? Boolean(existing.enabled) : true;
  if (existing && REQUIRED_TICKER_SOURCE_IDS.has(existing.source_id) && (!enabled || status !== "active")) {
    throw new ClientError("Utopian Reference Time and the weather collection are required civic-wire sources.", 409, "required_ticker_source");
  }
  return {
    label,
    prefix,
    endpointUrl,
    creditUrl,
    enabled,
    status,
    priority: Object.hasOwn(input, "priority") ? tickerNumber(input.priority, 10, -100, 100) : Number(existing?.priority ?? 10),
    sortOrder: Object.hasOwn(input, "sortOrder") ? tickerNumber(input.sortOrder, 0, -1000, 1000) : Number(existing?.sort_order ?? 0),
    treatment: Object.hasOwn(input, "treatment") ? tickerTreatment(input.treatment, existing?.treatment) : existing?.treatment || "standard",
    itemLimit: Object.hasOwn(input, "itemLimit") ? tickerNumber(input.itemLimit, 3, 1, 10) : Number(existing?.item_limit ?? 3),
    refreshMinutes: Object.hasOwn(input, "refreshMinutes") ? tickerNumber(input.refreshMinutes, 5, 5, 1440) : Number(existing?.refresh_minutes ?? 5),
  };
}

async function createTickerSource(request, env, input) {
  const session = await requireEditorialAuthority(request, env);
  const actorName = tickerActor(session);
  const values = tickerSourceInput(input);
  const now = new Date().toISOString();
  const sourceId = `TIS-${crypto.randomUUID()}`;
  const sourceKey = `custom-${values.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "rss"}-${sourceId.slice(-8)}`;
  const event = await prepareEntry(env, {
    eventKey: `civic-portal:${sourceId}:created`,
    eventType: "ticker_source_created",
    category: "editorial",
    title: "Civic-wire RSS source added",
    summary: `${actorName} added “${values.label}” to the civic wire’s managed RSS sources.`,
    actorName,
    subjectName: values.label,
    subjectRef: sourceId,
    occurredAt: now,
    utopianDate: formatUtopianDate(new Date(now)),
    gregorianDate: formatGregorianDate(new Date(now)),
    sourceLabel: "Editorial Studio · Civic wire Source Manager",
    sourceUrl: civicPageUrl(request, env, "/editorial"),
    metadata: { sourceId, sourceType: "rss", enabled: values.enabled, status: values.status, priority: values.priority, sortOrder: values.sortOrder, treatment: values.treatment },
  });
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO ticker_sources (
        source_id, source_key, label, source_type, endpoint_url, credit_url, prefix,
        enabled, status, priority, sort_order, treatment, item_limit, refresh_minutes,
        built_in, created_by, updated_by, created_at, updated_at
      ) VALUES (?1, ?2, ?3, 'rss', ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 0, ?14, ?14, ?15, ?15)
    `).bind(sourceId, sourceKey, values.label, values.endpointUrl, values.creditUrl, values.prefix, values.enabled ? 1 : 0, values.status, values.priority, values.sortOrder, values.treatment, values.itemLimit, values.refreshMinutes, actorName, now),
    event.statement,
  ]);
  if (values.enabled && values.status === "active") await refreshTickerSourceById(env, sourceId, true);
  const row = await env.DB.prepare("SELECT * FROM ticker_sources WHERE source_id = ?1").bind(sourceId).first();
  return { created: true, source: publicTickerSource(row) };
}

async function updateTickerSource(request, env, sourceId, input) {
  const session = await requireEditorialAuthority(request, env);
  const actorName = tickerActor(session);
  const existing = await env.DB.prepare("SELECT * FROM ticker_sources WHERE source_id = ?1").bind(sourceId).first();
  if (!existing) throw new ClientError("That ticker source was not found.", 404, "ticker_source_not_found");
  const values = tickerSourceInput(input, existing);
  const now = new Date().toISOString();
  const archivedAt = values.status === "archived" ? existing.archived_at || now : null;
  const eventType = values.status === "archived" && existing.status !== "archived"
    ? "ticker_source_archived"
    : existing.status === "archived" && values.status !== "archived"
      ? "ticker_source_restored"
      : "ticker_source_updated";
  const action = eventType.endsWith("archived") ? "archived" : eventType.endsWith("restored") ? "restored" : "updated";
  const event = await prepareEntry(env, {
    eventKey: `civic-portal:${sourceId}:${eventType}:${crypto.randomUUID()}`,
    eventType,
    category: "editorial",
    title: `Civic-wire source ${action}`,
    summary: `${actorName} ${action} the civic-wire source “${values.label}.”`,
    actorName,
    subjectName: values.label,
    subjectRef: sourceId,
    occurredAt: now,
    utopianDate: formatUtopianDate(new Date(now)),
    gregorianDate: formatGregorianDate(new Date(now)),
    sourceLabel: "Editorial Studio · Civic wire Source Manager",
    sourceUrl: civicPageUrl(request, env, "/editorial"),
    metadata: { sourceId, sourceType: existing.source_type, previousStatus: existing.status, status: values.status, enabled: values.enabled, priority: values.priority, sortOrder: values.sortOrder, treatment: values.treatment },
  });
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE ticker_sources SET
        label = ?2, endpoint_url = ?3, credit_url = ?4, prefix = ?5,
        enabled = ?6, status = ?7, priority = ?8, sort_order = ?9,
        treatment = ?10, item_limit = ?11, refresh_minutes = ?12,
        updated_by = ?13, updated_at = ?14, archived_at = ?15
      WHERE source_id = ?1
    `).bind(sourceId, values.label, values.endpointUrl, values.creditUrl, values.prefix, values.enabled ? 1 : 0, values.status, values.priority, values.sortOrder, values.treatment, values.itemLimit, values.refreshMinutes, actorName, now, archivedAt),
    event.statement,
  ]);
  if (values.enabled && values.status === "active" && (existing.endpoint_url !== values.endpointUrl || existing.status !== "active" || !existing.enabled)) {
    await refreshTickerSourceById(env, sourceId, true);
  }
  const row = await env.DB.prepare("SELECT * FROM ticker_sources WHERE source_id = ?1").bind(sourceId).first();
  return { updated: true, source: publicTickerSource(row) };
}

function tickerCoordinate(value, name, minimum, maximum) {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
    throw new ClientError(`${name} must be between ${minimum} and ${maximum}.`, 400, "ticker_weather_coordinate_invalid");
  }
  return Math.round(coordinate * 1_000_000) / 1_000_000;
}

function tickerWeatherLocationInput(input, existing = null) {
  const label = Object.hasOwn(input, "label") ? cleanText(input.label, 120) : existing?.label;
  const latitude = Object.hasOwn(input, "latitude")
    ? tickerCoordinate(input.latitude, "Latitude", -90, 90)
    : Number(existing?.latitude);
  const longitude = Object.hasOwn(input, "longitude")
    ? tickerCoordinate(input.longitude, "Longitude", -180, 180)
    : Number(existing?.longitude);
  const timezone = Object.hasOwn(input, "timezone") ? cleanText(input.timezone || "UTC", 100) : existing?.timezone || "UTC";
  if (!/^[A-Za-z0-9_+./-]+$/.test(timezone)) throw new ClientError("Select a valid location timezone.", 400, "ticker_weather_timezone_invalid");
  const conditionsMode = Object.hasOwn(input, "conditionsMode") ? cleanText(input.conditionsMode, 20) : existing?.conditions_mode || "combined";
  if (!TICKER_WEATHER_MODES.has(conditionsMode)) throw new ClientError("Select land, marine, or combined conditions.");
  const status = Object.hasOwn(input, "status") ? cleanText(input.status, 20) : existing?.status || "active";
  if (!TICKER_SOURCE_STATUSES.has(status)) throw new ClientError("Select a supported weather-location status.");
  return {
    label,
    latitude,
    longitude,
    timezone,
    conditionsMode,
    enabled: Object.hasOwn(input, "enabled") ? Boolean(input.enabled) : existing ? Boolean(existing.enabled) : true,
    status,
    priority: Object.hasOwn(input, "priority") ? tickerNumber(input.priority, 10, -100, 100) : Number(existing?.priority ?? 10),
    sortOrder: Object.hasOwn(input, "sortOrder") ? tickerNumber(input.sortOrder, 0, -1000, 1000) : Number(existing?.sort_order ?? 0),
    treatment: Object.hasOwn(input, "treatment") ? tickerTreatment(input.treatment, existing?.treatment) : existing?.treatment || "standard",
    refreshMinutes: Object.hasOwn(input, "refreshMinutes") ? tickerNumber(input.refreshMinutes, 5, 5, 1440) : Number(existing?.refresh_minutes ?? 5),
  };
}

function tickerWeatherLocationKey(label, locationId) {
  const stem = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "location";
  return `${stem}-${locationId.slice(-8).toLowerCase()}`;
}

function weatherLocationConstraint(error) {
  const message = String(error?.message || error);
  if (message.includes("at_least_one_weather_location_required")) {
    return new ClientError("At least one active weather location must remain on the civic wire.", 409, "at_least_one_weather_location_required");
  }
  return null;
}

async function prepareWeatherLocationEvent(request, env, values) {
  return prepareEntry(env, {
    eventKey: `civic-portal:${values.locationId}:${values.eventType}:${crypto.randomUUID()}`,
    eventType: values.eventType,
    category: "editorial",
    title: `Civic-wire weather location ${values.action}`,
    summary: `${values.actorName} ${values.action} the weather location “${values.label}.”`,
    actorName: values.actorName,
    subjectName: values.label,
    subjectRef: values.locationId,
    occurredAt: values.now,
    utopianDate: formatUtopianDate(new Date(values.now)),
    gregorianDate: formatGregorianDate(new Date(values.now)),
    sourceLabel: "Editorial Studio · Weather Locations",
    sourceUrl: civicPageUrl(request, env, "/editorial"),
    metadata: {
      locationId: values.locationId,
      latitude: values.input.latitude,
      longitude: values.input.longitude,
      timezone: values.input.timezone,
      conditionsMode: values.input.conditionsMode,
      enabled: values.input.enabled,
      status: values.input.status,
      priority: values.input.priority,
      sortOrder: values.input.sortOrder,
      treatment: values.input.treatment,
      refreshMinutes: values.input.refreshMinutes,
      previousStatus: values.previousStatus || null,
    },
  });
}

async function createTickerWeatherLocation(request, env, input) {
  const session = await requireEditorialAuthority(request, env);
  const actorName = tickerActor(session);
  const values = tickerWeatherLocationInput(input);
  const locationId = `TIW-${crypto.randomUUID()}`;
  const locationKey = tickerWeatherLocationKey(values.label, locationId);
  const now = new Date().toISOString();
  const event = await prepareWeatherLocationEvent(request, env, {
    locationId, eventType: "ticker_weather_location_created", action: "added", actorName,
    label: values.label, now, input: values,
  });
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO ticker_weather_locations (
        location_id, location_key, source_id, label, latitude, longitude, timezone,
        conditions_mode, enabled, status, priority, sort_order, treatment,
        refresh_minutes, created_by, updated_by, created_at, updated_at
      ) VALUES (?1, ?2, 'TIS-WEATHER', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?14, ?15, ?15)
    `).bind(locationId, locationKey, values.label, values.latitude, values.longitude, values.timezone, values.conditionsMode, values.enabled ? 1 : 0, values.status, values.priority, values.sortOrder, values.treatment, values.refreshMinutes, actorName, now),
    event.statement,
  ]);
  if (values.enabled && values.status === "active") await refreshTickerWeatherLocation(env, locationId, true);
  const row = await env.DB.prepare("SELECT * FROM ticker_weather_locations WHERE location_id = ?1").bind(locationId).first();
  return { created: true, location: publicTickerWeatherLocation(row) };
}

async function updateTickerWeatherLocation(request, env, locationId, input) {
  const session = await requireEditorialAuthority(request, env);
  const actorName = tickerActor(session);
  const existing = await env.DB.prepare("SELECT * FROM ticker_weather_locations WHERE location_id = ?1").bind(locationId).first();
  if (!existing) throw new ClientError("That weather location was not found.", 404, "ticker_weather_location_not_found");
  const values = tickerWeatherLocationInput(input, existing);
  const now = new Date().toISOString();
  const archivedAt = values.status === "archived" ? existing.archived_at || now : null;
  const eventType = values.status === "archived" && existing.status !== "archived"
    ? "ticker_weather_location_archived"
    : existing.status === "archived" && values.status !== "archived"
      ? "ticker_weather_location_restored"
      : "ticker_weather_location_updated";
  const action = eventType.endsWith("archived") ? "archived" : eventType.endsWith("restored") ? "restored" : "updated";
  const event = await prepareWeatherLocationEvent(request, env, {
    locationId, eventType, action, actorName, label: values.label, now, input: values, previousStatus: existing.status,
  });
  try {
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE ticker_weather_locations SET
          label = ?2, latitude = ?3, longitude = ?4, timezone = ?5,
          conditions_mode = ?6, enabled = ?7, status = ?8, priority = ?9,
          sort_order = ?10, treatment = ?11, refresh_minutes = ?12,
          updated_by = ?13, updated_at = ?14, archived_at = ?15
        WHERE location_id = ?1
      `).bind(locationId, values.label, values.latitude, values.longitude, values.timezone, values.conditionsMode, values.enabled ? 1 : 0, values.status, values.priority, values.sortOrder, values.treatment, values.refreshMinutes, actorName, now, archivedAt),
      env.DB.prepare("UPDATE ticker_feed_items SET is_current = 0 WHERE weather_location_id = ?1 AND (?2 = 0 OR ?3 <> 'active')")
        .bind(locationId, values.enabled ? 1 : 0, values.status),
      event.statement,
    ]);
  } catch (error) {
    throw weatherLocationConstraint(error) || error;
  }
  const coordinatesChanged = Number(existing.latitude) !== values.latitude || Number(existing.longitude) !== values.longitude
    || existing.conditions_mode !== values.conditionsMode || existing.timezone !== values.timezone;
  if (values.enabled && values.status === "active" && (coordinatesChanged || !existing.enabled || existing.status !== "active")) {
    await refreshTickerWeatherLocation(env, locationId, true);
  }
  const row = await env.DB.prepare("SELECT * FROM ticker_weather_locations WHERE location_id = ?1").bind(locationId).first();
  return { updated: true, location: publicTickerWeatherLocation(row) };
}

async function geocodeTickerWeatherLocations(request, env, url) {
  await requireEditorialAuthority(request, env);
  const query = cleanText(url.searchParams.get("q"), 120, false);
  if (query.length < 2) throw new ClientError("Enter at least two characters to search for a location.", 400, "ticker_weather_search_short");
  const endpoint = new URL("https://geocoding-api.open-meteo.com/v1/search");
  endpoint.search = new URLSearchParams({ name: query, count: "8", language: "en", format: "json" }).toString();
  const response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`The location search returned HTTP ${response.status}.`);
  const payload = JSON.parse(await readTickerResponse(response));
  return {
    results: (Array.isArray(payload.results) ? payload.results : []).slice(0, 8).map((result) => ({
      id: String(result.id || `${result.latitude},${result.longitude}`),
      label: [result.name, result.admin1, result.country].filter(Boolean).join(", "),
      name: cleanText(result.name, 120, false),
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
      timezone: cleanText(result.timezone || "UTC", 100),
      country: cleanText(result.country, 120, false),
      admin1: cleanText(result.admin1, 120, false),
    })).filter((result) => result.label && Number.isFinite(result.latitude) && Number.isFinite(result.longitude)),
  };
}

async function updateTickerFeedItem(request, env, itemId, input) {
  const session = await requireEditorialAuthority(request, env);
  const actorName = tickerActor(session);
  const existing = await env.DB.prepare(`
    SELECT i.*, s.label AS source_label FROM ticker_feed_items i
    JOIN ticker_sources s ON s.source_id = i.source_id
    WHERE i.item_id = ?1
  `).bind(itemId).first();
  if (!existing) throw new ClientError("That feed item was not found.", 404, "ticker_feed_item_not_found");
  const suppressed = Boolean(input.suppressed);
  if (Boolean(existing.suppressed) === suppressed) return { updated: false, item: publicTickerFeedItem(existing) };
  const now = new Date().toISOString();
  const eventType = suppressed ? "ticker_feed_item_suppressed" : "ticker_feed_item_restored";
  const action = suppressed ? "suppressed" : "restored";
  const event = await prepareEntry(env, {
    eventKey: `civic-portal:${itemId}:${eventType}:${crypto.randomUUID()}`,
    eventType,
    category: "editorial",
    title: `Civic-wire feed item ${action}`,
    summary: `${actorName} ${action} “${existing.label}” from the current civic-wire rotation.`,
    actorName,
    subjectName: existing.label,
    subjectRef: itemId,
    occurredAt: now,
    utopianDate: formatUtopianDate(new Date(now)),
    gregorianDate: formatGregorianDate(new Date(now)),
    sourceLabel: `Editorial Studio · ${existing.source_label}`,
    sourceUrl: civicPageUrl(request, env, "/editorial"),
    metadata: { itemId, sourceId: existing.source_id, suppressed },
  });
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE ticker_feed_items SET suppressed = ?2, suppressed_by = ?3, suppressed_at = ?4
      WHERE item_id = ?1
    `).bind(itemId, suppressed ? 1 : 0, suppressed ? actorName : null, suppressed ? now : null),
    event.statement,
  ]);
  const row = await env.DB.prepare("SELECT * FROM ticker_feed_items WHERE item_id = ?1").bind(itemId).first();
  return { updated: true, item: publicTickerFeedItem(row) };
}

function decodeTickerXml(value) {
  return String(value || "")
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function tickerXmlTag(block, names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match) return decodeTickerXml(match[1]);
  }
  return "";
}

function parseTickerFeed(xml, limit) {
  const rssBlocks = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  const atomBlocks = rssBlocks.length ? [] : [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);
  return [...rssBlocks, ...atomBlocks].slice(0, limit).map((block) => {
    const label = tickerXmlTag(block, ["title"]);
    const rssLink = tickerXmlTag(block, ["link"]);
    const atomLink = block.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1] || "";
    const href = rssLink || decodeTickerXml(atomLink);
    const identity = tickerXmlTag(block, ["guid", "id"]) || href || label;
    const publishedAt = tickerXmlTag(block, ["pubDate", "published", "updated", "dc:date"]);
    let safeHref = null;
    try { safeHref = tickerDestination(href); } catch { safeHref = null; }
    return {
      identity,
      label: cleanText(label, 240, false),
      href: safeHref,
      publishedAt: publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? new Date(publishedAt).toISOString() : null,
    };
  }).filter((item) => item.label);
}

async function readTickerResponse(response) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > TICKER_FETCH_LIMIT) throw new Error("The feed is larger than the protected ticker limit.");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > TICKER_FETCH_LIMIT) {
      await reader.cancel();
      throw new Error("The feed is larger than the protected ticker limit.");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

const TICKER_WEATHER_DESCRIPTIONS = {
  0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
  45: "fog", 48: "rime fog", 51: "light drizzle", 53: "drizzle",
  55: "dense drizzle", 61: "light rain", 63: "rain", 65: "heavy rain",
  80: "rain showers", 81: "rain showers", 82: "heavy showers",
  95: "thunderstorms", 96: "thunderstorms with hail", 99: "severe thunderstorms with hail",
};

function tickerCompassPoint(degrees) {
  if (typeof degrees !== "number") return "variable";
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(degrees / 45) % 8];
}

async function fetchTickerWeather(location) {
  const coordinates = { latitude: String(location.latitude), longitude: String(location.longitude) };
  const mode = location.conditions_mode || "combined";
  const weatherPromise = mode === "marine" ? Promise.resolve(null) : (() => {
    const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
    endpoint.search = new URLSearchParams({
      ...coordinates,
      current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      timezone: location.timezone || "UTC",
    }).toString();
    return fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  })();
  const marinePromise = mode === "land" ? Promise.resolve(null) : (() => {
    const endpoint = new URL("https://marine-api.open-meteo.com/v1/marine");
    endpoint.search = new URLSearchParams({
      ...coordinates,
      current: "wave_height,sea_surface_temperature,ocean_current_velocity",
      length_unit: "imperial",
      timezone: location.timezone || "UTC",
      cell_selection: "sea",
    }).toString();
    return fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  })();
  const [weatherResponse, marineResponse] = await Promise.all([weatherPromise, marinePromise]);
  if (weatherResponse && !weatherResponse.ok) throw new Error(`Weather source returned ${weatherResponse.status}.`);
  if (mode === "marine" && marineResponse && !marineResponse.ok) throw new Error(`Marine source returned ${marineResponse.status}.`);
  const weather = weatherResponse ? (await weatherResponse.json()).current || {} : {};
  const marine = marineResponse?.ok ? (await marineResponse.json()).current || {} : {};
  const parts = [location.label];
  if (typeof weather.temperature_2m === "number") parts.push(`${Math.round(weather.temperature_2m)}°F`);
  if (typeof weather.weather_code === "number") parts.push(TICKER_WEATHER_DESCRIPTIONS[weather.weather_code] || "mixed conditions");
  if (typeof weather.wind_speed_10m === "number") parts.push(`wind ${tickerCompassPoint(weather.wind_direction_10m)} ${Math.round(weather.wind_speed_10m)} mph`);
  const seaFahrenheit = typeof marine.sea_surface_temperature === "number" ? marine.sea_surface_temperature * 9 / 5 + 32 : null;
  if (seaFahrenheit !== null) parts.push(`sea ${Math.round(seaFahrenheit)}°F`);
  if (typeof marine.wave_height === "number") parts.push(`swell ${marine.wave_height.toFixed(1)} ft`);
  if (parts.length === 1) throw new Error("The weather service returned no current conditions for this location.");
  return [{
    identity: `weather-location:${location.location_id}`,
    label: parts.join(" · "),
    href: "https://open-meteo.com/",
    publishedAt: new Date().toISOString(),
  }];
}

async function fetchTickerSourceItems(source) {
  const feedUrl = tickerRssUrl(source.endpoint_url);
  const response = await fetch(feedUrl, {
    headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9" },
    redirect: "follow",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`The feed returned HTTP ${response.status}.`);
  tickerRssUrl(response.url);
  return parseTickerFeed(await readTickerResponse(response), Number(source.item_limit || 3));
}

async function storeTickerSourceItems(env, source, items) {
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare("UPDATE ticker_feed_items SET is_current = 0 WHERE source_id = ?1").bind(source.source_id),
  ];
  for (const item of items) {
    const itemKey = await digest(`${source.source_id}\n${item.identity}`);
    const itemId = `TIF-${itemKey.slice(0, 32)}`;
    statements.push(env.DB.prepare(`
      INSERT INTO ticker_feed_items (
        item_id, source_id, item_key, label, href, published_at, fetched_at, is_current
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1)
      ON CONFLICT(item_key) DO UPDATE SET
        label = excluded.label, href = excluded.href, published_at = excluded.published_at,
        fetched_at = excluded.fetched_at, is_current = 1
    `).bind(itemId, source.source_id, itemKey, item.label, item.href, item.publishedAt, now));
  }
  statements.push(env.DB.prepare(`
    UPDATE ticker_sources SET last_checked_at = ?2, last_success_at = ?2,
      last_error = NULL, updated_at = CASE WHEN updated_at > ?2 THEN updated_at ELSE ?2 END
    WHERE source_id = ?1
  `).bind(source.source_id, now));
  await env.DB.batch(statements);
  return items.length;
}

async function storeTickerWeatherItems(env, location, items) {
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare(`
      UPDATE ticker_feed_items SET is_current = 0
      WHERE weather_location_id = ?1 OR (source_id = 'TIS-WEATHER' AND weather_location_id IS NULL)
    `).bind(location.location_id),
  ];
  for (const item of items) {
    const itemKey = await digest(`TIS-WEATHER\n${location.location_id}\n${item.identity}`);
    const itemId = `TIF-${itemKey.slice(0, 32)}`;
    statements.push(env.DB.prepare(`
      INSERT INTO ticker_feed_items (
        item_id, source_id, item_key, label, href, published_at, fetched_at, is_current, weather_location_id
      ) VALUES (?1, 'TIS-WEATHER', ?2, ?3, ?4, ?5, ?6, 1, ?7)
      ON CONFLICT(item_key) DO UPDATE SET
        label = excluded.label, href = excluded.href, published_at = excluded.published_at,
        fetched_at = excluded.fetched_at, is_current = 1, weather_location_id = excluded.weather_location_id
    `).bind(itemId, itemKey, item.label, item.href, item.publishedAt, now, location.location_id));
  }
  statements.push(env.DB.prepare(`
    UPDATE ticker_weather_locations SET last_checked_at = ?2, last_success_at = ?2,
      last_error = NULL, updated_at = CASE WHEN updated_at > ?2 THEN updated_at ELSE ?2 END
    WHERE location_id = ?1
  `).bind(location.location_id, now));
  statements.push(env.DB.prepare(`
    UPDATE ticker_sources SET last_checked_at = ?1, last_success_at = ?1, last_error = NULL
    WHERE source_id = 'TIS-WEATHER'
  `).bind(now));
  await env.DB.batch(statements);
  return items.length;
}

async function refreshTickerWeatherLocation(env, locationId, force = false) {
  const location = await env.DB.prepare("SELECT * FROM ticker_weather_locations WHERE location_id = ?1").bind(locationId).first();
  if (!location || !location.enabled || location.status !== "active") return { refreshed: false, reason: "inactive" };
  if (!force && location.last_checked_at && Date.now() - Date.parse(location.last_checked_at) < Number(location.refresh_minutes) * 60_000) {
    return { refreshed: false, reason: "not-due" };
  }
  try {
    const items = await fetchTickerWeather(location);
    return { refreshed: true, count: await storeTickerWeatherItems(env, location, items) };
  } catch (error) {
    const now = new Date().toISOString();
    const message = cleanText(String(error?.message || error), 300, false);
    await env.DB.batch([
      env.DB.prepare("UPDATE ticker_weather_locations SET last_checked_at = ?2, last_error = ?3 WHERE location_id = ?1")
        .bind(locationId, now, message),
      env.DB.prepare("UPDATE ticker_sources SET last_checked_at = ?1, last_error = ?2 WHERE source_id = 'TIS-WEATHER'")
        .bind(now, message),
    ]);
    console.error(JSON.stringify({ level: "error", message: "ticker-weather-refresh-failed", locationId, error: String(error) }));
    return { refreshed: false, reason: "failed" };
  }
}

async function refreshTickerSourceById(env, sourceId, force = false) {
  const source = await env.DB.prepare("SELECT * FROM ticker_sources WHERE source_id = ?1").bind(sourceId).first();
  if (!source || !source.enabled || source.status !== "active") return { refreshed: false, reason: "inactive" };
  if (source.source_key === "south-pacific-weather") {
    const result = await env.DB.prepare(`
      SELECT location_id FROM ticker_weather_locations WHERE enabled = 1 AND status = 'active'
      ORDER BY priority DESC, sort_order ASC
    `).all();
    const outcomes = await Promise.all((result.results || []).map((row) => refreshTickerWeatherLocation(env, row.location_id, force)));
    return { refreshed: outcomes.some((outcome) => outcome.refreshed), count: outcomes.reduce((sum, outcome) => sum + Number(outcome.count || 0), 0) };
  }
  if (source.source_type !== "rss") return { refreshed: false, reason: "generated" };
  if (!force && source.last_checked_at && Date.now() - Date.parse(source.last_checked_at) < Number(source.refresh_minutes) * 60_000) {
    return { refreshed: false, reason: "not-due" };
  }
  try {
    const items = await fetchTickerSourceItems(source);
    return { refreshed: true, count: await storeTickerSourceItems(env, source, items) };
  } catch (error) {
    const now = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE ticker_sources SET last_checked_at = ?2, last_error = ?3 WHERE source_id = ?1
    `).bind(sourceId, now, cleanText(String(error?.message || error), 300, false)).run();
    console.error(JSON.stringify({ level: "error", message: "ticker-source-refresh-failed", sourceId, error: String(error) }));
    return { refreshed: false, reason: "failed" };
  }
}

async function syncTickerSources(env) {
  const result = await env.DB.prepare(`
    SELECT * FROM ticker_sources
    WHERE enabled = 1 AND status = 'active'
      AND source_type = 'rss'
    ORDER BY priority DESC, sort_order ASC
    LIMIT 50
  `).all();
  const weatherResult = await env.DB.prepare(`
    SELECT location_id FROM ticker_weather_locations
    WHERE enabled = 1 AND status = 'active'
    ORDER BY priority DESC, sort_order ASC LIMIT 50
  `).all();
  const work = [
    ...(result.results || []).map((source) => refreshTickerSourceById(env, source.source_id)),
    ...(weatherResult.results || []).map((location) => refreshTickerWeatherLocation(env, location.location_id)),
  ];
  const outcomes = await Promise.allSettled(work);
  const refreshed = outcomes.filter((outcome) => outcome.status === "fulfilled" && outcome.value.refreshed).length;
  console.log(JSON.stringify({ level: "info", message: "ticker-sources-synchronized", sources: result.results?.length || 0, weatherLocations: weatherResult.results?.length || 0, refreshed }));
  return { sources: result.results?.length || 0, weatherLocations: weatherResult.results?.length || 0, refreshed };
}

function tickerPrefixedLabel(prefix, label) {
  return prefix ? `${prefix} · ${label}` : label;
}

async function currentTickerItems(env) {
  const now = new Date().toISOString();
  const [sourceResult, announcementResult, feedResult, populationRow, ledgerRow] = await Promise.all([
    env.DB.prepare(`SELECT * FROM ticker_sources WHERE enabled = 1 AND status = 'active' ORDER BY priority DESC, sort_order ASC`).all(),
    env.DB.prepare(`
      SELECT * FROM ticker_announcements
      WHERE (status = 'active' OR (status = 'scheduled' AND starts_at IS NOT NULL AND starts_at <= ?1))
        AND (starts_at IS NULL OR starts_at <= ?1)
        AND (ends_at IS NULL OR ends_at > ?1)
      ORDER BY priority DESC, sort_order ASC, created_at ASC
    `).bind(now).all(),
    env.DB.prepare(`
      SELECT i.*,
        w.label AS weather_label, w.priority AS weather_priority,
        w.sort_order AS weather_sort_order, w.treatment AS weather_treatment
      FROM ticker_feed_items i
      JOIN ticker_sources s ON s.source_id = i.source_id
      LEFT JOIN ticker_weather_locations w ON w.location_id = i.weather_location_id
      WHERE i.is_current = 1 AND i.suppressed = 0 AND s.enabled = 1 AND s.status = 'active'
        AND (i.weather_location_id IS NULL OR (w.enabled = 1 AND w.status = 'active'))
      ORDER BY COALESCE(i.published_at, i.fetched_at) DESC
    `).all(),
    env.DB.prepare("SELECT COUNT(*) AS active FROM citizens WHERE standing = 'active'").first(),
    env.DB.prepare("SELECT MAX(seq) AS sequence FROM ledger_entries").first(),
  ]);
  const sources = sourceResult.results || [];
  const feedsBySource = new Map();
  for (const item of feedResult.results || []) {
    const items = feedsBySource.get(item.source_id) || [];
    items.push(item);
    feedsBySource.set(item.source_id, items);
  }
  const items = (announcementResult.results || []).map((row) => ({
    itemId: row.announcement_id,
    recordType: "manual",
    sourceId: null,
    sourceLabel: "Manual notice",
    kind: "manual",
    label: row.label,
    href: row.href || null,
    priority: Number(row.priority),
    sortOrder: Number(row.sort_order),
    treatment: row.treatment || "standard",
    status: "live",
  }));
  for (const source of sources) {
    const base = {
      sourceId: source.source_id,
      sourceLabel: source.label,
      priority: Number(source.priority),
      sortOrder: Number(source.sort_order),
      treatment: source.treatment || "standard",
      status: "live",
    };
    if (source.source_key === "population") {
      items.push({ ...base, itemId: `${source.source_id}:current`, recordType: "system", kind: "population", label: tickerPrefixedLabel(source.prefix, `Population: ${Number(populationRow?.active || 0).toLocaleString("en-US")}`), href: source.credit_url || "/citizens" });
    } else if (source.source_key === "utopian-reference-time") {
      items.push({ ...base, itemId: `${source.source_id}:current`, recordType: "system", kind: "reference-time", label: "Utopian Reference Time · Synchronizing", href: null });
    } else if (source.source_key === "transparency-ledger") {
      items.push({ ...base, itemId: `${source.source_id}:current`, recordType: "system", kind: "ledger", label: tickerPrefixedLabel(source.prefix, `Public record · Transparency Ledger operational · Sequence ${Number(ledgerRow?.sequence || 0)}`), href: source.credit_url || "/transparency-ledger" });
    } else {
      const sourceFeeds = feedsBySource.get(source.source_id) || [];
      for (const feed of source.source_key === "south-pacific-weather" ? sourceFeeds : sourceFeeds.slice(0, Number(source.item_limit))) {
        const weatherBase = feed.weather_location_id ? {
          ...base,
          sourceLabel: `${source.label} · ${feed.weather_label || "Location"}`,
          priority: Number(feed.weather_priority),
          sortOrder: Number(feed.weather_sort_order),
          treatment: feed.weather_treatment || "standard",
        } : base;
        items.push({ ...weatherBase, itemId: feed.item_id, recordType: "feed", kind: feed.weather_location_id ? "weather" : "rss", label: tickerPrefixedLabel(source.prefix, feed.label), href: feed.href || source.credit_url || null });
      }
    }
  }
  return items.sort((left, right) => right.priority - left.priority || left.sortOrder - right.sortOrder || left.label.localeCompare(right.label));
}

async function publicTicker(request, env) {
  const [items, sourceResult] = await Promise.all([
    currentTickerItems(env),
    env.DB.prepare(`
      SELECT source_id, label, credit_url FROM ticker_sources
      WHERE enabled = 1 AND status = 'active' AND credit_url IS NOT NULL
      ORDER BY priority DESC, sort_order ASC
    `).all(),
  ]);
  return {
    items,
    credits: (sourceResult.results || []).map((source) => ({ sourceId: source.source_id, label: source.label, href: source.credit_url })),
    updatedAt: new Date().toISOString(),
    source: civicPageUrl(request, env, "/editorial"),
  };
}

async function tickerManager(request, env) {
  const session = await requireEditorialAuthority(request, env);
  const [sourceResult, weatherResult, announcementResult, feedResult, currentItems] = await Promise.all([
    env.DB.prepare("SELECT * FROM ticker_sources ORDER BY status = 'archived', priority DESC, sort_order ASC, label COLLATE NOCASE").all(),
    env.DB.prepare("SELECT * FROM ticker_weather_locations ORDER BY status = 'archived', priority DESC, sort_order ASC, label COLLATE NOCASE").all(),
    env.DB.prepare("SELECT * FROM ticker_announcements ORDER BY status = 'archived', priority DESC, sort_order ASC, updated_at DESC").all(),
    env.DB.prepare(`
      SELECT i.* FROM ticker_feed_items i
      WHERE i.is_current = 1 OR i.suppressed = 1
      ORDER BY i.source_id, COALESCE(i.published_at, i.fetched_at) DESC
      LIMIT 250
    `).all(),
    currentTickerItems(env),
  ]);
  return {
    actor: tickerActor(session),
    currentItems,
    announcements: (announcementResult.results || []).map(publicAnnouncement),
    sources: (sourceResult.results || []).map(publicTickerSource),
    weatherLocations: (weatherResult.results || []).map(publicTickerWeatherLocation),
    feedItems: (feedResult.results || []).map(publicTickerFeedItem),
    ledgerPolicy: "Every human ticker configuration, notice, suppression, restoration, and archival change is appended to the Transparency Ledger under the authenticated civic identity.",
  };
}

function publicationSlug(value) {
  const slug = cleanText(value, 180).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ClientError("The publication slug may contain lowercase letters, numbers, and single hyphens only.");
  }
  return slug;
}

async function createEditorialDraft(request, env, input) {
  await requireEditorialAuthority(request, env);
  const title = cleanText(input.title, 240);
  const slug = publicationSlug(input.slug);
  const type = ["post", "page", "announcement"].includes(input.type) ? input.type : "post";
  const excerpt = cleanText(input.excerpt, 600, false);
  const contentMarkdown = cleanLongText(input.contentMarkdown, 60_000, false);
  const featuredImage = cleanText(input.featuredImage, 1_000, false) || null;
  const authorName = cleanText(input.authorName || "Adreto Nagdo Senoviros", 160);
  const now = new Date();
  const publicationId = `UTP-${crypto.randomUUID()}`;
  const event = await prepareEntry(env, {
    eventKey: `civic-portal:${publicationId}:drafted`,
    eventType: "editorial_draft_created",
    category: "editorial",
    title: `Editorial draft prepared: ${title}`,
    summary: excerpt || `A private ${type} draft was prepared for review.`,
    actorName: authorName,
    subjectName: title,
    subjectRef: publicationId,
    occurredAt: now.toISOString(),
    utopianDate: formatUtopianDate(now),
    gregorianDate: formatGregorianDate(now),
    sourceLabel: "Editorial Studio · Working record",
    sourceUrl: civicPageUrl(request, env, "/editorial"),
    metadata: { publicationId, slug, type, status: "draft", localSimulation: isLocalV3(env), remoteWrites: false },
  });
  try {
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO publications (
          publication_id, wordpress_id, slug, publication_type, title, status,
          canonical_url, source_modified_at, synchronized_at, metadata_json,
          excerpt, content_markdown, featured_image, author_name, publication_date,
          utopian_date, gregorian_date, created_at, updated_at
        ) VALUES (?1, NULL, ?2, ?3, ?4, 'draft', NULL, NULL, NULL, '{}',
          ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?9, ?9)
      `).bind(
        publicationId, slug, type, title, excerpt, contentMarkdown, featuredImage,
        authorName, now.toISOString(), formatUtopianDate(now), formatGregorianDate(now),
      ),
      event.statement,
    ]);
  } catch (error) {
    if (String(error).includes("UNIQUE")) throw new ClientError("That publication slug already exists.", 409, "slug_exists");
    throw error;
  }
  const row = await env.DB.prepare("SELECT * FROM publications WHERE publication_id = ?1").bind(publicationId).first();
  return { created: true, publication: publicPublication(row) };
}

async function importWordpressInventory(request, env, input) {
  await requireEditorialAuthority(request, env);
  if (!Array.isArray(input.posts) || input.posts.length < 1 || input.posts.length > 100) {
    throw new ClientError("A WordPress inventory must contain between 1 and 100 publications.");
  }
  const now = new Date().toISOString();
  const statements = [];
  let latestModified = "";
  for (const item of input.posts) {
    const wordpressId = Number(item.wordpressId);
    if (!Number.isInteger(wordpressId) || wordpressId < 1) throw new ClientError("Every WordPress publication needs a numeric source ID.");
    const slug = publicationSlug(item.slug);
    const title = cleanText(item.title, 240);
    const type = ["post", "page"].includes(item.type) ? item.type : "post";
    const canonicalUrl = cleanText(item.canonicalUrl, 500, false) || null;
    const sourceModifiedAt = cleanText(item.sourceModifiedAt, 40, false) || null;
    if (sourceModifiedAt && sourceModifiedAt > latestModified) latestModified = sourceModifiedAt;
    const publicationDate = cleanText(item.publicationDate, 40, false) || null;
    const date = publicationDate && !Number.isNaN(Date.parse(publicationDate)) ? new Date(publicationDate) : null;
    statements.push(env.DB.prepare(`
      INSERT INTO publications (
        publication_id, wordpress_id, slug, publication_type, title, status,
        canonical_url, source_modified_at, synchronized_at, metadata_json,
        excerpt, content_markdown, featured_image, author_name, publication_date,
        utopian_date, gregorian_date, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, 'published', ?6, ?7, ?8, ?9,
        ?10, '', ?11, 'Adreto Nagdo Senoviros', ?12, ?13, ?14, ?8, ?8)
      ON CONFLICT(slug) DO UPDATE SET
        wordpress_id = excluded.wordpress_id,
        publication_type = excluded.publication_type,
        title = excluded.title,
        canonical_url = excluded.canonical_url,
        source_modified_at = excluded.source_modified_at,
        synchronized_at = excluded.synchronized_at,
        metadata_json = excluded.metadata_json,
        excerpt = excluded.excerpt,
        featured_image = excluded.featured_image,
        publication_date = excluded.publication_date,
        utopian_date = excluded.utopian_date,
        gregorian_date = excluded.gregorian_date,
        updated_at = excluded.updated_at
    `).bind(
      `WP-${wordpressId}`, wordpressId, slug, type, title, canonicalUrl,
      sourceModifiedAt, now, JSON.stringify({ categories: item.categories || [], tags: item.tags || [], source: "wordpress-public-archive" }),
      cleanText(item.excerpt, 600, false), cleanText(item.featuredImage, 1_000, false) || null,
      publicationDate, date ? formatUtopianDate(date) : null, date ? formatGregorianDate(date) : null,
    ));
  }
  statements.push(env.DB.prepare(`
    UPDATE editorial_sync_state
    SET cursor_value = ?2, last_success_at = ?1, last_attempt_at = ?1,
        status = 'succeeded', message = ?3
    WHERE source_key = 'wordpress-public-archive'
  `).bind(now, cleanText(input.cursor || now, 120), `${statements.length} WordPress publications inventoried locally.`));
  const inventoryEventKey = `v3-local:wordpress-inventory:${input.posts.length}:${latestModified || "undated"}`;
  if (!(await entryByEventKey(env, inventoryEventKey))) {
    const event = await prepareEntry(env, {
      eventKey: inventoryEventKey,
      eventType: "wordpress_archive_inventoried",
      category: "editorial",
      title: "WordPress public archive inventoried locally",
      summary: `${input.posts.length} public publications were reconciled with the isolated v3 editorial index without writing to WordPress.`,
      actorName: "Codex · Local Continuity Process",
      subjectName: "Utopian Society WordPress archive",
      subjectRef: "wordpress-public-archive",
      occurredAt: now,
      utopianDate: formatUtopianDate(new Date(now)),
      gregorianDate: formatGregorianDate(new Date(now)),
      sourceLabel: "Editorial bridge · WordPress inventory",
      sourceUrl: civicPageUrl(request, env, "/editorial"),
      metadata: { publications: input.posts.length, latestModified, remoteWrites: false, localSimulation: isLocalV3(env) },
    });
    statements.push(event.statement);
  }
  await env.DB.batch(statements);
  return { imported: input.posts.length, synchronizedAt: now, remoteWrites: false };
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method === "GET" && path === "/") return json(request, { service: "Utopian Society Civic Ledger", status: "operational", version: 2 });
  if (request.method === "GET" && path === "/health") {
    return json(request, {
      ok: true,
      service: "civic-ledger",
      protectedStorageConfigured: Boolean(env.CIVIC_FILE_ENCRYPTION_KEY),
      workersAiConfigured: Boolean(env.AI),
    });
  }
  if (request.method === "GET" && path === "/v1/ledger") return listLedger(request, env, url);
  if (request.method === "GET" && path === "/v1/population") return population(request, env);
  if (request.method === "GET" && path === "/v1/citizens") return listCitizens(request, env, url);
  if (request.method === "GET" && path === "/v4/ticker") {
    return json(request, await publicTicker(request, env), {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=900" },
    });
  }
  if (request.method === "GET" && path === "/v3/publications") {
    return json(request, await listPublications(env, url), {
      headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" },
    });
  }
  const publicPublicationRoute = path.match(/^\/v3\/publications\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (request.method === "GET" && publicPublicationRoute) {
    return json(request, await publicPublicationBySlug(env, publicPublicationRoute[1]), {
      headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=600" },
    });
  }
  const publicProfileAvatarRoute = path.match(/^\/v3\/public\/citizens\/([a-z0-9-]+)\/avatar$/);
  if (request.method === "GET" && publicProfileAvatarRoute) {
    return publicProfileAvatar(request, env, publicProfileAvatarRoute[1]);
  }
  if (request.method === "GET" && path === "/v3/public/citizens") {
    return json(request, await publicCivicDirectory(env), {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }
  const publicProfileRoute = path.match(/^\/v3\/public\/citizens\/([a-z0-9-]+)$/);
  if (request.method === "GET" && publicProfileRoute) {
    return json(request, await publicCivicProfile(env, publicProfileRoute[1]), {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }
  if (request.method === "GET" && path === "/v3/portal/demo") {
    const session = await requireCivicSession(request, env);
    return json(request, await portalSnapshot(env, session.civic_id), { headers: { "Cache-Control": "no-store" } });
  }
  if (request.method === "GET" && path === "/v3/profile/avatar") {
    return profileAvatar(request, env);
  }
  const protectedDocumentContent = path.match(/^\/v3\/documents\/([A-Za-z0-9-]+)\/content$/);
  if (request.method === "GET" && protectedDocumentContent) {
    return downloadProtectedDocument(request, env, protectedDocumentContent[1]);
  }
  if (request.method === "GET" && path === "/v3/contribution/positions") {
    await requireCivicSession(request, env);
    return json(request, { positions: await contributionPositions(env), localSimulation: isLocalV3(env) }, { headers: { "Cache-Control": "no-store" } });
  }
  if (request.method === "GET" && path === "/v3/editorial/status") {
    return json(request, await editorialStatus(request, env), { headers: { "Cache-Control": "no-store" } });
  }
  if (request.method === "GET" && path === "/v3/editorial/access") {
    const session = await requireEditorialAuthority(request, env);
    return json(request, {
      authorized: true,
      civicId: session.civic_id,
      loginName: session.login_name,
    }, { headers: { "Cache-Control": "no-store" } });
  }
  if (request.method === "GET" && path === "/v3/editorial/wordpress-handoff") {
    return json(request, await wordpressHandoffManifest(request, env), { headers: { "Cache-Control": "no-store" } });
  }
  if (request.method === "GET" && path === "/v3/editorial/announcements") {
    return json(request, await listTickerAnnouncements(request, env, url), { headers: { "Cache-Control": "no-store" } });
  }
  if (request.method === "GET" && path === "/v4/editorial/ticker") {
    return json(request, await tickerManager(request, env), { headers: { "Cache-Control": "no-store" } });
  }
  if (request.method === "GET" && path === "/v4/editorial/ticker/weather-locations/geocode") {
    return json(request, await geocodeTickerWeatherLocations(request, env, url), { headers: { "Cache-Control": "no-store" } });
  }
  if (request.method === "GET" && path === "/v3/editorial/analytics") {
    return json(request, await editorialAnalytics(request, env, url), { headers: { "Cache-Control": "no-store" } });
  }
  if (request.method === "GET" && path === "/v2/immigration/assessment/bank") {
    return json(request, {
      version: ASSESSMENT_VERSION_V2,
      categories: bankSummary(),
      releaseMinimumPerCategory: 40,
      correctAnswersExposed: false,
    }, { headers: { "Cache-Control": "public, max-age=300" } });
  }

  if (request.method === "POST" && path === "/v2/immigration/assessment/start") {
    const assessment = await startAssessment(request, env);
    return json(request, assessment, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v3/analytics/event") {
    const body = await readJson(request, 5_000);
    return json(request, await recordPublicAnalytics(request, env, body), {
      status: 202,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v2/immigration/assessment/score") {
    const body = await readJson(request, 40_000);
    const result = await scoreAssessmentV2(request, env, body);
    return json(request, result, { headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v3/auth/login") {
    const body = await readJson(request);
    return json(request, await loginCivicAccount(request, env, body), { headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v3/auth/logout") {
    return json(request, await logoutCivicAccount(request, env), { headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v3/profile/avatar") {
    return json(request, await uploadProfileAvatar(request, env), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/profile/portrait") {
    const generated = await generateProfilePortrait(request, env);
    return binaryResponse(request, generated.bytes, generated.mediaType, null, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  if (request.method === "DELETE" && path === "/v3/profile/avatar") {
    return json(request, await deleteProfileAvatar(request, env), { headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "GET" && path === "/v3/profile/private-identity") {
    return json(request, await getPrivateIdentity(request, env), { headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "PUT" && path === "/v3/profile/private-identity") {
    const body = await readJson(request, 20_000);
    return json(request, await savePrivateIdentity(request, env, body), { headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "PUT" && path === "/v3/profile/public-presentation") {
    const body = await readJson(request, 10_000);
    return json(request, await savePublicProfilePresentation(request, env, body), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/documents") {
    return json(request, await uploadProtectedDocument(request, env), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const protectedDocument = path.match(/^\/v3\/documents\/([A-Za-z0-9-]+)$/);
  if (request.method === "DELETE" && protectedDocument) {
    return json(request, await deleteProtectedDocument(request, env, protectedDocument[1]), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v1/immigration/issue-certificate") {
    const body = await readJson(request);
    const written = await issueCertificate(request, env, body);
    return json(request, written, { status: written.created ? 201 : 200 });
  }

  if (request.method === "POST" && path === "/v3/contribution/assignments/accept") {
    const body = await readJson(request);
    const written = await acceptContributionAssignment(request, env, body);
    return json(request, written, { status: written.created ? 201 : 200, headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v3/learning/goals") {
    const body = await readJson(request);
    return json(request, await createLearningGoal(request, env, body), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/learning/reset") {
    const body = await readJson(request);
    return json(request, await resetLearningProfile(request, env, body), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/learning/evidence-contracts") {
    const body = await readJson(request, 30_000);
    return json(request, await createLearningEvidenceContract(request, env, body), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/learning/challenges") {
    const body = await readJson(request, 10_000);
    return json(request, await createLearningChallenge(request, env, body), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/learning/evaluate") {
    const body = await readJson(request, 40_000);
    return json(request, await evaluateLearningDocuments(request, env, body), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/learning/evaluations/record") {
    const body = await readJson(request, 100_000);
    return json(request, await recordLearningEvaluation(request, env, body), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/usu/enrollments") {
    const body = await readJson(request);
    return json(request, await requestUsuEnrollment(request, env, body), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/healing/appointments") {
    const body = await readJson(request);
    return json(request, await requestHealingAppointment(request, env, body), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/harmony/harms") {
    const body = await readJson(request);
    return json(request, await reportHarmonyHarm(request, env, body), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (request.method === "POST" && path === "/v3/editorial/announcements") {
    const body = await readJson(request);
    const written = await createTickerAnnouncement(request, env, body);
    return json(request, written, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v4/editorial/ticker/announcements") {
    const body = await readJson(request);
    const written = await createTickerAnnouncement(request, env, body);
    return json(request, written, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v4/editorial/ticker/sources") {
    const body = await readJson(request);
    const written = await createTickerSource(request, env, body);
    return json(request, written, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v4/editorial/ticker/weather-locations") {
    const body = await readJson(request);
    const written = await createTickerWeatherLocation(request, env, body);
    return json(request, written, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  const tickerAnnouncementAction = path.match(/^\/v4\/editorial\/ticker\/announcements\/([A-Za-z0-9-]+)$/);
  if (request.method === "PATCH" && tickerAnnouncementAction) {
    const body = await readJson(request);
    return json(request, await updateTickerAnnouncement(request, env, tickerAnnouncementAction[1], body), { headers: { "Cache-Control": "no-store" } });
  }

  const tickerSourceAction = path.match(/^\/v4\/editorial\/ticker\/sources\/([A-Za-z0-9-]+)$/);
  if (request.method === "PATCH" && tickerSourceAction) {
    const body = await readJson(request);
    return json(request, await updateTickerSource(request, env, tickerSourceAction[1], body), { headers: { "Cache-Control": "no-store" } });
  }

  const tickerSourceRefresh = path.match(/^\/v4\/editorial\/ticker\/sources\/([A-Za-z0-9-]+)\/refresh$/);
  if (request.method === "POST" && tickerSourceRefresh) {
    await requireEditorialAuthority(request, env);
    return json(request, await refreshTickerSourceById(env, tickerSourceRefresh[1], true), { headers: { "Cache-Control": "no-store" } });
  }

  const tickerWeatherLocationAction = path.match(/^\/v4\/editorial\/ticker\/weather-locations\/([A-Za-z0-9-]+)$/);
  if (request.method === "PATCH" && tickerWeatherLocationAction) {
    const body = await readJson(request);
    return json(request, await updateTickerWeatherLocation(request, env, tickerWeatherLocationAction[1], body), { headers: { "Cache-Control": "no-store" } });
  }

  const tickerWeatherLocationRefresh = path.match(/^\/v4\/editorial\/ticker\/weather-locations\/([A-Za-z0-9-]+)\/refresh$/);
  if (request.method === "POST" && tickerWeatherLocationRefresh) {
    await requireEditorialAuthority(request, env);
    return json(request, await refreshTickerWeatherLocation(env, tickerWeatherLocationRefresh[1], true), { headers: { "Cache-Control": "no-store" } });
  }

  const tickerFeedItemAction = path.match(/^\/v4\/editorial\/ticker\/feed-items\/([A-Za-z0-9-]+)$/);
  if (request.method === "PATCH" && tickerFeedItemAction) {
    const body = await readJson(request);
    return json(request, await updateTickerFeedItem(request, env, tickerFeedItemAction[1], body), { headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v3/editorial/publications") {
    const body = await readJson(request, 80_000);
    const written = await createEditorialDraft(request, env, body);
    return json(request, written, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v3/editorial/import-wordpress") {
    const body = await readJson(request, 160_000);
    const written = await importWordpressInventory(request, env, body);
    return json(request, written, { headers: { "Cache-Control": "no-store" } });
  }

  if (request.method === "POST" && path === "/v3/editorial/sync-wordpress") {
    await requireEditorialAuthority(request, env);
    return json(request, await syncWordpressArchive(env), { headers: { "Cache-Control": "no-store" } });
  }

  const contributionAction = path.match(/^\/v3\/contribution\/assignments\/([A-Za-z0-9-]+)\/(time|submit|affirm)$/);
  if (request.method === "POST" && contributionAction) {
    const body = await readJson(request);
    const assignmentId = contributionAction[1];
    const written = contributionAction[2] === "time"
      ? await recordContributionTime(request, env, assignmentId, body)
      : contributionAction[2] === "submit"
        ? await submitContributionAssignment(request, env, assignmentId, body)
        : await affirmContributionAssignment(request, env, assignmentId, body);
    return json(request, written, { status: written.created ? 201 : 200, headers: { "Cache-Control": "no-store" } });
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
      return json(request, {
        error: status === 400
          ? "Invalid JSON request."
          : "The civic record could not complete this request.",
      }, { status });
    }
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil((async () => {
      const results = await Promise.allSettled([
        syncReleaseInbox(env),
        syncWordpressArchive(env),
        syncTickerSources(env),
      ]);
      for (const result of results) {
        if (result.status === "rejected") {
          console.error(JSON.stringify({ level: "error", message: "scheduled-civic-task-failed", error: String(result.reason) }));
        }
      }
    })());
  },
};

export default civicLedgerWorker;
