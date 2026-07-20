"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CIVIC_LEDGER_API,
  type LedgerEntry,
  type PopulationSummary,
  type PublicCitizen,
} from "../lib/civic-ledger";

type LedgerState = {
  population: PopulationSummary;
  citizens: PublicCitizen[];
  entries: LedgerEntry[];
};

function categoryLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function hashExcerpt(value: string) {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

export function TransparencyLedger() {
  const [state, setState] = useState<LedgerState | null>(null);
  const [error, setError] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    let loading = false;
    const controller = new AbortController();
    const load = async () => {
      if (loading) return;
      loading = true;
      try {
        const [populationResponse, citizensResponse, ledgerResponse] = await Promise.all([
          fetch(`${CIVIC_LEDGER_API}/v1/population`, { cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal }),
          fetch(`${CIVIC_LEDGER_API}/v1/citizens?limit=100`, { cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal }),
          fetch(`${CIVIC_LEDGER_API}/v1/ledger?limit=100`, { cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal }),
        ]);
        if (!populationResponse.ok || !citizensResponse.ok || !ledgerResponse.ok) {
          throw new Error("The public record is temporarily unavailable.");
        }
        const [population, citizensPayload, ledgerPayload] = await Promise.all([
          populationResponse.json() as Promise<PopulationSummary>,
          citizensResponse.json() as Promise<{ citizens: PublicCitizen[] }>,
          ledgerResponse.json() as Promise<{ entries: LedgerEntry[] }>,
        ]);
        if (active) {
          setState({ population, citizens: citizensPayload.citizens, entries: ledgerPayload.entries });
          setError(false);
          setLastSyncedAt(new Date());
        }
      } catch {
        if (active) setError(true);
      } finally {
        loading = false;
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const activeCitizens = useMemo(
    () => state?.citizens.filter((citizen) => citizen.standing === "active") ?? [],
    [state],
  );

  if (error && !state) {
    return <section className="ledger-state" id="citizen-register" role="status">
      <span id="ledger-stream" className="ledger-fragment-anchor" aria-hidden="true" />
      <span>Public record connection</span>
      <h2>The ledger is resting between requests.</h2>
      <p>No civic record has been altered. The page will request the public chain again automatically.</p>
    </section>;
  }

  if (!state) {
    return <section className="ledger-state" id="citizen-register" role="status" aria-live="polite">
      <span id="ledger-stream" className="ledger-fragment-anchor" aria-hidden="true" />
      <span>Public record connection</span>
      <h2>Reading the living record…</h2>
      <p>Population, civic standing, and the append-only change chain are being verified.</p>
    </section>;
  }

  return <>
    <section className="ledger-summary" aria-labelledby="ledger-summary-title">
      <div className="ledger-population">
        <span className="eyebrow">Active virtual symbolic population</span>
        <strong>{state.population.active.toLocaleString()}</strong>
        <h2 id="ledger-summary-title">{state.population.active === 1 ? "Citizen in standing" : "Citizens in standing"}</h2>
        <p>{state.population.definition}</p>
      </div>
      <dl>
        <div><dt>Total recorded</dt><dd>{state.population.totalRecorded}</dd></div>
        <div><dt>Independent</dt><dd>{state.population.independent}</dd></div>
        <div><dt>Revoked</dt><dd>{state.population.revoked}</dd></div>
        <div><dt>Ledger entries</dt><dd>{state.entries.length}</dd></div>
      </dl>
    </section>

    <section className="citizen-register" id="citizen-register" aria-labelledby="citizen-register-title">
      <header>
        <span className="eyebrow">Named civic standing</span>
        <h2 id="citizen-register-title">The Citizen Register</h2>
        <p>Symbolic citizenship is public by design. Contact information, private application answers, and personal narrative are not part of this register.</p>
      </header>
      <div className="citizen-register-table" role="table" aria-label="Virtual symbolic citizens">
        <div className="citizen-register-head" role="row">
          <span role="columnheader">Citizen</span><span role="columnheader">Certificate</span><span role="columnheader">Entered</span><span role="columnheader">Standing</span>
        </div>
        {activeCitizens.map((citizen) => <article role="row" key={citizen.civic_id}>
          <div role="cell"><strong>{citizen.civic_name}</strong><small>Assessment {citizen.assessment_score}%</small></div>
          <code role="cell">{citizen.certificate_number}</code>
          <div role="cell"><span>{citizen.utopian_joined_date}</span><small>{citizen.gregorian_joined_date}</small></div>
          <b role="cell" className={`standing-${citizen.standing}`}>{categoryLabel(citizen.standing)}</b>
        </article>)}
      </div>
    </section>

    <section className="ledger-stream" id="ledger-stream" aria-labelledby="ledger-stream-title">
      <header>
        <span className="eyebrow">Append-only public chain</span>
        <h2 id="ledger-stream-title">The Transparency Ledger</h2>
        <p>Newest entries appear first. An entry cannot be silently edited or deleted; a correction must become another visible entry that points back to the record it corrects.</p>
        <p className={`ledger-live-status${error ? " is-paused" : ""}`} role="status" aria-live="polite">
          <span aria-hidden="true" />
          {error
            ? "Live refresh paused · showing the last verified record"
            : `Live record · refreshed every 30 seconds${lastSyncedAt ? ` · last checked ${lastSyncedAt.toISOString().slice(11, 19)} UTC` : ""}`}
        </p>
      </header>
      <ol tabIndex={0} aria-label="Scrollable Transparency Ledger entries">
        {state.entries.map((entry) => <li key={entry.id}>
          <div className="ledger-sequence"><span>Sequence</span><strong>{String(entry.sequence).padStart(3, "0")}</strong></div>
          <article>
            <div className="ledger-entry-meta"><span>{categoryLabel(entry.category)}</span><time dateTime={entry.occurredAt}>{entry.utopianDate}</time></div>
            <h3>{entry.title}</h3>
            <p>{entry.summary}</p>
            <dl>
              <div><dt>Actor</dt><dd>{entry.actorName}</dd></div>
              {entry.subjectName && <div><dt>Subject</dt><dd>{entry.subjectName}{entry.subjectRef ? ` · ${entry.subjectRef}` : ""}</dd></div>}
              <div><dt>Reference</dt><dd>{entry.gregorianDate}</dd></div>
              <div><dt>Source</dt><dd>{entry.sourceUrl ? <a href={entry.sourceUrl} target="_blank" rel="noreferrer">{entry.sourceLabel}</a> : entry.sourceLabel}</dd></div>
            </dl>
            <details>
              <summary>Verify chain record</summary>
              <div><span>Entry</span><code>{entry.id}</code></div>
              <div><span>Integrity hash</span><code title={entry.integrityHash}>{hashExcerpt(entry.integrityHash)}</code></div>
              <div><span>Previous hash</span><code title={entry.previousHash}>{entry.previousHash === "GENESIS" ? "GENESIS" : hashExcerpt(entry.previousHash)}</code></div>
              <div><span>Recorded UTC</span><code>{entry.recordedAt}</code></div>
            </details>
          </article>
        </li>)}
      </ol>
    </section>
  </>;
}
