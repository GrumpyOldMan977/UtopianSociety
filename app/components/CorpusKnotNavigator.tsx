"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gregorianDateUTC, MONTHS, utopianDate, WEEKDAYS } from "../lib/utopian-time";
import {
  isNavigatorView,
  navigatorViews,
  NavigatorNode,
  NavigatorView,
  NavigatorViewId,
  RingPosition,
} from "../lib/circle-navigation";

const geometry: Record<RingPosition, { cx: number; cy: number; r: number }> = {
  north: { cx: 360, cy: 185, r: 147 },
  northeast: { cx: 574, cy: 146, r: 143 },
  east: { cx: 533.7, cy: 360, r: 149.6 },
  southeast: { cx: 574, cy: 574, r: 143 },
  south: { cx: 360, cy: 535, r: 147 },
  southwest: { cx: 146, cy: 574, r: 143 },
  west: { cx: 186.3, cy: 360, r: 149.6 },
  northwest: { cx: 146, cy: 146, r: 143 },
};

const diagonalPositions = new Set<RingPosition>(["northeast", "southeast", "southwest", "northwest"]);

function ringArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const point = (angle: number) => {
    const radians = angle * Math.PI / 180;
    // Keep the server and browser SVG path strings byte-for-byte identical.
    // Different JS engines can otherwise disagree in the final floating-point digit.
    const stable = (value: number) => Number(value.toFixed(6));
    return { x: stable(cx + r * Math.cos(radians)), y: stable(cy + r * Math.sin(radians)) };
  };
  const start = point(startAngle);
  const end = point(endAngle);
  const span = ((endAngle - startAngle) % 360 + 360) % 360;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${end.x} ${end.y}`;
}

const diagonalOverpasses: Partial<Record<RingPosition, number[]>> = {
  northeast: [-148.2, 127.6],
  southeast: [-143.8, -57.6],
  southwest: [-52.4, 31.8],
  northwest: [36.3, 122.4],
};

function BaseWeaveArtwork({ nodes }: { nodes: NavigatorNode[] }) {
  const center = { cx: 361.3, cy: 360, r: 130.9 };
  const outerRings = [
    { cx: 360, cy: 185, r: 147 },
    { cx: 186.3, cy: 360, r: 149.6 },
    { cx: 533.7, cy: 360, r: 149.6 },
    { cx: 360, cy: 535, r: 147 },
  ];
  const centerOverpasses = [-145, -56, 35, 124];
  const diagonalNodes = nodes.filter((node) => diagonalPositions.has(node.position));
  const strandCircle = (ring: { cx: number; cy: number; r: number }, key: string) => <g key={key}>
    <circle className="weave-strand-shadow" {...ring} />
    <circle className="weave-strand-body" {...ring} />
    <circle className="weave-strand-light" {...ring} />
  </g>;

  return (
    <svg className="living-base-weave" viewBox="0 0 720 720" aria-hidden="true">
      <defs>
        <radialGradient id="knot-glow" cx="50%" cy="48%" r="58%">
          <stop offset="0" stopColor="#d8bb7b" stopOpacity=".14" />
          <stop offset=".62" stopColor="#6a8b79" stopOpacity=".035" />
          <stop offset="1" stopColor="#071815" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="360" cy="360" r="314" fill="url(#knot-glow)" />
      <g className="living-diagonal-strands weave-diagonal-under">
        {diagonalNodes.map((node) => strandCircle(geometry[node.position], `diagonal-${node.position}`))}
      </g>
      <g className="weave-center-under">
        {strandCircle(center, "center-under")}
      </g>
      <g className="weave-outer-rings">
        {outerRings.map((ring, index) => strandCircle(ring, `outer-${index}`))}
      </g>
      <g className="weave-center-over">
        {centerOverpasses.map((angle) => {
          const d = ringArc(center.cx, center.cy, center.r, angle - 8.5, angle + 8.5);
          return <g key={angle}>
            <path className="weave-strand-shadow" d={d} />
            <path className="weave-strand-body" d={d} />
            <path className="weave-strand-light" d={d} />
          </g>;
        })}
      </g>
      <g className="living-diagonal-strands weave-diagonal-over">
        {diagonalNodes.map((node) => {
          const ring = geometry[node.position];
          return <g className="living-ring-stroke is-diagonal" key={`over-${node.position}`}>
            {(diagonalOverpasses[node.position] ?? []).map((angle) => {
              const d = ringArc(ring.cx, ring.cy, ring.r, angle - 7.5, angle + 7.5);
              return <g key={angle}>
                <path className="weave-strand-shadow" d={d} />
                <path className="weave-strand-body" d={d} />
                <path className="weave-strand-light" d={d} />
              </g>;
            })}
          </g>;
        })}
      </g>
    </svg>
  );
}

export function CorpusKnotNavigator({ initialView = "root", compact = false }: { initialView?: NavigatorViewId; compact?: boolean }) {
  const [viewId, setViewId] = useState<NavigatorViewId>(initialView);
  const [phase, setPhase] = useState<"steady" | "leaving" | "entering">("steady");
  const [now, setNow] = useState(() => new Date("2026-03-20T00:00:00Z"));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [month, setMonth] = useState<number | null>(null);
  const transitionTimer = useRef<number | null>(null);
  const date = useMemo(() => utopianDate(now), [now]);
  const view = navigatorViews[viewId];

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (month === null && date.monthIndex >= 0) setMonth(date.monthIndex);
  }, [date.monthIndex, month]);

  useEffect(() => {
    const requested = new URL(window.location.href).searchParams.get("map");
    if (isNavigatorView(requested)) setViewId(requested);
    const onPopState = () => {
      const value = new URL(window.location.href).searchParams.get("map");
      setViewId(isNavigatorView(value) ? value : initialView);
      setPhase("entering");
      window.setTimeout(() => setPhase("steady"), 220);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [initialView]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setCalendarOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    if (!calendarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [calendarOpen]);

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
  }, []);

  const transitionTo = (next: NavigatorViewId) => {
    if (phase !== "steady" || next === viewId) return;
    setPhase("leaving");
    transitionTimer.current = window.setTimeout(() => {
      setViewId(next);
      const url = new URL(window.location.href);
      if (next === "root" && !compact) url.searchParams.delete("map");
      else url.searchParams.set("map", next);
      window.history.pushState({ corpusView: next }, "", `${url.pathname}${url.search}${url.hash}`);
      setPhase("entering");
      transitionTimer.current = window.setTimeout(() => setPhase("steady"), 230);
    }, 210);
  };

  const openCalendar = () => {
    setMonth(date.monthIndex >= 0 ? date.monthIndex : MONTHS.length - 1);
    setCalendarOpen(true);
  };

  const ancestry = useMemo(() => {
    const trail: { id: NavigatorViewId; label: string }[] = [];
    let cursor: NavigatorViewId | undefined = viewId;
    while (cursor) {
      const item: NavigatorView = navigatorViews[cursor];
      trail.unshift({ id: cursor, label: cursor === "root" ? "Corpus" : item.eyebrow });
      cursor = item.parent;
    }
    return trail;
  }, [viewId]);

  const renderNode = (node: NavigatorNode) => {
    const ring = geometry[node.position];
    const content = <span className="living-ring-copy">
      <span className="living-ring-title">{node.title}</span>
      <span className="living-ring-subtitle">
        {(node.subtitleLines ?? [node.subtitle]).map((line) => <span key={line}>{line}</span>)}
      </span>
      <span className="living-ring-enter">{node.nextView ? "Open map" : "Enter"}</span>
    </span>;
    const className = `living-ring-hit living-ring-${node.position}${node.primary ? " is-primary" : ""}`;
    const style = {
      left: `${(ring.cx / 720) * 100}%`,
      top: `${(ring.cy / 720) * 100}%`,
    };
    if (node.nextView) return <button className={className} style={style} onClick={() => transitionTo(node.nextView!)} key={node.id}>{content}</button>;
    return <Link className={className} style={style} href={node.href ?? "#"} key={node.id}>{content}</Link>;
  };

  return <>
    <div className={`corpus-navigator ${compact ? "is-compact" : ""}`}>
      <div className="navigator-copy" aria-live="polite">
        <span className="eyebrow">{view.eyebrow}</span>
        <h2>{view.title}</h2>
        <p>{view.description}</p>
      </div>

      <nav className="knot-breadcrumbs" aria-label="Civic map path">
        {ancestry.map((item, index) => <span key={item.id}>
          {index > 0 && <i aria-hidden="true">/</i>}
          <button onClick={() => transitionTo(item.id)} aria-current={item.id === viewId ? "page" : undefined}>{item.label}</button>
        </span>)}
      </nav>

      <div className={`living-knot-stage phase-${phase}`} data-view={viewId} aria-label={`${view.title} ring navigation`}>
        <BaseWeaveArtwork nodes={view.nodes} />
        <div className="living-ring-layer" key={viewId}>{view.nodes.map(renderNode)}</div>
        <button className="time-heart living-time-heart" onClick={openCalendar} aria-haspopup="dialog">
          <span className="time-kicker"><b>Utopian</b><b>Reference Time</b></span>
          <strong>{now.toISOString().slice(11, 19)}</strong>
          <span>{date.month} {String(date.day).padStart(2, "0")}</span>
          <small className="time-calendar-line"><b>{date.weekday}</b><span>{date.moon} · UTC</span></small>
          <em>Open the living calendar</em>
        </button>
      </div>

      {view.parent && <div className="navigator-actions">
        <button onClick={() => transitionTo(view.parent!)}>← Back one weave</button>
        <button onClick={() => transitionTo("root")}>Return to the frontispiece</button>
      </div>}
      <p className="navigator-instruction">Ring labels change in place; the center continues to keep Utopian time.</p>
    </div>

    {calendarOpen && (
      <div className="calendar-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCalendarOpen(false)}>
        <section className="calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="calendar-title">
          <button className="dialog-close" onClick={() => setCalendarOpen(false)} aria-label="Close calendar">×</button>
          <span className="eyebrow">The living measure of time</span>
          <h2 id="calendar-title">The Utopian Calendar</h2>
          <div className="calendar-current">
            <div><span>Today · {date.yearLabel}</span><strong>{date.month} {String(date.day).padStart(2, "0")}</strong><small>{date.weekday} · {date.moon}</small></div>
            <div><span>Reference</span><strong>{now.toISOString().slice(11, 19)} UTC</strong><small>{gregorianDateUTC(now)}</small></div>
          </div>
          <div className="month-ribbon" aria-label="Utopian months">
            {MONTHS.map(([name], index) => <button className={month === index ? "active" : ""} aria-pressed={month === index} onClick={() => setMonth(index)} key={name}>{String(index + 1).padStart(2, "0")}<span>{name}</span></button>)}
          </div>
          {month !== null && <div className="month-detail"><span>Month {month + 1} of 13</span><h3>{MONTHS[month][0]}</h3><p>{MONTHS[month][1]} · 28 days · four equal weeks</p><div className="day-grid">{WEEKDAYS.map((weekday) => <b key={weekday} title={weekday}>{weekday.replace("day", "")}</b>)}{Array.from({ length: 28 }, (_, index) => <i className={month === date.monthIndex && index + 1 === date.day ? "today" : ""} key={index}>{index + 1}</i>)}</div></div>}
          <div className="calendar-footer"><p>Thirteen months form 364 days. The Bridging stands outside both month and week. Utopian Year 1 is anchored to March 20, 2026 at 00:00 UTC.</p><Link href="/corpus/charter-of-time-and-observance">Read the Charter of Time and Observance →</Link></div>
        </section>
      </div>
    )}
  </>;
}
