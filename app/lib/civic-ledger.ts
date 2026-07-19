export const CIVIC_LEDGER_API = "https://utopian-civic-ledger.utopian-society-civic.workers.dev";

export type PopulationSummary = {
  active: number;
  independent: number;
  revoked: number;
  totalRecorded: number;
  latestCitizen: null | {
    civicName: string;
    certificateNumber: string;
    utopianDate: string;
    gregorianDate: string;
  };
  definition: string;
};

export type PublicCitizen = {
  civic_id: string;
  civic_name: string;
  certificate_number: string;
  standing: "active" | "independent" | "revoked" | string;
  assessment_score: number;
  utopian_joined_date: string;
  gregorian_joined_date: string;
  joined_at: string;
  exited_at: string | null;
  source_label: string;
};

export type LedgerEntry = {
  sequence: number;
  id: string;
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
};

export async function issueNaturalizationCertificate(input: {
  civicName: string;
  signature: string;
  oathAccepted: boolean;
  assessmentVersion: "immigration-v1";
  answers: number[];
  issuanceKey: string;
  turnstileToken?: string;
}) {
  const response = await fetch(`${CIVIC_LEDGER_API}/v1/immigration/issue-certificate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const result = await response.json() as CertificateIssuance & { error?: string };
  if (!response.ok) throw new Error(result.error || "The civic record could not issue this certificate.");
  return result;
}
