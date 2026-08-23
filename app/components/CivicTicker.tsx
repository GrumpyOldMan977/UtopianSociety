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
  announcements: Array<{ announcementId: string; label: string; href: string | null; priority: number }>;
  updatedAt: string;
};

type TickerItem = { label: string; href?: string };

const WEATHER_SOURCE =
  "https://open-meteo.com/en/docs#latitude=-30&longitude=-130&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m";

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

  const items = useMemo<TickerItem[]>(() => {
    const population = payload?.population;
    const populationCopy = population
      ? `Population: ${population.active.toLocaleString()}`
      : "Population · Awaiting the public Citizen Register";
    return [
      {
        label: "V3 · Public site updated · OpenAI Build Week judging complete · Awaiting results.",
        href: "/transparency-ledger",
      },
      ...(payload?.announcements ?? []).map((announcement) => ({
        label: `Local · ${announcement.label}`,
        href: announcement.href || "/blogs-essays",
      })),
      {
        label: "Local News · The Utopian Society enters OpenAI Build Week · View the public submission",
        href: "https://devpost.com/software/the-utopian-society",
      },
      { label: populationCopy, href: "/citizens" },
      payload?.weather
        ? { label: `South Pacific Gyre · ${payload.weather.temperatureF}°F · ${payload.weather.condition} · wind ${payload.weather.windDirection} ${payload.weather.windMph} mph${payload.weather.seaTemperatureF !== null ? ` · sea ${payload.weather.seaTemperatureF}°F` : ""}${payload.weather.waveHeightFt !== null ? ` · swell ${payload.weather.waveHeightFt} ft` : ""}`, href: WEATHER_SOURCE }
        : { label: "South Pacific Gyre · Awaiting the next open-ocean observation", href: WEATHER_SOURCE },
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
        <div className="ticker-track" style={{ "--ticker-duration": duration } as CSSProperties} aria-hidden="true">
          {[0, 1].map((copy) => <span className="ticker-copy" key={copy}>
            {items.map((item, index) => <span className="ticker-item" key={`${copy}-${index}`}><b>◆</b>{item.href ? <a href={item.href} tabIndex={-1} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noreferrer" : undefined}>{item.label}</a> : item.label}</span>)}
          </span>)}
        </div>
        <ul className="ticker-a11y">
          {items.map((item, index) => <li key={`accessible-${index}`}>
            {item.href
              ? <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noreferrer" : undefined}>{item.label}</a>
              : item.label}
          </li>)}
        </ul>
      </div>
      <span className="ticker-credit">
        <a href="/transparency-ledger">Ledger: Civic Portal</a>
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather: Open-Meteo</a>
        <a href="https://www.bbc.com/news/world" target="_blank" rel="noreferrer">Headlines: BBC News</a>
      </span>
    </section>
  );
}
