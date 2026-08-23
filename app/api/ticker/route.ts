import { CIVIC_LEDGER_API } from "../../lib/civic-ledger";

export async function GET() {
  try {
    const response = await fetch(`${CIVIC_LEDGER_API}/v4/ticker`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const body = await response.text();
    if (!response.ok) {
      return Response.json({
        items: [],
        credits: [],
        updatedAt: new Date().toISOString(),
        error: "The managed civic wire is temporarily unavailable.",
      }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
      },
    });
  } catch {
    return Response.json({
      items: [],
      credits: [],
      updatedAt: new Date().toISOString(),
      error: "The managed civic wire is temporarily unavailable.",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
