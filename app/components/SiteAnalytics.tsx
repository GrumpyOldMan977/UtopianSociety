"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ANALYTICS_ENDPOINT = "https://utopian-civic-ledger.utopian-society-civic.workers.dev/v3/analytics/event";
const PRIVATE_PATH = /^\/(?:portal|login|editorial|api)(?:\/|$)/;

export function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || PRIVATE_PATH.test(pathname)) return;
    const parameters = new URLSearchParams(window.location.search);
    const receiptKey = `utopia.analytics:${pathname}?${parameters.toString()}`;
    try {
      if (window.sessionStorage.getItem(receiptKey)) return;
      window.sessionStorage.setItem(receiptKey, "recorded");
    } catch {
      // A privacy-restricted browser can still send the aggregate event.
    }
    let referrerHost = "";
    try {
      referrerHost = document.referrer ? new URL(document.referrer).hostname : "";
    } catch {
      referrerHost = "";
    }
    void fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrerHost,
        utmSource: parameters.get("utm_source") || "",
        utmMedium: parameters.get("utm_medium") || "",
        utmCampaign: parameters.get("utm_campaign") || "",
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
