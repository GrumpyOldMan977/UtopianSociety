export const CIVIC_LEDGER_API = "https://utopian-civic-ledger.utopian-society-civic.workers.dev";

export function civicLedgerApi() {
  const configured = process.env.NEXT_PUBLIC_CIVIC_LEDGER_API?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "/api/civic";
  }
  return CIVIC_LEDGER_API;
}

export type PopulationSummary = {
  active: number;
  independent: number;
  revoked: number;
  totalRecorded: number;
  latestCitizen: null | {
    civicName: string;
    utopianDate: string;
    gregorianDate: string;
  };
  definition: string;
};

export type PublicCitizen = {
  civic_id: string;
  civic_name: string;
  standing: "active" | "independent" | "revoked" | string;
  assessment_score: number;
  utopian_joined_date: string;
  gregorian_joined_date: string;
  joined_at: string;
  exited_at: string | null;
  source_label: string;
  public_profile: boolean;
  profile_slug: string | null;
};

export type PublicCitizenDirectoryEntry = {
  slug: string;
  civicName: string;
  civicTitle: string;
  publicBio: string;
  hasAvatar: boolean;
  civicStanding: string;
  primaryContribution: string;
  profileVisibility: "public";
  updatedAt: string;
};

export type PublicCivicRecognition = {
  recognitionId: string;
  circleKey: string;
  recognitionType: "achievement" | "recognition" | "service" | "office" | string;
  title: string;
  summary: string;
  issuedBy: string;
  issuedAt: string | null;
  utopianDate: string;
  sourceUrl: string | null;
};

export type PublicCivicProfile = {
  slug: string;
  civicName: string;
  civicTitle: string;
  publicBio: string;
  hasAvatar: boolean;
  civicStanding: string;
  primaryContribution: string;
  profileVisibility: "civic" | "public" | string;
  recognitions: PublicCivicRecognition[];
  updatedAt: string;
};

export type LedgerEntry = {
  sequence: number;
  id: string;
  eventKey: string | null;
  eventType: string;
  category: string;
  title: string;
  summary: string;
  actorName: string;
  subjectName: string | null;
  subjectRef: string | null;
  occurredAt: string;
  utopianDate: string;
  gregorianDate: string;
  sourceLabel: string;
  sourceUrl: string | null;
  metadata: Record<string, unknown>;
  supersedesId: string | null;
  previousHash: string;
  integrityHash: string;
  recordedAt: string;
};

export type IssuedCertificate = {
  serial: string;
  civicName: string;
  score: number;
  utopianDate: string;
  gregorianDate: string;
};

export type CertificateIssuance = {
  created: boolean;
  certificate: IssuedCertificate;
  civicId: string;
  ledgerId: string;
  account: null | {
    loginName: string;
    activationRequired: boolean;
    activationToken: string | null;
  };
};

export type CivicLoginResult = {
  activated: boolean;
  credentialUpgraded: boolean;
  civicId: string;
  civicName: string;
  loginName: string;
  sessionToken: string;
  expiresAt: string;
};

export type ContributionPosition = {
  positionId: string;
  title: string;
  sectorKey: string;
  description: string;
  recordedHours: number;
  sepMultiplier: number;
  capacityRequired: string;
  status: string;
  publicSummary: string;
  availableSlots: number;
  qualificationSummary: string;
};

export type ContributionAssignment = {
  assignmentId: string;
  civicId: string;
  positionId: string;
  title: string;
  sectorKey: string;
  status: string;
  recordedHours: number;
  sepMultiplier: number;
  evidenceSummary: string | null;
  acceptedAt: string | null;
  submittedAt: string | null;
  affirmedAt: string | null;
  affirmedBy: string | null;
};

export type BalanceSimulationScenario = {
  scenario_id: string;
  label: string;
  basis_document: string;
  scenario_note: string;
  sustainable_population_capacity: number;
  operational_buffer_percent: number;
  civic_equilibrium_target: number;
  civic_equilibrium_lower: number;
  civic_equilibrium_upper: number;
  status: "illustrative" | "draft" | "retired" | string;
  simulated_at: string;
};

export type BalanceResourceMetric = {
  metric_id: string;
  scenario_id: string;
  domain_key: string;
  label: string;
  capacity_population: number;
  capacity_basis: string;
  reserve_text: string;
  trend_direction: "rising" | "stable" | "falling" | string;
  constraint_text: string;
  status: "stable" | "watch" | "strained" | "critical" | string;
  history: number[];
  methodology: string;
  sort_order: number;
};

export type FtbTradeMetric = {
  metric_id: string;
  snapshot_id: string;
  metric_key: string;
  label: string;
  value_minor: number | null;
  value_percent: number | null;
  value_text: string;
  trend_text: string;
  risk_status: "stable" | "watch" | "strained" | "critical" | string;
  methodology: string;
  sort_order: number;
};

export type FtbProductAdjustment = {
  adjustment_id: string;
  snapshot_id: string;
  product_label: string;
  category: string;
  external_price_minor: number;
  shipping_cost_minor: number;
  adjustment_percent: number;
  final_ccu_micros: number;
  final_ccu: number;
  internal_alternative: string;
  reason: string;
  risk_status: "stable" | "watch" | "strained" | "critical" | string;
  sort_order: number;
};

export type LearningEvidenceContract = {
  contractId: string;
  documentId: string;
  supersedesContractId: string | null;
  contractVersion: number;
  status: "accepted" | "withdrawn";
  documentType: string;
  authorOrIssuer: string;
  relationshipToCitizen: string;
  authorshipState: string;
  namedSubjects: string[];
  fictionalSubjects: string[];
  allowedChannels: Array<"declared" | "demonstrated" | "observed">;
  permittedScope: string[];
  includedSections: string;
  excludedSections: string;
  autobiographicalStatus: string;
  sensitivityClass: string;
  citizenContext: string;
  verificationClass: string;
  identityMatchState: string;
  identityMatchMethod: string;
  identityMatchConfidence: number;
  evidencePeriodStart: string | null;
  evidencePeriodEnd: string | null;
  evidencePeriodPrecision: string;
  evidencePeriodAuthority: string;
  evidencePeriodBasis: string;
  printedDocumentDate: string | null;
  rawExtractionHash: string | null;
  reviewedTranscriptHash: string | null;
  extractionMethod: string;
  pageCount: number | null;
  citizenAttestation: string;
  consentedAt: string;
  createdAt: string;
};

export type PrivateCivicIdentity = {
  configured: boolean;
  legalName: string;
  chosenName: string;
  identityVersion: number;
  variants: Array<{
    variantId: string;
    value: string;
    kind: "former_name" | "initials" | "historical_spelling" | "documented_misspelling" | "other";
    verificationNote: string;
    createdAt: string;
  }>;
  updatedAt: string | null;
};

export type LearningObservation = {
  observationId: string;
  evaluationId: string;
  documentId: string;
  contractId: string;
  actualSubject: string;
  subjectType: string;
  evidenceChannel: "declared" | "demonstrated" | "observed";
  primaryQKey: string;
  secondaryQKey: string | null;
  primarySubdomainKey: string;
  secondarySubdomainKey: string | null;
  secondaryJustification: string;
  sourceFact: string;
  observableFeature: string;
  rubricConnection: string;
  contextualInterpretation: string;
  tenQInference: string;
  limitations: string;
  alternativeExplanations: string;
    scoringRationale: string;
    boundedCitation: string;
  moralTreatment: string[];
  evaluationStatus?: string;
    estimate: number;
  rangeLow: number;
  rangeHigh: number;
  confidence: number;
  evidenceWeight: number;
  evidenceKind: string;
  temporalContext: string;
  evidencePeriodStart: string | null;
  evidencePeriodEnd: string | null;
  admissionStatus: "admitted" | "rejected" | "pending_review" | "excluded_by_citizen";
  rejectionReason: string;
  verificationState: string;
  evaluatorVersion: string;
  policyVersion: string;
  createdAt: string;
};

export type CivicPortalSnapshot = {
  localSimulation: boolean;
  persistence: string;
  aiAllowance: {
    provider: string;
    model: string;
    portraitModel: string;
    configured: boolean;
    available: boolean;
    portraitAvailable: boolean;
    portraitEstimate: number;
    dailyLimit: number;
    protectiveLimit: number;
    used: number;
    remaining: number;
    protectiveRemaining: number;
    percentUsed: number;
    requestCount: number;
    conversionCount: number;
    resetAt: string;
    scopeNote: string;
  };
  profile: {
    civicId: string;
    civicName: string;
    civicTitle: string | null;
    publicBio: string;
    hasAvatar: boolean;
    immigrationStanding: string;
    learningTier: string;
    contributionStatus: string;
    residenceStatus: string;
    profileVisibility: string;
    updatedAt: string;
  };
  certificate: null | {
    civicName: string;
    serial: string;
    standing: string;
    score: number;
    utopianDate: string;
    gregorianDate: string;
    issuedAt: string;
    sourceLabel: string;
  };
  learning: {
    records: Array<Record<string, string | number | null>>;
    evaluations: Array<Record<string, string | number | null>>;
    qScores: Array<Record<string, string | number | null>>;
    profileScores: Array<{
      qKey: string;
      status: "pending" | "domain_limited" | "evidence_supported";
      score: number | null;
      confidence: number;
      rangeLow: number | null;
      rangeHigh: number | null;
      evidenceCount: number;
      confidenceLabel: "Pending" | "Limited" | "Developing" | "Moderate" | "Strong";
      confidenceExplanation: string;
      domainScope: "broad" | "domain_limited";
      domainLabel: string;
      reportedStandardScore: number | null;
      reportedPercentile: number | null;
      normalizedEstimateMethod: string;
      summary: string;
      subdomains?: string[];
      sourceCount?: number;
      channelScores?: Record<string, {
        status: "pending" | "domain_limited" | "evidence_supported";
        score: number | null;
        confidence: number;
        rangeLow: number | null;
        rangeHigh: number | null;
        evidenceCount: number;
        confidenceLabel: string;
        domainLabel: string;
        summary: string;
      }>;
    }>;
    goals: Array<Record<string, string | number | null>>;
    recommendations: Array<Record<string, string | number | null>>;
    documents: ProtectedDocument[];
    evidenceContracts: LearningEvidenceContract[];
    observations: LearningObservation[];
    profileVersions: Array<Record<string, unknown>>;
    challenges: Array<Record<string, string | number | null>>;
    subdomains: Array<Record<string, string | number | null>>;
    policyVersion: string;
    evaluatorVersion: string;
  };
  usu: {
    courses: Array<Record<string, string | number | null>>;
    enrollments: Array<Record<string, string | number | null>>;
  };
  contribution: {
    assignments: ContributionAssignment[];
    openPositions: ContributionPosition[];
  };
  ccu: {
    balance: number;
    updatedAt: string | null;
    flows: Array<{
      flowId: string;
      type: "earned" | "allocated" | "pooled" | "donated" | "returned" | "adjusted" | string;
      amount: number;
      balanceAfter: number;
      source: string;
      purpose: string;
      utopianDate: string;
      occurredAt: string;
    }>;
    transactions: Array<{
      transactionId: string;
      assignmentId: string | null;
      type: string;
      amount: number;
      balanceAfter: number;
      description: string;
      createdAt: string;
    }>;
  };
  residence: null | {
    residenceId: string;
    label: string;
    capacity: number;
    occupied: number;
    accessibility: string[];
    status: string;
    beganAt: string;
  };
  requests: Array<Record<string, unknown>>;
  harmony: {
    harms: Array<Record<string, string | number | null>>;
    findings: Array<Record<string, string | number | null>>;
    restoration: Array<Record<string, string | number | null>>;
    documents: ProtectedDocument[];
  };
  healing: {
    timeline: Array<Record<string, string | number | null>>;
    prescriptions: Array<Record<string, string | number | null>>;
    appointments: Array<Record<string, string | number | null>>;
    documents: ProtectedDocument[];
  };
  balance: {
    livePopulation: number;
    scenario: BalanceSimulationScenario | null;
    resources: BalanceResourceMetric[];
    indicators: Array<Record<string, string | number | null>>;
  };
  ftb: null | {
    snapshot_id: string;
    fiat_currency: string;
    fiat_holdings_minor: number;
    methodology: string;
    measured_at: string;
    simulated: true;
    importSummary: Array<Record<string, unknown>>;
    exportSummary: Array<Record<string, unknown>>;
    metrics: FtbTradeMetric[];
    adjustments: FtbProductAdjustment[];
  };
  ledger: LedgerEntry[];
};

export type ProtectedDocument = {
  document_id: string;
  record_domain: "learning" | "healing" | "harmony";
  consent_scope: string;
  retention_status: string;
  created_at: string;
  source_document_id: string | null;
  derivation_method: "original" | "citizen_reviewed_ocr";
  review_status: "not_required" | "reviewed";
  reviewed_at: string | null;
  extraction_confidence: number | null;
  original_name: string;
  media_type: string;
  byte_size: number;
};

export type LearningAssessmentResult = {
  summary: string;
  confidence: number;
  qScores: Array<{
    qKey: string;
    score: number;
    confidence: number;
    evidenceSummary: string;
    evidenceCitations: string[];
  }>;
  recommendations: Array<{
    courseId: string;
    type: "strengthening" | "advancement" | "goal_based" | "exploration" | "prerequisite_bridge";
    rationale: string;
    confidence: number;
  }>;
  observations?: LearningObservation[];
  evaluationId?: string;
  status?: "completed" | "needs_more_evidence";
  completedAt?: string;
  provider?: string;
  aiAllowance?: CivicPortalSnapshot["aiAllowance"];
  rightsImpact?: "none";
};

export type TickerAnnouncement = {
  announcementId: string;
  label: string;
  href: string | null;
  status: "draft" | "scheduled" | "active" | "expired" | "archived" | string;
  startsAt: string | null;
  endsAt: string | null;
  priority: number;
  sortOrder: number;
  treatment: TickerTreatment;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type TickerTreatment = "standard" | "vellum" | "alternating" | "urgent" | "pulse";

export type TickerSource = {
  sourceId: string;
  sourceKey: string;
  label: string;
  sourceType: "system" | "rss";
  endpointUrl: string | null;
  creditUrl: string | null;
  prefix: string;
  enabled: boolean;
  status: "active" | "paused" | "archived";
  priority: number;
  sortOrder: number;
  treatment: TickerTreatment;
  itemLimit: number;
  refreshMinutes: number;
  builtIn: boolean;
  createdBy: string;
  updatedBy: string;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type TickerFeedItem = {
  itemId: string;
  sourceId: string;
  label: string;
  href: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  current: boolean;
  suppressed: boolean;
  suppressedBy: string | null;
  suppressedAt: string | null;
};

export type ManagedTickerItem = {
  itemId: string;
  recordType: "manual" | "system" | "feed";
  sourceId: string | null;
  sourceLabel: string;
  kind: string;
  label: string;
  href: string | null;
  priority: number;
  sortOrder: number;
  treatment: TickerTreatment;
  status: "live";
};

export type TickerManager = {
  actor: string;
  currentItems: ManagedTickerItem[];
  announcements: TickerAnnouncement[];
  sources: TickerSource[];
  feedItems: TickerFeedItem[];
  ledgerPolicy: string;
};

export type EditorialPublication = {
  publicationId: string;
  wordpressId: number | null;
  slug: string;
  type: "post" | "page" | "announcement" | string;
  title: string;
  status: "draft" | "published" | "archived" | string;
  canonicalUrl: string | null;
  excerpt: string;
  contentMarkdown: string;
  contentHtml: string;
  featuredImage: string | null;
  authorName: string;
  publicationDate: string | null;
  utopianDate: string | null;
  gregorianDate: string | null;
  sourceModifiedAt: string | null;
  synchronizedAt: string | null;
  sourceUrl: string | null;
  readingMinutes: number;
  wordCount: number;
  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};

export type EditorialStatus = {
  localSimulation: boolean;
  productionFrozen: boolean;
  wordpressBridge: {
    mode: string;
    remoteWritesEnabled: boolean;
    purpose: string;
  };
  publicationCounts: Array<{ publication_type: string; status: string; count: number }>;
  announcementCounts: Array<{ status: string; count: number }>;
  syncState: Array<{
    source_key: string;
    cursor_value: string | null;
    last_success_at: string | null;
    last_attempt_at: string | null;
    status: string;
    message: string | null;
  }>;
  recentPublications: EditorialPublication[];
  recentAnnouncements: TickerAnnouncement[];
};

export type EditorialAnalytics = {
  days: number;
  since: string;
  totalViews: number;
  sources: Array<{ source_group: string; source_detail: string; views: number }>;
  paths: Array<{ path: string; views: number }>;
  daily: Array<{ day_utc: string; views: number }>;
  privacy: string;
};

export type SynchronizedPublication = EditorialPublication;

export type WordpressHandoffManifest = {
  manifestVersion: "wordpress-reviewed-handoff-v1";
  generatedAt: string;
  localSimulation: boolean;
  productionFrozen: boolean;
  remoteWritesEnabled: false;
  reviewRequired: true;
  target: string;
  instructions: string;
  count: number;
  publications: Array<{
    publicationId: string;
    type: string;
    title: string;
    slug: string;
    excerpt: string;
    contentMarkdown: string;
    featuredImage: string | null;
    authorName: string;
    proposedPublicationDate: string | null;
    utopianDate: string | null;
    gregorianReference: string | null;
    canonicalUrl: string | null;
    metadata: Record<string, unknown>;
  }>;
};

export class CivicServiceError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "civic_service_error", status = 500) {
    super(message);
    this.name = "CivicServiceError";
    this.code = code;
    this.status = status;
  }
}

async function readCivicJson<T>(response: Response, fallbackMessage: string) {
  const body = await response.text();
  try {
    return JSON.parse(body) as T & { error?: string; code?: string };
  } catch {
    throw new CivicServiceError(
      fallbackMessage,
      "civic_service_response_invalid",
      response.ok ? 502 : response.status,
    );
  }
}

async function civicRequest<T>(path: string, init?: RequestInit, authenticated = false) {
  const sessionToken = authenticated && typeof window !== "undefined"
    ? sessionStorage.getItem("utopia.civicSession")
    : null;
  if (authenticated && !sessionToken) throw new Error("Sign in to open this private civic record.");
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(`${civicLedgerApi()}${path}`, {
    ...init,
    headers: {
      ...(!isFormData && init?.body ? { "Content-Type": "application/json" } : {}),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const result = await readCivicJson<T>(
    response,
    "The civic service returned an unreadable response. No civic record was changed.",
  );
  if (!response.ok) {
    throw new CivicServiceError(
      result.error || "The civic service could not complete this request.",
      result.code,
      response.status,
    );
  }
  return result;
}

function civicSessionToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("utopia.civicSession");
}

async function civicBinary(path: string) {
  const sessionToken = civicSessionToken();
  if (!sessionToken) throw new Error("Sign in to open this private civic record.");
  const response = await fetch(`${civicLedgerApi()}${path}`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(result.error || "The private civic file could not be opened.");
  }
  return response.blob();
}

export function loginCivicAccount(input: { loginName: string; password: string; activationToken?: string }) {
  return civicRequest<CivicLoginResult>("/v3/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logoutLocalCivicAccount() {
  return civicRequest<{ loggedOut: true }>("/v3/auth/logout", { method: "POST", body: "{}" }, true);
}

export function getLocalCivicPortal() {
  return civicRequest<CivicPortalSnapshot>("/v3/portal/demo", undefined, true);
}

export function uploadProfileAvatar(file: File) {
  const body = new FormData();
  body.append("file", file);
  return civicRequest<{ assetId: string; mediaType: string; byteSize: number; uploadedAt: string }>(
    "/v3/profile/avatar",
    { method: "POST", body },
    true,
  );
}

export async function generateProfilePortrait(file: File) {
  const sessionToken = civicSessionToken();
  if (!sessionToken) throw new Error("Sign in before generating a profile portrait.");
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${civicLedgerApi()}/v3/profile/portrait`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
    body,
    cache: "no-store",
  });
  if (!response.ok) {
    const result = await readCivicJson<Record<string, never>>(
      response,
      "The portrait service returned an unreadable response. No profile image was changed.",
    );
    throw new CivicServiceError(
      result.error || "The Renaissance portrait could not be generated.",
      result.code,
      response.status,
    );
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("The portrait generator returned an unreadable response.");
  }
  return response.blob();
}

export function getProfileAvatar() {
  return civicBinary("/v3/profile/avatar");
}

export function getPublicCivicProfile(slug: string) {
  return civicRequest<PublicCivicProfile>(`/v3/public/citizens/${encodeURIComponent(slug)}`);
}

export function getPublicCitizenDirectory() {
  return civicRequest<{ citizens: PublicCitizenDirectoryEntry[] }>("/v3/public/citizens");
}

export function civicProfileSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function publicProfileAvatarUrl(slug: string) {
  return `${civicLedgerApi()}/v3/public/citizens/${encodeURIComponent(slug)}/avatar`;
}

export function savePublicProfilePresentation(input: {
  civicTitle: string;
  publicBio: string;
  profileVisibility: "private" | "civic" | "public";
}) {
  return civicRequest<{
    civicTitle: string | null;
    publicBio: string;
    profileVisibility: string;
    updatedAt: string;
  }>("/v3/profile/public-presentation", {
    method: "PUT",
    body: JSON.stringify(input),
  }, true);
}

export function deleteProfileAvatar() {
  return civicRequest<{ deleted: boolean }>("/v3/profile/avatar", { method: "DELETE" }, true);
}

export function uploadProtectedDocument(
  domain: "learning" | "healing" | "harmony",
  consent: string,
  file: File,
  provenance?: {
    sourceDocumentId: string;
    derivationMethod: "citizen_reviewed_ocr";
    reviewStatus: "reviewed";
    extractionConfidence: number;
  },
) {
  const body = new FormData();
  body.append("domain", domain);
  body.append("consent", consent);
  body.append("file", file);
  if (provenance) {
    body.append("sourceDocumentId", provenance.sourceDocumentId);
    body.append("derivationMethod", provenance.derivationMethod);
    body.append("reviewStatus", provenance.reviewStatus);
    body.append("extractionConfidence", String(provenance.extractionConfidence));
  }
  return civicRequest<{
    documentId: string;
    originalName: string;
    mediaType: string;
    byteSize: number;
    domain: string;
    encrypted: true;
    createdAt: string;
    sourceDocumentId: string | null;
    derivationMethod: "original" | "citizen_reviewed_ocr";
    reviewStatus: "not_required" | "reviewed";
    reviewedAt: string | null;
    extractionConfidence: number | null;
  }>("/v3/documents", { method: "POST", body }, true);
}

export function downloadProtectedDocument(documentId: string, purpose: "export" | "ocr" = "export") {
  return civicBinary(`/v3/documents/${encodeURIComponent(documentId)}/content?purpose=${purpose}`);
}

export function deleteProtectedDocument(documentId: string) {
  return civicRequest<{ deleted: boolean }>(
    `/v3/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE" },
    true,
  );
}

export function acceptContributionPosition(input: { positionId: string; idempotencyKey: string }) {
  return civicRequest<{ created: boolean; assignment: ContributionAssignment }>("/v3/contribution/assignments/accept", {
    method: "POST",
    body: JSON.stringify(input),
  }, true);
}

export function recordContributionTime(
  assignmentId: string,
  input: { minutes: number; workDate: string; description: string },
) {
  return civicRequest<{ created: true; timeEntryId: string; minutes: number; recordedHours: number; title: string }>(
    `/v3/contribution/assignments/${encodeURIComponent(assignmentId)}/time`,
    { method: "POST", body: JSON.stringify(input) },
    true,
  );
}

export function submitContributionEvidence(assignmentId: string, input: { evidenceSummary: string }) {
  return civicRequest<{ created: boolean; status: string }>(`/v3/contribution/assignments/${encodeURIComponent(assignmentId)}/submit`, {
    method: "POST",
    body: JSON.stringify(input),
  }, true);
}

export function affirmContributionEvidence(assignmentId: string, input: { affirmedBy: string; idempotencyKey: string }) {
  return civicRequest<{ created: boolean; transactionId: string; ledgerId: string; amount: number; balanceAfter: number }>(`/v3/contribution/assignments/${encodeURIComponent(assignmentId)}/affirm`, {
    method: "POST",
    body: JSON.stringify(input),
  }, true);
}

export function createLearningGoal(goalText: string) {
  return civicRequest<{ created: true; goalId: string; goalText: string; status: string; createdAt: string }>(
    "/v3/learning/goals",
    { method: "POST", body: JSON.stringify({ goalText }) },
    true,
  );
}

export function resetLearningProfile() {
  return civicRequest<{
    reset: true;
    resetAt: string;
    removed: Record<string, number>;
    retained: {
      protectedDocuments: true;
      reviewedOcrTranscripts: true;
      evidenceContracts: true;
      learningGoals: true;
    };
  }>("/v3/learning/reset", {
    method: "POST",
    body: JSON.stringify({ confirmation: "RESET MY LEARNING PROFILE" }),
  }, true);
}

export function getPrivateCivicIdentity() {
  return civicRequest<PrivateCivicIdentity>(
    "/v3/profile/private-identity",
    { method: "GET" },
    true,
  );
}

export function savePrivateCivicIdentity(input: {
  legalName: string;
  chosenName: string;
  currentPassword: string;
  variants: Array<{
    value: string;
    kind: "former_name" | "initials" | "historical_spelling" | "documented_misspelling" | "other";
    verificationNote: string;
  }>;
  attested: true;
}) {
  return civicRequest<{
    saved: true;
    identity: PrivateCivicIdentity;
    privacy: string;
  }>("/v3/profile/private-identity", {
    method: "PUT",
    body: JSON.stringify(input),
  }, true);
}

export function saveLearningEvidenceContract(input: {
  documentId: string;
  documentType: string;
  authorOrIssuer: string;
  relationshipToCitizen: string;
  authorshipState: string;
  namedSubjects: string[];
  fictionalSubjects: string[];
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
  accepted: true;
}) {
  return civicRequest<{ created: true; contract: LearningEvidenceContract }>(
    "/v3/learning/evidence-contracts",
    { method: "POST", body: JSON.stringify(input) },
    true,
  );
}

export function challengeLearningObservation(input: {
  observationId: string;
  challengeType: "correction" | "context" | "dispute" | "exclude" | "reconsideration" | "counterevidence";
  citizenStatement: string;
}) {
  return civicRequest<{
    created: true;
    challengeId: string;
    observationId: string;
    challengeType: string;
    excludedFromSynthesis: boolean;
    status: "open";
    createdAt: string;
  }>("/v3/learning/challenges", {
    method: "POST",
    body: JSON.stringify(input),
  }, true);
}

export function requestLearningAssessment(input: {
  documentIds: string[];
  goalText: string;
  consent: true;
}) {
  const sessionToken = civicSessionToken();
  if (!sessionToken) return Promise.reject(new Error("Sign in to open this private civic record."));
  return fetch("/api/learning/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify(input),
    cache: "no-store",
  }).then(async (response) => {
    const result = await readCivicJson<LearningAssessmentResult>(
      response,
      "The automated Learning service returned an unreadable response. No Learning record was changed.",
    );
    if (!response.ok) {
      throw new CivicServiceError(
        result.error || "The automated Learning assessment could not be completed.",
        result.code,
        response.status,
      );
    }
    return result;
  });
}

export function requestUsuEnrollment(courseId: string) {
  return civicRequest<{ created: true; courseId: string; courseCode: string; status: string; unmetPrerequisites: string[] }>(
    "/v3/usu/enrollments",
    { method: "POST", body: JSON.stringify({ courseId }) },
    true,
  );
}

export function requestHealingAppointment(input: {
  careDomain: string;
  privateReason: string;
  preferredWindow: string;
}) {
  return civicRequest<{ created: true; appointmentId: string; status: string; createdAt: string }>(
    "/v3/healing/appointments",
    { method: "POST", body: JSON.stringify(input) },
    true,
  );
}

export function reportHarmonyHarm(input: {
  publicSummary: string;
  privateDetails: string;
  respondingCivicId?: string;
}) {
  return civicRequest<{ created: true; harmId: string; status: string; createdAt: string }>(
    "/v3/harmony/harms",
    { method: "POST", body: JSON.stringify(input) },
    true,
  );
}

export function getLocalEditorialStatus() {
  return civicRequest<EditorialStatus>("/v3/editorial/status", undefined, true);
}

export function getLocalEditorialAccess() {
  return civicRequest<{ authorized: true; civicId: string; loginName: string }>(
    "/v3/editorial/access",
    undefined,
    true,
  );
}

export function getLocalWordpressHandoff() {
  return civicRequest<WordpressHandoffManifest>("/v3/editorial/wordpress-handoff", undefined, true);
}

export function synchronizeWordpressPublications() {
  return civicRequest<{ synchronized: number; synchronizedAt: string; newest: string; remoteWrites: false }>(
    "/v3/editorial/sync-wordpress",
    { method: "POST", body: "{}" },
    true,
  );
}

export function getEditorialAnalytics(days = 30) {
  return civicRequest<EditorialAnalytics>(`/v3/editorial/analytics?days=${days}`, undefined, true);
}

export function getTickerManager() {
  return civicRequest<TickerManager>("/v4/editorial/ticker", undefined, true);
}

export type TickerAnnouncementInput = {
  label: string;
  href?: string | null;
  status: "draft" | "scheduled" | "active" | "paused" | "expired" | "archived";
  startsAt?: string | null;
  endsAt?: string | null;
  priority: number;
  sortOrder: number;
  treatment: TickerTreatment;
};

export function createLocalTickerAnnouncement(input: {
  label: string;
  href?: string | null;
  status: "draft" | "scheduled" | "active" | "paused";
  startsAt?: string | null;
  endsAt?: string | null;
  priority: number;
  sortOrder: number;
  treatment: TickerTreatment;
}) {
  return civicRequest<{ created: true; announcement: TickerAnnouncement }>("/v4/editorial/ticker/announcements", {
    method: "POST",
    body: JSON.stringify(input),
  }, true);
}

export function updateTickerAnnouncement(announcementId: string, input: Partial<TickerAnnouncementInput>) {
  return civicRequest<{ updated: true; announcement: TickerAnnouncement }>(`/v4/editorial/ticker/announcements/${encodeURIComponent(announcementId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, true);
}

export type TickerSourceInput = {
  label: string;
  endpointUrl: string;
  creditUrl?: string | null;
  prefix: string;
  enabled: boolean;
  status: "active" | "paused" | "archived";
  priority: number;
  sortOrder: number;
  treatment: TickerTreatment;
  itemLimit: number;
  refreshMinutes: number;
};

export function createTickerSource(input: TickerSourceInput) {
  return civicRequest<{ created: true; source: TickerSource }>("/v4/editorial/ticker/sources", {
    method: "POST",
    body: JSON.stringify(input),
  }, true);
}

export function updateTickerSource(sourceId: string, input: Partial<TickerSourceInput>) {
  return civicRequest<{ updated: true; source: TickerSource }>(`/v4/editorial/ticker/sources/${encodeURIComponent(sourceId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, true);
}

export function refreshTickerSource(sourceId: string) {
  return civicRequest<{ refreshed: boolean; count?: number; reason?: string }>(`/v4/editorial/ticker/sources/${encodeURIComponent(sourceId)}/refresh`, {
    method: "POST",
    body: "{}",
  }, true);
}

export function setTickerFeedItemSuppressed(itemId: string, suppressed: boolean) {
  return civicRequest<{ updated: boolean; item: TickerFeedItem }>(`/v4/editorial/ticker/feed-items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify({ suppressed }),
  }, true);
}

export function createLocalEditorialDraft(input: {
  title: string;
  slug: string;
  type: "post" | "page" | "announcement";
  excerpt: string;
  contentMarkdown: string;
  featuredImage?: string;
  authorName: string;
}) {
  return civicRequest<{ created: true; publication: EditorialPublication }>("/v3/editorial/publications", {
    method: "POST",
    body: JSON.stringify(input),
  }, true);
}

export async function issueNaturalizationCertificate(input: {
  civicName: string;
  signature: string;
  oathAccepted: boolean;
  assessmentVersion: "immigration-v1" | "immigration-v2";
  answers?: number[];
  assessmentAttemptId?: string;
  issuanceKey: string;
  turnstileToken?: string;
}) {
  const response = await fetch(`${civicLedgerApi()}/v1/immigration/issue-certificate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const result = await response.json() as CertificateIssuance & { error?: string };
  if (!response.ok) throw new Error(result.error || "The civic record could not issue this certificate.");
  return result;
}

export async function startImmigrationAssessment() {
  const response = await fetch(`${civicLedgerApi()}/v2/immigration/assessment/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  const result = await response.json() as import("./immigration-assessment").ImmigrationAssessmentAttempt & { error?: string };
  if (!response.ok) throw new Error(result.error || "The civic server could not prepare an assessment.");
  return result;
}

export async function scoreImmigrationAssessment(input: {
  attemptId: string;
  answers: Array<{ questionId: string; optionIndex: number }>;
  easterResponse: string;
}) {
  const response = await fetch(`${civicLedgerApi()}/v2/immigration/assessment/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const result = await response.json() as import("./immigration-assessment").ImmigrationAssessmentResult & { error?: string };
  if (!response.ok) throw new Error(result.error || "The civic server could not score this assessment.");
  return result;
}
