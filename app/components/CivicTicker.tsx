"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { utopianDate } from "../lib/utopian-time";

type TickerTreatment = "standard" | "vellum" | "alternating" | "urgent" | "pulse";

type TickerItem = {
  itemId: string;
  recordType: "manual" | "system" | "feed";
  sourceId: string | null;
  sourceLabel: string;
  kind: string;
  label: string;
  href: string | null;
  priority: number;
  sortOrder: number;
  treatment: TickerTreatment;
  status: "live";
};

type TickerPayload = {
  items: TickerItem[];
  credits: Array<{ sourceId: string; label: string; href: string }>;
  updatedAt: string;
};

function civicTime(date: Date) {
  const civicDate = utopianDate(date);
  const utc = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${civicDate.weekday} · ${civicDate.month} ${civicDate.day} · ${civicDate.yearLabel} · ${utc} UTC`;
}

function externalDestination(href: string | null) {
  return Boolean(href?.startsWith("https://"));
}

export function CivicTicker() {
  const [payload, setPayload] = useState<TickerPayload | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const update = async () => {
      try {
        const response = await fetch("/api/ticker", { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Ticker update unavailable");
        const next = await response.json() as TickerPayload;
        if (active) setPayload(next);
      } catch {
        if (active) setPayload(null);
      }
    };

    setNow(new Date());
    void update();
    const dataInterval = window.setInterval(update, 5 * 60 * 1000);
    const clockInterval = window.setInterval(() => setNow(new Date()), 30 * 1000);
    return () => {
      active = false;
      window.clearInterval(dataInterval);
      window.clearInterval(clockInterval);
    };
  }, []);

  const items = useMemo<TickerItem[]>(() => {
    const managed = payload?.items?.map((item) => item.kind === "reference-time"
      ? { ...item, label: now ? `Utopian Reference Time · ${civicTime(now)}` : item.label }
      : item) ?? [];
    if (managed.length) return managed;
    return [
      {
        itemId: "ticker-reference-time-fallback",
        recordType: "system",
        sourceId: null,
        sourceLabel: "Utopian Reference Time",
        kind: "reference-time",
        label: now ? `Utopian Reference Time · ${civicTime(now)}` : "Utopian Reference Time · Synchronizing",
        href: null,
        priority: 10,
        sortOrder: 0,
        treatment: "standard",
        status: "live",
      },
      {
        itemId: "ticker-ledger-fallback",
        recordType: "system",
        sourceId: null,
        sourceLabel: "Transparency Ledger",
        kind: "ledger",
        label: "Public record · Transparency Ledger operational",
        href: "/transparency-ledger",
        priority: 10,
        sortOrder: 10,
        treatment: "standard",
        status: "live",
      },
    ];
  }, [now, payload]);

  const duration = `${Math.max(58, items.map((item) => item.label).join(" ").length * 0.16)}s`;
  const visibleCredits = payload?.credits?.slice(0, 3) ?? [];

  return (
    <section className="civic-ticker" aria-label="Live civic wire">
      <span className="ticker-status" aria-hidden="true"><i /> Live civic wire</span>
      <div className="ticker-window">
        <div className="ticker-track" style={{ "--ticker-duration": duration } as CSSProperties} aria-hidden="true">
          {[0, 1].map((copy) => <span className="ticker-copy" key={copy}>
            {items.map((item) => <span className={`ticker-item ticker-treatment-${item.treatment}`} key={`${copy}-${item.itemId}`}><b>◆</b>{item.href ? <a href={item.href} tabIndex={-1} target={externalDestination(item.href) ? "_blank" : undefined} rel={externalDestination(item.href) ? "noreferrer" : undefined}>{item.label}</a> : item.label}</span>)}
          </span>)}
        </div>
        <ul className="ticker-a11y">
          {items.map((item) => <li key={`accessible-${item.itemId}`}>
            {item.href
              ? <a href={item.href} target={externalDestination(item.href) ? "_blank" : undefined} rel={externalDestination(item.href) ? "noreferrer" : undefined}>{item.label}</a>
              : item.label}
          </li>)}
          {(payload?.credits ?? []).map((credit) => <li key={`credit-${credit.sourceId}`}><a href={credit.href}>{credit.label} source</a></li>)}
        </ul>
      </div>
      <span className="ticker-credit">
        {visibleCredits.length
          ? visibleCredits.map((credit) => <a key={credit.sourceId} href={credit.href} target={externalDestination(credit.href) ? "_blank" : undefined} rel={externalDestination(credit.href) ? "noreferrer" : undefined}>{credit.label}</a>)
          : <a href="/transparency-ledger">Ledger: Civic Portal</a>}
      </span>
    </section>
  );
}
