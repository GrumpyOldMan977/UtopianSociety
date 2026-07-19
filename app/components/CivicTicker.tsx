"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { utopianDate } from "../lib/utopian-time";

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
    const next = [
      "BETA · Civic portal under active construction",
      payload?.weather
        ? `South Pacific Gyre · ${payload.weather.temperatureF}°F · ${payload.weather.condition} · wind ${payload.weather.windDirection} ${payload.weather.windMph} mph${payload.weather.seaTemperatureF !== null ? ` · sea ${payload.weather.seaTemperatureF}°F` : ""}${payload.weather.waveHeightFt !== null ? ` · swell ${payload.weather.waveHeightFt} ft` : ""}`
        : "South Pacific Gyre · Awaiting the next open-ocean observation",
      now ? `Utopian Reference Time · ${civicTime(now)}` : "Utopian Reference Time · Synchronizing",
      "Civic instruments · Public beta · Prototype records are not retained",
      ...(payload?.headlines ?? []).map((headline) => `World · ${headline.title}`),
    ];
    return next;
  }, [now, payload]);

  const duration = `${Math.max(58, items.join(" ").length * 0.16)}s`;

  return (
    <section className="civic-ticker" aria-label="Live civic wire">
      <span className="ticker-status" aria-hidden="true"><i /> Live civic wire</span>
      <div className="ticker-window">
        <div className="ticker-track" aria-hidden="true" style={{ "--ticker-duration": duration } as CSSProperties}>
          {[0, 1].map((copy) => <span className="ticker-copy" key={copy}>
            {items.map((item, index) => <span className="ticker-item" key={`${copy}-${index}`}><b>◆</b>{item}</span>)}
          </span>)}
        </div>
        <p className="ticker-a11y" aria-live="polite">{items.join(". ")}</p>
      </div>
      <span className="ticker-credit">
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather: Open-Meteo</a>
        <a href="https://www.bbc.com/news/world" target="_blank" rel="noreferrer">Headlines: BBC News</a>
      </span>
    </section>
  );
}
