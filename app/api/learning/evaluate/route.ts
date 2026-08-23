import { NextRequest, NextResponse } from "next/server";
import { serverCivicLedgerApi } from "../../../lib/server-civic-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Sign in before requesting a Learning assessment." },
      { status: 401 },
    );
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > 40_000) {
    return NextResponse.json({ error: "The assessment request is too large." }, { status: 413 });
  }

  const civicApi = serverCivicLedgerApi();
  if (!civicApi) {
    return NextResponse.json(
      {
        error: "The civic Learning service is not configured. No Learning record was changed.",
        code: "civic_service_unconfigured",
      },
      { status: 503 },
    );
  }

  let response: Response;
  try {
    response = await fetch(`${civicApi}/v3/learning/evaluate`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        Origin: request.nextUrl.origin,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "The Cloudflare civic service could not be reached. No Learning record was changed." },
      { status: 503 },
    );
  }

  const contentType = response.headers.get("content-type") || "application/json; charset=utf-8";
  const responseBody = await response.arrayBuffer();
  if (!/\bjson\b/i.test(contentType)) {
    return NextResponse.json(
      {
        error: "The civic Learning service returned an unreadable response. No Learning record was changed.",
        code: "civic_service_response_invalid",
      },
      { status: 502 },
    );
  }
  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
