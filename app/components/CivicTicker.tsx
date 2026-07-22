"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { utopianDate } from "../lib/utopian-time";
import type { PopulationSummary } from "../lib/civic-ledger";

type TickerPayload = {
  weather: null | {
    temperatureF: number;
    feelsLikeF: number;
    condition: string;
    windMph: number;
    windDirection: string;
    seaTemperatureF: number | null;
    waveHeightFt: number | null;
    currentMph: number | null;
  };
  population: PopulationSummary | null;
  headlines: Array<{ title: string; url: string }>;
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
    const dataInterval = window.setInterval(update, 10 * 60 * 1000);
    const clockInterval = window.setInterval(() => setNow(new Date()), 30 * 1000);
    return () => {
      active = false;
      window.clearInterval(dataInterval);
      window.clearInterval(clockInterval);
    };
  }, []);

  const items = useMemo(() => {
    const population = payload?.population;
    const populationCopy = population
      ? `Population: ${population.active.toLocaleString()}`
      : "Population · Awaiting the public Citizen Register";
    return [
      { label: "BETA · Public site frozen for review, updates planned Spiraday, Solvane 28, Utopian Year 1, once judging completes." },
      {
        label: "Local News · The Utopian Society enters OpenAI Build Week · View the public submission",
        href: "https://devpost.com/software/the-utopian-society",
      },
      { label: populationCopy },
      payload?.weather
        ? { label: `South Pacific Gyre · ${payload.weather.temperatureF}°F · ${payload.weather.condition} · wind ${payload.weather.windDirection} ${payload.weather.windMph} mph${payload.weather.seaTemperatureF !== null ? ` · sea ${payload.weather.seaTemperatureF}°F` : ""}${payload.weather.waveHeightFt !== null ? ` · swell ${payload.weather.waveHeightFt} ft` : ""}` }
        : { label: "South Pacific Gyre · Awaiting the next open-ocean observation" },
      { label: now ? `Utopian Reference Time · ${civicTime(now)}` : "Utopian Reference Time · Synchronizing" },
      { label: "Public record · Transparency Ledger operational", href: "/transparency-ledger" },
      ...(payload?.headlines ?? []).map((headline) => ({ label: `World · ${headline.title}`, href: headline.url })),
    ];
  }, [now, payload]);

  const duration = `${Math.max(58, items.map((item) => item.label).join(" ").length * 0.16)}s`;

  return (
    <section className="civic-ticker" aria-label="Live civic wire">
      <span className="ticker-status" aria-hidden="true"><i /> Live civic wire</span>
      <div className="ticker-window">
        <div className="ticker-track" aria-hidden="true" style={{ "--ticker-duration": duration } as CSSProperties}>
          {[0, 1].map((copy) => <span className="ticker-copy" key={copy}>
            {items.map((item, index) => <span className="ticker-item" key={`${copy}-${index}`}><b>◆</b>{item.href ? <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noreferrer" : undefined}>{item.label}</a> : item.label}</span>)}
          </span>)}
        </div>
        <p className="ticker-a11y" aria-live="polite">{items.map((item) => item.label).join(". ")}</p>
      </div>
      <span className="ticker-credit">
        <a href="/transparency-ledger">Ledger: Civic Portal</a>
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather: Open-Meteo</a>
        <a href="https://www.bbc.com/news/world" target="_blank" rel="noreferrer">Headlines: BBC News</a>
      </span>
    </section>
  );
}
