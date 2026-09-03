"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  createLocalEditorialDraft,
  createLocalTickerAnnouncement,
  createTickerSource,
  createTickerWeatherLocation,
  getEditorialAnalytics,
  getLocalEditorialStatus,
  getLocalWordpressHandoff,
  getTickerManager,
  refreshTickerSource,
  refreshTickerWeatherLocation,
  searchTickerWeatherLocations,
  setTickerFeedItemSuppressed,
  synchronizeWordpressPublications,
  updateTickerAnnouncement,
  updateTickerSource,
  updateTickerWeatherLocation,
  type EditorialAnalytics,
  type EditorialStatus,
  type TickerAnnouncement,
  type TickerManager,
  type TickerSource,
  type TickerTreatment,
  type TickerWeatherLocation,
  type TickerWeatherSearchResult,
} from "../lib/civic-ledger";

const civicAuthor = "Adreto Nagdo Senoviros";
type NoticeDraft = { label: string; href: string; status: "draft" | "scheduled" | "active" | "paused"; startsAt: string; endsAt: string; priority: number; sortOrder: number; treatment: TickerTreatment };
type SourceDraft = { label: string; endpointUrl: string; creditUrl: string; prefix: string; enabled: boolean; status: "active" | "paused" | "archived"; priority: number; sortOrder: number; treatment: TickerTreatment; itemLimit: number; refreshMinutes: number };
type WeatherDraft = { label: string; latitude: number; longitude: number; timezone: string; conditionsMode: "land" | "marine" | "combined"; enabled: boolean; status: "active" | "paused" | "archived"; priority: number; sortOrder: number; treatment: TickerTreatment; refreshMinutes: number };
type FeedbackScope = "draft" | "notice-editor" | "current-wire" | "notice-library" | "weather" | "source" | "archive";
type EditorialFeedback = { scope: FeedbackScope; kind: "success" | "error"; message: string };
type EditorialSection = "publishing" | "civic-wire" | "insights" | "archive";
type EditorialView = "draft" | "recent" | "rotation" | "notices" | "weather" | "sources" | "traffic" | "immigration" | "tools";
const emptyNotice: NoticeDraft = { label: "", href: "", status: "draft", startsAt: "", endsAt: "", priority: 10, sortOrder: 0, treatment: "standard" };
const emptySource: SourceDraft = { label: "", endpointUrl: "", creditUrl: "", prefix: "", enabled: true, status: "active", priority: 10, sortOrder: 0, treatment: "standard", itemLimit: 3, refreshMinutes: 5 };
const emptyWeather: WeatherDraft = { label: "", latitude: 0, longitude: 0, timezone: "UTC", conditionsMode: "land", enabled: true, status: "active", priority: 10, sortOrder: 0, treatment: "standard", refreshMinutes: 5 };

const editorialSections: Array<{ id: EditorialSection; label: string }> = [
  { id: "publishing", label: "Publishing" },
  { id: "civic-wire", label: "Civic Wire" },
  { id: "insights", label: "Insights" },
  { id: "archive", label: "Archive" },
];

const editorialViews: Record<EditorialSection, Array<{ id: EditorialView; label: string }>> = {
  publishing: [{ id: "draft", label: "New Draft" }, { id: "recent", label: "Recent Publications" }],
  "civic-wire": [{ id: "rotation", label: "Rotation" }, { id: "notices", label: "Notices" }, { id: "weather", label: "Weather" }, { id: "sources", label: "Sources" }],
  insights: [{ id: "traffic", label: "Traffic" }, { id: "immigration", label: "Immigration" }],
  archive: [{ id: "tools", label: "WordPress Tools" }],
};

const defaultEditorialViews: Record<EditorialSection, EditorialView> = {
  publishing: "draft",
  "civic-wire": "rotation",
  insights: "traffic",
  archive: "tools",
};

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

function rankValue(priority: number) {
  return priority >= 75 ? 100 : priority >= 35 ? 50 : priority >= 5 ? 10 : 0;
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

function weatherHealth(location: TickerWeatherLocation) {
  if (location.lastError) return `Needs attention · ${location.lastError}`;
  if (location.lastSuccessAt) return `Healthy · refreshed ${new Date(location.lastSuccessAt).toLocaleString()}`;
  return "Awaiting first refresh";
}

function InlineFeedback({ feedback, scope }: { feedback: EditorialFeedback | null; scope: FeedbackScope }) {
  if (!feedback || feedback.scope !== scope) return null;
  return <p className={`editorial-inline-message ${feedback.kind === "error" ? "is-error" : "is-success"}`} role={feedback.kind === "error" ? "alert" : "status"} aria-live="polite">{feedback.message}</p>;
}

export function EditorialStudio() {
  const [status, setStatus] = useState<EditorialStatus | null>(null);
  const [ticker, setTicker] = useState<TickerManager | null>(null);
  const [analytics, setAnalytics] = useState<EditorialAnalytics | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<EditorialFeedback | null>(null);
  const [busy, setBusy] = useState("");
  const [announcement, setAnnouncement] = useState<NoticeDraft>({ ...emptyNotice });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [sourceDraft, setSourceDraft] = useState<SourceDraft>({ ...emptySource });
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [weatherDraft, setWeatherDraft] = useState<WeatherDraft>({ ...emptyWeather });
  const [editingWeatherId, setEditingWeatherId] = useState<string | null>(null);
  const [weatherSearch, setWeatherSearch] = useState("");
  const [weatherSearchResults, setWeatherSearchResults] = useState<TickerWeatherSearchResult[]>([]);
  const [draft, setDraft] = useState({ title: "", slug: "", excerpt: "", contentMarkdown: "", featuredImage: "" });
  const [activeSection, setActiveSection] = useState<EditorialSection>("publishing");
  const [activeViewBySection, setActiveViewBySection] = useState<Record<EditorialSection, EditorialView>>({ ...defaultEditorialViews });

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

  useEffect(() => {
    function applyLocation() {
      const params = new URLSearchParams(window.location.search);
      const requestedSection = params.get("section");
      const section = editorialSections.some((item) => item.id === requestedSection)
        ? requestedSection as EditorialSection
        : "publishing";
      const requestedView = params.get("view");
      const view = editorialViews[section].some((item) => item.id === requestedView)
        ? requestedView as EditorialView
        : defaultEditorialViews[section];
      setActiveSection(section);
      setActiveViewBySection((current) => ({ ...current, [section]: view }));
    }

    applyLocation();
    window.addEventListener("popstate", applyLocation);
    return () => window.removeEventListener("popstate", applyLocation);
  }, []);

  const importedCount = useMemo(() => status?.publicationCounts.reduce((sum, row) => sum + Number(row.count), 0) ?? 0, [status]);
  const draftCount = status?.publicationCounts.find((row) => row.status === "draft")?.count ?? 0;
  const activeTickerCount = ticker?.currentItems.length ?? 0;
  const sourceById = useMemo(() => new Map((ticker?.sources ?? []).map((source) => [source.sourceId, source])), [ticker]);
  const activeWeatherCount = useMemo(() => (ticker?.weatherLocations ?? []).filter((location) => location.enabled && location.status === "active").length, [ticker]);
  const suppressedFeedItems = useMemo(() => (ticker?.feedItems ?? []).filter((item) => item.suppressed), [ticker]);
  const activeView = activeViewBySection[activeSection];

  function updateEditorialLocation(section: EditorialSection, view: EditorialView) {
    const url = new URL(window.location.href);
    if (url.searchParams.get("section") === section && url.searchParams.get("view") === view) return;
    url.searchParams.set("section", section);
    url.searchParams.set("view", view);
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function chooseEditorialSection(section: EditorialSection) {
    const view = activeViewBySection[section];
    setActiveSection(section);
    updateEditorialLocation(section, view);
  }

  function chooseEditorialView(view: EditorialView) {
    setActiveViewBySection((current) => ({ ...current, [activeSection]: view }));
    updateEditorialLocation(activeSection, view);
  }

  function openEditorialView(section: EditorialSection, view: EditorialView, targetId?: string) {
    setActiveSection(section);
    setActiveViewBySection((current) => ({ ...current, [section]: view }));
    updateEditorialLocation(section, view);
    if (targetId) window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function handleEditorialTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
    const currentIndex = tabs.indexOf(event.currentTarget);
    if (currentIndex < 0 || tabs.length === 0) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? tabs.length - 1
      : event.key === "ArrowRight" ? (currentIndex + 1) % tabs.length
      : (currentIndex - 1 + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  }

  async function runTickerMutation(key: string, scope: Exclude<FeedbackScope, "draft" | "archive">, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    setError("");
    setFeedback(null);
    try {
      await action();
      await refresh();
      setFeedback({ scope, kind: "success", message: `${success} Public rotation refreshes within five minutes.` });
      return true;
    } catch (reason) {
      setFeedback({ scope, kind: "error", message: reason instanceof Error ? reason.message : "The civic wire could not be updated." });
      return false;
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
    const saved = await runTickerMutation("announcement", "notice-editor", () => editingAnnouncementId
      ? updateTickerAnnouncement(editingAnnouncementId, input)
      : createLocalTickerAnnouncement(input), editingAnnouncementId
      ? "Ticker notice updated and recorded in the Transparency Ledger."
      : "Ticker notice saved and recorded in the Transparency Ledger.");
    if (saved) {
      setAnnouncement({ ...emptyNotice });
      setEditingAnnouncementId(null);
    }
  }

  function editAnnouncement(item: TickerAnnouncement) {
    setEditingAnnouncementId(item.announcementId);
    setAnnouncement({
      label: item.label,
      href: item.href || "",
      status: item.status === "expired" || item.status === "archived" ? "paused" : item.status as "draft" | "scheduled" | "active" | "paused",
      startsAt: localDateTime(item.startsAt),
      endsAt: localDateTime(item.endsAt),
      priority: rankValue(item.priority),
      sortOrder: item.sortOrder,
      treatment: item.treatment,
    });
    openEditorialView("civic-wire", "notices", "ticker-notice-editor");
  }

  async function saveSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { ...sourceDraft, creditUrl: sourceDraft.creditUrl || null };
    const saved = await runTickerMutation("source", "source", () => editingSourceId
      ? updateTickerSource(editingSourceId, input)
      : createTickerSource(input), editingSourceId
      ? "Ticker source updated and recorded in the Transparency Ledger."
      : "Custom RSS source added and recorded in the Transparency Ledger.");
    if (saved) {
      setSourceDraft({ ...emptySource });
      setEditingSourceId(null);
    }
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
      priority: rankValue(source.priority),
      sortOrder: source.sortOrder,
      treatment: source.treatment,
      itemLimit: source.itemLimit,
      refreshMinutes: source.refreshMinutes,
    });
    openEditorialView("civic-wire", "sources", "ticker-source-editor");
  }


  async function findWeatherLocation() {
    setBusy("weather-search");
    setError("");
    setFeedback(null);
    try {
      const result = await searchTickerWeatherLocations(weatherSearch);
      setWeatherSearchResults(result.results);
      if (!result.results.length) setFeedback({ scope: "weather", kind: "error", message: "No matching locations were found. Coordinates can still be entered manually." });
    } catch (reason) {
      setFeedback({ scope: "weather", kind: "error", message: reason instanceof Error ? reason.message : "The location search could not be completed." });
    } finally { setBusy(""); }
  }

  function chooseWeatherResult(result: TickerWeatherSearchResult) {
    setWeatherDraft((current) => ({
      ...current,
      label: result.label,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone || "UTC",
      conditionsMode: "land",
    }));
    setWeatherSearchResults([]);
  }

  async function saveWeatherLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await runTickerMutation("weather", "weather", () => editingWeatherId
      ? updateTickerWeatherLocation(editingWeatherId, weatherDraft)
      : createTickerWeatherLocation(weatherDraft), editingWeatherId
      ? "Weather location updated and recorded in the Transparency Ledger."
      : "Weather location added and recorded in the Transparency Ledger.");
    if (saved) {
      setWeatherDraft({ ...emptyWeather });
      setEditingWeatherId(null);
      setWeatherSearch("");
      setWeatherSearchResults([]);
    }
  }

  function editWeatherLocation(location: TickerWeatherLocation) {
    setEditingWeatherId(location.locationId);
    setWeatherDraft({
      label: location.label,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
      conditionsMode: location.conditionsMode,
      enabled: location.enabled,
      status: location.status,
      priority: rankValue(location.priority),
      sortOrder: location.sortOrder,
      treatment: location.treatment,
      refreshMinutes: location.refreshMinutes,
    });
    setWeatherSearch("");
    setWeatherSearchResults([]);
    openEditorialView("civic-wire", "weather", "ticker-weather-editor");
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("draft");
    setError("");
    setFeedback(null);
    try {
      await createLocalEditorialDraft({ ...draft, slug: draft.slug || slugify(draft.title), type: "post", authorName: civicAuthor });
      setDraft({ title: "", slug: "", excerpt: "", contentMarkdown: "", featuredImage: "" });
      await refresh();
      setFeedback({ scope: "draft", kind: "success", message: "Blog draft saved to the private editorial record. Nothing was sent to WordPress." });
    } catch (reason) {
      setFeedback({ scope: "draft", kind: "error", message: reason instanceof Error ? reason.message : "The local draft could not be saved." });
    } finally { setBusy(""); }
  }

  async function downloadHandoff() {
    setBusy("handoff"); setError(""); setFeedback(null);
    try {
      const manifest = await getLocalWordpressHandoff();
      const blob = new Blob([`${JSON.stringify(manifest, null, 2)}\n`], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href; link.download = `utopian-wordpress-handoff-${manifest.generatedAt.slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(href);
      setFeedback({ scope: "archive", kind: "success", message: `Reviewed handoff manifest prepared for ${manifest.count} draft${manifest.count === 1 ? "" : "s"}. No WordPress write occurred.` });
    } catch (reason) { setFeedback({ scope: "archive", kind: "error", message: reason instanceof Error ? reason.message : "The local handoff manifest could not be prepared." }); }
    finally { setBusy(""); }
  }

  async function synchronizeArchive() {
    setBusy("sync"); setError(""); setFeedback(null);
    try {
      const result = await synchronizeWordpressPublications();
      await refresh();
      setFeedback({
        scope: "archive",
        kind: "success",
        message: result.unchanged
          ? `${result.retained} published WordPress posts checked; the retained archive was already current. No WordPress content was changed.`
          : `${result.synchronized} changed WordPress post${result.synchronized === 1 ? "" : "s"} synchronized read-only${result.removed ? `; ${result.removed} removed from the retained archive` : ""}. No WordPress content was changed.`,
      });
    } catch (reason) { setFeedback({ scope: "archive", kind: "error", message: reason instanceof Error ? reason.message : "The WordPress archive could not be synchronized." }); }
    finally { setBusy(""); }
  }

  if (!status) return <section className="editorial-access-gate" aria-live="polite">
    <span>Authorized representatives</span><h1>Editorial Studio is private.</h1>
    <p>{error || "Verifying your civic authority…"}</p>
    {error && <Link href="/login">Sign in through the Civic Portal →</Link>}
  </section>;

  return <>
    <section className="editorial-studio-hero" aria-labelledby="editorial-studio-title">
      <div><span>Private tools</span><h1 id="editorial-studio-title">Editorial Studio</h1></div>
      <aside aria-label="Editorial status"><strong>{status.wordpressBridge.mode}</strong><span>{status.productionFrozen ? "Publishing paused" : "Publishing active"}</span><small>WordPress connection is read-only</small></aside>
    </section>

    {error && <p className="editorial-message is-error" role="alert">{error}</p>}

    <section className="editorial-vitals" aria-label="Editorial summary">
      <article><span>WordPress archive</span><strong>{importedCount}</strong><small>publications inventoried</small></article>
      <article><span>Private working record</span><strong>{draftCount}</strong><small>drafts awaiting review</small></article>
      <article><span>Civic wire</span><strong>{activeTickerCount}</strong><small>entries in the current rotation</small></article>
      <article><span>30-day public reading</span><strong>{analytics?.totalViews.toLocaleString("en-US") ?? "—"}</strong><small>aggregate first-party page views</small></article>
    </section>

    <div className="editorial-navigation">
      <nav className="editorial-primary-tabs" role="tablist" aria-label="Editorial Studio sections" aria-orientation="horizontal">
        {editorialSections.map((section) => <button
          key={section.id}
          id={`editorial-section-tab-${section.id}`}
          type="button"
          role="tab"
          aria-selected={activeSection === section.id}
          aria-controls={`editorial-section-panel-${section.id}`}
          tabIndex={activeSection === section.id ? 0 : -1}
          className={activeSection === section.id ? "is-active" : ""}
          onClick={() => chooseEditorialSection(section.id)}
          onKeyDown={handleEditorialTabKeyDown}
        >{section.label}</button>)}
      </nav>
      <nav className="editorial-secondary-tabs" role="tablist" aria-label={`${editorialSections.find((section) => section.id === activeSection)?.label} tools`} aria-orientation="horizontal">
          {editorialViews[activeSection].map((view) => <button
            key={view.id}
            id={`editorial-view-tab-${view.id}`}
            type="button"
            role="tab"
            aria-selected={activeView === view.id}
            aria-controls={`editorial-view-panel-${view.id}`}
            tabIndex={activeView === view.id ? 0 : -1}
            className={activeView === view.id ? "is-active" : ""}
            onClick={() => chooseEditorialView(view.id)}
            onKeyDown={handleEditorialTabKeyDown}
          >{view.label}</button>)}
      </nav>
    </div>

    <div id={`editorial-section-panel-${activeSection}`} role="tabpanel" aria-labelledby={`editorial-section-tab-${activeSection}`}>
      <div id={`editorial-view-panel-${activeView}`} className="editorial-view-panel" role="tabpanel" aria-labelledby={`editorial-view-tab-${activeView}`} tabIndex={0}>
    {activeSection === "publishing" && activeView === "draft" && <section className="editorial-workbench is-single-panel">
      <form onSubmit={saveDraft} className="editorial-sheet">
        <header><span>Blog drafts</span><h2>Create a draft</h2></header>
        <InlineFeedback feedback={feedback} scope="draft" />
        <label>Title<input required maxLength={240} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} /></label>
        <label>Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} /></label>
        <label>Excerpt<textarea required maxLength={600} rows={3} value={draft.excerpt} onChange={(event) => setDraft((current) => ({ ...current, excerpt: event.target.value }))} /></label>
        <label>Body · Markdown<textarea required maxLength={60000} rows={13} value={draft.contentMarkdown} onChange={(event) => setDraft((current) => ({ ...current, contentMarkdown: event.target.value }))} /></label>
        <label>Featured image URL · optional<input type="url" value={draft.featuredImage} onChange={(event) => setDraft((current) => ({ ...current, featuredImage: event.target.value }))} /></label>
        <footer><span>Author · {civicAuthor}</span><button disabled={busy === "draft"}>{busy === "draft" ? "Saving…" : "Save private draft"}</button></footer>
      </form>
    </section>}

    {activeSection === "civic-wire" && activeView === "notices" && <section className="editorial-workbench is-single-panel">
      <form onSubmit={saveAnnouncement} className="editorial-sheet ticker-sheet" id="ticker-notice-editor">
        <header><span>Ticker notices</span><h2>{editingAnnouncementId ? "Edit notice" : "New notice"}</h2><p>Changes are logged with the signed-in civic identity.</p></header>
        <InlineFeedback feedback={feedback} scope="notice-editor" />
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
    </section>}

    {activeSection === "civic-wire" && activeView === "rotation" && <section className="editorial-ticker-control" aria-labelledby="current-wire-title">
      <header><span>Live ticker</span><h2 id="current-wire-title">Current rotation</h2><p>Shown in public display order.</p></header>
      <InlineFeedback feedback={feedback} scope="current-wire" />
      <div className="editorial-table-wrap"><table className="editorial-table"><thead><tr><th>Hierarchy</th><th>Message</th><th>Type / source</th><th>Treatment</th><th>Destination</th><th>Action</th></tr></thead><tbody>
        {ticker?.currentItems.length ? ticker.currentItems.map((item) => <tr key={item.itemId}><td><strong>{rankLabel(item.priority)}</strong><small>order {item.sortOrder}</small></td><td>{item.label}</td><td><strong>{item.recordType}</strong><small>{item.sourceLabel}</small></td><td><span className={`ticker-treatment-chip is-${item.treatment}`}>{treatmentLabel(item.treatment)}</span></td><td>{item.href ? <a href={item.href}>Open link</a> : "—"}</td><td className="editorial-table-actions">{item.recordType === "manual" ? <button type="button" onClick={() => { const record = ticker.announcements.find((entry) => entry.announcementId === item.itemId); if (record) editAnnouncement(record); }}>Edit</button> : item.recordType === "feed" ? <button type="button" disabled={busy === `feed:${item.itemId}`} onClick={() => void runTickerMutation(`feed:${item.itemId}`, "current-wire", () => setTickerFeedItemSuppressed(item.itemId, true), "Feed item suppressed and recorded in the Transparency Ledger.")}>Suppress</button> : item.sourceId && <button type="button" onClick={() => { const source = sourceById.get(item.sourceId!); if (source) editSource(source); }}>Configure</button>}</td></tr>) : <tr><td colSpan={6}>The managed rotation is awaiting its first source refresh.</td></tr>}
      </tbody></table></div>
    </section>}

    {activeSection === "civic-wire" && activeView === "notices" && <section className="editorial-ticker-control" aria-labelledby="notice-library-title">
      <header><span>Notice library</span><h2 id="notice-library-title">Manual notices</h2><p>Archived notices can be restored.</p></header>
      <InlineFeedback feedback={feedback} scope="notice-library" />
      <div className="editorial-table-wrap"><table className="editorial-table"><thead><tr><th>Status</th><th>Notice</th><th>Hierarchy</th><th>Presentation</th><th>Last actor</th><th>Actions</th></tr></thead><tbody>
        {ticker?.announcements.length ? ticker.announcements.map((item) => <tr key={item.announcementId}><td><span className={`editorial-status is-${item.status}`}>{item.status}</span></td><td>{item.label}<small>{item.startsAt ? `Begins ${new Date(item.startsAt).toLocaleString()}` : "No beginning limit"}{item.endsAt ? ` · ends ${new Date(item.endsAt).toLocaleString()}` : ""}</small></td><td><strong>{rankLabel(item.priority)}</strong><small>order {item.sortOrder}</small></td><td>{treatmentLabel(item.treatment)}</td><td>{item.updatedBy}<small>{new Date(item.updatedAt).toLocaleString()}</small></td><td className="editorial-table-actions"><button type="button" onClick={() => editAnnouncement(item)}>Edit</button>{item.status !== "archived" ? <><button type="button" disabled={busy === `notice-state:${item.announcementId}`} onClick={() => void runTickerMutation(`notice-state:${item.announcementId}`, "notice-library", () => updateTickerAnnouncement(item.announcementId, { status: item.status === "paused" ? "active" : "paused" }), `Notice ${item.status === "paused" ? "activated" : "paused"} and recorded in the Transparency Ledger.`)}>{item.status === "paused" ? "Activate" : "Pause"}</button><button type="button" className="is-danger" disabled={busy === `notice-archive:${item.announcementId}`} onClick={() => void runTickerMutation(`notice-archive:${item.announcementId}`, "notice-library", () => updateTickerAnnouncement(item.announcementId, { status: "archived" }), "Notice archived and recorded in the Transparency Ledger.")}>Archive</button></> : <button type="button" onClick={() => void runTickerMutation(`notice-restore:${item.announcementId}`, "notice-library", () => updateTickerAnnouncement(item.announcementId, { status: "paused" }), "Notice restored in a paused state and recorded in the Transparency Ledger.")}>Restore paused</button>}</td></tr>) : <tr><td colSpan={6}>No ticker notices have been prepared.</td></tr>}
      </tbody></table></div>
    </section>}

    {activeSection === "civic-wire" && activeView === "weather" && <section className="editorial-source-manager" aria-labelledby="weather-manager-title">
      <header><span>Required source</span><h2 id="weather-manager-title">Weather Locations</h2><p>Add each Society site or place represented on the civic wire. At least one location remains active.</p></header>
      <InlineFeedback feedback={feedback} scope="weather" />
      <div className="editorial-table-wrap"><table className="editorial-table"><thead><tr><th>Location</th><th>Conditions</th><th>State</th><th>Hierarchy</th><th>Health</th><th>Actions</th></tr></thead><tbody>
        {ticker?.weatherLocations.length ? ticker.weatherLocations.map((location) => {
          const isOnlyActive = location.enabled && location.status === "active" && activeWeatherCount === 1;
          return <tr key={location.locationId}><td><strong>{location.label}</strong><small>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} · {location.timezone}</small></td><td><strong>{location.conditionsMode}</strong><small>{treatmentLabel(location.treatment)} · {location.refreshMinutes} min</small></td><td><span className={`editorial-status is-${location.status}`}>{location.status}</span><small>{location.enabled ? "Enabled" : "Disabled"}</small></td><td><strong>{rankLabel(location.priority)}</strong><small>order {location.sortOrder}</small></td><td className={location.lastError ? "is-health-error" : ""}>{weatherHealth(location)}</td><td className="editorial-table-actions"><button type="button" onClick={() => editWeatherLocation(location)}>Configure</button>{location.status !== "archived" ? <><button type="button" title={isOnlyActive ? "At least one weather location must remain active." : undefined} disabled={isOnlyActive || busy === `weather-state:${location.locationId}`} onClick={() => void runTickerMutation(`weather-state:${location.locationId}`, "weather", () => updateTickerWeatherLocation(location.locationId, { status: location.status === "paused" ? "active" : "paused", enabled: location.status === "paused" ? true : location.enabled }), `Weather location ${location.status === "paused" ? "resumed" : "paused"} and recorded in the Transparency Ledger.`)}>{location.status === "paused" ? "Resume" : "Pause"}</button><button type="button" disabled={busy === `weather-refresh:${location.locationId}` || location.status !== "active" || !location.enabled} onClick={() => void runTickerMutation(`weather-refresh:${location.locationId}`, "weather", async () => { const result = await refreshTickerWeatherLocation(location.locationId); if (result.reason === "failed") throw new Error("The weather location could not refresh. Its health message has been retained for review."); return result; }, "Weather location refreshed.")}>Refresh</button><button type="button" className="is-danger" title={isOnlyActive ? "Add or activate another weather location before archiving this one." : undefined} disabled={isOnlyActive || busy === `weather-archive:${location.locationId}`} onClick={() => void runTickerMutation(`weather-archive:${location.locationId}`, "weather", () => updateTickerWeatherLocation(location.locationId, { status: "archived", enabled: false }), "Weather location archived and recorded in the Transparency Ledger.")}>Archive</button></> : <button type="button" onClick={() => void runTickerMutation(`weather-restore:${location.locationId}`, "weather", () => updateTickerWeatherLocation(location.locationId, { status: "paused", enabled: false }), "Weather location restored in a paused state and recorded in the Transparency Ledger.")}>Restore paused</button>}</td></tr>;
        }) : <tr><td colSpan={6}>The required weather collection has no locations.</td></tr>}
      </tbody></table></div>

      <form className="editorial-sheet source-editor" id="ticker-weather-editor" onSubmit={saveWeatherLocation}>
        <header><span>{editingWeatherId ? "Configure location" : "Add location"}</span><h2>{editingWeatherId ? "Weather location settings" : "Add a weather location"}</h2><p>Search by place name or enter coordinates directly.</p></header>
        <div className="editorial-field-row"><label>Find a place<input maxLength={120} placeholder="Chicago, Tokyo, South Pacific Gyre…" value={weatherSearch} onChange={(event) => setWeatherSearch(event.target.value)} /></label><div className="editorial-inline-action"><button type="button" disabled={busy === "weather-search" || weatherSearch.trim().length < 2} onClick={() => void findWeatherLocation()}>{busy === "weather-search" ? "Searching…" : "Search"}</button></div></div>
        {weatherSearchResults.length > 0 && <div className="editorial-search-results" aria-label="Location search results">{weatherSearchResults.map((result) => <button type="button" key={result.id} onClick={() => chooseWeatherResult(result)}><strong>{result.label}</strong><small>{result.latitude.toFixed(4)}, {result.longitude.toFixed(4)} · {result.timezone}</small></button>)}</div>}
        <label>Public location name<input required maxLength={120} value={weatherDraft.label} onChange={(event) => setWeatherDraft((current) => ({ ...current, label: event.target.value }))} /></label>
        <div className="editorial-field-row"><label>Latitude<input required type="number" step="0.000001" min={-90} max={90} value={weatherDraft.latitude} onChange={(event) => setWeatherDraft((current) => ({ ...current, latitude: Number(event.target.value) }))} /></label><label>Longitude<input required type="number" step="0.000001" min={-180} max={180} value={weatherDraft.longitude} onChange={(event) => setWeatherDraft((current) => ({ ...current, longitude: Number(event.target.value) }))} /></label></div>
        <div className="editorial-field-row"><label>Timezone<input required maxLength={100} placeholder="America/Chicago" value={weatherDraft.timezone} onChange={(event) => setWeatherDraft((current) => ({ ...current, timezone: event.target.value }))} /></label><label>Conditions<select value={weatherDraft.conditionsMode} onChange={(event) => setWeatherDraft((current) => ({ ...current, conditionsMode: event.target.value as WeatherDraft["conditionsMode"] }))}><option value="land">Land weather</option><option value="marine">Marine conditions</option><option value="combined">Land and marine</option></select></label></div>
        <div className="editorial-field-row"><label>Rank<select value={weatherDraft.priority} onChange={(event) => setWeatherDraft((current) => ({ ...current, priority: Number(event.target.value) }))}>{rankOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Order within rank<input type="number" min={-1000} max={1000} value={weatherDraft.sortOrder} onChange={(event) => setWeatherDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></label></div>
        <div className="editorial-field-row"><label>Treatment<select value={weatherDraft.treatment} onChange={(event) => setWeatherDraft((current) => ({ ...current, treatment: event.target.value as TickerTreatment }))}>{treatmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Refresh interval<select value={weatherDraft.refreshMinutes} onChange={(event) => setWeatherDraft((current) => ({ ...current, refreshMinutes: Number(event.target.value) }))}><option value={5}>Every 5 minutes</option><option value={15}>Every 15 minutes</option><option value={30}>Every 30 minutes</option><option value={60}>Every hour</option><option value={360}>Every 6 hours</option><option value={1440}>Daily</option></select></label></div>
        <div className="editorial-field-row"><label>Status<select value={weatherDraft.status} onChange={(event) => setWeatherDraft((current) => ({ ...current, status: event.target.value as WeatherDraft["status"] }))}><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select></label><label className="editorial-checkbox"><input type="checkbox" checked={weatherDraft.enabled} onChange={(event) => setWeatherDraft((current) => ({ ...current, enabled: event.target.checked }))} />Enabled for public rotation</label></div>
        <footer><span>Actor · {ticker?.actor || "Authenticated representative"}</span><div className="editorial-button-row"><button disabled={busy === "weather"}>{busy === "weather" ? "Saving…" : editingWeatherId ? "Save location settings" : "Add weather location"}</button>{editingWeatherId && <button type="button" className="is-secondary" onClick={() => { setEditingWeatherId(null); setWeatherDraft({ ...emptyWeather }); setWeatherSearch(""); setWeatherSearchResults([]); }}>Cancel edit</button>}</div></footer>
      </form>
    </section>}

    {activeSection === "civic-wire" && activeView === "sources" && <section className="editorial-source-manager" aria-labelledby="source-manager-title">
      <header><span>Sources</span><h2 id="source-manager-title">Source Manager</h2><p>Manage built-in sources and RSS or Atom feeds.</p></header>
      <InlineFeedback feedback={feedback} scope="source" />
      <div className="editorial-table-wrap"><table className="editorial-table"><thead><tr><th>Source</th><th>State</th><th>Hierarchy</th><th>Defaults</th><th>Health</th><th>Actions</th></tr></thead><tbody>
        {ticker?.sources.map((source) => <tr key={source.sourceId}><td><strong>{source.label}</strong><small>{source.required ? "Required system source" : source.builtIn ? `Built-in ${source.sourceType}` : "Custom RSS"}{source.prefix ? ` · prefix “${source.prefix}”` : ""}</small></td><td><span className={`editorial-status is-${source.status}`}>{source.status}</span><small>{source.enabled ? "Enabled" : "Disabled"}</small></td><td><strong>{rankLabel(source.priority)}</strong><small>order {source.sortOrder}</small></td><td>{treatmentLabel(source.treatment)}<small>{source.sourceType === "rss" ? `${source.itemLimit} item${source.itemLimit === 1 ? "" : "s"} · ${source.refreshMinutes} min` : source.sourceKey === "south-pacific-weather" ? `${ticker.weatherLocations.filter((location) => location.enabled && location.status === "active").length} active locations` : "Generated live"}</small></td><td className={source.lastError ? "is-health-error" : ""}>{sourceHealth(source)}</td><td className="editorial-table-actions"><button type="button" onClick={() => editSource(source)}>Configure</button>{!source.required && (source.status !== "archived" ? <button type="button" disabled={busy === `source-state:${source.sourceId}`} onClick={() => void runTickerMutation(`source-state:${source.sourceId}`, "source", () => updateTickerSource(source.sourceId, { status: source.status === "paused" ? "active" : "paused", enabled: source.status === "paused" ? true : source.enabled }), `Source ${source.status === "paused" ? "resumed" : "paused"} and recorded in the Transparency Ledger.`)}>{source.status === "paused" ? "Resume" : "Pause"}</button> : <button type="button" onClick={() => void runTickerMutation(`source-restore:${source.sourceId}`, "source", () => updateTickerSource(source.sourceId, { status: "paused", enabled: false }), "Source restored in a paused state and recorded in the Transparency Ledger.")}>Restore paused</button>)}{(source.sourceType === "rss" || source.sourceKey === "south-pacific-weather") && source.status === "active" && <button type="button" disabled={busy === `source-refresh:${source.sourceId}`} onClick={() => void runTickerMutation(`source-refresh:${source.sourceId}`, "source", async () => { const result = await refreshTickerSource(source.sourceId); if (result.reason === "failed") throw new Error("The source could not refresh. Its health message has been retained for review."); return result; }, "Source refresh completed.")}>Refresh</button>}{!source.builtIn && source.status !== "archived" && <button type="button" className="is-danger" onClick={() => void runTickerMutation(`source-archive:${source.sourceId}`, "source", () => updateTickerSource(source.sourceId, { status: "archived", enabled: false }), "RSS source archived and recorded in the Transparency Ledger.")}>Archive</button>}</td></tr>)}
      </tbody></table></div>

      <form className="editorial-sheet source-editor" id="ticker-source-editor" onSubmit={saveSource}>
        <header><span>{editingSourceId ? "Configure source" : "Add source"}</span><h2>{editingSourceId ? "Source settings" : "Add RSS or Atom feed"}</h2><p>Public HTTPS feeds only.</p></header>
        <div className="editorial-field-row"><label>Source name<input required maxLength={120} value={sourceDraft.label} onChange={(event) => setSourceDraft((current) => ({ ...current, label: event.target.value }))} /></label><label>Label prefix · optional<input maxLength={40} placeholder="World, Local, Science…" value={sourceDraft.prefix} onChange={(event) => setSourceDraft((current) => ({ ...current, prefix: event.target.value }))} /></label></div>
        <label>RSS or Atom feed URL<input required={!editingSourceId || !sourceById.get(editingSourceId)?.builtIn} type="url" disabled={Boolean(editingSourceId && sourceById.get(editingSourceId)?.builtIn)} placeholder="https://example.org/feed.xml" value={sourceDraft.endpointUrl} onChange={(event) => setSourceDraft((current) => ({ ...current, endpointUrl: event.target.value }))} /></label>
        <label>Credit or source page · optional<input placeholder="https://example.org/news" value={sourceDraft.creditUrl} onChange={(event) => setSourceDraft((current) => ({ ...current, creditUrl: event.target.value }))} /></label>
        <div className="editorial-field-row"><label>Rank<select value={sourceDraft.priority} onChange={(event) => setSourceDraft((current) => ({ ...current, priority: Number(event.target.value) }))}>{rankOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Order within rank<input type="number" min={-1000} max={1000} value={sourceDraft.sortOrder} onChange={(event) => setSourceDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></label></div>
        <div className="editorial-field-row"><label>Default treatment<select value={sourceDraft.treatment} onChange={(event) => setSourceDraft((current) => ({ ...current, treatment: event.target.value as TickerTreatment }))}>{treatmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Items per refresh<input type="number" min={1} max={10} value={sourceDraft.itemLimit} onChange={(event) => setSourceDraft((current) => ({ ...current, itemLimit: Number(event.target.value) }))} /></label></div>
        <div className="editorial-field-row"><label>Refresh interval<select value={sourceDraft.refreshMinutes} onChange={(event) => setSourceDraft((current) => ({ ...current, refreshMinutes: Number(event.target.value) }))}><option value={5}>Every 5 minutes</option><option value={15}>Every 15 minutes</option><option value={30}>Every 30 minutes</option><option value={60}>Every hour</option><option value={360}>Every 6 hours</option><option value={1440}>Daily</option></select></label><label>Status<select disabled={Boolean(editingSourceId && sourceById.get(editingSourceId)?.required)} value={sourceDraft.status} onChange={(event) => setSourceDraft((current) => ({ ...current, status: event.target.value as typeof current.status }))}><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select></label></div>
        <label className="editorial-checkbox"><input type="checkbox" disabled={Boolean(editingSourceId && sourceById.get(editingSourceId)?.required)} checked={sourceDraft.enabled} onChange={(event) => setSourceDraft((current) => ({ ...current, enabled: event.target.checked }))} />{editingSourceId && sourceById.get(editingSourceId)?.required ? "Required for public rotation" : "Enabled for public rotation"}</label>
        <footer><span>Actor · {ticker?.actor || "Authenticated representative"}</span><div className="editorial-button-row"><button disabled={busy === "source"}>{busy === "source" ? "Saving…" : editingSourceId ? "Save source settings" : "Add RSS source"}</button>{editingSourceId && <button type="button" className="is-secondary" onClick={() => { setEditingSourceId(null); setSourceDraft({ ...emptySource }); }}>Cancel edit</button>}</div></footer>
      </form>

      {suppressedFeedItems.length > 0 && <div className="editorial-suppressed"><h3>Suppressed feed items</h3><p>These remain available for restoration while their source still retains them.</p>{suppressedFeedItems.map((item) => <article key={item.itemId}><span>{sourceById.get(item.sourceId)?.label || "Feed"}</span><strong>{item.label}</strong><button type="button" onClick={() => void runTickerMutation(`feed-restore:${item.itemId}`, "source", () => setTickerFeedItemSuppressed(item.itemId, false), "Feed item restored and recorded in the Transparency Ledger.")}>Restore</button></article>)}</div>}
    </section>}

    {activeSection === "archive" && activeView === "tools" && <section className="editorial-bridge" aria-labelledby="editorial-bridge-title">
      <div><span>WordPress</span><h2 id="editorial-bridge-title">Archive tools</h2></div>
      <aside><strong>Read-only connection</strong><p>Sync published posts or download the draft handoff file.</p><InlineFeedback feedback={feedback} scope="archive" /><button type="button" onClick={synchronizeArchive} disabled={busy === "sync"}>{busy === "sync" ? "Synchronizing…" : "Synchronize published posts"}</button><button type="button" onClick={downloadHandoff} disabled={busy === "handoff"}>{busy === "handoff" ? "Preparing…" : "Download handoff file"}</button></aside>
    </section>}

    {activeSection === "insights" && activeView === "traffic" && <section className="editorial-publications" aria-label="Aggregate public analytics"><header><span>Last 30 days</span><h2>Traffic sources</h2><p>{analytics?.privacy || "Public page views only."}</p></header><div>{analytics?.sources.length ? analytics.sources.slice(0, 8).map((source) => <article key={`${source.source_group}:${source.source_detail}`}><span>{source.source_group}</span><strong>{source.source_detail || "No external referrer"}</strong><small>{Number(source.views).toLocaleString("en-US")} page views</small></article>) : <article><span>No traffic yet</span><strong>No source totals</strong><small>Data will appear after public visits.</small></article>}</div></section>}
    {activeSection === "insights" && activeView === "immigration" && <section className="editorial-assessment-analytics" aria-label="Founder immigration assessment analytics">
      <header><span>Founder-only aggregate</span><h2>Immigration assessment activity</h2><p>{analytics?.immigration.privacy || "Exact aggregate assessment activity without individual answers or applicant identities."}</p></header>
      <div className="editorial-assessment-headline">
        <article><span>Active population</span><strong>{Number(analytics?.immigration.citizens.active || 0).toLocaleString("en-US")}</strong><small>{Number(analytics?.immigration.citizens.total || 0).toLocaleString("en-US")} total citizen record{Number(analytics?.immigration.citizens.total || 0) === 1 ? "" : "s"}</small></article>
        <article><span>Naturalization attempts</span><strong>{Number(analytics?.immigration.naturalization.lifetime.started || 0).toLocaleString("en-US")}</strong><small>All dynamic attempts started</small></article>
        <article><span>Practice attempts</span><strong>{Number(analytics?.immigration.practice.lifetime.started || 0).toLocaleString("en-US")}</strong><small>Authenticated, non-issuing runs</small></article>
      </div>
      <div className="editorial-table-wrap"><table className="editorial-table"><thead><tr><th>Assessment window</th><th>Started</th><th>Completed</th><th>Met standard</th><th>Not passed</th><th>Incomplete</th><th>In progress</th><th>Certificates</th></tr></thead><tbody>
        {analytics ? ([
          ["Naturalization · lifetime", analytics.immigration.naturalization.lifetime],
          ["Naturalization · 30 days", analytics.immigration.naturalization.last30Days],
          ["Naturalization · 7 days", analytics.immigration.naturalization.last7Days],
          ["Practice · lifetime", analytics.immigration.practice.lifetime],
          ["Practice · 30 days", analytics.immigration.practice.last30Days],
          ["Practice · 7 days", analytics.immigration.practice.last7Days],
        ] as const).map(([label, metrics]) => <tr key={label}><td><strong>{label}</strong></td><td>{metrics.started.toLocaleString("en-US")}</td><td>{metrics.completed.toLocaleString("en-US")}</td><td>{metrics.metStandard.toLocaleString("en-US")}</td><td>{metrics.notPassed.toLocaleString("en-US")}</td><td>{metrics.incomplete.toLocaleString("en-US")}</td><td>{metrics.inProgress.toLocaleString("en-US")}</td><td>{metrics.certificatesIssued.toLocaleString("en-US")}</td></tr>) : <tr><td colSpan={8}>Assessment analytics are loading.</td></tr>}
      </tbody></table></div>
      <footer>Incomplete means the two-hour attempt window expired before scoring. Individual attempts and results are not published to the Transparency Ledger; only privacy-thresholded weekly aggregates are.</footer>
    </section>}
    {activeSection === "publishing" && activeView === "recent" && <section className="editorial-publications" aria-label="Recent publication inventory"><header><span>Publications</span><h2>Recent records</h2></header><div>{status?.recentPublications.map((item) => <article key={item.publicationId}><span>{item.status} · {item.type}</span><strong>{item.title}</strong><small>{item.utopianDate || "Date pending"}</small></article>)}</div></section>}
      </div>
    </div>
  </>;
}
