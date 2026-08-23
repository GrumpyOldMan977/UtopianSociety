"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createLocalEditorialDraft,
  createLocalTickerAnnouncement,
  createTickerSource,
  getEditorialAnalytics,
  getLocalEditorialStatus,
  getLocalWordpressHandoff,
  getTickerManager,
  refreshTickerSource,
  setTickerFeedItemSuppressed,
  synchronizeWordpressPublications,
  updateTickerAnnouncement,
  updateTickerSource,
  type EditorialAnalytics,
  type EditorialStatus,
  type TickerAnnouncement,
  type TickerManager,
  type TickerSource,
  type TickerTreatment,
} from "../lib/civic-ledger";

const civicAuthor = "Adreto Nagdo Senoviros";
type NoticeDraft = { label: string; href: string; status: "draft" | "scheduled" | "active" | "paused"; startsAt: string; endsAt: string; priority: number; sortOrder: number; treatment: TickerTreatment };
type SourceDraft = { label: string; endpointUrl: string; creditUrl: string; prefix: string; enabled: boolean; status: "active" | "paused" | "archived"; priority: number; sortOrder: number; treatment: TickerTreatment; itemLimit: number; refreshMinutes: number };
const emptyNotice: NoticeDraft = { label: "", href: "", status: "draft", startsAt: "", endsAt: "", priority: 10, sortOrder: 0, treatment: "standard" };
const emptySource: SourceDraft = { label: "", endpointUrl: "", creditUrl: "", prefix: "", enabled: true, status: "active", priority: 10, sortOrder: 0, treatment: "standard", itemLimit: 3, refreshMinutes: 5 };

const rankOptions = [
  { value: 100, label: "Urgent" },
  { value: 50, label: "High" },
  { value: 10, label: "Normal" },
  { value: 0, label: "Background" },
];

const treatmentOptions: Array<{ value: TickerTreatment; label: string }> = [
  { value: "standard", label: "Standard gold" },
  { value: "vellum", label: "Vellum highlight" },
  { value: "alternating", label: "Alternate green and gold" },
  { value: "urgent", label: "Urgent amber" },
  { value: "pulse", label: "Slow attention pulse" },
];

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isoDate(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function rankLabel(priority: number) {
  return priority >= 75 ? "Urgent" : priority >= 35 ? "High" : priority >= 5 ? "Normal" : "Background";
}

function treatmentLabel(treatment: TickerTreatment) {
  return treatmentOptions.find((option) => option.value === treatment)?.label || treatment;
}

function sourceHealth(source: TickerSource) {
  if (source.lastError) return `Needs attention · ${source.lastError}`;
  if (source.lastSuccessAt) return `Healthy · refreshed ${new Date(source.lastSuccessAt).toLocaleString()}`;
  if (source.sourceType === "system" && source.sourceKey !== "south-pacific-weather") return "Generated live";
  return "Awaiting first refresh";
}

export function EditorialStudio() {
  const [status, setStatus] = useState<EditorialStatus | null>(null);
  const [ticker, setTicker] = useState<TickerManager | null>(null);
  const [analytics, setAnalytics] = useState<EditorialAnalytics | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [announcement, setAnnouncement] = useState<NoticeDraft>({ ...emptyNotice });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [sourceDraft, setSourceDraft] = useState<SourceDraft>({ ...emptySource });
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", slug: "", excerpt: "", contentMarkdown: "", featuredImage: "" });

  const refresh = useCallback(async () => {
    try {
      const [nextStatus, nextTicker] = await Promise.all([getLocalEditorialStatus(), getTickerManager()]);
      setStatus(nextStatus);
      setTicker(nextTicker);
      try { setAnalytics(await getEditorialAnalytics(30)); } catch { setAnalytics(null); }
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The editorial record is unavailable.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const importedCount = useMemo(() => status?.publicationCounts.reduce((sum, row) => sum + Number(row.count), 0) ?? 0, [status]);
  const draftCount = status?.publicationCounts.find((row) => row.status === "draft")?.count ?? 0;
  const activeTickerCount = ticker?.currentItems.length ?? 0;
  const sourceById = useMemo(() => new Map((ticker?.sources ?? []).map((source) => [source.sourceId, source])), [ticker]);
  const suppressedFeedItems = useMemo(() => (ticker?.feedItems ?? []).filter((item) => item.suppressed), [ticker]);

  async function runTickerMutation(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The civic wire could not be updated.");
    } finally {
      setBusy("");
    }
  }

  async function saveAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      label: announcement.label,
      href: announcement.href || null,
      status: announcement.status,
      startsAt: isoDate(announcement.startsAt),
      endsAt: isoDate(announcement.endsAt),
      priority: announcement.priority,
      sortOrder: announcement.sortOrder,
      treatment: announcement.treatment,
    };
    await runTickerMutation("announcement", () => editingAnnouncementId
      ? updateTickerAnnouncement(editingAnnouncementId, input)
      : createLocalTickerAnnouncement(input), editingAnnouncementId
      ? "Ticker notice updated and recorded in the Transparency Ledger."
      : "Ticker notice saved and recorded in the Transparency Ledger.");
    setAnnouncement({ ...emptyNotice });
    setEditingAnnouncementId(null);
  }

  function editAnnouncement(item: TickerAnnouncement) {
    setEditingAnnouncementId(item.announcementId);
    setAnnouncement({
      label: item.label,
      href: item.href || "",
      status: item.status === "expired" || item.status === "archived" ? "paused" : item.status as "draft" | "scheduled" | "active" | "paused",
      startsAt: localDateTime(item.startsAt),
      endsAt: localDateTime(item.endsAt),
      priority: item.priority,
      sortOrder: item.sortOrder,
      treatment: item.treatment,
    });
    document.getElementById("ticker-notice-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { ...sourceDraft, creditUrl: sourceDraft.creditUrl || null };
    await runTickerMutation("source", () => editingSourceId
      ? updateTickerSource(editingSourceId, input)
      : createTickerSource(input), editingSourceId
      ? "Ticker source updated and recorded in the Transparency Ledger."
      : "Custom RSS source added and recorded in the Transparency Ledger.");
    setSourceDraft({ ...emptySource });
    setEditingSourceId(null);
  }

  function editSource(source: TickerSource) {
    setEditingSourceId(source.sourceId);
    setSourceDraft({
      label: source.label,
      endpointUrl: source.endpointUrl || "",
      creditUrl: source.creditUrl || "",
      prefix: source.prefix,
      enabled: source.enabled,
      status: source.status,
      priority: source.priority,
      sortOrder: source.sortOrder,
      treatment: source.treatment,
      itemLimit: source.itemLimit,
      refreshMinutes: source.refreshMinutes,
    });
    document.getElementById("ticker-source-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("draft");
    setError("");
    setNotice("");
    try {
      await createLocalEditorialDraft({ ...draft, slug: draft.slug || slugify(draft.title), type: "post", authorName: civicAuthor });
      setDraft({ title: "", slug: "", excerpt: "", contentMarkdown: "", featuredImage: "" });
      setNotice("Blog draft saved to the private editorial record. Nothing was sent to WordPress.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The local draft could not be saved.");
    } finally { setBusy(""); }
  }

  async function downloadHandoff() {
    setBusy("handoff"); setError(""); setNotice("");
    try {
      const manifest = await getLocalWordpressHandoff();
      const blob = new Blob([`${JSON.stringify(manifest, null, 2)}\n`], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href; link.download = `utopian-wordpress-handoff-${manifest.generatedAt.slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(href);
      setNotice(`Reviewed handoff manifest prepared for ${manifest.count} draft${manifest.count === 1 ? "" : "s"}. No WordPress write occurred.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The local handoff manifest could not be prepared."); }
    finally { setBusy(""); }
  }

  async function synchronizeArchive() {
    setBusy("sync"); setError(""); setNotice("");
    try {
      const result = await synchronizeWordpressPublications();
      setNotice(`${result.synchronized} published WordPress posts synchronized read-only. No WordPress content was changed.`);
      await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The WordPress archive could not be synchronized."); }
    finally { setBusy(""); }
  }

  if (!status) return <section className="editorial-access-gate" aria-live="polite">
    <span>Authorized representatives</span><h1>Editorial Studio is private.</h1>
    <p>{error || "Verifying your civic authority…"}</p>
    {error && <Link href="/login">Sign in through the Civic Portal →</Link>}
  </section>;

  return <>
    <section className="editorial-studio-hero" aria-labelledby="editorial-studio-title">
      <div><span>Editorial continuity · accountable public voice</span><h1 id="editorial-studio-title">The public voice remains connected to its record.</h1><p>The Studio manages the live civic wire, preserves its source history, and keeps the WordPress archive available without permitting silent public changes.</p></div>
      <aside aria-label="Editorial safety status"><strong>{status.wordpressBridge.mode}</strong><span>{status.productionFrozen ? "Public release frozen" : "Public release active"}</span><small>WordPress writes remain disabled here</small></aside>
    </section>

    {(error || notice) && <p className={error ? "editorial-message is-error" : "editorial-message"} role={error ? "alert" : "status"}>{error || notice}</p>}

    <section className="editorial-vitals" aria-label="Editorial continuity summary">
      <article><span>WordPress archive</span><strong>{importedCount}</strong><small>publications inventoried</small></article>
      <article><span>Private working record</span><strong>{draftCount}</strong><small>drafts awaiting review</small></article>
      <article><span>Civic wire</span><strong>{activeTickerCount}</strong><small>entries in the current rotation</small></article>
      <article><span>30-day public reading</span><strong>{analytics?.totalViews.toLocaleString("en-US") ?? "—"}</strong><small>aggregate first-party page views</small></article>
    </section>

    <section className="editorial-workbench">
      <form onSubmit={saveDraft} className="editorial-sheet">
        <header><span>01 · Working record</span><h2>Compose a private blog draft.</h2><p>The canonical public copy can be handed to WordPress after review so the web and Android publishing tools remain useful.</p></header>
        <label>Title<input required maxLength={240} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} /></label>
        <label>Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} /></label>
        <label>Excerpt<textarea required maxLength={600} rows={3} value={draft.excerpt} onChange={(event) => setDraft((current) => ({ ...current, excerpt: event.target.value }))} /></label>
        <label>Body · Markdown<textarea required maxLength={60000} rows={13} value={draft.contentMarkdown} onChange={(event) => setDraft((current) => ({ ...current, contentMarkdown: event.target.value }))} /></label>
        <label>Featured image URL · optional<input type="url" value={draft.featuredImage} onChange={(event) => setDraft((current) => ({ ...current, featuredImage: event.target.value }))} /></label>
        <footer><span>Author · {civicAuthor}</span><button disabled={busy === "draft"}>{busy === "draft" ? "Saving…" : "Save private draft"}</button></footer>
      </form>

      <form onSubmit={saveAnnouncement} className="editorial-sheet ticker-sheet" id="ticker-notice-editor">
        <header><span>02 · Civic wire notice</span><h2>{editingAnnouncementId ? "Revise a ticker notice." : "Prepare a ticker notice."}</h2><p>Every saved notice and later adjustment receives a Transparency Ledger sequence under the authenticated civic identity.</p></header>
        <label>Notice<input required maxLength={240} value={announcement.label} onChange={(event) => setAnnouncement((current) => ({ ...current, label: event.target.value }))} /></label>
        <label>Destination · optional<input placeholder="/citizens or https://…" value={announcement.href} onChange={(event) => setAnnouncement((current) => ({ ...current, href: event.target.value }))} /></label>
        <div className="editorial-field-row">
          <label>Status<select value={announcement.status} onChange={(event) => setAnnouncement((current) => ({ ...current, status: event.target.value as typeof current.status }))}><option value="draft">Draft · never public</option><option value="scheduled">Scheduled · follows dates</option><option value="active">Live · public now</option><option value="paused">Paused · retained but hidden</option></select></label>
          <label>Rank<select value={announcement.priority} onChange={(event) => setAnnouncement((current) => ({ ...current, priority: Number(event.target.value) }))}>{rankOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </div>
        <div className="editorial-field-row">
          <label>Treatment<select value={announcement.treatment} onChange={(event) => setAnnouncement((current) => ({ ...current, treatment: event.target.value as TickerTreatment }))}>{treatmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label>Order within rank<input type="number" min={-1000} max={1000} value={announcement.sortOrder} onChange={(event) => setAnnouncement((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></label>
        </div>
        <div className="editorial-field-row">
          <label>Begins · optional<input type="datetime-local" value={announcement.startsAt} onChange={(event) => setAnnouncement((current) => ({ ...current, startsAt: event.target.value }))} /></label>
          <label>Ends · optional<input type="datetime-local" value={announcement.endsAt} onChange={(event) => setAnnouncement((current) => ({ ...current, endsAt: event.target.value }))} /></label>
        </div>
        <footer><span>Actor · {ticker?.actor || "Authenticated representative"}</span><div className="editorial-button-row"><button disabled={busy === "announcement"}>{busy === "announcement" ? "Saving…" : editingAnnouncementId ? "Save revision" : "Save ticker notice"}</button>{editingAnnouncementId && <button type="button" className="is-secondary" onClick={() => { setEditingAnnouncementId(null); setAnnouncement({ ...emptyNotice }); }}>Cancel edit</button>}</div></footer>
      </form>
    </section>

    <section className="editorial-ticker-control" aria-labelledby="current-wire-title">
      <header><span>Current Civic Wire</span><h2 id="current-wire-title">Everything the public ticker contains, in display order.</h2><p>{ticker?.ledgerPolicy}</p></header>
      <div className="editorial-table-wrap"><table className="editorial-table"><thead><tr><th>Hierarchy</th><th>Message</th><th>Type / source</th><th>Treatment</th><th>Destination</th><th>Action</th></tr></thead><tbody>
        {ticker?.currentItems.length ? ticker.currentItems.map((item) => <tr key={item.itemId}><td><strong>{rankLabel(item.priority)}</strong><small>order {item.sortOrder}</small></td><td>{item.label}</td><td><strong>{item.recordType}</strong><small>{item.sourceLabel}</small></td><td><span className={`ticker-treatment-chip is-${item.treatment}`}>{treatmentLabel(item.treatment)}</span></td><td>{item.href ? <a href={item.href}>Open link</a> : "—"}</td><td className="editorial-table-actions">{item.recordType === "manual" ? <button type="button" onClick={() => { const record = ticker.announcements.find((entry) => entry.announcementId === item.itemId); if (record) editAnnouncement(record); }}>Edit</button> : item.recordType === "feed" ? <button type="button" disabled={busy === `feed:${item.itemId}`} onClick={() => void runTickerMutation(`feed:${item.itemId}`, () => setTickerFeedItemSuppressed(item.itemId, true), "Feed item suppressed and recorded in the Transparency Ledger.")}>Suppress</button> : item.sourceId && <button type="button" onClick={() => { const source = sourceById.get(item.sourceId!); if (source) editSource(source); }}>Configure</button>}</td></tr>) : <tr><td colSpan={6}>The managed rotation is awaiting its first source refresh.</td></tr>}
      </tbody></table></div>
    </section>

    <section className="editorial-ticker-control" aria-labelledby="notice-library-title">
      <header><span>Notice library</span><h2 id="notice-library-title">Manual notices remain editable and recoverable.</h2><p>Archival removes a notice from public rotation without erasing who created or changed it.</p></header>
      <div className="editorial-table-wrap"><table className="editorial-table"><thead><tr><th>Status</th><th>Notice</th><th>Hierarchy</th><th>Presentation</th><th>Last actor</th><th>Actions</th></tr></thead><tbody>
        {ticker?.announcements.length ? ticker.announcements.map((item) => <tr key={item.announcementId}><td><span className={`editorial-status is-${item.status}`}>{item.status}</span></td><td>{item.label}<small>{item.startsAt ? `Begins ${new Date(item.startsAt).toLocaleString()}` : "No beginning limit"}{item.endsAt ? ` · ends ${new Date(item.endsAt).toLocaleString()}` : ""}</small></td><td><strong>{rankLabel(item.priority)}</strong><small>order {item.sortOrder}</small></td><td>{treatmentLabel(item.treatment)}</td><td>{item.updatedBy}<small>{new Date(item.updatedAt).toLocaleString()}</small></td><td className="editorial-table-actions"><button type="button" onClick={() => editAnnouncement(item)}>Edit</button>{item.status !== "archived" ? <><button type="button" disabled={busy === `notice-state:${item.announcementId}`} onClick={() => void runTickerMutation(`notice-state:${item.announcementId}`, () => updateTickerAnnouncement(item.announcementId, { status: item.status === "paused" ? "active" : "paused" }), `Notice ${item.status === "paused" ? "activated" : "paused"} and recorded in the Transparency Ledger.`)}>{item.status === "paused" ? "Activate" : "Pause"}</button><button type="button" className="is-danger" disabled={busy === `notice-archive:${item.announcementId}`} onClick={() => void runTickerMutation(`notice-archive:${item.announcementId}`, () => updateTickerAnnouncement(item.announcementId, { status: "archived" }), "Notice archived and recorded in the Transparency Ledger.")}>Archive</button></> : <button type="button" onClick={() => void runTickerMutation(`notice-restore:${item.announcementId}`, () => updateTickerAnnouncement(item.announcementId, { status: "paused" }), "Notice restored in a paused state and recorded in the Transparency Ledger.")}>Restore paused</button>}</td></tr>) : <tr><td colSpan={6}>No ticker notices have been prepared.</td></tr>}
      </tbody></table></div>
    </section>

    <section className="editorial-source-manager" aria-labelledby="source-manager-title">
      <header><span>03 · Source Manager</span><h2 id="source-manager-title">System information and custom RSS feeds share one accountable hierarchy.</h2><p>Built-in sources can be paused or restyled. Custom public HTTPS RSS and Atom feeds can be added, refreshed, archived, and restored here.</p></header>
      <div className="editorial-table-wrap"><table className="editorial-table"><thead><tr><th>Source</th><th>State</th><th>Hierarchy</th><th>Defaults</th><th>Health</th><th>Actions</th></tr></thead><tbody>
        {ticker?.sources.map((source) => <tr key={source.sourceId}><td><strong>{source.label}</strong><small>{source.builtIn ? `Built-in ${source.sourceType}` : "Custom RSS"}{source.prefix ? ` · prefix “${source.prefix}”` : ""}</small></td><td><span className={`editorial-status is-${source.status}`}>{source.status}</span><small>{source.enabled ? "Enabled" : "Disabled"}</small></td><td><strong>{rankLabel(source.priority)}</strong><small>order {source.sortOrder}</small></td><td>{treatmentLabel(source.treatment)}<small>{source.sourceType === "rss" || source.sourceKey === "south-pacific-weather" ? `${source.itemLimit} item${source.itemLimit === 1 ? "" : "s"} · ${source.refreshMinutes} min` : "Generated live"}</small></td><td className={source.lastError ? "is-health-error" : ""}>{sourceHealth(source)}</td><td className="editorial-table-actions"><button type="button" onClick={() => editSource(source)}>Configure</button>{source.status !== "archived" ? <button type="button" disabled={busy === `source-state:${source.sourceId}`} onClick={() => void runTickerMutation(`source-state:${source.sourceId}`, () => updateTickerSource(source.sourceId, { status: source.status === "paused" ? "active" : "paused", enabled: source.status === "paused" ? true : source.enabled }), `Source ${source.status === "paused" ? "resumed" : "paused"} and recorded in the Transparency Ledger.`)}>{source.status === "paused" ? "Resume" : "Pause"}</button> : <button type="button" onClick={() => void runTickerMutation(`source-restore:${source.sourceId}`, () => updateTickerSource(source.sourceId, { status: "paused", enabled: false }), "Source restored in a paused state and recorded in the Transparency Ledger.")}>Restore paused</button>}{(source.sourceType === "rss" || source.sourceKey === "south-pacific-weather") && source.status === "active" && <button type="button" disabled={busy === `source-refresh:${source.sourceId}`} onClick={() => void runTickerMutation(`source-refresh:${source.sourceId}`, async () => { const result = await refreshTickerSource(source.sourceId); if (result.reason === "failed") throw new Error("The source could not refresh. Its health message has been retained for review."); return result; }, "Source refresh completed.")}>Refresh</button>}{!source.builtIn && source.status !== "archived" && <button type="button" className="is-danger" onClick={() => void runTickerMutation(`source-archive:${source.sourceId}`, () => updateTickerSource(source.sourceId, { status: "archived", enabled: false }), "RSS source archived and recorded in the Transparency Ledger.")}>Archive</button>}</td></tr>)}
      </tbody></table></div>

      <form className="editorial-sheet source-editor" id="ticker-source-editor" onSubmit={saveSource}>
        <header><span>{editingSourceId ? "Configure source" : "Add custom RSS"}</span><h2>{editingSourceId ? "Set the source’s place in the wire." : "Add a public RSS or Atom feed."}</h2><p>Only public HTTPS feeds are accepted. Feed text is size-limited, sanitized, and cached by the civic Worker before appearing publicly.</p></header>
        <div className="editorial-field-row"><label>Source name<input required maxLength={120} value={sourceDraft.label} onChange={(event) => setSourceDraft((current) => ({ ...current, label: event.target.value }))} /></label><label>Label prefix · optional<input maxLength={40} placeholder="World, Local, Science…" value={sourceDraft.prefix} onChange={(event) => setSourceDraft((current) => ({ ...current, prefix: event.target.value }))} /></label></div>
        <label>RSS or Atom feed URL<input required={!editingSourceId || !sourceById.get(editingSourceId)?.builtIn} type="url" disabled={Boolean(editingSourceId && sourceById.get(editingSourceId)?.builtIn)} placeholder="https://example.org/feed.xml" value={sourceDraft.endpointUrl} onChange={(event) => setSourceDraft((current) => ({ ...current, endpointUrl: event.target.value }))} /></label>
        <label>Credit or source page · optional<input placeholder="https://example.org/news" value={sourceDraft.creditUrl} onChange={(event) => setSourceDraft((current) => ({ ...current, creditUrl: event.target.value }))} /></label>
        <div className="editorial-field-row"><label>Rank<select value={sourceDraft.priority} onChange={(event) => setSourceDraft((current) => ({ ...current, priority: Number(event.target.value) }))}>{rankOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Order within rank<input type="number" min={-1000} max={1000} value={sourceDraft.sortOrder} onChange={(event) => setSourceDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></label></div>
        <div className="editorial-field-row"><label>Default treatment<select value={sourceDraft.treatment} onChange={(event) => setSourceDraft((current) => ({ ...current, treatment: event.target.value as TickerTreatment }))}>{treatmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Items per refresh<input type="number" min={1} max={10} value={sourceDraft.itemLimit} onChange={(event) => setSourceDraft((current) => ({ ...current, itemLimit: Number(event.target.value) }))} /></label></div>
        <div className="editorial-field-row"><label>Refresh interval<select value={sourceDraft.refreshMinutes} onChange={(event) => setSourceDraft((current) => ({ ...current, refreshMinutes: Number(event.target.value) }))}><option value={5}>Every 5 minutes</option><option value={15}>Every 15 minutes</option><option value={30}>Every 30 minutes</option><option value={60}>Every hour</option><option value={360}>Every 6 hours</option><option value={1440}>Daily</option></select></label><label>Status<select value={sourceDraft.status} onChange={(event) => setSourceDraft((current) => ({ ...current, status: event.target.value as typeof current.status }))}><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select></label></div>
        <label className="editorial-checkbox"><input type="checkbox" checked={sourceDraft.enabled} onChange={(event) => setSourceDraft((current) => ({ ...current, enabled: event.target.checked }))} />Enabled for public rotation</label>
        <footer><span>Actor · {ticker?.actor || "Authenticated representative"}</span><div className="editorial-button-row"><button disabled={busy === "source"}>{busy === "source" ? "Saving…" : editingSourceId ? "Save source settings" : "Add RSS source"}</button>{editingSourceId && <button type="button" className="is-secondary" onClick={() => { setEditingSourceId(null); setSourceDraft({ ...emptySource }); }}>Cancel edit</button>}</div></footer>
      </form>

      {suppressedFeedItems.length > 0 && <div className="editorial-suppressed"><h3>Suppressed feed items</h3><p>These remain available for restoration while their source still retains them.</p>{suppressedFeedItems.map((item) => <article key={item.itemId}><span>{sourceById.get(item.sourceId)?.label || "Feed"}</span><strong>{item.label}</strong><button type="button" onClick={() => void runTickerMutation(`feed-restore:${item.itemId}`, () => setTickerFeedItemSuppressed(item.itemId, false), "Feed item restored and recorded in the Transparency Ledger.")}>Restore</button></article>)}</div>}
    </section>

    <section className="editorial-bridge" aria-labelledby="editorial-bridge-title">
      <div><span>04 · WordPress / Jetpack bridge</span><h2 id="editorial-bridge-title">One editorial origin, one public record.</h2></div>
      <ol><li><strong>Inventory</strong><p>The current public posts are represented locally with their archival context.</p></li><li><strong>Compose</strong><p>New writing receives one canonical slug and civic author identity.</p></li><li><strong>Synchronize</strong><p>The Worker reads only published posts and retains a last-known-good public copy.</p></li><li><strong>Preserve</strong><p>If WordPress cannot be reached, the prior public copy remains intact.</p></li></ol>
      <aside><strong>This bridge never writes to WordPress.</strong><p>Publish and edit through WordPress or Jetpack; this desk verifies read-only synchronization and aggregate traffic sources.</p><button type="button" onClick={synchronizeArchive} disabled={busy === "sync"}>{busy === "sync" ? "Synchronizing…" : "Synchronize published WordPress posts"}</button><button type="button" onClick={downloadHandoff} disabled={busy === "handoff"}>{busy === "handoff" ? "Preparing…" : "Download reviewed handoff manifest"}</button></aside>
    </section>

    <section className="editorial-publications" aria-label="Aggregate public analytics"><header><span>First-party reading · 30 days</span><h2>Where the public record is being found.</h2><p>{analytics?.privacy || "No private civic activity is measured."}</p></header><div>{analytics?.sources.length ? analytics.sources.slice(0, 8).map((source) => <article key={`${source.source_group}:${source.source_detail}`}><span>{source.source_group}</span><strong>{source.source_detail || "No external referrer"}</strong><small>{Number(source.views).toLocaleString("en-US")} page views</small></article>) : <article><span>Awaiting public readings</span><strong>No source totals yet.</strong><small>Traffic begins accumulating after deployment.</small></article>}</div></section>
    <section className="editorial-publications" aria-label="Recent publication inventory"><header><span>Private publication index</span><h2>The archive and the unfinished page.</h2></header><div>{status?.recentPublications.map((item) => <article key={item.publicationId}><span>{item.status} · {item.type}</span><strong>{item.title}</strong><small>{item.utopianDate || "Utopian date assigned at publication"}</small></article>)}</div></section>
  </>;
}
