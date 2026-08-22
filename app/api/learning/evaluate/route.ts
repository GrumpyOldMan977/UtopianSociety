import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const civicApi = () => (
  process.env.CIVIC_LEDGER_INTERNAL_API || "http://127.0.0.1:8788"
).replace(/\/$/, "");

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

  let response: Response;
  try {
    response = await fetch(`${civicApi()}/v3/learning/evaluate`, {
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
  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
