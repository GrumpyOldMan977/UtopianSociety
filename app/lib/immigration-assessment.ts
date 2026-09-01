export const immigrationDomains = [
  { key: "founding-covenant", label: "Founding Covenant" },
  { key: "constitutional-rights-duties", label: "Constitutional Rights and Duties" },
  { key: "governance-circle-system", label: "Governance and Circle System" },
  { key: "learning-contribution", label: "Learning and Contribution" },
  { key: "care-consent-autonomy", label: "Care, Consent, and Bodily Autonomy" },
  { key: "harm-restoration-harmony", label: "Harm, Restoration, and Harmony" },
  { key: "stewardship-capacity-balance", label: "Stewardship, Capacity, and Balance" },
  { key: "immigration-civic-standing", label: "Immigration and Civic Standing" },
  { key: "time-continuity-observance", label: "Time, Continuity, and Observance" },
  { key: "public-civic-practice", label: "Public Civic Practice" },
] as const;

export const ASSESSMENT_PASSING_SCORE = 90;
export const CATEGORY_PASSING_SCORE = 7;
export const SCORED_QUESTION_COUNT = 100;
export const TOTAL_QUESTION_COUNT = 101;

export type ImmigrationAssessmentQuestion = {
  ordinal: number;
  id: string;
  categoryKey: string;
  category: string;
  prompt: string;
  options?: string[];
  responseType?: "text";
  source?: { href: string; section: string };
  scored: boolean;
};

export type ImmigrationAssessmentAttempt = {
  attemptId: string;
  version: "immigration-v2";
  purpose: "naturalization" | "practice";
  startedAt: string;
  expiresAt: string;
  selectionFingerprint: string;
  requirements: {
    scoredQuestions: number;
    overallPassingScore: number;
    questionsPerCategory: number;
    categoryPassingScore: number;
  };
  categories: Array<{ key: string; label: string }>;
  questions: ImmigrationAssessmentQuestion[];
};

export type ImmigrationAssessmentResult = {
  attemptId: string;
  version: "immigration-v2";
  purpose: "naturalization" | "practice";
  score: number;
  passed: boolean;
  categoryResults: Array<{ key: string; label: string; correct: number; total: number; passed: boolean }>;
  requirements: { overallPassingScore: number; categoryPassingScore: number };
  easterEgg: { scored: false; recognized: boolean; response: string };
  answersRetained: false;
};
