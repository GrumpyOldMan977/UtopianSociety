"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createLocalEditorialDraft,
  createLocalTickerAnnouncement,
  getEditorialAnalytics,
  getLocalEditorialStatus,
  getLocalWordpressHandoff,
  synchronizeWordpressPublications,
  type EditorialAnalytics,
  type EditorialStatus,
} from "../lib/civic-ledger";

const civicAuthor = "Adreto Nagdo Senoviros";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isoDate(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

export function EditorialStudio() {
  const [status, setStatus] = useState<EditorialStatus | null>(null);
  const [analytics, setAnalytics] = useState<EditorialAnalytics | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [announcement, setAnnouncement] = useState({ label: "", href: "", status: "draft", startsAt: "", endsAt: "", priority: 10 });
  const [draft, setDraft] = useState({ title: "", slug: "", excerpt: "", contentMarkdown: "", featuredImage: "" });

  const refresh = useCallback(async () => {
    try {
      const nextStatus = await getLocalEditorialStatus();
      setStatus(nextStatus);
      try { setAnalytics(await getEditorialAnalytics(30)); } catch { setAnalytics(null); }
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The local editorial record is unavailable.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const importedCount = useMemo(() => status?.publicationCounts.reduce((sum, row) => sum + Number(row.count), 0) ?? 0, [status]);
  const draftCount = status?.publicationCounts.find((row) => row.status === "draft")?.count ?? 0;
  const activeTickerCount = status?.announcementCounts.find((row) => row.status === "active")?.count ?? 0;

  async function saveAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("announcement");
    setError("");
    setNotice("");
    try {
      await createLocalTickerAnnouncement({
        label: announcement.label,
        href: announcement.href || undefined,
        status: announcement.status as "draft" | "scheduled" | "active",
        startsAt: isoDate(announcement.startsAt),
        endsAt: isoDate(announcement.endsAt),
        priority: announcement.priority,
        createdBy: civicAuthor,
      });
      setAnnouncement({ label: "", href: "", status: "draft", startsAt: "", endsAt: "", priority: 10 });
      setNotice("Ticker notice saved to the isolated local civic record.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The ticker notice could not be saved.");
    } finally {
      setBusy("");
    }
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("draft");
    setError("");
    setNotice("");
    try {
      await createLocalEditorialDraft({
        ...draft,
        slug: draft.slug || slugify(draft.title),
        type: "post",
        authorName: civicAuthor,
      });
      setDraft({ title: "", slug: "", excerpt: "", contentMarkdown: "", featuredImage: "" });
      setNotice("Blog draft saved locally. Nothing was sent to WordPress or production.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The local draft could not be saved.");
    } finally {
      setBusy("");
    }
  }

  async function downloadHandoff() {
    setBusy("handoff");
    setError("");
    setNotice("");
    try {
      const manifest = await getLocalWordpressHandoff();
      const blob = new Blob([`${JSON.stringify(manifest, null, 2)}\n`], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `utopian-wordpress-handoff-${manifest.generatedAt.slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      setNotice(`Reviewed handoff manifest prepared locally for ${manifest.count} draft${manifest.count === 1 ? "" : "s"}. No WordPress write occurred.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The local handoff manifest could not be prepared.");
    } finally {
      setBusy("");
    }
  }

  async function synchronizeArchive() {
    setBusy("sync");
    setError("");
    setNotice("");
    try {
      const result = await synchronizeWordpressPublications();
      setNotice(`${result.synchronized} published WordPress posts synchronized read-only. No WordPress content was changed.`);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The WordPress archive could not be synchronized.");
    } finally {
      setBusy("");
    }
  }

  if (!status) return <section className="editorial-access-gate" aria-live="polite">
    <span>Authorized representatives</span>
    <h1>Editorial Studio is private.</h1>
    <p>{error || "Verifying your civic authority…"}</p>
    {error && <Link href="/login">Sign in through the Civic Portal →</Link>}
  </section>;

  return <>
    <section className="editorial-studio-hero" aria-labelledby="editorial-studio-title">
      <div>
        <span>Editorial continuity · WordPress origin</span>
        <h1 id="editorial-studio-title">The public voice remains connected to its archive.</h1>
        <p>WordPress remains the publishing desk for Android, web, and Jetpack. The public facade reads only material that WordPress has already published and retains its last-known-good copy whenever the origin is unavailable.</p>
      </div>
      <aside aria-label="Editorial safety status">
        <strong>{status.wordpressBridge.mode}</strong>
        <span>{status.productionFrozen ? "Public release frozen" : "Public release active"}</span>
        <small>WordPress writes remain disabled here</small>
      </aside>
    </section>

    {(error || notice) && <p className={error ? "editorial-message is-error" : "editorial-message"} role={error ? "alert" : "status"}>{error || notice}</p>}

    <section className="editorial-vitals" aria-label="Editorial continuity summary">
      <article><span>WordPress archive</span><strong>{importedCount}</strong><small>publications inventoried</small></article>
      <article><span>Local working record</span><strong>{draftCount}</strong><small>drafts awaiting review</small></article>
      <article><span>Local civic wire</span><strong>{activeTickerCount}</strong><small>active local notices</small></article>
      <article><span>30-day public reading</span><strong>{analytics?.totalViews.toLocaleString("en-US") ?? "—"}</strong><small>aggregate first-party page views</small></article>
    </section>

    <section className="editorial-workbench">
      <form onSubmit={saveDraft} className="editorial-sheet">
        <header><span>01 · Working record</span><h2>Compose a local blog draft.</h2><p>The canonical public copy will eventually be handed to WordPress so the web and Android publishing tools can remain useful.</p></header>
        <label>Title<input required maxLength={240} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} /></label>
        <label>Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} /></label>
        <label>Excerpt<textarea required maxLength={600} rows={3} value={draft.excerpt} onChange={(event) => setDraft((current) => ({ ...current, excerpt: event.target.value }))} /></label>
        <label>Body · Markdown<textarea required maxLength={60000} rows={13} value={draft.contentMarkdown} onChange={(event) => setDraft((current) => ({ ...current, contentMarkdown: event.target.value }))} /></label>
        <label>Featured image URL · optional<input type="url" value={draft.featuredImage} onChange={(event) => setDraft((current) => ({ ...current, featuredImage: event.target.value }))} /></label>
        <footer><span>Author · {civicAuthor}</span><button disabled={busy === "draft"}>{busy === "draft" ? "Saving…" : "Save local draft"}</button></footer>
      </form>

      <form onSubmit={saveAnnouncement} className="editorial-sheet ticker-sheet">
        <header><span>02 · Civic wire</span><h2>Prepare a ticker notice.</h2><p>Draft, schedule, or activate a notice on localhost. Production remains unchanged until the freeze ends and a reviewed release is authorized.</p></header>
        <label>Notice<input required maxLength={240} value={announcement.label} onChange={(event) => setAnnouncement((current) => ({ ...current, label: event.target.value }))} /></label>
        <label>Destination · optional<input type="url" value={announcement.href} onChange={(event) => setAnnouncement((current) => ({ ...current, href: event.target.value }))} /></label>
        <div className="editorial-field-row">
          <label>Status<select value={announcement.status} onChange={(event) => setAnnouncement((current) => ({ ...current, status: event.target.value }))}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active locally</option></select></label>
          <label>Priority<input type="number" min={-100} max={100} value={announcement.priority} onChange={(event) => setAnnouncement((current) => ({ ...current, priority: Number(event.target.value) }))} /></label>
        </div>
        <div className="editorial-field-row">
          <label>Begins · optional<input type="datetime-local" value={announcement.startsAt} onChange={(event) => setAnnouncement((current) => ({ ...current, startsAt: event.target.value }))} /></label>
          <label>Ends · optional<input type="datetime-local" value={announcement.endsAt} onChange={(event) => setAnnouncement((current) => ({ ...current, endsAt: event.target.value }))} /></label>
        </div>
        <footer><span>Actor · {civicAuthor}</span><button disabled={busy === "announcement"}>{busy === "announcement" ? "Saving…" : "Save ticker notice"}</button></footer>

        <div className="editorial-recent">
          <span>Recent notices</span>
          {status?.recentAnnouncements.length ? status.recentAnnouncements.map((item) => <article key={item.announcementId}><strong>{item.label}</strong><small>{item.status} · priority {item.priority}</small></article>) : <p>No local ticker notices have been drafted.</p>}
        </div>
      </form>
    </section>

    <section className="editorial-bridge" aria-labelledby="editorial-bridge-title">
      <div><span>03 · WordPress / Jetpack bridge</span><h2 id="editorial-bridge-title">One editorial origin, one public record.</h2></div>
      <ol>
        <li><strong>Inventory</strong><p>The 27 current public posts are represented locally with source URL, original timestamp, Utopian date, imagery, categories, and tags.</p></li>
        <li><strong>Compose</strong><p>New writing begins here or in WordPress, but every item receives one canonical slug and a civic author identity.</p></li>
        <li><strong>Synchronize</strong><p>The Worker reads only published posts, preserves the authored HTML and imagery, and records one canonical public route.</p></li>
        <li><strong>Preserve</strong><p>If WordPress cannot be reached, the prior public copy remains intact rather than disappearing.</p></li>
      </ol>
      <aside>
        <strong>This bridge never writes to WordPress.</strong>
        <p>Publish and edit through WordPress or Jetpack; this desk can verify the read-only synchronization and inspect aggregate traffic sources.</p>
        <button type="button" onClick={synchronizeArchive} disabled={busy === "sync"}>{busy === "sync" ? "Synchronizing…" : "Synchronize published WordPress posts"}</button>
        <button type="button" onClick={downloadHandoff} disabled={busy === "handoff"}>{busy === "handoff" ? "Preparing…" : "Download reviewed handoff manifest"}</button>
      </aside>
    </section>

    <section className="editorial-publications" aria-label="Aggregate public analytics">
      <header><span>First-party reading · 30 days</span><h2>Where the public record is being found.</h2><p>{analytics?.privacy || "No private civic activity is measured."}</p></header>
      <div>{analytics?.sources.length ? analytics.sources.slice(0, 8).map((source) => <article key={`${source.source_group}:${source.source_detail}`}><span>{source.source_group}</span><strong>{source.source_detail || "No external referrer"}</strong><small>{Number(source.views).toLocaleString("en-US")} page views</small></article>) : <article><span>Awaiting public readings</span><strong>No source totals yet.</strong><small>Traffic begins accumulating after deployment.</small></article>}</div>
    </section>

    <section className="editorial-publications" aria-label="Recent publication inventory">
      <header><span>Local publication index</span><h2>The archive and the unfinished page.</h2></header>
      <div>{status?.recentPublications.map((item) => <article key={item.publicationId}><span>{item.status} · {item.type}</span><strong>{item.title}</strong><small>{item.utopianDate || "Utopian date assigned at publication"}</small></article>)}</div>
    </section>
  </>;
}
