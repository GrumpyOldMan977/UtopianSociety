import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTHORED_FICTION_MORAL_TREATMENTS,
  AUTHORED_FICTION_Q_KEYS,
  LEARNING_OBSERVATION_SCHEMA,
  authoredFictionObservationBoundary,
  learningDocumentTypePolicy,
  matchContractAttestedIdentity,
  matchPrivateIdentityText,
  learningContractScoreability,
  learningScoresFromObservations,
  latestLearningObservationsByDocument,
  normalizeEvidenceContract,
  normalizeLearningObservation,
  segmentAuthoredWork,
  synthesizeLearningEquityProfile,
} from "../cloudflare/civic-ledger/src/learning-equity.js";

test("accepted self-authorship can bind an author name to private identity without claiming source proof", () => {
  const result = matchContractAttestedIdentity({
    authorshipState: "citizen_author",
    authorOrIssuer: "Adreto Nagdo Senoviros",
    citizenAttestation: "I attest that I authored this work.",
  }, [{ value: "Adreto Nagdo Senoviros", reference: "chosen civic name" }]);
  assert.equal(result.state, "matched");
  assert.match(result.method, /citizen-attested identity binding/i);
  assert.ok(result.confidence < 1);
});

test("self-authorship binding requires both an attestation and a strong private-identity match", () => {
  assert.equal(matchContractAttestedIdentity({
    authorshipState: "citizen_author",
    authorOrIssuer: "Adreto Nagdo Senoviros",
    citizenAttestation: "",
  }, [{ value: "Adreto Nagdo Senoviros", reference: "chosen civic name" }]), null);
  assert.equal(matchContractAttestedIdentity({
    authorshipState: "citizen_author",
    authorOrIssuer: "Different Person",
    citizenAttestation: "I attest that I authored this work.",
  }, [{ value: "Adreto Nagdo Senoviros", reference: "chosen civic name" }]), null);
});

test("a high-confidence private-name variation plus accepted authorship attestation can bind legacy fiction", () => {
  const result = matchContractAttestedIdentity({
    authorshipState: "citizen_author",
    authorOrIssuer: "A Morgan",
    citizenAttestation: "I attest that I authored this work.",
  }, [{ value: "Avery Q Morgan", reference: "private legal identity" }]);
  assert.equal(result.state, "matched");
  assert.match(result.method, /private identity variation/i);
  assert.equal(result.confidence, 0.72);
});

test("the AI schema constrains subdomains to the canonical Ten-Q vocabulary", () => {
  const properties = LEARNING_OBSERVATION_SCHEMA.properties.observations.items.properties;
  assert.ok(properties.primarySubdomainKey.enum.includes("reasoning"));
  assert.ok(properties.primarySubdomainKey.enum.includes("acquisition"));
  assert.ok(!properties.primarySubdomainKey.enum.includes("generic_ability"));
  assert.equal(properties.evidenceWeight, undefined, "provenance weight must be owned by deterministic policy, not AI");
});

function contract(overrides = {}) {
  return {
    contractId: "contract-1",
    ...normalizeEvidenceContract({
      documentType: "standardized_assessment",
      authorOrIssuer: "Issuing institution",
      relationshipToCitizen: "Record about the citizen",
      authorshipState: "citizen_subject",
      allowedChannels: ["observed", "demonstrated", "declared"],
      permittedScope: ["intellectual", "learning", "creative", "moral"],
      autobiographicalStatus: "not_applicable",
      sensitivityClass: "ordinary",
      verificationClass: "externally_verified",
      evidencePeriodStart: "2024-01-01",
      evidencePeriodEnd: "2024-12-31",
      evidencePeriodPrecision: "year",
      evidencePeriodAuthority: "printed_source",
      citizenAttestation: "I attest that this classification is accurate to the best of my knowledge.",
      ...overrides,
    }, overrides.documentId || "doc-1"),
    identityMatchState: overrides.identityMatchState || "matched",
    identityMatchMethod: overrides.identityMatchMethod || "local verified-variant comparison",
  };
}

function observation(overrides = {}, acceptedContract = contract()) {
  return normalizeLearningObservation({
    documentId: acceptedContract.documentId,
    actualSubject: "Citizen",
    subjectType: "citizen",
    evidenceChannel: "observed",
    primaryQKey: "intellectual",
    secondaryQKey: "",
    primarySubdomainKey: "reasoning",
    secondarySubdomainKey: "",
    secondaryJustification: "",
    sourceFact: "A bounded standardized result reports sustained reasoning performance.",
    observableFeature: "The bounded result records sustained reasoning performance under standardized conditions.",
    rubricConnection: "Sustained reasoning performance maps directly to the Intellectual Q reasoning subdomain without claiming a whole-person result.",
    contextualInterpretation: "The result is relevant to reasoning in the test conditions and does not define the whole person.",
    tenQInference: "This supports a provisional Intellectual Q reasoning observation.",
    limitations: "This result does not establish reasoning performance outside the assessment conditions or across every intellectual domain.",
    alternativeExplanations: "Performance may also reflect familiarity with the assessment format, fatigue, motivation, or testing conditions.",
    scoringRationale: "The estimate is placed in the strong-evidence band because the result is direct and standardized, while the interval and confidence preserve test-condition and domain limitations.",
    boundedCitation: "Document 1, score table, reasoning result.",
    estimate: 82,
    rangeLow: 76,
    rangeHigh: 87,
    confidence: 0.85,
    evidenceWeight: 0.9,
    evidenceKind: "standardized_assessment",
    temporalContext: "adult_current",
    admissionStatus: "admitted",
    rejectionReason: "",
    moralTreatment: ["not_applicable"],
    ...overrides,
  }, acceptedContract, "Citizen");
}

test("the authored-fiction rubric reviews exactly the eight admissible domains", () => {
  assert.deepEqual(AUTHORED_FICTION_Q_KEYS, [
    "intellectual",
    "emotional",
    "social",
    "creative",
    "natural",
    "technological",
    "learning",
    "moral",
  ]);
  assert.ok(AUTHORED_FICTION_MORAL_TREATMENTS.includes("harm_depicted"));
  assert.ok(AUTHORED_FICTION_MORAL_TREATMENTS.includes("harm_endorsed"));
  assert.ok(AUTHORED_FICTION_MORAL_TREATMENTS.includes("harm_challenged"));
  assert.ok(AUTHORED_FICTION_MORAL_TREATMENTS.includes("harm_as_restoration"));
});

test("missing evidence remains pending rather than becoming a zero", () => {
  const profile = synthesizeLearningEquityProfile([]);
  assert.equal(profile.length, 10);
  assert.ok(profile.every((item) => item.status === "pending" && item.score === null));
  assert.ok(profile.every((item) => item.normalizedEstimateMethod.length > 0));
});

test("pending domains are omitted from persistence instead of receiving fabricated midpoint scores", () => {
  assert.deepEqual(learningScoresFromObservations([]), []);

  const scores = learningScoresFromObservations([observation()]);
  assert.deepEqual(scores.map((item) => item.qKey), ["intellectual"]);
  assert.equal(scores[0].score, 82);
  assert.notEqual(scores[0].score, 50);
  assert.ok(scores[0].interpretiveBasis.length > 0);
});

test("an admitted observation receives deterministic provenance weight even when AI supplies zero", () => {
  const result = observation({ evidenceWeight: 0 });
  assert.equal(result.admissionStatus, "admitted");
  assert.equal(result.evidenceWeight, 1, "externally verified evidence receives the policy weight");
  assert.ok(learningScoresFromObservations([result]).length > 0);
});

test("an admitted absolute zero is quarantined for review rather than becoming a Q score", () => {
  const result = observation({
    estimate: 0,
    rangeLow: 0,
    rangeHigh: 0,
    evidenceWeight: 0,
  });
  assert.equal(result.admissionStatus, "pending_review");
  assert.equal(result.evidenceWeight, 0);
  assert.match(result.rejectionReason, /uncalibrated endpoint/i);
  assert.deepEqual(learningScoresFromObservations([result]), []);
});

test("an admitted point estimate is widened without changing its score", () => {
  const result = observation({ estimate: 72, rangeLow: 72, rangeHigh: 72, confidence: 0.8 });
  assert.equal(result.estimate, 72);
  assert.ok(result.rangeLow < 72);
  assert.ok(result.rangeHigh > 72);
});

test("synthesis is deterministic and independent of upload order", () => {
  const first = observation();
  const secondContract = contract({ documentId: "doc-2" });
  const second = observation({
    documentId: "doc-2",
    primarySubdomainKey: "critical_evaluation",
    boundedCitation: "Document 2, evaluated work sample.",
    estimate: 88,
    rangeLow: 82,
    rangeHigh: 92,
    evidenceKind: "observed_behavior",
  }, secondContract);
  assert.deepEqual(
    synthesizeLearningEquityProfile([first, second]),
    synthesizeLearningEquityProfile([second, first]),
  );
});

test("only the latest evaluation of a document contributes to its current score", () => {
  const older = {
    ...observation({ estimate: 34, rangeLow: 28, rangeHigh: 40 }),
    evaluationId: "evaluation-1",
    createdAt: "2026-08-01T00:00:00.000Z",
  };
  const newer = {
    ...observation({ estimate: 82, rangeLow: 76, rangeHigh: 87 }),
    evaluationId: "evaluation-2",
    createdAt: "2026-08-02T00:00:00.000Z",
  };
  const current = latestLearningObservationsByDocument([newer, older]);
  assert.deepEqual(current.map((item) => item.evaluationId), ["evaluation-2"]);
  assert.equal(
    synthesizeLearningEquityProfile([older, newer]).find((item) => item.qKey === "intellectual").score,
    82,
  );
});

test("superseded observations remain auditable but cannot affect the current profile", () => {
  const historical = {
    ...observation({ estimate: 91, rangeLow: 86, rangeHigh: 95 }),
    evaluationId: "evaluation-historical",
    evaluationStatus: "superseded",
    createdAt: "2026-08-01T00:00:00.000Z",
  };
  assert.deepEqual(latestLearningObservationsByDocument([historical]), []);
  const intellectual = synthesizeLearningEquityProfile([historical])
    .find((item) => item.qKey === "intellectual");
  assert.equal(intellectual.status, "pending");
  assert.equal(intellectual.score, null);
});

test("an incomplete audit explanation cannot be admitted", () => {
  const result = observation({ limitations: "Too short." });
  assert.equal(result.admissionStatus, "pending_review");
  assert.equal(result.evidenceWeight, 0);
  assert.match(result.rejectionReason, /audit explanation/i);
});

test("declared commentary cannot be admitted as demonstrated cooperation", () => {
  const socialContract = contract({
    documentId: "social-1",
    permittedScope: ["social"],
  });
  const result = observation({
    documentId: "social-1",
    primaryQKey: "social",
    primarySubdomainKey: "cooperation",
    evidenceChannel: "declared",
  }, socialContract);
  assert.equal(result.admissionStatus, "pending_review");
  assert.match(result.rejectionReason, /coordination|joint activity/i);
});

test("childhood evidence cannot dominate accepted adult evidence", () => {
  const adult = observation({ estimate: 90, rangeLow: 85, rangeHigh: 94 });
  const childhood = Array.from({ length: 8 }, (_, index) => {
    const childhoodContract = contract({ documentId: `child-${index}` });
    return observation({
      documentId: childhoodContract.documentId,
      boundedCitation: `Childhood record ${index + 1}.`,
      estimate: 30,
      rangeLow: 20,
      rangeHigh: 45,
      confidence: 0.95,
      evidenceWeight: 1,
      evidenceKind: "formal_academic",
      temporalContext: "childhood",
    }, childhoodContract);
  });
  const intellectual = synthesizeLearningEquityProfile([adult, ...childhood])
    .find((item) => item.qKey === "intellectual");
  assert.ok(intellectual.score > 75, `expected adult evidence to remain dominant, got ${intellectual.score}`);
});

test("fictional character conduct is never admitted as citizen evidence", () => {
  const fiction = contract({
    documentType: "authored_fiction",
    documentId: "fiction-1",
    authorshipState: "citizen_author",
    allowedChannels: ["demonstrated"],
    permittedScope: ["creative", "moral"],
  });
  const result = observation({
    documentId: "fiction-1",
    evidenceChannel: "demonstrated",
    primaryQKey: "moral",
    primarySubdomainKey: "harm_recognition",
    sourceFact: "The protagonist forgives an antagonist in the final scene.",
    contextualInterpretation: "The character demonstrates restorative judgment.",
    tenQInference: "The author therefore has high moral capacity.",
    boundedCitation: "Chapter 10, protagonist dialogue.",
  }, fiction);
  assert.equal(result.admissionStatus, "rejected");
  assert.match(result.rejectionReason, /citizen-author|fictional character|narrator/i);
});

test("fiction may support demonstrated authorial craft", () => {
  const fiction = contract({
    documentType: "authored_fiction",
    documentId: "fiction-2",
    authorshipState: "citizen_author",
    allowedChannels: ["demonstrated"],
    permittedScope: ["creative"],
  });
  const result = observation({
    documentId: "fiction-2",
    evidenceChannel: "demonstrated",
    primaryQKey: "creative",
    primarySubdomainKey: "craft_development",
    sourceFact: "The author maintains a multi-thread narrative structure across ten chapters.",
    contextualInterpretation: "Sustained continuity is demonstrated in the authored artifact.",
    tenQInference: "The citizen-author's sustained construction supports a Creative Q craft-development observation.",
    boundedCitation: "Chapters 1–10, continuity of interleaved plot threads.",
  }, fiction);
  assert.equal(result.admissionStatus, "admitted");
  assert.equal(result.evidenceWeight, 0.75);
});

test("Moral-Q fiction requires an explicit narrative-treatment classification", () => {
  const fiction = contract({
    documentType: "authored_fiction",
    documentId: "fiction-moral",
    authorOrIssuer: "Citizen",
    authorshipState: "citizen_author",
    allowedChannels: ["demonstrated"],
    permittedScope: ["moral"],
  });
  const base = {
    documentId: fiction.documentId,
    actualSubject: "Citizen",
    evidenceChannel: "demonstrated",
    primaryQKey: "moral",
    primarySubdomainKey: "harm_recognition",
    sourceFact: "The authored work repeatedly depicts institutional harm and follows its consequences through restoration rather than treating it as spectacle.",
    observableFeature: "The citizen-author's narrative framing returns to consequences, responsibility, and repair across the literary work.",
    rubricConnection: "The sustained authorial construction maps to bounded ethical perception and harm recognition in the authored artifact.",
    contextualInterpretation: "Across the work, harmful conduct is depicted and challenged through consequence, responsibility, and restorative response.",
    tenQInference: "The citizen-author Citizen demonstrates ethical perception through the narrative construction of harm and restoration in the literary work.",
    scoringRationale: "The estimate reflects repeated authorial framing of consequence and repair while remaining bounded to the constructed literary artifact.",
    boundedCitation: "Chapter 1; Chapter 6; Chapter 12",
    evidenceKind: "authored_work",
  };
  const unclassified = observation({ ...base, moralTreatment: ["not_applicable"] }, fiction);
  assert.equal(unclassified.admissionStatus, "pending_review");
  assert.match(unclassified.rejectionReason, /narrative treatment/i);

  const classified = observation({
    ...base,
    moralTreatment: ["harm_depicted", "harm_challenged", "harm_as_restoration"],
  }, fiction);
  assert.equal(classified.admissionStatus, "admitted");
  assert.deepEqual(classified.moralTreatment, [
    "harm_depicted",
    "harm_challenged",
    "harm_as_restoration",
  ]);
});

test("fiction cannot relabel a named character as the citizen-author", () => {
  const fiction = contract({
    documentType: "authored_fiction",
    documentId: "fiction-character",
    authorOrIssuer: "Citizen",
    authorshipState: "citizen_author",
    allowedChannels: ["demonstrated"],
    permittedScope: ["creative", "moral"],
  });
  const result = observation({
    documentId: fiction.documentId,
    actualSubject: "Robyn",
    evidenceChannel: "demonstrated",
    primaryQKey: "moral",
    primarySubdomainKey: "harm_recognition",
    sourceFact: "Robyn refuses a harmful order and explains the likely consequences to another character.",
    observableFeature: "The authored novel constructs an ethically consequential decision inside the narrative.",
    rubricConnection: "The literary framing could be examined as authorial ethical modeling, but it cannot make Robyn the citizen.",
    contextualInterpretation: "The scene belongs to a fictional character in an authored artifact.",
    tenQInference: "The citizen-author's narrative framing, rather than Robyn's conduct, would be the only permissible subject.",
    scoringRationale: "Any estimate would have to concern the citizen-author's demonstrated construction of consequences across the work.",
    boundedCitation: "Chapter 8, Robyn's refusal scene.",
    evidenceKind: "authored_work",
  }, fiction);
  assert.equal(result.admissionStatus, "rejected");
  assert.match(result.rejectionReason, /citizen-author as the actual subject/i);
});

test("complete-work fiction claims require an explicit pattern across separated structural regions", () => {
  const fictionContract = {
    ...contract({
      documentType: "authored_fiction",
      authorOrIssuer: "Avery Morgan",
      authorshipState: "citizen_author",
    }),
    completeWorkStructuralLabels: ["Opening material", "Part II", "Part V"],
  };
  const base = {
    actualSubject: "Avery Morgan",
    observableFeature: "The citizen-author's narrative architecture sustains differentiated institutions and perspectives across the work.",
    rubricConnection: "The recurring whole-work construction demonstrates original synthesis through coordinated civic and personal threads.",
    contextualInterpretation: "The pattern develops throughout the beginning, middle, and ending rather than appearing in one isolated scene.",
    tenQInference: "The citizen-author Avery Morgan demonstrates original synthesis in the literary work's sustained narrative architecture.",
    scoringRationale: "Repeated construction across separated parts supports a bounded demonstrated estimate while leaving revision history unknown.",
  };
  const isolated = authoredFictionObservationBoundary({
    ...base,
    boundedCitation: "Part II",
  }, fictionContract, "Avery Morgan");
  assert.equal(isolated.valid, false);
  assert.match(isolated.reason, /single scene/i);

  const distributed = authoredFictionObservationBoundary({
    ...base,
    boundedCitation: "Opening material; Part II; Part V",
  }, fictionContract, "Avery Morgan");
  assert.equal(distributed.valid, true);
});

test("authored-work segmentation covers every source character exactly once", () => {
  const source = [
    "Chapter 1\n" + "Opening paragraph. ".repeat(310),
    "Chapter 2\n" + "Middle paragraph. ".repeat(310),
    "Chapter 3\n" + "Ending paragraph. ".repeat(310),
  ].join("\n\n");
  const segments = segmentAuthoredWork(source, { maxChars: 5_000, minChars: 1_000 });
  assert.ok(segments.length >= 3);
  assert.equal(segments[0].start, 0);
  assert.equal(segments.at(-1).end, source.length);
  assert.equal(segments.map((segment) => segment.text).join(""), source);
  for (let index = 1; index < segments.length; index += 1) {
    assert.equal(segments[index - 1].end, segments[index].start);
  }
  assert.ok(segments.some((segment) => /Chapter 2/i.test(segment.structuralLabel)));
  assert.ok(segments.some((segment) => /Chapter 3/i.test(segment.structuralLabel)));
  assert.equal(segments[0].coverageRegion, "beginning");
  assert.equal(segments.at(-1).coverageRegion, "ending");
  assert.ok(segments.every((segment) => segment.structuralUnitId));
  assert.ok(segments.every((segment) => Number.isInteger(segment.structuralUnitIndex)));
});

test("one long artifact cannot gain extra influence by producing more observations", () => {
  const longContract = contract({ documentId: "long-work" });
  const independentContract = contract({ documentId: "independent-work" });
  const strongest = observation({
    documentId: longContract.documentId,
    boundedCitation: "Long work, section 1.",
    estimate: 90,
    rangeLow: 84,
    rangeHigh: 94,
  }, longContract);
  const repeated = [2, 3, 4, 5].map((section) => observation({
    documentId: longContract.documentId,
    boundedCitation: `Long work, section ${section}.`,
    estimate: 90,
    rangeLow: 84,
    rangeHigh: 94,
  }, longContract));
  const independent = observation({
    documentId: independentContract.documentId,
    boundedCitation: "Independent work, bounded result.",
    estimate: 50,
    rangeLow: 44,
    rangeHigh: 56,
  }, independentContract);
  const singleResult = synthesizeLearningEquityProfile([strongest, independent])
    .find((item) => item.qKey === "intellectual");
  const repeatedResult = synthesizeLearningEquityProfile([strongest, ...repeated, independent])
    .find((item) => item.qKey === "intellectual");
  assert.equal(repeatedResult.score, singleResult.score);
  assert.equal(repeatedResult.normalizedEstimateMethod, singleResult.normalizedEstimateMethod);
});

test("document type policy makes authored-fiction boundaries explicit", () => {
  const fiction = learningDocumentTypePolicy("authored_fiction");
  assert.match(fiction.subject, /never a character/i);
  assert.match(fiction.coverage, /every part/i);
  const essay = learningDocumentTypePolicy("authored_autobiographical_essay");
  assert.match(essay.allowedEvidence, /lived claims use the declared channel/i);
});

test("an autobiographical essay may support demonstrated reasoning and craft", () => {
  const essay = contract({
    documentType: "authored_autobiographical_essay",
    documentId: "essay-1",
    authorshipState: "citizen_author",
    allowedChannels: ["declared", "demonstrated"],
    permittedScope: ["intellectual", "creative", "learning"],
    verificationClass: "self_submitted",
  });
  const result = observation({
    documentId: "essay-1",
    evidenceChannel: "demonstrated",
    primaryQKey: "creative",
    primarySubdomainKey: "craft_development",
    sourceFact: "The author sustains a seven-section autobiographical essay that connects scenes, comparison, and civic reflection.",
    contextualInterpretation: "The authored artifact directly demonstrates sustained organization and reflective narrative craft.",
    tenQInference: "This supports a bounded Creative Q craft-development observation without treating autobiographical claims as observed conduct.",
    boundedCitation: "Sections I-VII, recurring creek imagery and developed thematic continuity.",
    estimate: 78,
    rangeLow: 68,
    rangeHigh: 84,
    confidence: 0.82,
    evidenceWeight: 0,
    evidenceKind: "authored_work",
    temporalContext: "adult_current",
  }, essay);
  assert.equal(result.admissionStatus, "admitted");
  assert.equal(result.evidenceWeight, 0.65);
  assert.equal(learningScoresFromObservations([result])[0].score, 78);
});

test("context-only and clinical contracts are refused before scoring", () => {
  assert.deepEqual(
    learningContractScoreability(contract({ documentType: "context_only" })),
    {
      scoreBearing: false,
      reason: "This contract classifies the document as context only, so it cannot raise or lower a Ten-Q score.",
    },
  );
  assert.equal(
    learningContractScoreability(contract({
      documentType: "clinical_context",
      sensitivityClass: "clinical_restricted",
      permittedScope: [],
    })).scoreBearing,
    false,
  );
});

test("an admitted observation marked insufficient is held for review, not scored", () => {
  const result = observation({
    evidenceKind: "insufficient",
    estimate: 64,
    rangeLow: 55,
    rangeHigh: 71,
    confidence: 0.8,
  });
  assert.equal(result.admissionStatus, "pending_review");
  assert.equal(result.evidenceWeight, 0);
  assert.match(result.rejectionReason, /marked.*insufficient/i);
  assert.equal(learningScoresFromObservations([result]).length, 0);
});

test("diagnosis and legal hardship cannot become Ten-Q observations", () => {
  const result = observation({
    sourceFact: "The record reports an ADHD diagnosis and a prior court record.",
    boundedCitation: "Clinical and legal history section.",
  });
  assert.equal(result.admissionStatus, "rejected");
  assert.equal(result.evidenceWeight, 0);
});

test("an observation without separated fact, context, inference, and citation is rejected", () => {
  const result = observation({ boundedCitation: "", contextualInterpretation: "" });
  assert.equal(result.admissionStatus, "rejected");
  assert.match(result.rejectionReason, /separate auditable fields/i);
});

test("unauthorized channels and Q domains are rejected", () => {
  const narrow = contract({
    allowedChannels: ["declared"],
    permittedScope: ["learning"],
  });
  const result = observation({}, narrow);
  assert.equal(result.admissionStatus, "rejected");
});

test("an unresolved private identity link pauses evidence without alleging fraud", () => {
  const unresolved = contract({
    identityMatchState: "mismatch_review",
    identityMatchMethod: "No encrypted legal-name variant matched the extracted subject.",
  });
  const result = observation({}, unresolved);
  assert.equal(result.admissionStatus, "pending_review");
  assert.equal(result.evidenceWeight, 0);
  assert.match(result.rejectionReason, /not a finding of dishonesty/i);
});

test("private identity matching handles ordering, initials, and punctuation locally", () => {
  const candidates = [{ value: "Matthew B. Elliott", reference: "legal identity" }];
  const result = matchPrivateIdentityText(
    "ELLIOTT, Matthew B — cumulative educational record",
    candidates,
  );
  assert.equal(result.state, "matched");
  assert.match(result.method, /locally/i);
  assert.doesNotMatch(result.method, /Matthew/i);
});

test("private identity matching tolerates one OCR error but requires confirmation", () => {
  const result = matchPrivateIdentityText(
    "M. Elllott — second grade report",
    [{ value: "Matthew Elliott", reference: "legal identity" }],
  );
  assert.equal(result.state, "probable");
  assert.ok(result.confidence > 0 && result.confidence < 1);
});

test("a different identity becomes a review question, never an accusation", () => {
  const result = matchPrivateIdentityText(
    "Record issued to Avery Morgan",
    [{ value: "Matthew Elliott", reference: "legal identity" }],
  );
  assert.equal(result.state, "mismatch_review");
  assert.match(result.method, /not proof of fraud/i);
});

test("combined and per-channel profiles remain visibly distinct", () => {
  const declaredContract = contract({ allowedChannels: ["declared"], documentId: "declared-1" });
  const declared = observation({
    documentId: "declared-1",
    evidenceChannel: "declared",
    estimate: 95,
    boundedCitation: "Citizen declaration, item 1.",
    evidenceKind: "self_report",
  }, declaredContract);
  const observed = observation({ estimate: 70 });
  const profile = synthesizeLearningEquityProfile([declared, observed])
    .find((item) => item.qKey === "intellectual");
  assert.equal(profile.channelScores.demonstrated.status, "pending");
  assert.equal(profile.channelScores.declared.score, 95);
  assert.equal(profile.channelScores.observed.score, 70);
  assert.notEqual(profile.score, profile.channelScores.declared.score);
});
