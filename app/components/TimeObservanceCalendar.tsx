"use client";

import { useMemo, useState } from "react";
import { gregorianDateUTC, MONTHS, utopianDate, WEEKDAYS } from "../lib/utopian-time";

export function TimeObservanceCalendar() {
  const today = useMemo(() => new Date(), []);
  const current = utopianDate(today);
  const currentMonth = current.monthIndex < 0 ? 0 : current.monthIndex;
  const currentDay = current.monthIndex < 0 ? 1 : current.day;
  const [monthIndex, setMonthIndex] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const selectedMonth = MONTHS[monthIndex];

  const selectMonth = (index: number, moveFocus = false) => {
    setMonthIndex(index);
    setSelectedDay(index === current.monthIndex ? current.day : 1);
    if (moveFocus) requestAnimationFrame(() => document.getElementById(`observance-month-${index}`)?.focus());
  };

  const returnToToday = () => {
    setMonthIndex(currentMonth);
    setSelectedDay(currentDay);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".observance-grid .is-today")?.focus());
  };

  return <section className="observance-calendar" id="living-calendar" aria-labelledby="observance-title">
    <div className="observance-heading">
      <span className="eyebrow">The living measure of time</span>
      <h2 id="observance-title">The Utopian calendar</h2>
      <p>The center remains a shared civic instrument—not an eighth Circle. Every date is computed by the same authoritative engine used by the frontispiece clock.</p>
    </div>
    <div className="observance-today">
      <div><small>Today · {current.yearLabel}</small><strong>{current.weekday} · {current.month} {String(current.day).padStart(2, "0")}</strong><span>{current.moon}</span></div>
      <div><small>Gregorian reference</small><strong>{gregorianDateUTC(today)}</strong><button type="button" onClick={returnToToday}>Return to today</button></div>
    </div>
    <div className="observance-months" role="tablist" aria-label="Utopian months">
      {MONTHS.map(([month], index) => <button
        type="button"
        role="tab"
        id={`observance-month-${index}`}
        aria-controls="observance-month-panel"
        aria-selected={monthIndex === index}
        tabIndex={monthIndex === index ? 0 : -1}
        onClick={() => selectMonth(index)}
        onKeyDown={(event) => {
          let next = index;
          if (event.key === "ArrowRight") next = (index + 1) % MONTHS.length;
          else if (event.key === "ArrowLeft") next = (index - 1 + MONTHS.length) % MONTHS.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = MONTHS.length - 1;
          else return;
          event.preventDefault();
          selectMonth(next, true);
        }}
        key={month}
      >{String(index + 1).padStart(2, "0")}<span>{month}</span></button>)}
    </div>
    <div id="observance-month-panel" role="tabpanel" aria-labelledby={`observance-month-${monthIndex}`}>
      <div className="observance-grid-heading"><span>Month {monthIndex + 1} of 13</span><h3>{selectedMonth[0]}</h3><p>{selectedMonth[1]} · 28 days · four equal weeks</p></div>
      <div className="observance-grid">
        {WEEKDAYS.map((day) => <b key={day}>{day.replace("day", "")}</b>)}
        {Array.from({ length: 28 }, (_, index) => {
          const day = index + 1;
          const isToday = current.monthIndex === monthIndex && current.day === day;
          const isSelected = selectedDay === day;
          return <button
            type="button"
            className={`${isToday ? "is-today" : ""}${isSelected ? " is-selected" : ""}`}
            aria-pressed={isSelected}
            aria-label={`${selectedMonth[0]} ${day}${isToday ? ", today" : ""}`}
            onClick={() => setSelectedDay(day)}
            key={day}
          ><span>{day}</span>{isToday && <small>Today</small>}</button>;
        })}
      </div>
      <div className="observance-selection" aria-live="polite">
        <small>Selected civic date</small>
        <strong>{WEEKDAYS[(selectedDay - 1) % WEEKDAYS.length]} · {selectedMonth[0]} {selectedDay}</strong>
        <span>No mandatory observance is attached to this preview date. Published events will state purpose, accessibility, and voluntary participation.</span>
      </div>
    </div>
    <div className="observance-kinds" aria-label="Observance and celestial-event guidance">
      <article><span>01</span><h4>Civic observances</h4><p>Public remembrance, seasonal gatherings, and continuity rites are shown with their Utopian date, purpose, accessibility, and voluntary-participation statement.</p></article>
      <article><span>02</span><h4>Celestial events</h4><p>Equinoxes, solstices, and other astronomical events are recorded at their exact UTC instant. The civic date identifies the day containing the event; it does not replace astronomy.</p></article>
      <article><span>03</span><h4>The Bridging</h4><p>The year’s closing day stands outside both month and week. A Deep Bridging adds a second intercalary day only in the calendar’s defined cycle.</p></article>
      <article><span>04</span><h4>Freedom of observance</h4><p>No calendar entry compels worship, ritual, cultural agreement, or attendance. Shared time coordinates civic life while belief remains free.</p></article>
    </div>
    <p className="observance-note"><b>The Bridging</b> follows Iskareth outside the ordinary week. Observance remains voluntary; shared time coordinates civic life without compelling belief or ritual.</p>
  </section>;
}
