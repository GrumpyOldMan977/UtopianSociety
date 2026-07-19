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

