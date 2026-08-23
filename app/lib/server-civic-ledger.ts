const LOCAL_CIVIC_LEDGER_API = "http://127.0.0.1:8788";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function serverCivicLedgerApi() {
  const configured = process.env.CIVIC_LEDGER_INTERNAL_API?.trim();
  if (!configured) {
    return process.env.NODE_ENV === "development" ? LOCAL_CIVIC_LEDGER_API : null;
  }

  try {
    const url = new URL(configured);
    if (process.env.NODE_ENV !== "development" && (url.protocol !== "https:" || isLocalHost(url.hostname))) {
      return null;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
