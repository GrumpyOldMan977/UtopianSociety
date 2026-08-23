import { NextRequest, NextResponse } from "next/server";
import { serverCivicLedgerApi } from "../../../lib/server-civic-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CROP_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PORTRAIT_PROMPT = `Transform the supplied square head-and-shoulders portrait into a dignified Renaissance anatomical-study colored-pencil drawing on warm ochre vellum. Preserve the person's facial identity, apparent age, skin tone, hair, glasses, beard, expression, and head angle with high fidelity. Use fine graphite and ink hatching, subtle hand-drawn contours, natural facial proportions, muted green, teal, and antique-gold color accents, and gentle parchment texture inspired by Leonardo da Vinci's Vitruvian manuscript aesthetic. Keep the face centered and fully visible inside a circular-avatar-safe composition. Do not add text, labels, signatures, symbols, insignia, extra people, extra limbs, hats, jewelry, uniforms, costumes, or invented objects. The output must be a polished square civic portrait, not a photographic filter, embossing effect, relief, negative, or photocopy.`;

function jsonError(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function hasCivicSession(authorization: string, civicApi: string, origin: string) {
  try {
    const response = await fetch(`${civicApi}/v3/portal/demo`, {
      headers: { Authorization: authorization, Origin: origin },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return jsonError("Sign in before generating a profile portrait.", "civic_auth_required", 401);
  }

  const civicApi = serverCivicLedgerApi();
  if (!civicApi) {
    return jsonError("The civic service is not configured. No portrait was generated.", "civic_service_unconfigured", 503);
  }
  if (!await hasCivicSession(authorization, civicApi, request.nextUrl.origin)) {
    return jsonError("Your civic session has expired. Sign in again before generating a portrait.", "civic_session_invalid", 401);
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return jsonError("The Renaissance portrait generator is not configured.", "portrait_generator_unconfigured", 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("The cropped profile photograph could not be read.", "portrait_crop_invalid", 400);
  }
  const crop = form.get("file");
  if (!(crop instanceof File) || !ALLOWED_IMAGE_TYPES.has(crop.type) || crop.size < 1 || crop.size > MAX_CROP_BYTES) {
    return jsonError("Send a valid JPG, PNG, or WebP crop no larger than 3 MB.", "portrait_crop_invalid", 400);
  }

  const openAiForm = new FormData();
  const cropExtension = crop.type === "image/jpeg" ? "jpg" : crop.type === "image/png" ? "png" : "webp";
  openAiForm.append("model", "gpt-image-2");
  openAiForm.append("image[]", crop, `civic-profile-crop.${cropExtension}`);
  openAiForm.append("prompt", PORTRAIT_PROMPT);
  openAiForm.append("size", "1024x1024");
  openAiForm.append("quality", "medium");

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openAiForm,
      cache: "no-store",
      signal: AbortSignal.timeout(180_000),
    });
  } catch {
    return jsonError("The portrait generator could not be reached. Try again in a moment.", "portrait_generator_unreachable", 503);
  }

  if (!response.ok) {
    const requestId = response.headers.get("x-request-id");
    console.error("OpenAI portrait generation failed", { status: response.status, requestId });
    const status = response.status === 429 ? 429 : 502;
    const message = response.status === 429
      ? "The portrait generator is busy or its allowance has been reached. Try again later."
      : "The portrait generator could not complete this image. Try another crop or try again later.";
    return jsonError(message, "portrait_generation_failed", status);
  }

  let result: { data?: Array<{ b64_json?: string }> };
  try {
    result = await response.json() as { data?: Array<{ b64_json?: string }> };
  } catch {
    return jsonError("The portrait generator returned an unreadable response.", "portrait_response_invalid", 502);
  }
  const encoded = result.data?.[0]?.b64_json;
  if (!encoded) {
    return jsonError("The portrait generator returned no image.", "portrait_response_invalid", 502);
  }

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  } catch {
    return jsonError("The portrait generator returned an unreadable image.", "portrait_response_invalid", 502);
  }
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, private",
      "Content-Length": String(bytes.byteLength),
    },
  });
}
