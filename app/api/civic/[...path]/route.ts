import type { NextRequest } from "next/server";

const LOCAL_CIVIC_SERVICE = "http://127.0.0.1:8788";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StreamingRequestInit = RequestInit & {
  duplex?: "half";
};

function civicServiceBase() {
  return (process.env.CIVIC_LEDGER_INTERNAL_API || LOCAL_CIVIC_SERVICE).replace(/\/$/, "");
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(`${civicServiceBase()}/${path.map(encodeURIComponent).join("/")}`);
  targetUrl.search = sourceUrl.search;

  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept", "idempotency-key"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Origin", sourceUrl.origin);
  headers.set("X-Forwarded-Host", sourceUrl.host);

  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : request.body;
  const init: StreamingRequestInit = {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  };
  if (body) init.duplex = "half";
  const response = await fetch(targetUrl, init);
  const responseHeaders = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) responseHeaders.set("Content-Type", contentType);
  responseHeaders.set("Cache-Control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
