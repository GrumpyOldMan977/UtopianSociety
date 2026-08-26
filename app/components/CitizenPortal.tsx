"use client";

import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  acceptContributionPosition,
  affirmContributionEvidence,
  CivicPortalSnapshot,
  createLearningGoal,
  civicProfileSlug,
  deleteProfileAvatar,
  deleteProtectedDocument,
  downloadProtectedDocument,
  getPrivateCivicIdentity,
  getLocalCivicPortal,
  getProfileAvatar,
  generateProfilePortrait,
  logoutLocalCivicAccount,
  LearningEvidenceContract,
  LearningObservation,
  PrivateCivicIdentity,
  ProtectedDocument,
  recordContributionTime,
  reportHarmonyHarm,
  requestHealingAppointment,
  requestLearningAssessment,
  requestUsuEnrollment,
  resetLearningProfile,
  savePublicProfilePresentation,
  savePrivateCivicIdentity,
  saveLearningEvidenceContract,
  challengeLearningObservation,
  submitContributionEvidence,
  uploadProfileAvatar,
  uploadProtectedDocument,
} from "../lib/civic-ledger";
import {
  OcrProgress,
  OcrResult,
  recognizeProtectedDocument,
} from "../lib/browser-ocr";
import { utopianDateLong } from "../lib/utopian-time";

const TABS = [
  "Contribution",
  "Healing",
  "Harmony",
  "CCB",
  "Learning",
  "Balance",
  "FTB",
  "USU",
  "Certificate",
] as const;
type PortalTab = typeof TABS[number];

const Q_LABELS: Record<string, string> = {
  intellectual: "Intellectual",
  emotional: "Emotional",
  social: "Social",
  creative: "Creative",
  adaptability: "Adaptability",
  moral: "Moral",
  physical: "Physical",
  natural: "Natural",
  technological: "Technological",
  learning: "Learning",
};

const LEARNING_CHANNEL_LABELS = {
  combined: "Combined",
  declared: "Citizen declared",
  demonstrated: "Demonstrated in work",
  observed: "Externally observed",
} as const;
type LearningChannelView = keyof typeof LEARNING_CHANNEL_LABELS;

type OcrDraft = OcrResult & {
  source: ProtectedDocument;
  sourceUrl: string;
};

function displayNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

function displayBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function displayPercent(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
  }).format(value);
}

function displayMoney(minorUnits: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}

function displayUtc(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${utopianDateLong(date)} · ${time} UTC`;
}

function storedArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function saveBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(href);
}

function value(row: Record<string, string | number | null>, key: string) {
  const result = row[key];
  return result === null || result === undefined || result === "" ? "Pending" : String(result);
}

type StructuredName = {
  first: string;
  middle: string;
  last: string;
};

function splitStructuredName(value: string): StructuredName {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: "", middle: "", last: "" };
  if (parts.length === 1) return { first: parts[0], middle: "", last: "" };
  return {
    first: parts[0],
    middle: parts.slice(1, -1).join(" "),
    last: parts.at(-1) || "",
  };
}

function joinStructuredName(value: StructuredName) {
  return [value.first, value.middle, value.last].map((part) => part.trim()).filter(Boolean).join(" ");
}

type PortalTextSize = "standard" | "large" | "largest";
const PORTAL_TEXT_SIZE_KEY = "utopia.textSize";

function applyPortalTextSize(value: PortalTextSize) {
  document.documentElement.dataset.utopiaTextSize = value;
  localStorage.setItem(PORTAL_TEXT_SIZE_KEY, value);
}

export function CitizenPortal() {
  const [accessReady, setAccessReady] = useState(false);
  const [civicId, setCivicId] = useState("");
  const [snapshot, setSnapshot] = useState<CivicPortalSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>("Contribution");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [minutes, setMinutes] = useState<Record<string, string>>({});
  const [timeNotes, setTimeNotes] = useState<Record<string, string>>({});
  const [learningGoal, setLearningGoal] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [learningConsent, setLearningConsent] = useState(false);
  const [learningChannelView, setLearningChannelView] = useState<LearningChannelView>("combined");
  const [contractDocumentId, setContractDocumentId] = useState("");
  const [detailsDocumentId, setDetailsDocumentId] = useState("");
  const [identitySettingsOpen, setIdentitySettingsOpen] = useState(false);
  const [textSize, setTextSize] = useState<PortalTextSize>("large");
  const [ocrDraft, setOcrDraft] = useState<OcrDraft | null>(null);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [ocrReviewed, setOcrReviewed] = useState(false);
  const ocrAbort = useRef<AbortController | null>(null);
  const ocrSourceUrl = useRef("");
  const [careDomain, setCareDomain] = useState("whole-person care");
  const [careReason, setCareReason] = useState("");
  const [careWindow, setCareWindow] = useState("");
  const [harmSummary, setHarmSummary] = useState("");
  const [harmDetails, setHarmDetails] = useState("");

  const refresh = useCallback(async () => {
    if (!civicId) return;
    setError("");
    const next = await getLocalCivicPortal();
    setSnapshot(next);
    if (next.profile.hasAvatar) {
      const blob = await getProfileAvatar();
      setAvatarUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(blob);
      });
    } else {
      setAvatarUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return "";
      });
    }
  }, [civicId]);

  useEffect(() => {
    const session = sessionStorage.getItem("utopia.civicSession");
    const storedTextSize = localStorage.getItem(PORTAL_TEXT_SIZE_KEY);
    const nextTextSize: PortalTextSize = storedTextSize === "standard" || storedTextSize === "largest"
      ? storedTextSize
      : "large";
    applyPortalTextSize(nextTextSize);
    queueMicrotask(() => {
      setTextSize(nextTextSize);
      setCivicId(session ? sessionStorage.getItem("utopia.civicId") || "" : "");
      setAccessReady(true);
    });
  }, []);

  useEffect(() => {
    if (!civicId) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void refresh().catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "The local civic profile could not be opened.");
      });
    });
    return () => {
      active = false;
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
    // avatarUrl is intentionally managed by refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [civicId, refresh]);

  useEffect(() => () => {
    ocrAbort.current?.abort();
    if (ocrSourceUrl.current) URL.revokeObjectURL(ocrSourceUrl.current);
  }, []);

  const assignmentsByPosition = useMemo(() => new Map(
    (snapshot?.contribution.assignments || []).map((assignment) => [assignment.positionId, assignment]),
  ), [snapshot]);

  async function run<Result>(
    action: string,
    operation: () => Promise<Result>,
    completed: string | ((result: Result) => string),
  ) {
    setBusy(action);
    setError("");
    setNotice("");
    try {
      const result = await operation();
      setNotice(typeof completed === "function" ? completed(result) : completed);
      await refresh();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The civic workflow could not complete this step.");
      return false;
    } finally {
      setBusy("");
    }
  }

  async function uploadRecord(
    event: ChangeEvent<HTMLInputElement>,
    domain: "learning" | "healing" | "harmony",
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const accepted = new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
    ]);
    if (!accepted.has(file.type)) {
      setError("Choose a PDF, DOCX, TXT, JPG, or PNG document.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`${file.name} is ${displayBytes(file.size)}. Private civic documents may be no larger than 10 MB.`);
      return;
    }
    await run(
      `${domain}-upload`,
      () => uploadProtectedDocument(
        domain,
        `Citizen authorized retention for private ${domain} use and may export or delete the original.`,
        file,
      ),
      `${file.name} encrypted and retained in the private ${domain} record.`,
    );
  }

  async function exportDocument(documentId: string, originalName: string) {
    setBusy(`export-${documentId}`);
    setError("");
    try {
      saveBlob(await downloadProtectedDocument(documentId), originalName);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The private document could not be exported.");
    } finally {
      setBusy("");
    }
  }

  async function prepareOcrReview(source: ProtectedDocument) {
    const controller = new AbortController();
    ocrAbort.current?.abort();
    ocrAbort.current = controller;
    setBusy(`ocr-${source.document_id}`);
    setError("");
    setNotice("");
    setOcrDraft(null);
    if (ocrSourceUrl.current) {
      URL.revokeObjectURL(ocrSourceUrl.current);
      ocrSourceUrl.current = "";
    }
    setOcrReviewed(false);
    setOcrProgress({
      stage: "loading",
      page: 1,
      totalPages: 1,
      percent: 0,
      message: "Opening the encrypted source scan locally…",
    });
    try {
      const blob = await downloadProtectedDocument(source.document_id, "ocr");
      const sourceUrl = URL.createObjectURL(blob);
      ocrSourceUrl.current = sourceUrl;
      const result = await recognizeProtectedDocument(
        blob,
        source.media_type,
        setOcrProgress,
        controller.signal,
      );
      setOcrDraft({ source, sourceUrl, ...result });
      setNotice("OCR produced a private draft. Correct it below before any text becomes Learning evidence.");
    } catch (cause) {
      if (ocrSourceUrl.current) {
        URL.revokeObjectURL(ocrSourceUrl.current);
        ocrSourceUrl.current = "";
      }
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "The browser could not read this scan.");
      setOcrProgress(null);
    } finally {
      if (ocrAbort.current === controller) ocrAbort.current = null;
      setBusy("");
    }
  }

  async function saveReviewedOcrTranscript() {
    if (!ocrDraft || !ocrReviewed) return;
    const text = ocrDraft.text.trim();
    if (text.replace(/[^A-Za-z0-9]/g, "").length < 120) {
      setError("The reviewed transcript needs more readable evidence before Learning can assess it.");
      return;
    }
    const stem = ocrDraft.source.original_name
      .replace(/\.[^.]+$/, "")
      .replace(/[^\p{L}\p{N}._ -]+/gu, "")
      .trim()
      .slice(0, 90) || "learning-evidence";
    const file = new File([text], `${stem}.reviewed-ocr.txt`, { type: "text/plain" });
    setBusy("ocr-save");
    setError("");
    setNotice("");
    try {
      const uploaded = await uploadProtectedDocument(
        "learning",
        "Citizen reviewed and corrected a local OCR draft, then authorized retention of this derived transcript as Learning evidence. The encrypted original remains authoritative.",
        file,
        {
          sourceDocumentId: ocrDraft.source.document_id,
          derivationMethod: "citizen_reviewed_ocr",
          reviewStatus: "reviewed",
          extractionConfidence: ocrDraft.confidence,
        },
      );
      setSelectedDocuments((current) => [
        uploaded.documentId,
        ...current.filter((id) => (
          id !== uploaded.documentId
          && id !== ocrDraft.source.document_id
        )),
      ].slice(0, 3));
      setOcrDraft(null);
      if (ocrSourceUrl.current) {
        URL.revokeObjectURL(ocrSourceUrl.current);
        ocrSourceUrl.current = "";
      }
      setOcrProgress(null);
      setOcrReviewed(false);
      setNotice("The reviewed transcript is encrypted, linked to its original scan, and selected for Learning assessment.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The reviewed OCR transcript could not be retained.");
    } finally {
      setBusy("");
    }
  }

  async function logout() {
    try {
      await logoutLocalCivicAccount();
    } finally {
      sessionStorage.removeItem("utopia.civicSession");
      sessionStorage.removeItem("utopia.civicId");
      sessionStorage.removeItem("utopia.civicName");
      window.location.assign("/login");
    }
  }

  if (accessReady && !civicId) {
    return <section className="portal-loading portal-locked">
      <strong>This Civic Profile is private.</strong>
      <p>Enter through Civic Portal → Login to open the record belonging to you.</p>
      <Link href="/login">Continue to Login →</Link>
    </section>;
  }
  if (!accessReady || (!snapshot && !error)) {
    return <section className="portal-loading" aria-live="polite"><span>Opening the local civic record…</span></section>;
  }
  if (!snapshot) {
    return <section className="portal-loading portal-error" role="alert">
      <strong>The local civic service is unavailable.</strong><p>{error}</p>
      <button type="button" onClick={() => void refresh()}>Try again</button>
    </section>;
  }

  const { profile } = snapshot;
  const learningAutomationEnabled = snapshot.aiAllowance.available;
  const profileScores = new Map(snapshot.learning.profileScores.map((score) => [score.qKey, score]));
  const learningContracts = new Map(snapshot.learning.evidenceContracts.map((contract) => [contract.documentId, contract]));
  const selectedLearningDocuments = snapshot.learning.documents.filter((document) => selectedDocuments.includes(document.document_id));
  const missingLearningContracts = selectedLearningDocuments.filter((document) => !learningContracts.has(document.document_id));
  const contractDocument = snapshot.learning.documents.find((document) => document.document_id === contractDocumentId) || null;
  const detailsDocument = snapshot.learning.documents.find((document) => document.document_id === detailsDocumentId) || null;

  return <>
    <section className="citizen-identity" aria-labelledby="citizen-name">
      <div className="citizen-identity-copy">
        <span className="eyebrow">My Civic Profile · Private citizen view</span>
        <h1 id="citizen-name">{profile.civicName}</h1>
        {profile.civicTitle && <strong className="citizen-title">{profile.civicTitle}</strong>}
        <div className="citizen-profile-actions">
          <Link href={`/citizens/${civicProfileSlug(profile.civicName)}`}>View public profile</Link>
          <button type="button" onClick={() => setIdentitySettingsOpen((current) => !current)}>
            {identitySettingsOpen ? "Close identity & profile settings" : "Identity & profile settings"}
          </button>
          <button type="button" onClick={() => void logout()}>Log out</button>
        </div>
      </div>
      <div className="citizen-avatar-display">
        <div
          className={`citizen-avatar${avatarUrl ? " has-image" : ""}`}
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
          aria-label={avatarUrl ? `${profile.civicName}'s private profile picture` : "No profile picture selected"}
        >
          {!avatarUrl && <span>{profile.civicName.split(/\s+/).map((part) => part[0]).slice(0, 3).join("")}</span>}
        </div>
      </div>
    </section>
    {identitySettingsOpen && <PrivateIdentitySettings
      civicName={profile.civicName}
      civicTitle={profile.civicTitle || ""}
      publicBio={profile.publicBio}
      profileVisibility={profile.profileVisibility}
      avatarUrl={avatarUrl}
      aiAllowance={snapshot.aiAllowance}
      textSize={textSize}
      onTextSizeChange={(value) => {
        setTextSize(value);
        applyPortalTextSize(value);
      }}
      onClose={() => setIdentitySettingsOpen(false)}
      onSaved={refresh}
    />}

    <section className="citizen-status-ribbon" aria-label="Citizen status summary">
      <article><span>Immigration</span><strong>{profile.immigrationStanding}</strong></article>
      <article><span>Learning</span><strong>{profile.learningTier}</strong></article>
      <article><span>Contribution</span><strong>{profile.contributionStatus}</strong></article>
      <article><span>Residence</span><strong>{snapshot.residence?.label || profile.residenceStatus}</strong></article>
      <article className="citizen-ccu"><span>Common Credit Balance</span><strong>{displayNumber(snapshot.ccu.balance)} <small>CCU</small></strong></article>
    </section>

    <nav className="civic-profile-tabs" aria-label="Civic Profile sections">
      {TABS.map((tab) => <button
        key={tab}
        type="button"
        className={activeTab === tab ? "is-active" : ""}
        aria-current={activeTab === tab ? "page" : undefined}
        onClick={() => {
          setActiveTab(tab);
          setError("");
          setNotice("");
        }}
      >{tab}</button>)}
    </nav>

    {(error || notice) && <div className={`portal-message portal-global-message ${error ? "is-error" : "is-success"}`} role={error ? "alert" : "status"}>{error || notice}</div>}

    <section className="civic-tab-panel" aria-live="polite">
      {activeTab === "Contribution" && <ContributionTab
        snapshot={snapshot}
        assignmentsByPosition={assignmentsByPosition}
        busy={busy}
        evidence={evidence}
        setEvidence={setEvidence}
        minutes={minutes}
        setMinutes={setMinutes}
        timeNotes={timeNotes}
        setTimeNotes={setTimeNotes}
        run={run}
      />}

      {activeTab === "Healing" && <div className="portal-operational-grid">
        <article>
          <span className="eyebrow">Care access</span><h2>Request an appointment</h2>
          <form onSubmit={(event) => {
            event.preventDefault();
            void run("healing-appointment", () => requestHealingAppointment({
              careDomain, privateReason: careReason, preferredWindow: careWindow,
            }), "The private care request has entered Healing review.");
          }}>
            <label>Care domain<input value={careDomain} onChange={(event) => setCareDomain(event.target.value)} required /></label>
            <label>Private reason<textarea value={careReason} onChange={(event) => setCareReason(event.target.value)} required /></label>
            <label>Preferred time or access need<input value={careWindow} onChange={(event) => setCareWindow(event.target.value)} /></label>
            <button disabled={Boolean(busy) || !careReason.trim()}>Request care</button>
          </form>
          <p className="privacy-note">This local prototype schedules care access. It does not diagnose, prescribe, or make emergency claims.</p>
        </article>
        <article>
          <span className="eyebrow">Private health file</span><h2>Records and prescriptions</h2>
          <RecordUpload domain="healing" busy={busy} onUpload={uploadRecord} />
          <DocumentList documents={snapshot.healing.documents} busy={busy} exportDocument={exportDocument} run={run} />
          <RecordRows rows={snapshot.healing.timeline} empty="No care timeline entries have been recorded." />
          <RecordRows rows={snapshot.healing.prescriptions} empty="No prescriptions have been recorded." />
          <RecordRows rows={snapshot.healing.appointments} empty="No appointment requests have been recorded." />
        </article>
      </div>}

      {activeTab === "Harmony" && <div className="portal-operational-grid">
        <article>
          <span className="eyebrow">Private Harmony intake</span><h2>Report a Harm</h2>
          <form onSubmit={(event) => {
            event.preventDefault();
            void run("harmony-harm", () => reportHarmonyHarm({
              publicSummary: harmSummary,
              privateDetails: harmDetails,
            }), "The Harm report has entered private Harmony triage.");
          }}>
            <label>Procedural public summary<input value={harmSummary} maxLength={280} onChange={(event) => setHarmSummary(event.target.value)} required /></label>
            <label>Private account<textarea value={harmDetails} onChange={(event) => setHarmDetails(event.target.value)} required /></label>
            <button disabled={Boolean(busy) || !harmSummary.trim() || !harmDetails.trim()}>File Harm report</button>
          </form>
          <p className="privacy-note">AI may eventually summarize evidence, but it must never decide responsibility or restoration.</p>
        </article>
        <article>
          <span className="eyebrow">Harmony record</span><h2>Proceedings and restoration</h2>
          <RecordUpload domain="harmony" busy={busy} onUpload={uploadRecord} />
          <DocumentList documents={snapshot.harmony.documents} busy={busy} exportDocument={exportDocument} run={run} />
          <RecordRows rows={snapshot.harmony.harms} empty="No Harms have been reported by or about this citizen." />
          <RecordRows rows={snapshot.harmony.findings} empty="No findings of responsibility are present." />
          <RecordRows rows={snapshot.harmony.restoration} empty="No restoration requirements are present." />
        </article>
      </div>}

      {activeTab === "CCB" && <div className="portal-single-panel">
        <span className="eyebrow">Community Contribution Bank</span><h2>{displayNumber(snapshot.ccu.balance)} CCU</h2>
        <p>CCU is recorded as civic value flow: Earned, Allocated, Pooled, Donated, Returned, or Adjusted. It is not debt, debit, or creditworthiness.</p>
        <div className="value-flow-table" role="table" aria-label="Common Credit value flow">
          {(snapshot.ccu.flows.length ? snapshot.ccu.flows : snapshot.ccu.transactions).map((flow, index) => {
            const item = flow as Record<string, unknown>;
            return <div role="row" key={String(item.flowId || item.transactionId || index)}>
              <strong>{String(item.type || "Earned")}</strong>
              <span>{displayNumber(Number(item.amount || 0))} CCU</span>
              <span>{String(item.purpose || item.description || "Civic value flow")}</span>
              <small>Balance {displayNumber(Number(item.balanceAfter || 0))} CCU</small>
            </div>;
          })}
          {!snapshot.ccu.flows.length && !snapshot.ccu.transactions.length && <p>No Common Credit value flow has been recorded.</p>}
        </div>
      </div>}

      {activeTab === "Learning" && <div className="portal-operational-grid learning-tab">
        <article>
          <span className="eyebrow">Automated Assessment</span><h2>Evidence, Ten Qs, and lifelong direction</h2>
          <div className="ai-fuel" data-available={learningAutomationEnabled}>
            <div>
              <strong>Portal AI allowance</strong>
              <span>{displayNumber(snapshot.aiAllowance.used)} of {displayNumber(snapshot.aiAllowance.protectiveLimit)} protective units used</span>
            </div>
            <div
              className="ai-fuel-track"
              role="progressbar"
              aria-label="Estimated portal AI allowance used"
              aria-valuemin={0}
              aria-valuemax={snapshot.aiAllowance.protectiveLimit}
              aria-valuenow={Math.min(snapshot.aiAllowance.used, snapshot.aiAllowance.protectiveLimit)}
            >
              <span style={{ width: `${snapshot.aiAllowance.percentUsed}%` }} />
            </div>
            <small>
              {displayNumber(snapshot.aiAllowance.protectiveRemaining)} protected units remain · resets daily at 00:00 UTC.
              {" "}{snapshot.aiAllowance.scopeNote}
            </small>
          </div>
          <RecordUpload domain="learning" busy={busy} onUpload={uploadRecord} />
          <LearningDocumentRegister
            documents={snapshot.learning.documents}
            observations={snapshot.learning.observations}
            contracts={learningContracts}
            busy={busy}
            exportDocument={exportDocument}
            run={run}
            selected={selectedDocuments}
            setSelected={setSelectedDocuments}
            maxSelected={3}
            onPrepareOcr={prepareOcrReview}
            onOpenContract={setContractDocumentId}
            onOpenDetails={setDetailsDocumentId}
          />
          {contractDocument && <PortalModal
            title={`Evidence contract · ${contractDocument.original_name}`}
            description="Define or revise what this document may contribute to the Learning record."
            onClose={() => setContractDocumentId("")}
          >
            <LearningContractWorkbench
              documents={[contractDocument]}
              contracts={learningContracts}
              busy={busy}
              run={run}
              onSaved={() => setContractDocumentId("")}
            />
          </PortalModal>}
          {detailsDocument && <PortalModal
            title={`Evidence details · ${detailsDocument.original_name}`}
            description="Document-specific scoring, provenance, integrity, and civic recourse."
            onClose={() => setDetailsDocumentId("")}
            wide
          >
            <LearningDocumentDetails
              document={detailsDocument}
              observations={snapshot.learning.observations}
              evaluations={snapshot.learning.evaluations}
              recommendations={snapshot.learning.recommendations}
              contracts={snapshot.learning.evidenceContracts}
              challenges={snapshot.learning.challenges}
              busy={busy}
              run={run}
            />
          </PortalModal>}
          {(ocrProgress || ocrDraft) && <section className="ocr-review" aria-live="polite">
            <header>
              <div>
                <span className="eyebrow">Private browser OCR</span>
                <h3>{ocrDraft ? `Review ${ocrDraft.source.original_name}` : ocrProgress?.message}</h3>
              </div>
              {ocrDraft && <button type="button" disabled={Boolean(busy)} onClick={() => {
                setOcrDraft(null);
                setOcrProgress(null);
                setOcrReviewed(false);
                if (ocrSourceUrl.current) {
                  URL.revokeObjectURL(ocrSourceUrl.current);
                  ocrSourceUrl.current = "";
                }
              }}>Discard draft</button>}
            </header>
            {ocrProgress && <div
              className="ocr-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={ocrProgress.percent}
            >
              <span style={{ width: `${ocrProgress.percent}%` }} />
              <small>{ocrProgress.message} {ocrProgress.percent}%</small>
            </div>}
            {ocrDraft && <>
              <div className="ocr-confidence">
                <strong>{ocrDraft.pageCount} page{ocrDraft.pageCount === 1 ? "" : "s"} · {ocrDraft.confidence.toFixed(1)}% average machine confidence</strong>
                <span>Confidence is not accuracy. Correct names, dates, headings, grades, scores, and symbols against the original scan.</span>
                <span>For report-card tables, verify every grade against both its subject row and quarter column; OCR may read a letter correctly while losing the cell it belongs to.</span>
              </div>
              <div className="ocr-review-grid">
                <div className="ocr-source-preview">
                  <span>Authoritative original</span>
                  {ocrDraft.source.media_type === "application/pdf"
                    ? <div className="ocr-pdf-pages">
                      {ocrDraft.pages.map((page) => page.previewDataUrl && <figure key={page.page}>
                        <figcaption>Original page {page.page}</figcaption>
                        <img src={page.previewDataUrl} alt={`Original page ${page.page} of ${ocrDraft.source.original_name}`} />
                      </figure>)}
                      <a href={ocrDraft.sourceUrl} target="_blank" rel="noreferrer">Open the encrypted source copy in a new tab</a>
                    </div>
                    : <img src={ocrDraft.sourceUrl} alt={`Original scan: ${ocrDraft.source.original_name}`} />}
                </div>
                <label>Citizen-reviewed transcript
                  <textarea
                    value={ocrDraft.text}
                    onChange={(event) => setOcrDraft((current) => current
                      ? { ...current, text: event.target.value }
                      : current)}
                    spellCheck
                  />
                </label>
              </div>
              <details>
                <summary>Page-by-page OCR confidence</summary>
                <ol>{ocrDraft.pages.map((page) => <li key={page.page}>
                  <span>Page {page.page}</span><strong>{page.confidence.toFixed(1)}%</strong>
                </li>)}</ol>
              </details>
              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={ocrReviewed}
                  onChange={(event) => setOcrReviewed(event.target.checked)}
                />
                I compared this transcript with the original scan and corrected material OCR errors.
              </label>
              <button type="button" disabled={!ocrReviewed || Boolean(busy)} onClick={() => void saveReviewedOcrTranscript()}>
                {busy === "ocr-save" ? "Encrypting reviewed transcript…" : "Retain reviewed transcript"}
              </button>
              <p className="privacy-note">OCR runs sequentially in this browser and consumes no Cloudflare AI allowance. The raw machine draft is not uploaded. Only the text you review and retain becomes derived Learning evidence; the original encrypted scan remains linked and authoritative.</p>
            </>}
          </section>}
          <p className="privacy-note">Choose one to three documents per interpretation. Every accepted result adds evidence to the longitudinal profile; later documents refine the synthesis without erasing earlier sources.</p>
          <label>Current learning goal<textarea value={learningGoal} onChange={(event) => setLearningGoal(event.target.value)} placeholder="What would you like to strengthen, explore, or learn next?" /></label>
          <div className="learning-actions">
            <button type="button" disabled={!learningGoal.trim() || Boolean(busy)} onClick={() => void run(
              "learning-goal",
              () => createLearningGoal(learningGoal),
              "Learning goal saved to the private civic record.",
            )}>Save goal</button>
            <label className="consent-check"><input type="checkbox" disabled={!learningAutomationEnabled} checked={learningConsent} onChange={(event) => setLearningConsent(event.target.checked)} />I consent to sending only the selected documents to Cloudflare Workers AI for this evidence-bound assessment.</label>
            <button type="button" disabled={!learningAutomationEnabled || !learningConsent || !selectedDocuments.length || Boolean(busy) || Boolean(missingLearningContracts.length)} onClick={() => void run(
              "learning-assessment",
              () => requestLearningAssessment({
                documentIds: selectedDocuments,
                goalText: learningGoal,
                consent: true,
              }),
              (result) => {
                const admitted = (result.observations || []).filter((item) => item.admissionStatus === "admitted").length;
                const scoredDomains = (result.qScores || []).length;
                if (result.status === "completed" && admitted > 0 && scoredDomains > 0) {
                  return `Assessment completed. ${admitted} source-bound observation${admitted === 1 ? " was" : "s were"} admitted across ${scoredDomains} score-bearing Q domain${scoredDomains === 1 ? "" : "s"}; the cumulative profile was updated.`;
                }
                return "Interpretation completed, but no score-bearing evidence was admitted. Open Details beside the selected document to review its evaluation and recourse record; the cumulative profile was not changed.";
              },
            )}>{busy === "learning-assessment" ? "Assessing…" : "Run Automated Assessment"}</button>
          </div>
          {selectedDocuments.length > 0 && missingLearningContracts.length > 0 && <div className="simulation-notice" role="status">
            <strong>Evidence contract required</strong>
            <p>Classify and authorize {missingLearningContracts.map((document) => document.original_name).join(", ")} before interpretation. Selection alone never grants Learning permission to infer from a document.</p>
          </div>}
          {!learningAutomationEnabled && <div className="simulation-notice" role="status">
            <strong>Automated interpretation is paused</strong>
            <p>Encrypted evidence upload, private retrieval, deletion, and Learning goals remain available. The shared protective allowance is unavailable or too low for another assessment; no existing citizen record is altered.</p>
          </div>}
          <p className="privacy-note">Learning interprets standardized tests, education, work, authored material, and observed performance into the Society&apos;s Ten-Q framework. Diagnosis, hardship, disability, health, and legal history cannot lower a Q or determine civic rights.</p>
        </article>
        <article>
          <span className="eyebrow">Ten Q profile</span><h2>Capacity is plural.</h2>
          <div className="learning-channel-switcher" role="group" aria-label="Ten-Q evidence channel">
            {Object.entries(LEARNING_CHANNEL_LABELS).map(([key, label]) => <button
              key={key}
              type="button"
              className={learningChannelView === key ? "is-active" : ""}
              aria-pressed={learningChannelView === key}
              onClick={() => setLearningChannelView(key as LearningChannelView)}
            >{label}</button>)}
          </div>
          <div className="ten-q-grid">
            {Object.entries(Q_LABELS).map(([key, label]) => {
              const combinedScore = profileScores.get(key);
              const score = learningChannelView === "combined"
                ? combinedScore
                : combinedScore?.channelScores?.[learningChannelView];
              const isDomainLimited = score?.status === "domain_limited";
              return <div key={key}>
                <span>{label}</span>
                <strong>{isDomainLimited
                  ? "Broad Q Pending"
                  : score?.score !== null && score?.score !== undefined
                    ? `${score.score}/100`
                    : "Pending"}</strong>
                {isDomainLimited && score?.score !== null && score?.score !== undefined
                  && <small>{score.domainLabel || "Domain-limited observation"}: {score.score}/100 provisional observation</small>}
                <small>{score?.score !== null && score?.score !== undefined
                  ? `${score.rangeLow}-${score.rangeHigh} evidence range · ${score.confidenceLabel} evidence confidence · ${score.evidenceCount} source observation${score.evidenceCount === 1 ? "" : "s"}`
                  : "Awaiting relevant consented evidence"}</small>
                {score && (score.reportedStandardScore !== null || score.reportedPercentile !== null)
                  && <small>Source measure: standard score {score.reportedStandardScore ?? "not captured"} · reported percentile {score.reportedPercentile ?? "not captured"}</small>}
                {score && <p>{score.summary}</p>}
                {score?.confidenceExplanation && <p>{score.confidenceExplanation}</p>}
                {score?.normalizedEstimateMethod && <p><strong>Method:</strong> {score.normalizedEstimateMethod}</p>}
              </div>;
            })}
          </div>
          <p className="learning-evidence-rule">Source scores, reported percentiles, and provisional Ten-Q estimates remain separate and auditable. Scores synthesize all accepted observations. Adult and standardized evidence carries greater weight; childhood records provide longitudinal context and cannot erase stronger adult evidence. Disagreement widens the displayed range and lowers confidence rather than silently overwriting a result.</p>
          <LearningCourseSuggestions recommendations={snapshot.learning.recommendations} />
          {snapshot.localSimulation && <section className="learning-test-controls" aria-labelledby="learning-reset-title">
            <span className="eyebrow">Local testing control</span>
            <h3 id="learning-reset-title">Reset the derived Learning profile</h3>
            <p>This removes evaluations, observations, synthesized Ten-Q scores, recommendations, challenges, and profile versions. Encrypted source documents, reviewed OCR transcripts, evidence contracts, and Learning goals remain intact.</p>
            <button
              className="destructive-control"
              type="button"
              disabled={Boolean(busy)}
              onClick={() => {
                const confirmed = window.confirm(
                  "Reset every derived Learning result for this local citizen? Source documents, reviewed OCR, evidence contracts, and goals will be retained.",
                );
                if (!confirmed) return;
                void run(
                  "learning-reset",
                  resetLearningProfile,
                  "The derived Learning profile was reset. Retained evidence is ready for another test.",
                ).then(() => {
                  setSelectedDocuments([]);
                  setLearningConsent(false);
                });
              }}
            >
              {busy === "learning-reset" ? "Resetting…" : "Reset Learning Profile"}
            </button>
          </section>}
        </article>
      </div>}

      {activeTab === "Balance" && <div className="portal-single-panel balance-dashboard">
        <span className="eyebrow">Circle of Balance · civic instrument panel</span><h2>One live population. An illustrative capacity model.</h2>
        {snapshot.balance.scenario ? (() => {
          const scenario = snapshot.balance.scenario;
          const population = snapshot.balance.livePopulation;
          const capacity = Number(scenario.sustainable_population_capacity || 0);
          const utilization = capacity ? population / capacity : 0;
          return <>
            <div className="simulation-notice" role="note">
              <strong>Evidence boundary</strong>
              <p>The active Citizen Register supplies the population count. Capacity, resources, reserves, histories, constraints, and trajectories are simulated planning values.</p>
            </div>
            <section className="balance-overview" aria-label="Live population compared with simulated sustainable capacity">
              <div><span>Live population</span><strong>{displayNumber(population)}</strong><small>Active Citizen Register</small></div>
              <div><span>Simulated sustainable capacity</span><strong>{displayNumber(capacity)}</strong><small>{scenario.label}</small></div>
              <div><span>Scenario utilization</span><strong>{displayPercent(utilization)}</strong><small>{displayNumber(population)} live / {displayNumber(capacity)} simulated</small></div>
              <div><span>Operational buffer</span><strong>{displayNumber(scenario.operational_buffer_percent)}%</strong><small>Planning margin</small></div>
            </section>
            <div className="balance-master-gauge">
              <header><strong>Population against the binding simulated capacity</strong><span>{displayNumber(population)} / {displayNumber(capacity)}</span></header>
              <div className="capacity-track" role="progressbar" aria-label="Live population against simulated sustainable population capacity" aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={population}>
                <i style={{ width: `${Math.min(100, utilization * 100)}%` }} />
              </div>
              <p>CEI target {scenario.civic_equilibrium_target.toFixed(2)} · equilibrium range {scenario.civic_equilibrium_lower.toFixed(2)}–{scenario.civic_equilibrium_upper.toFixed(2)}. SEP responses are advisory balancing cascades, never quotas or compulsory assignments.</p>
            </div>
            <div className="balance-resource-grid">
              {snapshot.balance.resources.map((resource) => {
                const resourceCapacity = Number(resource.capacity_population || 0);
                const resourceUse = resourceCapacity ? population / resourceCapacity : 0;
                const historyMaximum = Math.max(...resource.history, 1);
                return <article key={resource.metric_id} data-status={resource.status}>
                  <header><span>{resource.domain_key}</span><b>{resource.status}</b></header>
                  <h3>{resource.label}</h3>
                  <div className="resource-reading"><strong>{displayNumber(population)}</strong><span>live citizens</span><em>/</em><strong>{displayNumber(resourceCapacity)}</strong><span>simulated capacity</span></div>
                  <div className="capacity-track" role="progressbar" aria-label={`${resource.label}: live population against simulated capacity`} aria-valuemin={0} aria-valuemax={resourceCapacity} aria-valuenow={population}>
                    <i style={{ width: `${Math.min(100, resourceUse * 100)}%` }} />
                  </div>
                  <div className="resource-history" aria-label={`${resource.label} simulated six-period history`}>
                    {resource.history.map((point, index) => <i key={`${resource.metric_id}-${index}`} style={{ height: `${Math.max(8, point / historyMaximum * 100)}%` }} title={`Simulated period ${index + 1}: ${point}`} />)}
                  </div>
                  <dl>
                    <div><dt>Reserve</dt><dd>{resource.reserve_text}</dd></div>
                    <div><dt>Trend</dt><dd>{resource.trend_direction}</dd></div>
                    <div><dt>Constraint</dt><dd>{resource.constraint_text}</dd></div>
                  </dl>
                  <p>{resource.capacity_basis}</p><small>{resource.methodology}</small>
                </article>;
              })}
            </div>
            <p className="method-source">Scenario method: {scenario.basis_document}. {scenario.scenario_note}</p>
          </>;
        })() : <p>No Balance simulation scenario is present.</p>}
      </div>}

      {activeTab === "FTB" && <div className="portal-single-panel ftb-dashboard">
        <span className="eyebrow">Foreign Trade Bank · boundary simulation</span><h2>How an internal civic economy could meet an external monetary world.</h2>
        {snapshot.ftb ? <>
          <div className="simulation-notice" role="note">
            <strong>No real funds or trade</strong>
            <p>Every reserve, import, export, price, risk, and CCU adjustment below is illustrative. The dashboard exercises FTB policy without claiming assets or market activity that do not exist.</p>
          </div>
          <dl className="ftb-summary">
            <div><dt>Reference currency</dt><dd>{snapshot.ftb.fiat_currency}</dd></div>
            <div><dt>Illustrative holdings</dt><dd>{displayMoney(snapshot.ftb.fiat_holdings_minor, snapshot.ftb.fiat_currency)}</dd></div>
            <div><dt>Scenario date</dt><dd>{snapshot.ftb.measured_at.slice(0, 10)}</dd></div>
          </dl>
          <div className="ftb-metric-grid">
            {snapshot.ftb.metrics.map((metric) => <article key={metric.metric_id} data-status={metric.risk_status}>
              <header><span>{metric.metric_key}</span><b>{metric.risk_status}</b></header>
              <h3>{metric.label}</h3><strong>{metric.value_text}</strong><p>{metric.trend_text}</p><small>{metric.methodology}</small>
            </article>)}
          </div>
          <div className="ftb-adjustment-table" role="table" aria-label="Illustrative Foreign Trade Bank product adjustments">
            <header role="row"><span>Illustrative good</span><span>External + transport</span><span>FTB adjustment</span><span>Final CCU</span><span>Internal alternative and reason</span></header>
            {snapshot.ftb.adjustments.map((adjustment) => <div role="row" key={adjustment.adjustment_id}>
              <strong>{adjustment.product_label}<small>{adjustment.category}</small></strong>
              <span>{displayMoney(adjustment.external_price_minor + adjustment.shipping_cost_minor, snapshot.ftb!.fiat_currency)}</span>
              <span>{adjustment.adjustment_percent > 0 ? "+" : ""}{adjustment.adjustment_percent}%</span>
              <span>{displayNumber(adjustment.final_ccu)} CCU</span>
              <p><b>{adjustment.internal_alternative}</b>{adjustment.reason}</p>
            </div>)}
          </div>
          <p className="method-source">{snapshot.ftb.methodology} One illustrative CCU is shown at parity with one reference-currency unit solely to make the simulation legible.</p>
        </> : <p>No FTB simulation snapshot is present.</p>}
      </div>}

      {activeTab === "USU" && <div className="portal-single-panel">
        <span className="eyebrow">Utopian Society University</span><h2>Available lifelong-learning paths</h2>
        <div className="course-grid">{snapshot.usu.courses.map((course, index) => {
          const courseId = value(course, "course_id");
          const enrollment = snapshot.usu.enrollments.find((item) => item.course_id === courseId);
          return <article key={courseId || index}>
            <span>{value(course, "code")} · {value(course, "tier_key")}</span>
            <h3>{value(course, "title")}</h3>
            <p>{value(course, "description")}</p>
            <small>{value(course, "contribution_relevance")}</small>
            <button disabled={Boolean(busy)} onClick={() => void run(
              `enroll-${courseId}`,
              () => requestUsuEnrollment(courseId),
              "The enrollment request has been evaluated against the recorded prerequisites.",
            )}>{enrollment ? `Status: ${value(enrollment, "status")}` : "Request enrollment"}</button>
          </article>;
        })}</div>
      </div>}

      {activeTab === "Certificate" && <CertificateTab snapshot={snapshot} />}
    </section>

    <section className="citizen-ledger-trace" aria-labelledby="citizen-ledger-title">
      <header><div><span className="eyebrow">Recent civic trace</span><h2 id="citizen-ledger-title">Account and public record remain reconcilable.</h2></div><Link href="/transparency-ledger">Open the full Transparency Ledger →</Link></header>
      {snapshot.ledger.length ? <ol>{snapshot.ledger.map((entry) => <li key={entry.id}><b>{String(entry.sequence).padStart(3, "0")}</b><div><strong>{entry.title}</strong><p>{entry.summary}</p><small>{entry.utopianDate} · {entry.actorName}</small></div></li>)}</ol> : <p className="empty-ledger">No citizen-specific public trace exists. Private records never enter the public ledger merely because they were uploaded.</p>}
    </section>
  </>;
}

const CROPPED_AVATAR_SIZE = 512;
const PORTRAIT_GENERATOR_INPUT_SIZE = 496;

type CropImageSize = { width: number; height: number };
type CropOffset = { x: number; y: number };

function cropGeometry(image: CropImageSize, cropSize: number, zoom: number) {
  const baseScale = Math.max(cropSize / image.width, cropSize / image.height);
  const scale = baseScale * zoom;
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    width,
    height,
    maxX: Math.abs(width - cropSize) / 2,
    maxY: Math.abs(height - cropSize) / 2,
  };
}

function clampCropOffset(offset: CropOffset, geometry: ReturnType<typeof cropGeometry>): CropOffset {
  return {
    x: Math.max(-geometry.maxX, Math.min(geometry.maxX, offset.x)),
    y: Math.max(-geometry.maxY, Math.min(geometry.maxY, offset.y)),
  };
}

function loadCropImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That image could not be opened. Choose another JPG, PNG, or WebP file."));
    image.src = source;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function drawCroppedAvatar(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  imageSize: CropImageSize,
  cropSize: number,
  zoom: number,
  offset: CropOffset,
  outputSize: number,
) {
  const geometry = cropGeometry(imageSize, cropSize, zoom);
  const outputScale = outputSize / cropSize;
  context.fillStyle = "#061d18";
  context.fillRect(0, 0, outputSize, outputSize);
  context.drawImage(
    image,
    ((cropSize - geometry.width) / 2 + offset.x) * outputScale,
    ((cropSize - geometry.height) / 2 + offset.y) * outputScale,
    geometry.width * outputScale,
    geometry.height * outputScale,
  );
}

function ProfilePhotoSettings({
  civicName,
  avatarUrl,
  aiAllowance,
  onSaved,
}: {
  civicName: string;
  avatarUrl: string;
  aiAllowance: CivicPortalSnapshot["aiAllowance"];
  onSaved: () => Promise<void>;
}) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceSize, setSourceSize] = useState<CropImageSize>({ width: 1, height: 1 });
  const [cropSize, setCropSize] = useState(320);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [generatedPortraitUrl, setGeneratedPortraitUrl] = useState("");
  const [generatedPortrait, setGeneratedPortrait] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);
  const cropStage = useRef<HTMLDivElement | null>(null);
  const cropImage = useRef<HTMLImageElement | null>(null);
  const sourceUrlRef = useRef("");
  const generatedPortraitUrlRef = useRef("");
  const drag = useRef<{ pointerId: number; x: number; y: number; offset: CropOffset } | null>(null);
  const geometry = cropGeometry(sourceSize, cropSize, zoom);
  const initials = civicName.split(/\s+/).map((part) => part[0]).slice(0, 3).join("");
  const portraitAllowanceAvailable = aiAllowance.configured && aiAllowance.portraitAvailable;
  const portraitAllowanceMessage = !aiAllowance.configured
    ? "The Cloudflare portrait generator is temporarily unavailable."
    : portraitAllowanceAvailable
      ? `A portrait uses approximately ${displayNumber(aiAllowance.portraitEstimate)} of the shared daily protective units.`
      : "The shared 9,000-unit protective AI allowance cannot cover another portrait today. Try again after 00:00 UTC.";

  const discardGeneratedPortrait = useCallback(() => {
    if (generatedPortraitUrlRef.current) URL.revokeObjectURL(generatedPortraitUrlRef.current);
    generatedPortraitUrlRef.current = "";
    setGeneratedPortraitUrl("");
    setGeneratedPortrait(null);
  }, []);

  function discardSource() {
    discardGeneratedPortrait();
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = "";
    setSourceUrl("");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    cropImage.current = null;
    drag.current = null;
  }

  useEffect(() => () => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (generatedPortraitUrlRef.current) URL.revokeObjectURL(generatedPortraitUrlRef.current);
  }, []);

  useEffect(() => {
    if (!sourceUrl || !cropStage.current) return;
    const stage = cropStage.current;
    const measure = () => setCropSize(Math.max(1, stage.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [sourceUrl]);

  useEffect(() => {
    setOffset((current) => clampCropOffset(current, cropGeometry(sourceSize, cropSize, zoom)));
  }, [sourceSize, cropSize, zoom]);

  useEffect(() => {
    if (generatedPortraitUrlRef.current) discardGeneratedPortrait();
  }, [sourceUrl, zoom, offset.x, offset.y, discardGeneratedPortrait]);

  async function openCropSource(nextUrl: string) {
    const image = await loadCropImage(nextUrl);
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = nextUrl;
    setSourceSize({ width: image.naturalWidth, height: image.naturalHeight });
    cropImage.current = image;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSourceUrl(nextUrl);
  }

  async function chooseSource(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("Choose a valid JPG, PNG, or WebP image no larger than 10 MB.");
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    try {
      await openCropSource(nextUrl);
    } catch (cause) {
      if (sourceUrlRef.current !== nextUrl) URL.revokeObjectURL(nextUrl);
      setError(cause instanceof Error ? cause.message : "That image could not be opened.");
    }
  }

  async function reframeCurrentPhoto() {
    if (!avatarUrl) return;
    setBusy(true);
    setMessage("");
    setError("");
    let nextUrl = "";
    try {
      const response = await fetch(avatarUrl);
      if (!response.ok) throw new Error("The current profile photo could not be opened for reframing.");
      nextUrl = URL.createObjectURL(await response.blob());
      await openCropSource(nextUrl);
    } catch (cause) {
      if (nextUrl && sourceUrlRef.current !== nextUrl) URL.revokeObjectURL(nextUrl);
      setError(cause instanceof Error ? cause.message : "The current profile photo could not be opened for reframing.");
    } finally {
      setBusy(false);
    }
  }

  function moveCrop(event: React.PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    setOffset(clampCropOffset({
      x: current.offset.x + event.clientX - current.x,
      y: current.offset.y + event.clientY - current.y,
    }, geometry));
  }

  function endCropMove(event: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
  }

  async function croppedPhotoBlob(outputSize = CROPPED_AVATAR_SIZE) {
    if (!sourceUrl) throw new Error("Choose a profile photograph before continuing.");
    const image = cropImage.current || await loadCropImage(sourceUrl);
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the cropped profile photo.");
    drawCroppedAvatar(context, image, sourceSize, cropSize, zoom, offset, outputSize);
    const blob = await canvasBlob(canvas, "image/webp", 0.92) || await canvasBlob(canvas, "image/png");
    if (!blob) throw new Error("This browser could not create the cropped profile photo.");
    return blob;
  }

  async function generateRenaissancePortrait() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (!portraitAllowanceAvailable) throw new Error(portraitAllowanceMessage);
      const crop = await croppedPhotoBlob(PORTRAIT_GENERATOR_INPUT_SIZE);
      const cropExtension = crop.type === "image/webp" ? "webp" : "png";
      const generated = await generateProfilePortrait(new File([crop], `cropped-profile-photo.${cropExtension}`, {
        type: crop.type,
        lastModified: Date.now(),
      }));
      discardGeneratedPortrait();
      const previewUrl = URL.createObjectURL(generated);
      generatedPortraitUrlRef.current = previewUrl;
      setGeneratedPortraitUrl(previewUrl);
      setGeneratedPortrait(generated);
      setMessage("The generated portrait is ready for your approval. Your public profile has not changed.");
      try {
        await onSaved();
      } catch {
        // The portrait is still usable; the allowance display will reconcile on the next portal refresh.
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Renaissance portrait could not be generated.");
      try {
        await onSaved();
      } catch {
        // Preserve the generator error when the portal snapshot cannot also be refreshed.
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveCrop() {
    if (!sourceUrl) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const blob = await croppedPhotoBlob();
      const extension = blob.type === "image/webp" ? "webp" : "png";
      await uploadProfileAvatar(new File([blob], `civic-profile-photo.${extension}`, {
        type: blob.type,
        lastModified: Date.now(),
      }));
      await onSaved();
      discardSource();
      setMessage("The cropped profile photo is saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The cropped profile photo could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function saveGeneratedPortrait() {
    if (!generatedPortrait) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await uploadProfileAvatar(new File([generatedPortrait], "civic-renaissance-portrait.png", {
        type: generatedPortrait.type || "image/png",
        lastModified: Date.now(),
      }));
      await onSaved();
      discardSource();
      setMessage("The approved Renaissance portrait is now your profile photo.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The generated portrait could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await deleteProfileAvatar();
      await onSaved();
      setMessage("The profile photo has been removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The profile photo could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="profile-photo-settings" aria-labelledby="profile-photo-settings-title">
    <header>
      <div>
        <span className="eyebrow">Profile photograph</span>
        <h3 id="profile-photo-settings-title">Choose the framing the public will see</h3>
      </div>
      <p>The source image stays in this browser while you frame it. Only the finished 512 × 512 crop is uploaded—or sent for generation if you explicitly request it.</p>
    </header>
    <input
      ref={fileInput}
      className="profile-photo-file sr-only"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      aria-label="Choose a profile photo to crop"
      onChange={(event) => void chooseSource(event)}
    />
    {sourceUrl ? <div className="profile-photo-crop-workspace">
      <div
        ref={cropStage}
        className="profile-photo-crop-stage"
        role="img"
        aria-label="Profile photo crop preview. Drag the image to position it inside the circular frame."
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offset };
        }}
        onPointerMove={moveCrop}
        onPointerUp={endCropMove}
        onPointerCancel={endCropMove}
      >
        {/* The selected source is local-only and exists solely inside this authenticated crop tool. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sourceUrl}
          alt=""
          draggable={false}
          style={{
            width: `${geometry.width}px`,
            height: `${geometry.height}px`,
            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
            opacity: generatedPortraitUrl ? 0 : 1,
          }}
        />
        {/* Object URLs produced inside this private tool cannot use Next's remote image loader. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {generatedPortraitUrl && <img className="profile-photo-generated-preview" src={generatedPortraitUrl} alt="Generated Renaissance portrait preview" draggable={false} />}
        <i className="profile-photo-crop-mask" aria-hidden="true" />
      </div>
      <div className="profile-photo-crop-controls">
        <p>{generatedPortraitUrl ? "Review the generated portrait. It is not public until you approve it." : "Drag the portrait directly, or use the controls for precise framing."}</p>
        <label>Zoom <small>{Math.round(zoom * 100)}%</small>
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <div className="profile-photo-generation-disclosure">
          <strong>Renaissance portrait generator</strong>
          <p>With your explicit request, only a 496 × 496 finished crop is sent to Cloudflare Workers AI to create a colored-pencil portrait on warm vellum. It uses approximately {displayNumber(aiAllowance.portraitEstimate)} units from the same protected daily allowance as Learning.</p>
          <small id="portrait-allowance-help">{portraitAllowanceMessage}</small>
        </div>
        <label>Horizontal position
          <input
            type="range"
            min={-geometry.maxX}
            max={geometry.maxX}
            step="1"
            value={offset.x}
            disabled={geometry.maxX === 0}
            onChange={(event) => setOffset((current) => ({ ...current, x: Number(event.target.value) }))}
          />
        </label>
        <label>Vertical position
          <input
            type="range"
            min={-geometry.maxY}
            max={geometry.maxY}
            step="1"
            value={offset.y}
            disabled={geometry.maxY === 0}
            onChange={(event) => setOffset((current) => ({ ...current, y: Number(event.target.value) }))}
          />
        </label>
        <div className="profile-photo-actions">
          {generatedPortrait ? <>
            <button type="button" disabled={busy} onClick={() => void saveGeneratedPortrait()}>{busy ? "Saving…" : "Use generated portrait"}</button>
            <span
              className="profile-photo-generation-control"
              data-tooltip={!portraitAllowanceAvailable ? portraitAllowanceMessage : undefined}
              title={portraitAllowanceMessage}
              tabIndex={!portraitAllowanceAvailable ? 0 : undefined}
            >
              <button
                className={`profile-photo-generate${portraitAllowanceAvailable ? "" : " is-allowance-exhausted"}`}
                type="button"
                disabled={busy || !portraitAllowanceAvailable}
                aria-describedby="portrait-allowance-help"
                onClick={() => void generateRenaissancePortrait()}
              >{busy ? "Generating…" : portraitAllowanceAvailable ? "Generate another" : "Try again after daily reset"}</button>
            </span>
            <button type="button" disabled={busy} onClick={() => void saveCrop()}>{busy ? "Saving…" : "Use original photograph"}</button>
          </> : <>
            <button type="button" disabled={busy} onClick={() => void saveCrop()}>{busy ? "Saving…" : "Save cropped photo"}</button>
            <span
              className="profile-photo-generation-control"
              data-tooltip={!portraitAllowanceAvailable ? portraitAllowanceMessage : undefined}
              title={portraitAllowanceMessage}
              tabIndex={!portraitAllowanceAvailable ? 0 : undefined}
            >
              <button
                className={`profile-photo-generate${portraitAllowanceAvailable ? "" : " is-allowance-exhausted"}`}
                type="button"
                disabled={busy || !portraitAllowanceAvailable}
                aria-describedby="portrait-allowance-help"
                onClick={() => void generateRenaissancePortrait()}
              >{busy ? "Generating…" : portraitAllowanceAvailable ? "Generate Renaissance portrait" : "Try again after daily reset"}</button>
            </span>
          </>}
          <button type="button" disabled={busy} onClick={discardSource}>Cancel crop</button>
          <button type="button" disabled={busy} onClick={() => fileInput.current?.click()}>Choose another image</button>
        </div>
      </div>
    </div> : <div className="profile-photo-current">
      <div
        className={`profile-photo-current-avatar${avatarUrl ? " has-image" : ""}`}
        style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
        aria-label={avatarUrl ? `${civicName}'s current profile photo` : "No profile photo selected"}
      >
        {!avatarUrl && <span>{initials}</span>}
      </div>
      <div>
        <strong>{avatarUrl ? "Current profile photo" : "No profile photo selected"}</strong>
        <p>Choose a JPG, PNG, or WebP image up to 10 MB, then position and zoom it before saving.</p>
        <div className="profile-photo-actions">
          {avatarUrl && <button type="button" disabled={busy} onClick={() => void reframeCurrentPhoto()}>{busy ? "Opening…" : "Reframe current photo"}</button>}
          <button type="button" disabled={busy} onClick={() => fileInput.current?.click()}>{avatarUrl ? "Choose new photo" : "Choose a photo"}</button>
          {avatarUrl && <button className="profile-photo-remove" type="button" disabled={busy} onClick={() => void removePhoto()}>{busy ? "Removing…" : "Remove photo"}</button>}
        </div>
      </div>
    </div>}
    {error && <div className="portal-message is-error" role="alert">{error}</div>}
    {message && <div className="portal-message is-success" role="status">{message}</div>}
  </section>;
}

function PublicProfileSettings({
  civicName,
  civicTitle,
  publicBio,
  profileVisibility,
  avatarUrl,
  aiAllowance,
  onSaved,
}: {
  civicName: string;
  civicTitle: string;
  publicBio: string;
  profileVisibility: string;
  avatarUrl: string;
  aiAllowance: CivicPortalSnapshot["aiAllowance"];
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(civicTitle);
  const [bio, setBio] = useState(publicBio);
  const [visibility, setVisibility] = useState<"private" | "civic" | "public">(
    ["private", "civic", "public"].includes(profileVisibility)
      ? profileVisibility as "private" | "civic" | "public"
      : "private",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await savePublicProfilePresentation({
        civicTitle: title,
        publicBio: bio,
        profileVisibility: visibility,
      });
      await onSaved();
      setMessage("Public profile presentation saved.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "The public profile could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="public-profile-settings" aria-labelledby="public-profile-settings-title">
    <header>
      <div>
        <span className="eyebrow">Citizen-authored public presentation</span>
        <h2 id="public-profile-settings-title">Shape what the public learns about you</h2>
      </div>
    </header>
    <ProfilePhotoSettings civicName={civicName} avatarUrl={avatarUrl} aiAllowance={aiAllowance} onSaved={onSaved} />
    <form onSubmit={save}>
      <label>Public role or title
        <input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>About
        <textarea
          value={bio}
          maxLength={3500}
          rows={7}
          placeholder="Tell visitors who you are, what you care about, and how you participate in the Society."
          onChange={(event) => setBio(event.target.value)}
        />
        <small>{bio.length}/3,500 characters, including spaces · written and approved by you</small>
      </label>
      <label>Profile visibility
        <select value={visibility} onChange={(event) => setVisibility(event.target.value as "private" | "civic" | "public")}>
          <option value="private">Private — no public profile</option>
          <option value="civic">Civic — public civic identity</option>
          <option value="public">Public — broadly shareable profile</option>
        </select>
      </label>
      <p>Achievements and recognitions cannot be self-entered. They are published only from a relevant Circle’s accountable record.</p>
      {message && <output>{message}</output>}
      <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save public profile"}</button>
    </form>
  </section>;
}

function PrivateIdentitySettings({
  civicName,
  civicTitle,
  publicBio,
  profileVisibility,
  avatarUrl,
  aiAllowance,
  textSize,
  onTextSizeChange,
  onClose,
  onSaved,
}: {
  civicName: string;
  civicTitle: string;
  publicBio: string;
  profileVisibility: string;
  avatarUrl: string;
  aiAllowance: CivicPortalSnapshot["aiAllowance"];
  textSize: PortalTextSize;
  onTextSizeChange: (value: PortalTextSize) => void;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [identity, setIdentity] = useState<PrivateCivicIdentity | null>(null);
  const [legalName, setLegalName] = useState<StructuredName>(() => splitStructuredName(""));
  const [chosenName, setChosenName] = useState<StructuredName>(() => splitStructuredName(civicName));
  const [currentPassword, setCurrentPassword] = useState("");
  const [verifiedVariants, setVerifiedVariants] = useState<PrivateCivicIdentity["variants"]>([]);
  const [attested, setAttested] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getPrivateCivicIdentity().then((result) => {
      if (!active) return;
      setIdentity(result);
      setLegalName(splitStructuredName(result.legalName));
      setChosenName(splitStructuredName(result.chosenName || civicName));
      setVerifiedVariants(result.variants);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Private identity settings could not be opened.");
    }).finally(() => {
      if (active) setBusy(false);
    });
    return () => {
      active = false;
    };
  }, [civicName]);

  async function saveIdentity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await savePrivateCivicIdentity({
        legalName: joinStructuredName(legalName),
        chosenName: joinStructuredName(chosenName),
        currentPassword,
        variants: verifiedVariants.map((variant) => ({
          value: variant.value,
          kind: variant.kind,
          verificationNote: variant.verificationNote,
        })),
        attested: true,
      });
      setIdentity(result.identity);
      setCurrentPassword("");
      setAttested(false);
      setMessage(`${result.privacy} Identity version ${result.identity.identityVersion} is active.`);
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Private identity settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="private-identity-settings" aria-labelledby="private-identity-title">
    <header>
      <div>
        <span className="eyebrow">Private identity & public presentation</span>
        <h2 id="private-identity-title">Control what stays private and what the public sees</h2>
      </div>
      <button type="button" onClick={onClose}>Close</button>
    </header>
    <h3 className="private-identity-section-title">Encrypted identity</h3>
    <p>
      Learning compares extracted document text with these encrypted names locally. Routine punctuation,
      ordering, initials, and likely one-character OCR differences are handled automatically. The legal
      name never appears on the public profile, public ledger, analytics, or AI prompt. A mismatch creates
      a review question; it is not a finding of dishonesty.
    </p>
    {identity?.updatedAt && <small>
      Identity version {identity.identityVersion} · last changed {displayUtc(identity.updatedAt)}
    </small>}
    {error && <div className="portal-message is-error" role="alert">{error}</div>}
    {message && <div className="portal-message is-success" role="status">{message}</div>}
    {busy && !identity
      ? <p aria-live="polite">Opening encrypted identity settings…</p>
      : <form onSubmit={(event) => void saveIdentity(event)}>
        <div className="private-identity-core">
          <fieldset>
            <legend>Legal name · private</legend>
            <label>First
            <input
              value={legalName.first}
              onChange={(event) => setLegalName((current) => ({ ...current, first: event.target.value }))}
              autoComplete="given-name"
              maxLength={80}
              required
            />
            </label>
            <label>Middle
            <input
              value={legalName.middle}
              onChange={(event) => setLegalName((current) => ({ ...current, middle: event.target.value }))}
              autoComplete="additional-name"
              maxLength={80}
            />
            </label>
            <label>Last
              <input
                value={legalName.last}
                onChange={(event) => setLegalName((current) => ({ ...current, last: event.target.value }))}
                autoComplete="family-name"
                maxLength={80}
                required
              />
            </label>
            <small>Required for private matching of records issued outside the Society.</small>
          </fieldset>
          <fieldset>
            <legend>Chosen civic name · public</legend>
            <label>First
              <input
                value={chosenName.first}
                onChange={(event) => setChosenName((current) => ({ ...current, first: event.target.value }))}
                maxLength={80}
              />
            </label>
            <label>Middle
              <input
                value={chosenName.middle}
                onChange={(event) => setChosenName((current) => ({ ...current, middle: event.target.value }))}
                maxLength={80}
              />
            </label>
            <label>Last
              <input
                value={chosenName.last}
                onChange={(event) => setChosenName((current) => ({ ...current, last: event.target.value }))}
                maxLength={80}
              />
            </label>
            <small>This is the ordinary Society identity shown on the Civic Profile.</small>
          </fieldset>
        </div>
        <label className="private-identity-password">
          Current civic password
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            minLength={10}
            maxLength={128}
            required
          />
          <small>Reauthentication is required for every identity change.</small>
        </label>
        <label className="private-identity-attestation">
          <input
            type="checkbox"
            checked={attested}
            onChange={(event) => setAttested(event.target.checked)}
            required
          />
          <span>I attest that this legal identity and its documented variants are accurate.</span>
        </label>
        <button disabled={busy || !legalName.first.trim() || !legalName.last.trim() || !currentPassword || !attested}>
          {busy ? "Securing identity…" : "Save encrypted identity"}
        </button>
      </form>}
    <section className="portal-readability-settings" aria-labelledby="portal-readability-title">
      <span className="eyebrow">Appearance & readability</span>
      <h3 id="portal-readability-title">Choose a comfortable text size</h3>
      <p>This preference is saved in this browser and applies throughout the public site and Civic Portal.</p>
      <fieldset>
        <legend>Site text size</legend>
        {([
          ["standard", "Standard", "Original site scale"],
          ["large", "Large", "Comfortable default"],
          ["largest", "Largest", "Maximum readable scale"],
        ] as const).map(([value, label, description]) => <label key={value} className={textSize === value ? "is-active" : ""}>
          <input
            type="radio"
            name="portal-text-size"
            value={value}
            checked={textSize === value}
            onChange={() => onTextSizeChange(value)}
          />
          <span><strong>{label}</strong><small>{description}</small></span>
        </label>)}
      </fieldset>
    </section>
    <PublicProfileSettings
      civicName={civicName}
      civicTitle={civicTitle}
      publicBio={publicBio}
      profileVisibility={profileVisibility}
      avatarUrl={avatarUrl}
      aiAllowance={aiAllowance}
      onSaved={onSaved}
    />
  </section>;
}

function ContributionTab({
  snapshot, assignmentsByPosition, busy, evidence, setEvidence, minutes, setMinutes,
  timeNotes, setTimeNotes, run,
}: {
  snapshot: CivicPortalSnapshot;
  assignmentsByPosition: Map<string, CivicPortalSnapshot["contribution"]["assignments"][number]>;
  busy: string;
  evidence: Record<string, string>;
  setEvidence: Dispatch<SetStateAction<Record<string, string>>>;
  minutes: Record<string, string>;
  setMinutes: Dispatch<SetStateAction<Record<string, string>>>;
  timeNotes: Record<string, string>;
  setTimeNotes: Dispatch<SetStateAction<Record<string, string>>>;
  run: PortalRun;
}) {
  return <div className="portal-single-panel">
    <span className="eyebrow">Circle of Contribution</span><h2>Available positions and active contribution</h2>
    <p>One verified hour begins as 1 CCU. The Society’s current need may adjust it through SEP; filled positions disappear from the available list.</p>
    <div className="contribution-position-grid">{snapshot.contribution.openPositions.map((position) => {
      const assignment = assignmentsByPosition.get(position.positionId);
      const minutesValue = Number(minutes[assignment?.assignmentId || ""] || 0);
      return <article className={assignment ? `has-assignment status-${assignment.status}` : ""} key={position.positionId}>
        <div className="position-index"><span>{position.sectorKey.replace(/-/g, " ")}</span><b>{position.availableSlots} place(s)</b></div>
        <h3>{position.title}</h3><p>{position.publicSummary}</p>
        <dl>
          <div><dt>Actual time</dt><dd>{displayNumber(assignment?.recordedHours || 0)} h</dd></div>
          <div><dt>Rate</dt><dd>1 CCU / h</dd></div>
          <div><dt>SEP</dt><dd>× {position.sepMultiplier.toFixed(3)}</dd></div>
          <div><dt>Current value</dt><dd>{displayNumber((assignment?.recordedHours || 0) * position.sepMultiplier)} CCU</dd></div>
        </dl>
        <small><b>Qualification:</b> {position.qualificationSummary || position.capacityRequired}</small>
        {!assignment && <button type="button" disabled={Boolean(busy)} onClick={() => void run(
          `accept-${position.positionId}`,
          () => acceptContributionPosition({ positionId: position.positionId, idempotencyKey: crypto.randomUUID() }),
          `${position.title} accepted.`,
        )}>Accept this contribution</button>}
        {assignment && <div className="assignment-stage">
          <span>Assignment · {assignment.status}</span>
          {["accepted", "active"].includes(assignment.status) && <>
            <label>Minutes actually contributed<input type="number" min="1" max="1440" value={minutes[assignment.assignmentId] || ""} onChange={(event) => setMinutes((current) => ({ ...current, [assignment.assignmentId]: event.target.value }))} /></label>
            <label>Private time note<textarea value={timeNotes[assignment.assignmentId] || ""} onChange={(event) => setTimeNotes((current) => ({ ...current, [assignment.assignmentId]: event.target.value }))} /></label>
            <button disabled={!minutesValue || !timeNotes[assignment.assignmentId]?.trim() || Boolean(busy)} onClick={() => void run(
              `time-${assignment.assignmentId}`,
              () => recordContributionTime(assignment.assignmentId, {
                minutes: minutesValue,
                workDate: new Date().toISOString().slice(0, 10),
                description: timeNotes[assignment.assignmentId],
              }),
              "Actual contribution time recorded.",
            )}>Record time</button>
            <label>Evidence summary<textarea value={evidence[assignment.assignmentId] || ""} onChange={(event) => setEvidence((current) => ({ ...current, [assignment.assignmentId]: event.target.value }))} /></label>
            <button disabled={!assignment.recordedHours || !evidence[assignment.assignmentId]?.trim() || Boolean(busy)} onClick={() => void run(
              `submit-${assignment.assignmentId}`,
              () => submitContributionEvidence(assignment.assignmentId, { evidenceSummary: evidence[assignment.assignmentId] }),
              "Evidence submitted for independent affirmation.",
            )}>Submit for affirmation</button>
          </>}
          {assignment.status === "submitted" && <button disabled={Boolean(busy)} onClick={() => void run(
            `affirm-${assignment.assignmentId}`,
            () => affirmContributionEvidence(assignment.assignmentId, {
              affirmedBy: "Circle of Affirmation · Local Steward",
              idempotencyKey: crypto.randomUUID(),
            }),
            "Contribution affirmed; Common Credit and ledger trace reconciled atomically.",
          )}>Affirm in local demonstration</button>}
          {assignment.status === "affirmed" && <p className="assignment-complete">Affirmed by {assignment.affirmedBy}.</p>}
        </div>}
      </article>;
    })}</div>
  </div>;
}

const DOCUMENT_Q_LABELS: Record<string, string> = {
  intellectual: "IQ",
  emotional: "EQ",
  social: "SQ",
  creative: "CQ",
  adaptability: "AQ",
  moral: "MQ",
  physical: "PQ",
  natural: "NQ",
  technological: "TQ",
  learning: "LQ",
};

function documentQScores(observations: LearningObservation[], documentId: string) {
  const admitted = latestDocumentObservations(observations, documentId).filter((observation) => (
    observation.documentId === documentId
      && observation.admissionStatus === "admitted"
      && Number.isFinite(observation.estimate)
      && observation.estimate > 0
      && observation.estimate < 100
      && observation.confidence > 0
      && observation.evidenceWeight > 0
  ));
  return Object.keys(Q_LABELS).map((qKey) => {
    const relevant = admitted.filter((observation) => observation.primaryQKey === qKey);
    if (!relevant.length) return { qKey, score: null, evidenceCount: 0 };
    const weighted = relevant.map((observation) => ({
      estimate: observation.estimate,
      weight: Math.max(0.05, observation.evidenceWeight) * Math.max(0.05, observation.confidence),
    }));
    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    const score = Math.round(weighted.reduce((sum, item) => sum + item.estimate * item.weight, 0) / totalWeight);
    return { qKey, score: Math.max(0, Math.min(100, score)), evidenceCount: relevant.length };
  });
}

function latestDocumentObservations(observations: LearningObservation[], documentId: string) {
  const matching = observations.filter((observation) => observation.documentId === documentId);
  if (!matching.length) return [];
  const latest = matching.reduce((current, observation) => {
    const currentKey = `${current.createdAt || ""}\u0000${current.evaluationId || ""}`;
    const candidateKey = `${observation.createdAt || ""}\u0000${observation.evaluationId || ""}`;
    return candidateKey > currentKey ? observation : current;
  });
  return matching.filter((observation) => observation.evaluationId === latest.evaluationId);
}

function PortalModal({
  title, description, onClose, wide = false, children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const closeButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  return <div className="portal-modal-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className={`portal-modal${wide ? " is-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="portal-modal-title" aria-describedby="portal-modal-description">
      <header className="portal-modal-header">
        <div><h3 id="portal-modal-title">{title}</h3><p id="portal-modal-description">{description}</p></div>
        <button ref={closeButton} type="button" onClick={onClose} aria-label="Close dialog">Close</button>
      </header>
      <div className="portal-modal-content">{children}</div>
      <footer className="portal-modal-footer"><button type="button" onClick={onClose}>Close / Cancel</button></footer>
    </section>
  </div>;
}

function LearningDocumentRegister({
  documents, observations, contracts, busy, exportDocument, run, selected, setSelected,
  maxSelected, onPrepareOcr, onOpenContract, onOpenDetails,
}: {
  documents: ProtectedDocument[];
  observations: LearningObservation[];
  contracts: Map<string, LearningEvidenceContract>;
  busy: string;
  exportDocument: (documentId: string, name: string) => Promise<void>;
  run: PortalRun;
  selected: string[];
  setSelected: Dispatch<SetStateAction<string[]>>;
  maxSelected: number;
  onPrepareOcr: (document: ProtectedDocument) => Promise<void>;
  onOpenContract: (documentId: string) => void;
  onOpenDetails: (documentId: string) => void;
}) {
  if (!documents.length) return <p className="empty-record">No retained Learning documents.</p>;
  return <section className="learning-document-register" aria-labelledby="learning-document-register-title">
    <header>
      <div><span className="eyebrow">Evidence register</span><h3 id="learning-document-register-title">Retained Learning documents</h3></div>
      <p>Select up to {maxSelected} documents for one interpretation. Scores shown here belong only to the named document, not to the cumulative profile.</p>
    </header>
    <div className="learning-document-columns" aria-hidden="true"><span>Documents</span><span>Document evidence</span><span>Actions</span></div>
    <ul className="learning-document-window">{documents.map((document) => {
      const scores = documentQScores(observations, document.document_id);
      const hasScores = scores.some((item) => item.score !== null);
      const hasContract = contracts.has(document.document_id);
      return <li key={document.document_id}>
        <div className="learning-document-identity">
          <input
            type="checkbox"
            checked={selected.includes(document.document_id)}
            disabled={!selected.includes(document.document_id) && selected.length >= maxSelected}
            onChange={(event) => setSelected((current) => {
              if (!event.target.checked) return current.filter((id) => id !== document.document_id);
              if (current.length >= maxSelected) return current;
              return [...current, document.document_id];
            })}
            aria-label={`Select ${document.original_name} for assessment`}
          />
          <div><strong>{document.original_name}</strong><small>{displayBytes(document.byte_size)} · {document.retention_status}</small>
            {document.derivation_method === "citizen_reviewed_ocr" && <small className="document-provenance">Citizen-reviewed OCR transcript · linked source retained</small>}
          </div>
        </div>
        <div className={`learning-document-scores${hasScores ? " has-scores" : ""}`} aria-label={`${document.original_name} document-specific Ten-Q scores`}>
          {hasScores ? scores.map((item) => <span key={item.qKey} title={`${Q_LABELS[item.qKey]} · ${item.evidenceCount} admitted observation${item.evidenceCount === 1 ? "" : "s"}`}>
            <b>{DOCUMENT_Q_LABELS[item.qKey]}</b><strong>{item.score ?? "—"}</strong>
          </span>) : <em>Not yet scored</em>}
        </div>
        <div className="learning-document-actions">
          <button type="button" className={hasContract ? "" : "is-missing"} onClick={() => onOpenContract(document.document_id)}>
            {hasContract ? `Contract v${contracts.get(document.document_id)?.contractVersion}` : "Create contract"}
          </button>
          <button type="button" onClick={() => onOpenDetails(document.document_id)}>Details</button>
          {document.derivation_method === "original" && ["application/pdf", "image/jpeg", "image/png"].includes(document.media_type) && <button type="button" disabled={Boolean(busy)} onClick={() => void onPrepareOcr(document)}>Prepare OCR</button>}
          <button type="button" disabled={Boolean(busy)} onClick={() => void exportDocument(document.document_id, document.original_name)}>Export</button>
          <button type="button" disabled={Boolean(busy)} onClick={() => void run(
            `delete-${document.document_id}`,
            () => deleteProtectedDocument(document.document_id),
            `${document.original_name} deleted from retained private storage.`,
          )}>Delete</button>
        </div>
      </li>;
    })}</ul>
  </section>;
}

function LearningDocumentDetails({
  document, observations, evaluations, recommendations, contracts, challenges, busy, run,
}: {
  document: ProtectedDocument;
  observations: LearningObservation[];
  evaluations: Array<Record<string, string | number | null>>;
  recommendations: Array<Record<string, string | number | null>>;
  contracts: LearningEvidenceContract[];
  challenges: Array<Record<string, string | number | null>>;
  busy: string;
  run: PortalRun;
}) {
  const allDocumentObservations = observations.filter((observation) => observation.documentId === document.document_id);
  const documentObservations = latestDocumentObservations(observations, document.document_id);
  const evaluationIds = new Set(allDocumentObservations.map((observation) => observation.evaluationId));
  const observationIds = new Set(allDocumentObservations.map((observation) => observation.observationId));
  const documentEvaluations = evaluations.filter((evaluation) => evaluationIds.has(String(evaluation.evaluation_id || "")));
  const documentRecommendations = recommendations.filter((recommendation) => evaluationIds.has(String(recommendation.evaluation_id || "")));
  const documentContracts = contracts.filter((contract) => contract.documentId === document.document_id);
  const documentChallenges = challenges.filter((challenge) => observationIds.has(String(challenge.observation_id || challenge.observationId || "")));
  const scores = documentQScores(observations, document.document_id).filter((item) => item.score !== null);

  return <div className="learning-document-details">
    <dl className="learning-document-summary">
      <div><dt>Retained file</dt><dd>{document.original_name}</dd></div>
      <div><dt>Protection</dt><dd>{document.retention_status} · {displayBytes(document.byte_size)}</dd></div>
      <div><dt>Evidence contract</dt><dd>{documentContracts[0] ? `v${documentContracts[0].contractVersion}` : "Not created"}</dd></div>
      <div><dt>Current admitted observations</dt><dd>{documentObservations.filter((item) => item.admissionStatus === "admitted").length}</dd></div>
    </dl>
    {allDocumentObservations.length > documentObservations.length && <p className="learning-current-evaluation-note">
      Current interpretation is shown below. Earlier reruns remain available in the evaluation history but do not alter the current document score.
    </p>}
    {scores.length > 0 && <div className="learning-detail-scores">{scores.map((item) => <span key={item.qKey}><b>{Q_LABELS[item.qKey]}</b><strong>{item.score}/100</strong></span>)}</div>}
    <LearningEvaluationHistory evaluations={documentEvaluations} recommendations={documentRecommendations} />
    <LearningEvidenceRecord
      observations={documentObservations}
      contracts={documentContracts}
      profileVersions={[]}
      challenges={documentChallenges}
      busy={busy}
      run={run}
    />
  </div>;
}

function LearningCourseSuggestions({ recommendations }: { recommendations: Array<Record<string, string | number | null>> }) {
  const unique = new Map<string, Record<string, string | number | null>>();
  for (const recommendation of recommendations) {
    const key = String(recommendation.course_id || recommendation.code || recommendation.title || recommendation.recommendation_id || "");
    if (key && !unique.has(key)) unique.set(key, recommendation);
  }
  const suggestions = [...unique.values()].slice(0, 8);
  return <section className="learning-course-suggestions" aria-labelledby="learning-course-suggestions-title">
    <span className="eyebrow">Lifelong direction</span><h3 id="learning-course-suggestions-title">Course suggestions</h3>
    {suggestions.length ? <ul>{suggestions.map((item, index) => <li key={String(item.recommendation_id || item.course_id || index)}>
      <strong>{String(item.code || item.title || item.course_id || "Suggested course")}</strong>
      {item.rationale && <span>{String(item.rationale)}</span>}
    </li>)}</ul> : <p className="empty-record">Course suggestions will appear when admitted evidence supports a useful next step.</p>}
  </section>;
}

function RecordUpload({
  domain, busy, onUpload,
}: {
  domain: "learning" | "healing" | "harmony";
  busy: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>, domain: "learning" | "healing" | "harmony") => Promise<void>;
}) {
  return <label className="record-upload">Add encrypted {domain} document
    <input type="file" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png" disabled={Boolean(busy)} onChange={(event) => void onUpload(event, domain)} />
    <small>PDF, DOCX, TXT, JPG, or PNG · 10 MB maximum · AES-256-GCM at rest</small>
  </label>;
}

type PortalRun = (
  action: string,
  operation: () => Promise<unknown>,
  completed: string,
) => Promise<boolean>;

const DOCUMENT_TYPE_OPTIONS = [
  ["standardized_assessment", "Standardized assessment"],
  ["school_record", "School record"],
  ["employment_record", "Employment record"],
  ["certification", "Certification"],
  ["authored_autobiographical_essay", "Authored autobiographical essay"],
  ["authored_non_autobiographical_essay", "Authored non-autobiographical essay"],
  ["authored_fiction", "Authored fiction"],
  ["technical_project", "Technical project"],
  ["creative_portfolio", "Creative portfolio"],
  ["personal_reflection", "Personal reflection"],
  ["third_party_evaluation", "Third-party evaluation"],
  ["collaborative_work", "Collaborative work"],
  ["clinical_context", "Clinical context only (never scored)"],
  ["context_only", "Context only"],
  ["other", "Other"],
] as const;

type LearningContractDraft = {
  sourceContractVersion: number | null;
  documentType: string;
  authorOrIssuer: string;
  relationshipToCitizen: string;
  authorshipState: string;
  namedSubjects: string;
  fictionalSubjects: string;
  allowedChannels: Array<"declared" | "demonstrated" | "observed">;
  permittedScope: string[];
  includedSections: string;
  excludedSections: string;
  autobiographicalStatus: string;
  sensitivityClass: string;
  citizenContext: string;
  verificationClass: string;
  evidencePeriodStart: string;
  evidencePeriodEnd: string;
  evidencePeriodPrecision: string;
  evidencePeriodAuthority: string;
  evidencePeriodBasis: string;
  printedDocumentDate: string;
  citizenAttestation: string;
  accepted: boolean;
};

function initialLearningContract(document: ProtectedDocument): LearningContractDraft {
  const isReviewed = document.derivation_method === "citizen_reviewed_ocr";
  return {
    sourceContractVersion: null,
    documentType: "other",
    authorOrIssuer: "",
    relationshipToCitizen: "This document contains evidence about or created by the signed-in citizen.",
    authorshipState: "unknown",
    namedSubjects: "",
    fictionalSubjects: "",
    allowedChannels: ["demonstrated"],
    permittedScope: Object.keys(Q_LABELS),
    includedSections: "",
    excludedSections: "",
    autobiographicalStatus: "unknown",
    sensitivityClass: "ordinary",
    citizenContext: "",
    verificationClass: isReviewed ? "citizen_reviewed" : "self_submitted",
    evidencePeriodStart: "",
    evidencePeriodEnd: "",
    evidencePeriodPrecision: "unknown",
    evidencePeriodAuthority: "unknown",
    evidencePeriodBasis: "",
    printedDocumentDate: "",
    citizenAttestation: "I classified this evidence in good faith and authorize only the scope and channels selected here.",
    accepted: false,
  };
}

function revisedLearningContract(
  document: ProtectedDocument,
  contract: LearningEvidenceContract,
): LearningContractDraft {
  const fallback = initialLearningContract(document);
  return {
    sourceContractVersion: contract.contractVersion,
    documentType: contract.documentType || fallback.documentType,
    authorOrIssuer: contract.authorOrIssuer || "",
    relationshipToCitizen: contract.relationshipToCitizen || "",
    authorshipState: contract.authorshipState || fallback.authorshipState,
    namedSubjects: contract.namedSubjects.join(", "),
    fictionalSubjects: contract.fictionalSubjects.join(", "),
    allowedChannels: [...contract.allowedChannels],
    permittedScope: [...contract.permittedScope],
    includedSections: contract.includedSections || "",
    excludedSections: contract.excludedSections || "",
    autobiographicalStatus: contract.autobiographicalStatus || fallback.autobiographicalStatus,
    sensitivityClass: contract.sensitivityClass || fallback.sensitivityClass,
    citizenContext: contract.citizenContext || "",
    verificationClass: contract.verificationClass || fallback.verificationClass,
    evidencePeriodStart: contract.evidencePeriodStart || "",
    evidencePeriodEnd: contract.evidencePeriodEnd || "",
    evidencePeriodPrecision: contract.evidencePeriodPrecision || fallback.evidencePeriodPrecision,
    evidencePeriodAuthority: contract.evidencePeriodAuthority || fallback.evidencePeriodAuthority,
    evidencePeriodBasis: contract.evidencePeriodBasis || "",
    printedDocumentDate: contract.printedDocumentDate || "",
    citizenAttestation: contract.citizenAttestation || fallback.citizenAttestation,
    // Every superseding version requires a fresh, explicit act of consent.
    accepted: false,
  };
}

function LearningContractWorkbench({
  documents, contracts, busy, run, onSaved,
}: {
  documents: ProtectedDocument[];
  contracts: Map<string, LearningEvidenceContract>;
  busy: string;
  run: PortalRun;
  onSaved?: () => void;
}) {
  const [documentId, setDocumentId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, LearningContractDraft>>({});

  useEffect(() => {
    queueMicrotask(() => {
      if (!documents.length) {
        setDocumentId("");
        return;
      }
      if (!documents.some((document) => document.document_id === documentId)) {
        setDocumentId(documents.find((document) => !contracts.has(document.document_id))?.document_id || documents[0].document_id);
      }
    });
  }, [contracts, documentId, documents]);

  if (!documents.length) {
    return <section className="learning-contract-empty">
      <strong>Evidence contracts</strong>
      <span>Select a retained document to classify its authorship, subject, period, and permitted inferences.</span>
    </section>;
  }

  const document = documents.find((item) => item.document_id === documentId) || documents[0];
  const existing = contracts.get(document.document_id);
  const acceptedVersion = existing?.contractVersion ?? null;
  const inheritedDraft = existing
    ? revisedLearningContract(document, existing)
    : initialLearningContract(document);
  const savedDraft = drafts[document.document_id];
  const draft = savedDraft?.sourceContractVersion === acceptedVersion
    ? savedDraft
    : inheritedDraft;
  const update = (change: Partial<LearningContractDraft>) => setDrafts((current) => ({
    ...current,
    [document.document_id]: {
      ...(current[document.document_id]?.sourceContractVersion === acceptedVersion
        ? current[document.document_id]
        : inheritedDraft),
      ...change,
    },
  }));
  const toggle = <T extends string>(values: T[], item: T) => (
    values.includes(item) ? values.filter((value) => value !== item) : [...values, item]
  );

  return <section className="learning-contract-workbench" aria-labelledby="learning-contract-title">
    <header>
      <div>
        <span className="eyebrow">Evidence contract</span>
        <h3 id="learning-contract-title">Define what this evidence may mean</h3>
      </div>
      {documents.length > 1 && <label>Selected evidence
        <select value={document.document_id} onChange={(event) => setDocumentId(event.target.value)}>
          {documents.map((item) => <option key={item.document_id} value={item.document_id}>
            {contracts.has(item.document_id) ? "✓ " : "○ "}{item.original_name}
          </option>)}
        </select>
      </label>}
    </header>
    {existing && <div className="contract-status">
      <strong>Accepted contract v{existing.contractVersion}</strong>
      <span>{existing.documentType.replace(/_/g, " ")} · {existing.allowedChannels.join(", ")} · evidence period {existing.evidencePeriodStart || "unknown"} to {existing.evidencePeriodEnd || "unknown"}</span>
      <small>Saving again creates an immutable superseding version; it never edits history in place.</small>
    </div>}
    <p className="contract-required-key"><span aria-hidden="true">*</span> Required to accept the evidence contract.</p>
    <div className="contract-form-grid">
      <label>Document type
        <select value={draft.documentType} onChange={(event) => {
          const documentType = event.target.value;
          update({
            documentType,
            allowedChannels: documentType === "authored_fiction" ? ["demonstrated"] : draft.allowedChannels,
            sensitivityClass: documentType === "clinical_context" ? "clinical_restricted" : draft.sensitivityClass,
          });
        }}>{DOCUMENT_TYPE_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
      </label>
      <label>Author or issuing institution <span className="required-marker" aria-hidden="true">*</span><span className="sr-only"> Required</span><input required aria-required="true" value={draft.authorOrIssuer} onChange={(event) => update({ authorOrIssuer: event.target.value })} /></label>
      <label>Relationship to the citizen <span className="required-marker" aria-hidden="true">*</span><span className="sr-only"> Required</span><textarea required aria-required="true" value={draft.relationshipToCitizen} onChange={(event) => update({ relationshipToCitizen: event.target.value })} /></label>
      <label>Authorship / subject state
        <select value={draft.authorshipState} onChange={(event) => update({ authorshipState: event.target.value })}>
          <option value="citizen_author">Citizen is author</option><option value="citizen_subject">Citizen is subject</option>
          <option value="co_author">Citizen is co-author</option><option value="institutional">Institutional record</option>
          <option value="third_party">Third-party material</option><option value="unknown">Unresolved</option>
        </select>
      </label>
      <label>Named real subjects<input value={draft.namedSubjects} onChange={(event) => update({ namedSubjects: event.target.value })} placeholder="Comma-separated" /></label>
      <label>Named fictional subjects<input value={draft.fictionalSubjects} onChange={(event) => update({ fictionalSubjects: event.target.value })} placeholder="Characters or narrators; comma-separated" /></label>
      <label>Evidence period begins<input type="date" value={draft.evidencePeriodStart} onChange={(event) => update({ evidencePeriodStart: event.target.value })} /></label>
      <label>Evidence period ends<input type="date" value={draft.evidencePeriodEnd} onChange={(event) => update({ evidencePeriodEnd: event.target.value })} /></label>
      <label>Date precision
        <select value={draft.evidencePeriodPrecision} onChange={(event) => update({ evidencePeriodPrecision: event.target.value })}>
          <option value="unknown">Unknown</option><option value="life_stage">Life stage</option><option value="academic_period">Academic period</option>
          <option value="year">Year</option><option value="month">Month</option><option value="day">Day</option>
        </select>
      </label>
      <label>Date authority
        <select value={draft.evidencePeriodAuthority} onChange={(event) => update({ evidencePeriodAuthority: event.target.value })}>
          <option value="unknown">Unknown</option><option value="printed_source">Printed on source</option><option value="issuer_metadata">Issuer metadata</option>
          <option value="corroborated_context">Corroborated context</option><option value="citizen_declared">Citizen declared</option><option value="machine_inferred">Machine inferred</option>
        </select>
      </label>
      <label>Date basis<textarea value={draft.evidencePeriodBasis} onChange={(event) => update({ evidencePeriodBasis: event.target.value })} placeholder="Where the period came from; filenames and file creation dates are not authoritative." /></label>
      <label>Printed document date<input type="date" value={draft.printedDocumentDate} onChange={(event) => update({ printedDocumentDate: event.target.value })} /></label>
      <label>Included sections<textarea value={draft.includedSections} onChange={(event) => update({ includedSections: event.target.value })} placeholder="Blank means the full non-excluded document." /></label>
      <label>Excluded sections<textarea value={draft.excludedSections} onChange={(event) => update({ excludedSections: event.target.value })} placeholder="Clinical, legal, third-party, private, or irrelevant material." /></label>
      <label>Citizen context<textarea value={draft.citizenContext} onChange={(event) => update({ citizenContext: event.target.value })} placeholder="Context may qualify interpretation; it cannot manufacture source facts." /></label>
      <label>Verification class
        <select value={draft.verificationClass} onChange={(event) => update({ verificationClass: event.target.value })}>
          <option value="self_submitted">Self-submitted</option><option value="citizen_reviewed">Citizen-reviewed extraction</option>
          <option value="externally_verified">Externally verified</option><option value="directly_observed">Directly observed</option>
        </select>
      </label>
    </div>
    <fieldset aria-describedby="evidence-channels-required">
      <legend>Authorized evidence channels <span className="required-marker" aria-hidden="true">*</span></legend>
      <span id="evidence-channels-required" className="contract-group-requirement">Choose at least one.</span>
      {(["declared", "demonstrated", "observed"] as const).map((channel) => <label key={channel}>
        <input type="checkbox" checked={draft.allowedChannels.includes(channel)} disabled={draft.documentType === "authored_fiction" && channel !== "demonstrated"} onChange={() => update({ allowedChannels: toggle(draft.allowedChannels, channel) })} />
        {LEARNING_CHANNEL_LABELS[channel]}
      </label>)}
    </fieldset>
    <fieldset aria-describedby="evidence-scope-required">
      <legend>Permitted Ten-Q scope <span className="required-marker" aria-hidden="true">*</span></legend>
      <span id="evidence-scope-required" className="contract-group-requirement">Choose at least one.</span>
      {Object.entries(Q_LABELS).map(([key, label]) => <label key={key}>
        <input type="checkbox" checked={draft.permittedScope.includes(key)} onChange={() => update({ permittedScope: toggle(draft.permittedScope, key) })} />{label}
      </label>)}
    </fieldset>
    <p className="learning-safeguard">Authored fiction supports demonstrated craft, modeling, and synthesis—not the behavior of characters. Clinical, diagnostic, legal, hardship, or demographic context never raises or lowers a Ten-Q estimate or civic standing.</p>
    <label className="consent-check">
      <input required aria-required="true" type="checkbox" checked={draft.accepted} onChange={(event) => update({ accepted: event.target.checked })} />
      <span>{draft.citizenAttestation} <span className="required-marker" aria-hidden="true">*</span><span className="sr-only"> Required</span></span>
    </label>
    <button type="button" disabled={Boolean(busy) || !draft.accepted || !draft.authorOrIssuer.trim() || !draft.relationshipToCitizen.trim() || !draft.allowedChannels.length || !draft.permittedScope.length} onClick={async () => {
      const saved = await run(
        `learning-contract-${document.document_id}`,
        () => saveLearningEvidenceContract({
        documentId: document.document_id,
        documentType: draft.documentType,
        authorOrIssuer: draft.authorOrIssuer,
        relationshipToCitizen: draft.relationshipToCitizen,
        authorshipState: draft.authorshipState,
        namedSubjects: draft.namedSubjects.split(",").map((value) => value.trim()).filter(Boolean),
        fictionalSubjects: draft.fictionalSubjects.split(",").map((value) => value.trim()).filter(Boolean),
        allowedChannels: draft.allowedChannels,
        permittedScope: draft.permittedScope,
        includedSections: draft.includedSections,
        excludedSections: draft.excludedSections,
        autobiographicalStatus: draft.autobiographicalStatus,
        sensitivityClass: draft.sensitivityClass,
        citizenContext: draft.citizenContext,
        verificationClass: draft.verificationClass,
        evidencePeriodStart: draft.evidencePeriodStart,
        evidencePeriodEnd: draft.evidencePeriodEnd,
        evidencePeriodPrecision: draft.evidencePeriodPrecision,
        evidencePeriodAuthority: draft.evidencePeriodAuthority,
        evidencePeriodBasis: draft.evidencePeriodBasis,
        printedDocumentDate: draft.printedDocumentDate,
        citizenAttestation: draft.citizenAttestation,
        accepted: true,
        }),
        `${document.original_name} now has an accepted, auditable evidence contract.`,
      );
      if (saved) onSaved?.();
    }}>{existing ? "Create revised contract" : "Create contract"}</button>
  </section>;
}

function LearningEvidenceRecord({
  observations, contracts, profileVersions, challenges, busy, run,
}: {
  observations: LearningObservation[];
  contracts: LearningEvidenceContract[];
  profileVersions: Array<Record<string, unknown>>;
  challenges: Array<Record<string, string | number | null>>;
  busy: string;
  run: PortalRun;
}) {
  const [challengeDrafts, setChallengeDrafts] = useState<Record<string, string>>({});
  const [challengeTypes, setChallengeTypes] = useState<Record<string, "correction" | "context" | "dispute" | "exclude" | "reconsideration" | "counterevidence">>({});
  const contractsById = useMemo(
    () => new Map(contracts.map((contract) => [contract.contractId, contract])),
    [contracts],
  );

  return <section className="learning-evidence-record" aria-labelledby="learning-evidence-record-title">
    <span className="eyebrow">Evidence provenance and civic recourse</span>
    <h3 id="learning-evidence-record-title">Every inference remains visible and contestable</h3>
    <p>Learning stores the source fact, contextual interpretation, and Ten-Q inference separately. A profile is an educational aid, never an automatic qualification or civic-rights decision.</p>
    {observations.some((observation) => !observation.observableFeature || !observation.rubricConnection || !observation.limitations || !observation.scoringRationale) && <p className="learning-legacy-audit-note">
      This interpretation predates the expanded v3 audit standard. Rerun the document to add observable features, rubric mapping, limitations, alternatives, and a complete numerical rationale.
    </p>}
    {!observations.length && <p className="empty-record">No source-bound observations have been retained yet.</p>}
    <div className="observation-ledger">{observations.map((observation) => {
      const challengeType = challengeTypes[observation.observationId] || "context";
      const statement = challengeDrafts[observation.observationId] || "";
      const contract = contractsById.get(observation.contractId);
      return <article key={observation.observationId} data-status={observation.admissionStatus}>
        <header>
          <div><strong>{Q_LABELS[observation.primaryQKey]} · {observation.primarySubdomainKey.replace(/_/g, " ")}</strong><span>{LEARNING_CHANNEL_LABELS[observation.evidenceChannel]} · {observation.evidenceKind.replace(/_/g, " ")}</span></div>
          <b>{observation.admissionStatus.replace(/_/g, " ")}</b>
        </header>
        <dl>
          <div className="learning-source-evidence"><dt>Source evidence</dt><dd>{observation.sourceFact || "No bounded source passage retained."}</dd></div>
          <div><dt>Observable feature</dt><dd>{observation.observableFeature || "Legacy observation: observable feature was not separately retained."}</dd></div>
          <div><dt>Evidence channel</dt><dd>{LEARNING_CHANNEL_LABELS[observation.evidenceChannel]} Â· {observation.evidenceKind.replace(/_/g, " ")}</dd></div>
          <div><dt>Rubric connection</dt><dd>{observation.rubricConnection || "Legacy observation: rubric mapping was not separately retained."}</dd></div>
          <div><dt>Contextual interpretation</dt><dd>{observation.contextualInterpretation || "No separate context retained."}</dd></div>
          <div><dt>Ten-Q inference</dt><dd>{observation.tenQInference || "No inference retained."}</dd></div>
          <div><dt>Scoring rationale</dt><dd>{observation.scoringRationale || "Legacy observation: numerical rationale was not separately retained."}</dd></div>
          <div><dt>Limitations</dt><dd>{observation.limitations || "Legacy observation: limitations were not separately retained."}</dd></div>
          <div><dt>Alternative explanations</dt><dd>{observation.alternativeExplanations || "Legacy observation: alternatives were not separately retained."}</dd></div>
          {observation.moralTreatment.length > 0 && <div><dt>Narrative treatment</dt><dd>{observation.moralTreatment.map((value) => value.replace(/_/g, " ")).join(" · ")}</dd></div>}
          <div><dt>Bounded citation</dt><dd>{observation.boundedCitation || "Citation unavailable."}</dd></div>
        </dl>
        <p><strong>{observation.estimate}/100</strong> within {observation.rangeLow}–{observation.rangeHigh} · evidence confidence {displayPercent(observation.confidence)} · weight {displayPercent(observation.evidenceWeight)}</p>
        {contract && <details className="observation-provenance">
          <summary>Source contract and integrity</summary>
          <dl>
            <div><dt>Contract</dt><dd>v{contract.contractVersion} · {contract.documentType.replace(/_/g, " ")}</dd></div>
            <div><dt>Issuer</dt><dd>{contract.authorOrIssuer}</dd></div>
            <div><dt>Evidence period</dt><dd>{contract.evidencePeriodStart || "Pending"} to {contract.evidencePeriodEnd || "Pending"} · {contract.evidencePeriodAuthority.replace(/_/g, " ")}</dd></div>
            <div><dt>Identity link</dt><dd>{contract.identityMatchState.replace(/_/g, " ")} · {contract.identityMatchMethod}</dd></div>
            <div><dt>Extraction</dt><dd>{contract.extractionMethod.replace(/_/g, " ")} · {contract.pageCount ?? "unknown"} page(s)</dd></div>
            <div><dt>Integrity hashes</dt><dd>Original {contract.rawExtractionHash?.slice(0, 16) || "Pending"}… · reviewed {contract.reviewedTranscriptHash?.slice(0, 16) || "not applicable"}…</dd></div>
          </dl>
        </details>}
        {observation.rejectionReason && <p className="observation-rejection">{observation.rejectionReason}</p>}
        <div className="observation-challenge">
          <label>Response
            <select value={challengeType} onChange={(event) => setChallengeTypes((current) => ({ ...current, [observation.observationId]: event.target.value as typeof challengeType }))}>
              <option value="context">Add context</option><option value="correction">Correct the record</option><option value="dispute">Dispute inference</option>
              <option value="reconsideration">Request reconsideration</option><option value="counterevidence">Offer counterevidence</option><option value="exclude">Exclude from synthesis</option>
            </select>
          </label>
          <label>Citizen statement<textarea value={statement} onChange={(event) => setChallengeDrafts((current) => ({ ...current, [observation.observationId]: event.target.value }))} /></label>
          <button type="button" disabled={Boolean(busy) || statement.trim().length < 10} onClick={() => {
            if (challengeType === "exclude" && !window.confirm("Exclude this observation from the derived profile while retaining the audit record?")) return;
            void run(
              `learning-challenge-${observation.observationId}`,
              () => challengeLearningObservation({ observationId: observation.observationId, challengeType, citizenStatement: statement }),
              challengeType === "exclude" ? "The observation remains auditable but is excluded from synthesis." : "The citizen response is attached to this observation for review.",
            );
          }}>Record response</button>
        </div>
      </article>;
    })}</div>
    {profileVersions.length > 0 && <details className="learning-version-history">
      <summary>Profile synthesis history · {profileVersions.length} version{profileVersions.length === 1 ? "" : "s"}</summary>
      <div>{profileVersions.map((version, index) => <article key={String(version.profileVersionId || index)}>
        <strong>Version {String(version.versionNumber || "?")}</strong>
        <span>{String(version.createdAt || "")}</span>
        <small>Evidence set {String(version.evidenceSetHash || "").slice(0, 16)}… · {String(version.policyVersion || "")}</small>
      </article>)}</div>
    </details>}
    {challenges.length > 0 && <p className="learning-challenge-count">{challenges.length} citizen response{challenges.length === 1 ? "" : "s"} retained in the private Learning record.</p>}
  </section>;
}

function DocumentList({
  documents, busy, exportDocument, run, selected, setSelected, maxSelected, onPrepareOcr,
}: {
  documents: CivicPortalSnapshot["learning"]["documents"];
  busy: string;
  exportDocument: (documentId: string, name: string) => Promise<void>;
  run: PortalRun;
  selected?: string[];
  setSelected?: Dispatch<SetStateAction<string[]>>;
  maxSelected?: number;
  onPrepareOcr?: (document: ProtectedDocument) => Promise<void>;
}) {
  if (!documents.length) return <p className="empty-record">No retained documents.</p>;
  return <ul className="protected-document-list">{documents.map((document) => <li key={document.document_id}>
    {selected && setSelected && <input
      type="checkbox"
      checked={selected.includes(document.document_id)}
      disabled={!selected.includes(document.document_id) && Boolean(maxSelected && selected.length >= maxSelected)}
      onChange={(event) => setSelected((current) => {
        if (!event.target.checked) return current.filter((id) => id !== document.document_id);
        if (maxSelected && current.length >= maxSelected) return current;
        return [...current, document.document_id];
      })}
      aria-label={`Select ${document.original_name} for assessment`}
    />}
    <div>
      <strong>{document.original_name}</strong>
      <small>{displayBytes(document.byte_size)} · {document.retention_status}</small>
      {document.derivation_method === "citizen_reviewed_ocr"
        && <small className="document-provenance">Citizen-reviewed OCR transcript · linked source retained · reviewed {document.reviewed_at ? displayUtc(document.reviewed_at) : "locally"}</small>}
    </div>
    {onPrepareOcr
      && document.derivation_method === "original"
      && ["application/pdf", "image/jpeg", "image/png"].includes(document.media_type)
      && <button
        disabled={Boolean(busy)}
        onClick={() => void onPrepareOcr(document)}
      >Prepare OCR</button>}
    <button disabled={Boolean(busy)} onClick={() => void exportDocument(document.document_id, document.original_name)}>Export</button>
    <button disabled={Boolean(busy)} onClick={() => void run(
      `delete-${document.document_id}`,
      () => deleteProtectedDocument(document.document_id),
      `${document.original_name} deleted from retained private storage.`,
    )}>Delete</button>
  </li>)}</ul>;
}

function RecordRows({ rows, empty }: { rows: Array<Record<string, string | number | null>>; empty: string }) {
  if (!rows.length) return <p className="empty-record">{empty}</p>;
  return <div className="compact-records">{rows.slice(0, 8).map((row, index) => {
    const entries = Object.entries(row).filter(([, field]) => field !== null && field !== "").slice(0, 4);
    return <article key={String(row.id || row.record_id || row.appointment_id || row.harm_id || index)}>{entries.map(([key, field]) => <p key={key}><span>{key.replace(/_/g, " ")}</span><strong>{String(field)}</strong></p>)}</article>;
  })}</div>;
}

function LearningEvaluationHistory({
  evaluations,
  recommendations,
}: {
  evaluations: Array<Record<string, string | number | null>>;
  recommendations: Array<Record<string, string | number | null>>;
}) {
  if (!evaluations.length) return <p className="empty-record">No Automated Assessment has been completed.</p>;
  const recommendationsByEvaluation = new Map<string, Array<Record<string, string | number | null>>>();
  for (const recommendation of recommendations) {
    const evaluationId = String(recommendation.evaluation_id || "");
    if (!evaluationId) continue;
    recommendationsByEvaluation.set(evaluationId, [
      ...(recommendationsByEvaluation.get(evaluationId) || []),
      recommendation,
    ]);
  }
  const supersededIds = new Set(
    evaluations.map((evaluation) => String(evaluation.supersedes_evaluation_id || "")).filter(Boolean),
  );
  return <section className="learning-evaluation-history" aria-labelledby="learning-evaluation-history-title">
    <span className="eyebrow">Learning evaluation history</span>
    <h3 id="learning-evaluation-history-title">What each assessment changed</h3>
    <div className="learning-evaluation-list">{evaluations.slice(0, 8).map((evaluation, index) => {
      const evaluationId = String(evaluation.evaluation_id || "");
      const status = String(evaluation.status || "needs_more_evidence");
      const completedAt = String(evaluation.completed_at || evaluation.created_at || "");
      const related = recommendationsByEvaluation.get(evaluationId) || [];
      const superseded = status === "superseded" || supersededIds.has(evaluationId);
      const admitted = status === "completed" && !superseded;
      const coverage = storedArray<{
        name?: string;
        mode?: string;
        coveragePercent?: number;
        sourceCharacters?: number;
        coveredCharacters?: number;
        structuralLabels?: string[];
        coverageReceipt?: Array<{ structuralLabel?: string; coverageRegion?: string; analyzed?: boolean }>;
      }>(evaluation.coverage_json);
      const domainReviews = storedArray<{
        qKey?: string;
        status?: string;
        rationale?: string;
        citations?: string[];
        moralTreatment?: string[];
      }>(evaluation.domain_reviews_json);
      return <article className={admitted ? "is-admitted" : "needs-evidence"} key={evaluationId || index}>
        <div className="learning-evaluation-heading">
          <strong>{superseded ? "Superseded historical method" : admitted ? "Evidence admitted" : "No score changed"}</strong>
          {completedAt && <time dateTime={completedAt}>{displayUtc(completedAt)}</time>}
        </div>
        <p>{String(evaluation.summary || (admitted
          ? "Accepted observations were added to the cumulative Learning profile."
          : "The assessment completed, but its observations were held or rejected by the evidence safeguards."))}</p>
        <p className="learning-evaluation-outcome">{superseded
          ? "Outcome: preserved for audit; excluded from the current method and profile synthesis."
          : admitted
          ? "Outcome: cumulative profile recalculated."
          : "Outcome: existing Ten-Q scores preserved without alteration."}</p>
        {coverage.length > 0 && <details className="learning-coverage-receipt">
          <summary>Complete-work coverage receipt</summary>
          {coverage.map((item, itemIndex) => {
            const receipt = Array.isArray(item.coverageReceipt) ? item.coverageReceipt : [];
            const regions = [...new Set(receipt.filter((entry) => entry.analyzed !== false).map((entry) => entry.coverageRegion).filter(Boolean))];
            const labels = [...new Set(receipt.filter((entry) => entry.analyzed !== false).map((entry) => entry.structuralLabel).filter(Boolean))];
            return <div key={`${item.name || "document"}-${itemIndex}`}>
              <strong>{item.name || "Submitted document"}</strong>
              <p>{Number(item.coveragePercent || 0).toFixed(1)}% · {Number(item.coveredCharacters || 0).toLocaleString("en-US")} of {Number(item.sourceCharacters || 0).toLocaleString("en-US")} characters · {item.mode?.replace(/_/g, " ") || "coverage unavailable"}</p>
              {regions.length > 0 && <p>Regions: {regions.join(" · ")}</p>}
              {labels.length > 0 && <p>Structural span: {labels.join(" · ")}</p>}
            </div>;
          })}
        </details>}
        {domainReviews.length > 0 && <details className="learning-domain-reviews">
          <summary>Authored-fiction domain findings</summary>
          <div>{domainReviews.map((review, reviewIndex) => <article key={`${review.qKey || "domain"}-${reviewIndex}`}>
            <strong>{Q_LABELS[String(review.qKey || "")] || String(review.qKey || "Unknown Q")} · {String(review.status || "insufficient").replace(/_/g, " ")}</strong>
            <p>{review.rationale || "No domain rationale was returned; the domain remained unsupported."}</p>
            {Array.isArray(review.citations) && review.citations.length > 0 && <small>Citations: {review.citations.join(" · ")}</small>}
            {review.qKey === "moral" && Array.isArray(review.moralTreatment) && <small>Narrative treatment: {review.moralTreatment.map((value) => value.replace(/_/g, " ")).join(" · ")}</small>}
          </article>)}</div>
        </details>}
        {related.length > 0 && <div className="learning-evaluation-recommendations">
          <span>Course suggestions</span>
          <ul>{related.slice(0, 4).map((item, itemIndex) => <li key={String(item.recommendation_id || itemIndex)}>
            <strong>{String(item.code || item.title || item.course_id || "Suggested course")}</strong>
            {item.rationale && <span>{String(item.rationale)}</span>}
          </li>)}</ul>
        </div>}
        <details><summary>Technical record</summary><code>{evaluationId}</code>{evaluation.supersedes_evaluation_id && <small>Supersedes {String(evaluation.supersedes_evaluation_id)}</small>}</details>
      </article>;
    })}</div>
  </section>;
}

function CertificateTab({ snapshot }: { snapshot: CivicPortalSnapshot }) {
  const certificate = snapshot.certificate;
  if (!certificate) return <div className="portal-single-panel"><span className="eyebrow">Certificate</span><h2>Pending</h2><p>No authoritative certificate is linked to this civic profile.</p></div>;
  const cert = certificate;

  function downloadCertificateImage() {
    const escape = (text: string) => text.replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;",
    }[character] || character));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1050" viewBox="0 0 1600 1050">
      <rect width="1600" height="1050" fill="#f3e6c8"/><rect x="25" y="25" width="1550" height="1000" fill="none" stroke="#a8782f" stroke-width="5"/>
      <text x="800" y="120" text-anchor="middle" font-family="Georgia" font-size="28" fill="#835d22" letter-spacing="6">THE UTOPIAN SOCIETY</text>
      <text x="800" y="235" text-anchor="middle" font-family="Georgia" font-size="72" fill="#26382f">Certificate of Virtual</text>
      <text x="800" y="315" text-anchor="middle" font-family="Georgia" font-size="72" fill="#26382f">Symbolic Naturalization</text>
      <text x="800" y="440" text-anchor="middle" font-family="Georgia" font-size="64" fill="#174b3d">${escape(cert.civicName)}</text>
      <text x="800" y="510" text-anchor="middle" font-family="Georgia" font-size="25" fill="#5e5749">has demonstrated civic comprehension and entered the voluntary oath freely.</text>
      <g transform="translate(720 565)" fill="none" stroke="#a8782f" stroke-width="9">
        <circle cx="80" cy="30" r="42"/><circle cx="30" cy="80" r="42"/><circle cx="130" cy="80" r="42"/><circle cx="80" cy="130" r="42"/><circle cx="80" cy="80" r="42"/>
      </g>
      <text x="400" y="800" text-anchor="middle" font-family="Georgia" font-size="25" fill="#26382f">${escape(cert.utopianDate)}</text>
      <text x="1200" y="800" text-anchor="middle" font-family="Georgia" font-size="25" fill="#26382f">${escape(cert.gregorianDate)}</text>
      <text x="400" y="890" text-anchor="middle" font-family="Georgia" font-size="25" fill="#26382f">${cert.score}% · Standard met</text>
      <text x="1200" y="890" text-anchor="middle" font-family="Georgia" font-size="25" fill="#26382f">${escape(cert.serial)}</text>
      <text x="800" y="975" text-anchor="middle" font-family="Arial" font-size="17" fill="#756b58">Symbolic recognition only; not legal nationality, identification, visa, or physical residency.</text>
    </svg>`;
    saveBlob(new Blob([svg], { type: "image/svg+xml" }), `${cert.serial}.svg`);
  }

  return <div className="certificate-tab portal-single-panel">
    <div className="printable-certificate">
      <span className="eyebrow">The Utopian Society</span>
      <h2>Certificate of Virtual<br />Symbolic Naturalization</h2>
      <p>Let the living record acknowledge that</p>
      <h3>{certificate.civicName}</h3>
      <p>has demonstrated civic comprehension, entered the voluntary oath freely, and is welcomed as a symbolic citizen.</p>
      <div className="certificate-ring-seal"><span role="img" aria-label="Five interlocking rings of the Utopian Society" /></div>
      <dl>
        <div><dt>Utopian date</dt><dd>{certificate.utopianDate}</dd></div>
        <div><dt>Gregorian reference</dt><dd>{certificate.gregorianDate}</dd></div>
        <div><dt>Assessment</dt><dd>{certificate.score}% · Standard met</dd></div>
        <div><dt>Certificate</dt><dd>{certificate.serial}</dd></div>
      </dl>
      <small>Symbolic recognition only. This certificate is not legal nationality, government identification, a visa, physical residency, or full constitutional citizenship.</small>
    </div>
    <div className="certificate-actions">
      <button onClick={() => window.print()}>Print / save PDF</button>
      <button onClick={downloadCertificateImage}>Download image</button>
    </div>
  </div>;
}
