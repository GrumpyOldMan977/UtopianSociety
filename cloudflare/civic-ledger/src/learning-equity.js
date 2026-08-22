export const LEARNING_POLICY_VERSION = "learning-equity-v5";
export const LEARNING_EVALUATOR_VERSION = "learning-equity-evaluator-v5";

export const LEARNING_Q_KEYS = [
  "intellectual", "emotional", "social", "creative", "adaptability",
  "moral", "physical", "natural", "technological", "learning",
];

export const LEARNING_CHANNELS = ["declared", "demonstrated", "observed"];

export const AUTHORED_FICTION_Q_KEYS = [
  "intellectual", "emotional", "social", "creative", "natural",
  "technological", "learning", "moral",
];

export const AUTHORED_FICTION_MORAL_TREATMENTS = [
  "harm_depicted", "harm_endorsed", "harm_challenged", "harm_romanticized",
  "harm_as_consequence_free_entertainment", "harm_as_perseverance",
  "harm_as_restoration", "harm_as_responsibility", "harm_as_social_failure",
  "consent_and_autonomy", "power_and_accountability", "not_applicable",
];

export const LEARNING_EVIDENCE_KINDS = [
  "standardized_assessment", "formal_academic", "occupational_history",
  "authored_work", "observed_behavior", "self_report", "contextual", "insufficient",
];

export const LEARNING_TEMPORAL_CONTEXTS = [
  "adult_current", "adult_historical", "adolescent", "childhood", "undated",
];

export const LEARNING_SUBDOMAINS = {
  intellectual: ["reasoning", "knowledge_integration", "critical_evaluation"],
  emotional: ["emotional_perception", "emotional_regulation", "reflective_awareness"],
  social: ["communication", "perspective_coordination", "cooperation"],
  creative: ["original_synthesis", "craft_development", "generative_range"],
  adaptability: ["strategy_revision", "transfer", "recovery_learning"],
  physical: ["embodied_skill", "somatic_awareness", "safe_practice"],
  natural: ["ecological_observation", "systems_stewardship", "pattern_classification"],
  technological: ["tool_fluency", "systems_reasoning", "technical_creation"],
  learning: ["acquisition", "retention", "application", "transfer"],
  moral: [
    "ethical_perception", "perspective_taking", "consent_autonomy", "harm_recognition",
    "proportionality", "fairness_consistency", "epistemic_integrity", "accountability",
    "restorative_capacity", "responsible_power", "epistemic_humility", "respect_personhood",
  ],
};

const KIND_FACTORS = {
  standardized_assessment: 1,
  formal_academic: 0.85,
  occupational_history: 0.8,
  authored_work: 0.75,
  observed_behavior: 0.7,
  self_report: 0.5,
  contextual: 0.35,
  insufficient: 0,
};

const TIME_FACTORS = {
  adult_current: 1,
  adult_historical: 0.9,
  adolescent: 0.65,
  childhood: 0.4,
  undated: 0.55,
};

const CHANNEL_FACTORS = {
  declared: 0.55,
  demonstrated: 0.85,
  observed: 0.85,
};

// The evaluator identifies and calibrates an observation. It does not decide
// how much civic weight that observation receives. Provenance weight remains a
// transparent policy decision owned by Learning and applied deterministically.
const VERIFICATION_FACTORS = {
  externally_verified: 1,
  directly_observed: 0.95,
  citizen_reviewed: 0.8,
  self_submitted: 0.65,
};

// Document type determines what the artifact can evidence and how strongly a
// self-submitted artifact contributes.  These factors do not change an AI
// estimate; they only limit the deterministic civic weight applied later.
const DOCUMENT_TYPE_FACTORS = {
  authored_autobiographical_essay: 1,
  authored_non_autobiographical_essay: 0.9,
  authored_fiction: 0.75,
  technical_project: 0.95,
  creative_portfolio: 0.85,
  personal_reflection: 0.8,
  collaborative_work: 0.75,
};

export const LEARNING_DOCUMENT_TYPE_POLICIES = Object.freeze({
  authored_fiction: Object.freeze({
    subject: "The citizen-author as maker of the complete literary artifact, never a character, narrator, or fictional event.",
    focus: "Whole-work narrative architecture, sustained continuity, craft, original synthesis, modeled systems, thematic development, and the work's ethical framing. Depiction is not endorsement.",
    allowedEvidence: "Demonstrated authorial features only. Character behavior may be quoted as source material but cannot itself become evidence about the citizen.",
    coverage: "Every part of a long work must be processed before document-level observations are synthesized.",
    weightClass: "moderate authored-artifact evidence",
  }),
  authored_autobiographical_essay: Object.freeze({
    subject: "The citizen-author as writer; independently unverified lived claims remain declared rather than observed.",
    focus: "Literary craft, reflective interpretation, reasoning, synthesis, communication, knowledge integration, and clearly attributable self-report.",
    allowedEvidence: "Demonstrated craft may be scored; lived claims use the declared channel unless independently corroborated.",
    coverage: "Judge the complete essay and preserve the boundary between present authorial skill and historical recollection.",
    weightClass: "high-relevance authored evidence",
  }),
  authored_non_autobiographical_essay: Object.freeze({
    subject: "The citizen-author as writer and reasoner, not every person or institution discussed in the essay.",
    focus: "Literary craft, argument structure, critical evaluation, knowledge integration, synthesis, sourcing, and explicitly expressed ethical reasoning.",
    allowedEvidence: "Demonstrated authorial work only; factual assertions remain claims unless verified by the source itself or an external process.",
    coverage: "Judge the complete essay, including its reasoning chain and conclusion.",
    weightClass: "moderate-high authored evidence",
  }),
  default: Object.freeze({
    subject: "The citizen only where the accepted evidence contract makes that attribution permissible.",
    focus: "Use the document's accepted contract, source type, evidence channel, permitted scope, and verification status.",
    allowedEvidence: "Do not infer beyond the source-bound capacity actually demonstrated, declared, or observed.",
    coverage: "Use all material required to interpret the bounded evidence fairly.",
    weightClass: "contract-governed evidence",
  }),
});

export function learningDocumentTypePolicy(documentType) {
  return LEARNING_DOCUMENT_TYPE_POLICIES[documentType]
    || LEARNING_DOCUMENT_TYPE_POLICIES.default;
}

function authoredStructuralUnits(source) {
  const headingPattern = /^(?:#{1,6}\s*)?((?:chapter|part|section)\s+(?:\d+|[ivxlcdm]+|[a-z]+)(?:(?:\s*[:-]\s*|\s+)[^\n]*)?|interlude(?:\s*[:-]\s*[^\n]*)?)\s*$/gim;
  const headings = [...source.matchAll(headingPattern)].map((match) => ({
    start: Number(match.index || 0),
    label: String(match[1] || match[0] || "").trim(),
  }));
  if (!headings.length) {
    return [{ label: "Complete work", start: 0, end: source.length }];
  }
  const units = [];
  if (headings[0].start > 0 && source.slice(0, headings[0].start).trim()) {
    units.push({ label: "Opening material", start: 0, end: headings[0].start });
  }
  for (let index = 0; index < headings.length; index += 1) {
    units.push({
      label: headings[index].label,
      start: headings[index].start,
      end: headings[index + 1]?.start ?? source.length,
    });
  }
  return units;
}

function splitAuthoredRange(source, start, end, safeMax, safeMin) {
  const ranges = [];
  let cursor = start;
  while (cursor < end) {
    const hardEnd = Math.min(end, cursor + safeMax);
    let sliceEnd = hardEnd;
    if (hardEnd < end) {
      const paragraphBreak = source.lastIndexOf("\n\n", hardEnd);
      const lineBreak = source.lastIndexOf("\n", hardEnd);
      sliceEnd = paragraphBreak >= cursor + safeMin
        ? paragraphBreak + 2
        : lineBreak >= cursor + safeMin ? lineBreak + 1 : hardEnd;
    }
    ranges.push({ start: cursor, end: Math.max(cursor + 1, sliceEnd) });
    cursor = Math.max(cursor + 1, sliceEnd);
  }
  return ranges;
}

/**
 * Split a long authored artifact without dropping or duplicating text.  Breaks
 * prefer paragraph boundaries, while labels preserve the most recent chapter,
 * part, section, or interlude for auditable downstream citations.
 */
export function segmentAuthoredWork(sourceText, { maxChars = 28_000, minChars = 8_000 } = {}) {
  const source = String(sourceText || "").replace(/\0/g, "");
  if (!source) return [];
  const safeMax = Math.max(4_000, Math.floor(Number(maxChars) || 28_000));
  const safeMin = Math.min(safeMax, Math.max(1_000, Math.floor(Number(minChars) || 8_000)));
  const units = authoredStructuralUnits(source);
  const segments = [];
  units.forEach((unit, unitIndex) => {
    const ranges = splitAuthoredRange(source, unit.start, unit.end, safeMax, safeMin);
    ranges.forEach((range, chunkIndex) => {
      const relativePosition = units.length === 1 ? 0.5 : unitIndex / (units.length - 1);
      segments.push({
        segmentId: `segment-${String(segments.length + 1).padStart(3, "0")}`,
        structuralUnitId: `unit-${String(unitIndex + 1).padStart(3, "0")}`,
        structuralLabel: unit.label,
        structuralUnitIndex: unitIndex + 1,
        structuralUnitCount: units.length,
        chunkIndex: chunkIndex + 1,
        chunkCount: ranges.length,
        coverageRegion: relativePosition < 0.34 ? "beginning" : relativePosition > 0.66 ? "ending" : "middle",
        start: range.start,
        end: range.end,
        text: source.slice(range.start, range.end),
      });
    });
  });
  return segments;
}

export function learningContractScoreability(contract) {
  if (contract?.sensitivityClass === "clinical_restricted"
    || contract?.documentType === "clinical_context") {
    return {
      scoreBearing: false,
      reason: "Clinical evidence may be retained as protected context, but it cannot raise or lower a Ten-Q score.",
    };
  }
  if (contract?.documentType === "context_only") {
    return {
      scoreBearing: false,
      reason: "This contract classifies the document as context only, so it cannot raise or lower a Ten-Q score.",
    };
  }
  if (!Array.isArray(contract?.permittedScope) || contract.permittedScope.length === 0) {
    return {
      scoreBearing: false,
      reason: "The accepted contract authorizes no Ten-Q domains for evaluation.",
    };
  }
  if (!Array.isArray(contract?.allowedChannels) || contract.allowedChannels.length === 0) {
    return {
      scoreBearing: false,
      reason: "The accepted contract authorizes no evidence channel for evaluation.",
    };
  }
  return { scoreBearing: true, reason: null };
}

const DOCUMENT_TYPES = [
  "standardized_assessment", "school_record", "employment_record",
  "certification", "authored_autobiographical_essay",
  "authored_non_autobiographical_essay", "authored_fiction",
  "technical_project", "creative_portfolio", "personal_reflection",
  "third_party_evaluation", "collaborative_work", "clinical_context",
  "context_only", "other",
];

const AUTHORED_TYPES = new Set([
  "authored_autobiographical_essay", "authored_non_autobiographical_essay",
  "authored_fiction", "technical_project", "creative_portfolio",
  "personal_reflection", "collaborative_work",
]);

const CLINICAL_PATTERN = /\b(?:CAARS|MMPI|MCMI|SRS|ADOS|IVA-?2|DSM|ADHD|autis(?:m|tic)|diagnos(?:is|ed|tic)|depress(?:ion|ive)|anxiety disorder|trauma disorder|psychiatric condition|personality disorder)\b/i;
const LEGAL_HARDSHIP_PATTERN = /\b(?:arrest|conviction|criminal|felony|misdemeanor|homeless|poverty|bankrupt|incarcerat|court record|legal history)\b/i;

function clamp(value, minimum, maximum, fallback = minimum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function text(value, maximum = 1200) {
  const result = typeof value === "string" ? value.trim().replace(/\r\n?/g, "\n") : "";
  return result.slice(0, maximum);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const AUTHORIAL_SUBJECT_PATTERN = /\b(?:author|citizen-author|authored)\b/i;
const AUTHORIAL_CONSTRUCTION_PATTERN = /\b(?:authored artifact|literary (?:artifact|work|construction|craft)|work as a whole|narrative (?:architecture|structure|craft|construction|design|continuity|voice|framing)|craft|composition|thematic (?:development|pattern|framing)|worldbuilding|sustained continuity|authorial (?:choice|choices|construction|craft|design|framing|modeling|synthesis))\b/i;

export function authoredFictionObservationBoundary(input, contract, citizenLabel = "the citizen") {
  if (contract?.documentType !== "authored_fiction") return { valid: true, reason: null };
  const actualSubject = normalizedIdentityText(input?.actualSubject);
  const citizen = normalizedIdentityText(citizenLabel);
  const attestedAuthor = normalizedIdentityText(contract?.authorOrIssuer);
  const authorMatched = Boolean(actualSubject)
    && (actualSubject === citizen || actualSubject === attestedAuthor);
  if (!authorMatched) {
    return {
      valid: false,
      reason: "Authored fiction must identify the verified citizen-author as the actual subject; a character, narrator, abbreviated fictional identity, or unresolved subject cannot be scored.",
    };
  }
  const authorialExplanation = [
    input?.observableFeature,
    input?.rubricConnection,
    input?.tenQInference,
    input?.scoringRationale,
  ].map((value) => String(value || "")).join(" ");
  const inference = String(input?.tenQInference || "");
  if (!AUTHORIAL_SUBJECT_PATTERN.test(authorialExplanation)
    || !AUTHORIAL_CONSTRUCTION_PATTERN.test(authorialExplanation)
    || !AUTHORIAL_SUBJECT_PATTERN.test(inference)
    || !AUTHORIAL_CONSTRUCTION_PATTERN.test(inference)) {
    return {
      valid: false,
      reason: "The observation does not keep its inference anchored to the citizen-author's demonstrated construction of the literary work.",
    };
  }
  const structuralLabels = asArray(contract?.completeWorkStructuralLabels)
    .map((value) => text(value, 240))
    .filter(Boolean);
  if (structuralLabels.length > 1) {
    const normalizedCitation = normalizedIdentityText(input?.boundedCitation);
    const citedLabels = structuralLabels.filter((label) => {
      const normalizedLabel = normalizedIdentityText(label);
      return normalizedLabel && normalizedCitation.includes(normalizedLabel);
    });
    const requiredCitationCount = Math.min(3, structuralLabels.length);
    const wholeWorkExplanation = [
      input?.observableFeature,
      input?.rubricConnection,
      input?.contextualInterpretation,
      input?.tenQInference,
      input?.scoringRationale,
    ].map((value) => String(value || "")).join(" ");
    const distributedPattern = /\b(?:across|throughout|beginning|middle|ending|whole[- ]work|multiple (?:sections|chapters|parts)|recurring|repeated|sustained|development over)\b/i;
    if (citedLabels.length < requiredCitationCount || !distributedPattern.test(wholeWorkExplanation)) {
      return {
        valid: false,
        reason: `A complete-work fiction claim requires an explicit cross-work pattern and citations to at least ${requiredCitationCount} separated structural regions; a single scene cannot establish whole-work capacity.`,
      };
    }
  }
  return { valid: true, reason: null };
}

function normalizedIdentityText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function identityTokens(value) {
  return normalizedIdentityText(value).split(" ").filter(Boolean);
}

const ALL_LEARNING_SUBDOMAINS = [...new Set(Object.values(LEARNING_SUBDOMAINS).flat())];

function withinOneEdit(left, right) {
  if (left === right) return true;
  if (Math.abs(left.length - right.length) > 1) return false;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    let rowMinimum = current[0];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1]
        + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      const distance = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        substitution,
      );
      current.push(distance);
      rowMinimum = Math.min(rowMinimum, distance);
    }
    if (rowMinimum > 1) return false;
    previous = current;
  }
  return previous[right.length] <= 1;
}

export function matchPrivateIdentityText(documentText, candidates) {
  const usableCandidates = asArray(candidates)
    .map((candidate) => ({
      value: text(candidate?.value, 240),
      reference: text(candidate?.reference, 180) || "private identity",
    }))
    .filter((candidate) => normalizedIdentityText(candidate.value));
  const haystack = ` ${normalizedIdentityText(documentText)} `;
  for (const candidate of usableCandidates) {
    const normalized = normalizedIdentityText(candidate.value);
    if (haystack.includes(` ${normalized} `)) {
      return {
        state: "matched",
        method: `Exact normalized match against ${candidate.reference} was performed locally; the private name was not sent to AI.`,
        confidence: 1,
      };
    }
  }
  const documentTokens = new Set(identityTokens(documentText));
  for (const candidate of usableCandidates) {
    const tokens = identityTokens(candidate.value);
    if (tokens.length >= 2 && tokens.every((token) => documentTokens.has(token))) {
      return {
        state: "matched",
        method: `Order-independent token match against ${candidate.reference} was performed locally; the private name was not sent to AI.`,
        confidence: 0.94,
      };
    }
    const familyName = tokens.at(-1);
    const initials = tokens.slice(0, -1).map((token) => token[0]).filter(Boolean);
    const familyMatched = familyName && documentTokens.has(familyName);
    const initialMatched = !initials.length || initials.some((initial) => documentTokens.has(initial));
    if (familyMatched && initialMatched) {
      return {
        state: "probable",
        method: `Family name and at least one initial matched locally against ${candidate.reference}.`,
        confidence: 0.72,
      };
    }
    const approximateFamilyMatch = familyName && [...documentTokens]
      .some((token) => token.length >= 4 && withinOneEdit(token, familyName));
    if (approximateFamilyMatch && initialMatched) {
      return {
        state: "probable",
        method: `A one-character OCR-tolerant family-name match and an initial matched locally against ${candidate.reference}. Citizen confirmation remains appropriate.`,
        confidence: 0.64,
      };
    }
  }
  return {
    state: "mismatch_review",
    method: "No configured legal name or verified variation was found in the extracted text. Citizen review is required; this is not proof of fraud.",
    confidence: 0,
  };
}

export function matchContractAttestedIdentity(contract, candidates) {
  if (!contract || !["citizen_author", "co_author"].includes(contract.authorshipState)) return null;
  if (!text(contract.citizenAttestation, 1000) || !text(contract.authorOrIssuer, 240)) return null;
  const authorMatch = matchPrivateIdentityText(contract.authorOrIssuer, candidates);
  const attestedProbableMatch = authorMatch.state === "probable" && authorMatch.confidence >= 0.7;
  if (authorMatch.state !== "matched" && !attestedProbableMatch) return null;
  return {
    state: "matched",
    method: attestedProbableMatch
      ? "The accepted self-authorship contract names a high-confidence private identity variation and carries the citizen's authorship attestation. This binds identity for evaluation without claiming independent documentary verification."
      : "The accepted self-authorship contract names a verified private identity. This is a citizen-attested identity binding, not independent proof printed in the document body.",
    confidence: Math.min(attestedProbableMatch ? 0.8 : 0.88, authorMatch.confidence),
  };
}

function validQ(value) {
  return LEARNING_Q_KEYS.includes(value) ? value : null;
}

function validSubdomain(qKey, value) {
  return qKey && LEARNING_SUBDOMAINS[qKey]?.includes(value) ? value : null;
}

export const LEARNING_OBSERVATION_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    observations: {
      type: "array",
      maxItems: 30,
      items: {
        type: "object",
        properties: {
          documentId: { type: "string" },
          actualSubject: { type: "string" },
          subjectType: {
            type: "string",
            enum: ["citizen", "third_party", "fictional_character", "institution", "unknown"],
          },
          evidenceChannel: { type: "string", enum: LEARNING_CHANNELS },
          primaryQKey: { type: "string", enum: LEARNING_Q_KEYS },
          secondaryQKey: { type: "string", enum: ["", ...LEARNING_Q_KEYS] },
          primarySubdomainKey: { type: "string", enum: ALL_LEARNING_SUBDOMAINS },
          secondarySubdomainKey: { type: "string", enum: ["", ...ALL_LEARNING_SUBDOMAINS] },
          secondaryJustification: { type: "string" },
          sourceFact: { type: "string" },
          observableFeature: { type: "string" },
          rubricConnection: { type: "string" },
          contextualInterpretation: { type: "string" },
          tenQInference: { type: "string" },
          limitations: { type: "string" },
          alternativeExplanations: { type: "string" },
          scoringRationale: { type: "string" },
          boundedCitation: { type: "string" },
          estimate: { type: "integer", minimum: 0, maximum: 100 },
          rangeLow: { type: "integer", minimum: 0, maximum: 100 },
          rangeHigh: { type: "integer", minimum: 0, maximum: 100 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidenceKind: { type: "string", enum: LEARNING_EVIDENCE_KINDS },
          temporalContext: { type: "string", enum: LEARNING_TEMPORAL_CONTEXTS },
          admissionStatus: {
            type: "string",
            enum: ["admitted", "rejected", "pending_review"],
          },
          rejectionReason: { type: "string" },
          moralTreatment: {
            type: "array",
            maxItems: 5,
            items: { type: "string", enum: AUTHORED_FICTION_MORAL_TREATMENTS },
          },
        },
        required: [
          "documentId", "actualSubject", "subjectType", "evidenceChannel",
          "primaryQKey", "secondaryQKey", "primarySubdomainKey",
          "secondarySubdomainKey", "secondaryJustification", "sourceFact",
          "observableFeature", "rubricConnection", "contextualInterpretation",
          "tenQInference", "limitations", "alternativeExplanations",
          "scoringRationale", "boundedCitation",
          "estimate", "rangeLow", "rangeHigh", "confidence",
          "evidenceKind", "temporalContext", "admissionStatus", "rejectionReason",
          "moralTreatment",
        ],
        additionalProperties: false,
      },
    },
    recommendations: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          courseId: { type: "string" },
          type: {
            type: "string",
            enum: ["strengthening", "advancement", "goal_based", "exploration", "prerequisite_bridge"],
          },
          rationale: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["courseId", "type", "rationale", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "confidence", "observations", "recommendations"],
  additionalProperties: false,
};

export function normalizeEvidenceContract(input, documentId) {
  const allowedChannels = [...new Set(asArray(input?.allowedChannels)
    .filter((value) => LEARNING_CHANNELS.includes(value)))];
  const permittedScope = [...new Set(asArray(input?.permittedScope)
    .filter((value) => LEARNING_Q_KEYS.includes(value)))];
  const documentType = DOCUMENT_TYPES.includes(input?.documentType) ? input.documentType : "other";
  return {
    documentId,
    documentType,
    authorOrIssuer: text(input?.authorOrIssuer, 240),
    relationshipToCitizen: text(input?.relationshipToCitizen, 500),
    authorshipState: [
      "citizen_author", "citizen_subject", "co_author", "third_party", "institutional", "unknown",
    ].includes(input?.authorshipState) ? input.authorshipState : "unknown",
    namedSubjects: asArray(input?.namedSubjects).map((value) => text(value, 160)).filter(Boolean).slice(0, 20),
    fictionalSubjects: asArray(input?.fictionalSubjects).map((value) => text(value, 160)).filter(Boolean).slice(0, 30),
    allowedChannels,
    permittedScope,
    includedSections: text(input?.includedSections, 1500),
    excludedSections: text(input?.excludedSections, 1500),
    autobiographicalStatus: ["yes", "no", "mixed", "not_applicable", "unknown"].includes(input?.autobiographicalStatus)
      ? input.autobiographicalStatus : "unknown",
    sensitivityClass: ["ordinary", "personal", "sensitive", "clinical_restricted"].includes(input?.sensitivityClass)
      ? input.sensitivityClass : "ordinary",
    citizenContext: text(input?.citizenContext, 2500),
    verificationClass: ["self_submitted", "citizen_reviewed", "externally_verified", "directly_observed"].includes(input?.verificationClass)
      ? input.verificationClass : "self_submitted",
    evidencePeriodStart: text(input?.evidencePeriodStart, 32) || null,
    evidencePeriodEnd: text(input?.evidencePeriodEnd, 32) || null,
    evidencePeriodPrecision: ["day", "month", "year", "academic_period", "life_stage", "unknown"].includes(input?.evidencePeriodPrecision)
      ? input.evidencePeriodPrecision : "unknown",
    evidencePeriodAuthority: [
      "printed_source", "issuer_metadata", "corroborated_context",
      "citizen_declared", "machine_inferred", "unknown",
    ].includes(input?.evidencePeriodAuthority) ? input.evidencePeriodAuthority : "unknown",
    evidencePeriodBasis: text(input?.evidencePeriodBasis, 1000),
    printedDocumentDate: text(input?.printedDocumentDate, 64) || null,
    citizenAttestation: text(input?.citizenAttestation, 1000),
  };
}

export function normalizeLearningObservation(input, contract, citizenLabel = "the citizen") {
  const documentId = text(input?.documentId, 100);
  const primaryQKey = validQ(input?.primaryQKey);
  let secondaryQKey = validQ(input?.secondaryQKey);
  if (secondaryQKey === primaryQKey) secondaryQKey = null;
  const primarySubdomainKey = validSubdomain(primaryQKey, input?.primarySubdomainKey);
  let secondarySubdomainKey = validSubdomain(secondaryQKey, input?.secondarySubdomainKey);
  let secondaryJustification = text(input?.secondaryJustification, 800);
  if (!secondaryQKey || !secondarySubdomainKey || secondaryJustification.length < 20) {
    secondaryQKey = null;
    secondarySubdomainKey = null;
    secondaryJustification = "";
  }
  const sourceFact = text(input?.sourceFact, 1800);
  const observableFeature = text(input?.observableFeature, 1800);
  const rubricConnection = text(input?.rubricConnection, 1800);
  const contextualInterpretation = text(input?.contextualInterpretation, 1800);
  const tenQInference = text(input?.tenQInference, 1800);
  const limitations = text(input?.limitations, 1800);
  const alternativeExplanations = text(input?.alternativeExplanations, 1800);
  const scoringRationale = text(input?.scoringRationale, 1800);
  const boundedCitation = text(input?.boundedCitation, 700);
  const moralTreatment = [...new Set(asArray(input?.moralTreatment)
    .filter((value) => AUTHORED_FICTION_MORAL_TREATMENTS.includes(value)))].slice(0, 5);
  const combined = `${sourceFact} ${observableFeature} ${rubricConnection} ${contextualInterpretation} ${tenQInference} ${limitations} ${alternativeExplanations} ${scoringRationale} ${boundedCitation}`;
  const channel = LEARNING_CHANNELS.includes(input?.evidenceChannel)
    ? input.evidenceChannel : "declared";
  const evidenceKind = LEARNING_EVIDENCE_KINDS.includes(input?.evidenceKind)
    ? input.evidenceKind : "insufficient";
  const temporalContext = LEARNING_TEMPORAL_CONTEXTS.includes(input?.temporalContext)
    ? input.temporalContext : "undated";
  const subjectType = [
    "citizen", "third_party", "fictional_character", "institution", "unknown",
  ].includes(input?.subjectType) ? input.subjectType : "unknown";
  const actualSubject = text(input?.actualSubject, 240) || "Unresolved subject";
  let admissionStatus = input?.admissionStatus === "admitted" ? "admitted" : "pending_review";
  let rejectionReason = text(input?.rejectionReason, 1000);
  const fictionBoundary = authoredFictionObservationBoundary(input, contract, citizenLabel);

  if (!documentId || documentId !== contract?.documentId) {
    admissionStatus = "rejected";
    rejectionReason = "Observation was not bound to the accepted evidence contract.";
  } else if (subjectType !== "citizen") {
    admissionStatus = "rejected";
    rejectionReason = "The observation describes a third party, institution, narrator, or fictional character rather than the citizen.";
  } else if (!fictionBoundary.valid) {
    admissionStatus = "rejected";
    rejectionReason = fictionBoundary.reason;
  } else if (!primaryQKey || !primarySubdomainKey) {
    admissionStatus = "rejected";
    rejectionReason = "The observation did not identify one valid primary Q and subdomain.";
  } else if (!sourceFact || !contextualInterpretation || !tenQInference || !boundedCitation) {
    admissionStatus = "rejected";
    rejectionReason = "The observation did not preserve source fact, context, inference, and a bounded citation as separate auditable fields.";
  } else if (
    contract.documentType === "authored_fiction"
    && primaryQKey === "moral"
    && (!moralTreatment.length || moralTreatment.every((value) => value === "not_applicable"))
  ) {
    admissionStatus = "pending_review";
    rejectionReason = "A Moral-Q fiction observation must classify the narrative treatment of harm, consent, autonomy, power, consequence, responsibility, or restoration. Depiction alone is not authorial endorsement.";
  } else if (
    sourceFact.length < 40
    || observableFeature.length < 30
    || rubricConnection.length < 40
    || limitations.length < 40
    || alternativeExplanations.length < 25
    || scoringRationale.length < 50
  ) {
    admissionStatus = "pending_review";
    rejectionReason = "The audit explanation was incomplete or too terse to justify admission. Source evidence, observable feature, rubric connection, limitations, alternatives, and numerical rationale must remain independently reviewable.";
  } else if (!contract.allowedChannels.includes(channel)) {
    admissionStatus = "rejected";
    rejectionReason = "The evidence channel was not authorized by the accepted evidence contract.";
  } else if (!contract.permittedScope.includes(primaryQKey)) {
    admissionStatus = "rejected";
    rejectionReason = "The primary Q was outside the citizen-authorized evaluation scope.";
  } else if (
    ["citizen_subject", "citizen_author", "co_author"].includes(contract.authorshipState)
    && ["unresolved", "probable", "mismatch_review"].includes(contract.identityMatchState)
  ) {
    admissionStatus = "pending_review";
    rejectionReason = "The evidence may concern the citizen, but private local identity matching is unresolved or needs confirmation. This is not a finding of dishonesty.";
  } else if (secondaryQKey && !contract.permittedScope.includes(secondaryQKey)) {
    secondaryQKey = null;
    secondarySubdomainKey = null;
    secondaryJustification = "";
  } else if (contract.sensitivityClass === "clinical_restricted" || contract.documentType === "clinical_context") {
    admissionStatus = "rejected";
    rejectionReason = "Clinical context is retained for care or context and excluded from Ten-Q scoring.";
  } else if (CLINICAL_PATTERN.test(combined) || LEGAL_HARDSHIP_PATTERN.test(combined)) {
    admissionStatus = "rejected";
    rejectionReason = "Clinical, legal, or hardship material cannot raise or lower a Ten-Q estimate.";
  } else if (contract.documentType === "authored_fiction" && channel !== "demonstrated") {
    admissionStatus = "rejected";
    rejectionReason = "Fiction may support only demonstrated authorial craft or modeling; character content is not lived evidence.";
  } else if (
    primaryQKey === "social"
    && primarySubdomainKey === "cooperation"
    && channel === "declared"
  ) {
    admissionStatus = "pending_review";
    rejectionReason = "Cooperation requires attributable coordination or joint activity, not only a statement or commentary about cooperation.";
  } else if (
    primaryQKey === "emotional"
    && primarySubdomainKey === "emotional_regulation"
    && channel === "declared"
  ) {
    admissionStatus = "pending_review";
    rejectionReason = "Emotional regulation requires observable regulation, strategy use, or recovery; describing feelings or sanctuary alone is insufficient.";
  } else if (
    primaryQKey === "learning"
    && channel === "declared"
  ) {
    admissionStatus = "pending_review";
    rejectionReason = "Learning Q requires demonstrated or observed acquisition, retention, application, or transfer rather than a declaration of knowledge alone.";
  }

  let confidence = clamp(input?.confidence, 0, 1, 0);
  const estimate = Math.round(clamp(input?.estimate, 0, 100, 50));
  const suppliedRangeLow = Math.min(estimate, Math.round(clamp(input?.rangeLow, 0, 100, estimate)));
  const suppliedRangeHigh = Math.max(estimate, Math.round(clamp(input?.rangeHigh, 0, 100, estimate)));

  // An admitted absolute zero/maximum or zero-confidence result is internally
  // contradictory. Preserve it for review instead of silently treating it as
  // evidence about the citizen or substituting a neutral score.
  if (admissionStatus === "admitted" && (
    confidence <= 0
    || (estimate === 0 && suppliedRangeLow === 0 && suppliedRangeHigh === 0)
    || (estimate === 100 && suppliedRangeLow === 100 && suppliedRangeHigh === 100)
  )) {
    admissionStatus = "pending_review";
    rejectionReason = "The evaluator returned an uncalibrated endpoint or zero-confidence result. No score was admitted; the evidence remains available for a corrected interpretation.";
  }
  if (admissionStatus === "admitted" && evidenceKind === "insufficient") {
    admissionStatus = "pending_review";
    rejectionReason = "The evaluator marked this observation insufficient while also attempting to admit it. No score was admitted; the source remains available for corrected interpretation.";
  }

  let evidenceWeight = admissionStatus === "admitted" && evidenceKind !== "insufficient"
    ? (VERIFICATION_FACTORS[contract?.verificationClass] ?? VERIFICATION_FACTORS.self_submitted)
    : 0;
  evidenceWeight *= DOCUMENT_TYPE_FACTORS[contract?.documentType] ?? 1;
  if (AUTHORED_TYPES.has(contract.documentType) && primaryQKey === "moral") {
    confidence = Math.min(confidence, 0.6);
    evidenceWeight = Math.min(evidenceWeight, 0.45);
  }
  if (admissionStatus !== "admitted" || evidenceKind === "insufficient") {
    confidence = 0;
    evidenceWeight = 0;
  }
  // A non-degenerate interval communicates uncertainty honestly. Widening a
  // point interval never raises or lowers the evaluator's estimate.
  const uncertaintyMargin = Math.max(4, Math.round((1 - confidence) * 18));
  const rangeLow = admissionStatus === "admitted" && suppliedRangeLow === suppliedRangeHigh
    ? Math.max(0, estimate - uncertaintyMargin)
    : suppliedRangeLow;
  const rangeHigh = admissionStatus === "admitted" && suppliedRangeLow === suppliedRangeHigh
    ? Math.min(100, estimate + uncertaintyMargin)
    : suppliedRangeHigh;

  return {
    documentId,
    contractId: contract?.contractId || "",
    actualSubject: actualSubject || citizenLabel,
    subjectType,
    evidenceChannel: channel,
    primaryQKey: primaryQKey || "learning",
    secondaryQKey,
    primarySubdomainKey: primarySubdomainKey || "acquisition",
    secondarySubdomainKey,
    secondaryJustification,
    sourceFact,
    observableFeature,
    rubricConnection,
    contextualInterpretation,
    tenQInference,
    limitations,
    alternativeExplanations,
    scoringRationale,
    boundedCitation,
    estimate,
    rangeLow,
    rangeHigh,
    confidence,
    evidenceWeight,
    evidenceKind,
    temporalContext,
    evidencePeriodStart: contract?.evidencePeriodStart || null,
    evidencePeriodEnd: contract?.evidencePeriodEnd || null,
    admissionStatus,
    rejectionReason,
    moralTreatment,
    verificationState: contract?.verificationClass || "self_submitted",
  };
}

function expandContributions(observations, qKey, channel = null) {
  return asArray(observations).flatMap((observation) => {
    if (observation.admissionStatus !== "admitted") return [];
    if (channel && observation.evidenceChannel !== channel) return [];
    const contributions = [];
    if (observation.primaryQKey === qKey) {
      contributions.push({ ...observation, relationship: "primary", relationshipFactor: 1 });
    }
    if (observation.secondaryQKey === qKey) {
      contributions.push({ ...observation, relationship: "secondary", relationshipFactor: 0.55 });
    }
    return contributions;
  });
}

function synthesizeOne(observations, qKey, channel = null) {
  const contributions = expandContributions(observations, qKey, channel)
    .map((observation) => {
      const kindFactor = KIND_FACTORS[observation.evidenceKind] ?? 0.35;
      const timeFactor = TIME_FACTORS[observation.temporalContext] ?? 0.55;
      const channelFactor = CHANNEL_FACTORS[observation.evidenceChannel] ?? 0.55;
      return {
        ...observation,
        baseWeight: observation.confidence * observation.evidenceWeight
          * kindFactor * timeFactor * channelFactor * observation.relationshipFactor,
      };
    })
    .filter((observation) => (
      Number.isFinite(observation.estimate)
      && observation.estimate > 0
      && observation.estimate < 100
      && observation.baseWeight > 0
    ))
    .sort((left, right) => (
      left.documentId.localeCompare(right.documentId)
      || left.primaryQKey.localeCompare(right.primaryQKey)
      || left.boundedCitation.localeCompare(right.boundedCitation)
    ));

  if (!contributions.length) {
    return {
      qKey,
      status: "pending",
      score: null,
      confidence: 0,
      rangeLow: null,
      rangeHigh: null,
      evidenceCount: 0,
      confidenceLabel: "Pending",
      confidenceExplanation: "No accepted evidence currently supports this Q. Pending is not a finding of low ability.",
      domainScope: "broad",
      domainLabel: "",
      reportedStandardScore: null,
      reportedPercentile: null,
      normalizedEstimateMethod: "No accepted evidence supports an estimate for this Q. Pending is preserved without assigning a neutral, average, or low score.",
      summary: "Insufficient accepted evidence. This is not a finding of low ability.",
      subdomains: [],
    };
  }

  // One long artifact may yield several distinct observations, but length must
  // not let it outweigh independent sources. Collectively, a document can
  // contribute no more weight to one Q than its strongest observation.
  const documentTotals = new Map();
  for (const item of contributions) {
    const current = documentTotals.get(item.documentId) || { total: 0, strongest: 0 };
    current.total += item.baseWeight;
    current.strongest = Math.max(current.strongest, item.baseWeight);
    documentTotals.set(item.documentId, current);
  }
  const documentCapped = contributions.map((item) => {
    const document = documentTotals.get(item.documentId);
    const scale = document?.total > document?.strongest
      ? document.strongest / document.total
      : 1;
    return { ...item, documentAdjustedWeight: item.baseWeight * scale };
  });

  const adultWeight = documentCapped
    .filter((item) => item.temporalContext.startsWith("adult_"))
    .reduce((sum, item) => sum + item.documentAdjustedWeight, 0);
  const childhoodWeight = documentCapped
    .filter((item) => item.temporalContext === "childhood")
    .reduce((sum, item) => sum + item.documentAdjustedWeight, 0);
  const childhoodScale = adultWeight > 0 && childhoodWeight > adultWeight * 0.2
    ? (adultWeight * 0.2) / childhoodWeight
    : 1;
  const weighted = documentCapped.map((item) => ({
    ...item,
    adjustedWeight: item.temporalContext === "childhood"
      ? item.documentAdjustedWeight * childhoodScale
      : item.documentAdjustedWeight,
  }));
  const totalWeight = weighted.reduce((sum, item) => sum + item.adjustedWeight, 0);
  const score = weighted.reduce((sum, item) => sum + item.estimate * item.adjustedWeight, 0) / totalWeight;
  const variance = weighted.reduce(
    (sum, item) => sum + item.adjustedWeight * ((item.estimate - score) ** 2),
    0,
  ) / totalWeight;
  const deviation = Math.sqrt(Math.max(0, variance));
  const agreement = Math.max(0.45, 1 - deviation / 45);
  const subdomains = [...new Set(weighted.map((item) => (
    item.primaryQKey === qKey ? item.primarySubdomainKey : item.secondarySubdomainKey
  )).filter(Boolean))];
  const sources = new Set(weighted.map((item) => item.documentId));
  const confidence = Math.min(
    0.95,
    (1 - Math.exp(-totalWeight / 1.4))
      * agreement
      * Math.min(1, 0.65 + (subdomains.length * 0.12)),
  );
  const sourceLow = Math.min(...weighted.map((item) => item.rangeLow));
  const sourceHigh = Math.max(...weighted.map((item) => item.rangeHigh));
  const statisticalMargin = Math.round((1 - confidence) * 16 + deviation / 2);
  const rangeLow = Math.max(0, Math.min(sourceLow, Math.round(score) - statisticalMargin));
  const rangeHigh = Math.min(100, Math.max(sourceHigh, Math.round(score) + statisticalMargin));
  const minimumBreadth = qKey === "moral" ? 4 : qKey === "learning" ? 3 : 2;
  const status = subdomains.length >= minimumBreadth && sources.size >= 2
    ? "evidence_supported"
    : "domain_limited";
  const confidenceLabel = status === "domain_limited"
    ? "Limited"
    : confidence < 0.5 ? "Developing" : confidence < 0.72 ? "Moderate" : "Strong";
  const summaries = [...new Set(weighted.map((item) => item.tenQInference).filter(Boolean))].slice(0, 3);
  return {
    qKey,
    status,
    score: Math.round(score),
    confidence,
    rangeLow,
    rangeHigh,
    evidenceCount: weighted.length,
    sourceCount: sources.size,
    confidenceLabel,
    confidenceExplanation: status === "domain_limited"
      ? `Accepted evidence currently covers ${subdomains.length} of ${minimumBreadth} required subdomains. The observation is visible, but the broad Q remains pending.`
      : `${weighted.length} accepted observations from ${sources.size} sources support this estimate. Confidence reflects source reliability, channel, agreement, maturity, and subdomain breadth—not human worth.`,
    domainScope: status === "domain_limited" ? "domain_limited" : "broad",
    domainLabel: subdomains.join(", "),
    reportedStandardScore: null,
    reportedPercentile: null,
    normalizedEstimateMethod: `Deterministic evidence synthesis under ${LEARNING_POLICY_VERSION}. Each document's aggregate influence on a Q is capped at its strongest single observation; childhood evidence is capped at 20% of adult evidence weight when adult evidence exists.`,
    summary: summaries.join(" "),
    subdomains,
  };
}

export function synthesizeLearningEquityProfile(observations) {
  const sorted = latestLearningObservationsByDocument(observations).slice().sort((left, right) => (
    String(left.observation_id || left.observationId || "").localeCompare(
      String(right.observation_id || right.observationId || ""),
    )
  ));
  return LEARNING_Q_KEYS.map((qKey) => {
    const combined = synthesizeOne(sorted, qKey);
    return {
      ...combined,
      channelScores: Object.fromEntries(
        LEARNING_CHANNELS.map((channel) => [channel, synthesizeOne(sorted, qKey, channel)]),
      ),
    };
  });
}

export function latestLearningObservationsByDocument(observations) {
  const values = asArray(observations).filter((observation) => (
    String(observation.evaluationStatus || observation.evaluation_status || "") !== "superseded"
  ));
  const latestByDocument = new Map();
  const unversioned = [];
  for (const observation of values) {
    const documentId = String(observation.documentId || observation.document_id || "");
    const evaluationId = String(observation.evaluationId || observation.evaluation_id || "");
    if (!documentId || !evaluationId) {
      unversioned.push(observation);
      continue;
    }
    const createdAt = String(observation.createdAt || observation.created_at || "");
    const candidateKey = `${createdAt}\u0000${evaluationId}`;
    const current = latestByDocument.get(documentId);
    if (!current || candidateKey > current.candidateKey) {
      latestByDocument.set(documentId, { evaluationId, candidateKey });
    }
  }
  return [
    ...unversioned,
    ...values.filter((observation) => {
      const documentId = String(observation.documentId || observation.document_id || "");
      const evaluationId = String(observation.evaluationId || observation.evaluation_id || "");
      return documentId && evaluationId && latestByDocument.get(documentId)?.evaluationId === evaluationId;
    }),
  ];
}

export function learningScoresFromObservations(observations) {
  const currentObservations = latestLearningObservationsByDocument(observations);
  return synthesizeLearningEquityProfile(currentObservations)
    .filter((profile) => profile.status !== "pending" && Number.isInteger(profile.score))
    .map((profile) => ({
    qKey: profile.qKey,
    score: profile.score,
    confidence: profile.confidence,
    evidenceKind: "contextual",
    temporalContext: "undated",
    evidenceWeight: Math.min(1, profile.evidenceCount / 3),
    interpretiveBasis: profile.normalizedEstimateMethod,
    evidenceSummary: profile.summary || profile.confidenceExplanation,
    evidenceCitations: currentObservations
      .filter((item) => item.admissionStatus === "admitted"
        && (item.primaryQKey === profile.qKey || item.secondaryQKey === profile.qKey))
      .map((item) => item.boundedCitation)
      .filter(Boolean)
      .slice(0, 8),
    reportedStandardScore: null,
    reportedPercentile: null,
    normalizedEstimateMethod: profile.normalizedEstimateMethod,
    domainScope: profile.status === "evidence_supported" ? "broad" : "domain_limited",
    domainLabel: profile.domainLabel,
  }));
}
