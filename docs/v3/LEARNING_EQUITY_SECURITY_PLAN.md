# Learning Equity, Evidence, and Security Plan

## Status and boundary

This is the waiting local-development plan for the Circle of Learning document
evaluation system. It is not authorization to deploy, mutate production data,
or treat any automated result as ratified civic policy.

- Development and validation remain local.
- The public judging build remains frozen.
- Learning results are provisional evidence profiles, not verdicts about a
  citizen's worth, identity, or permitted future.
- No score, document, diagnosis, demographic trait, or historical event may
  independently disqualify a citizen from a Contribution.

## Constitutional design principle

A Ten-Q profile records:

> What has been demonstrated, through what evidence, under what conditions,
> with what uncertainty, at this point in time.

Every citizen is presumed capable of further growth. Absence of prior
opportunity is not evidence of inability. Ten-Q should open developmental
pathways, not construct an algorithmic caste system.

## Current implementation baseline

The local v3 system already provides:

- browser-side OCR for image-only PDFs;
- a side-by-side authoritative scan and citizen-reviewed transcript;
- retention of reviewed transcript provenance;
- cumulative Learning evidence rather than last-upload-wins replacement;
- score ranges, confidence, and Pending states for unsupported Qs;
- separation of narrow observations from broader Q claims;
- a three-document interpretation limit;
- a 10 MB per-document upload limit; and
- a local Cloudflare Worker and local D1 data path.

The reviewed OCR transcript is now the text submitted for interpretation while
the original scan remains linked as the authoritative source. Testing a
childhood report card exposed the next required correction: synthesis must use
the evidence's period and maturity, never upload order.

## Phase 1: Private civic identity and document matching

Add citizen profile settings with distinct identity fields:

- **Legal name**: required for citizens originating through Immigration and
  used only for private document matching and verification.
- **Chosen civic name**: optional and used as the citizen's normal Society
  identity.
- **Verified name variants**: former spellings, initials, transcription
  variations, and documented misspellings.

Safeguards:

- Legal names and variants are private, encrypted at rest, access-controlled,
  and excluded from public profiles, public ledgers, URLs, analytics, and
  ordinary civic display.
- A mismatch raises a review question; it does not automatically reject the
  evidence.
- Matching must tolerate initials, ordering changes, punctuation, OCR errors,
  and verified historical misspellings.
- Every match records which private variant matched, the match method, and the
  confidence without exposing the private value publicly.
- Changes to identity fields require reauthentication and create a private
  audit event.

## Phase 2: Evidence provenance and chronology

For each source, store separately:

- original encrypted file hash;
- MIME type, page count, and technical extraction method;
- raw OCR or extracted text;
- citizen-reviewed transcript and its hash;
- a structured diff between raw extraction and reviewed text;
- source type and verification class;
- issuing institution, when available;
- citizen-declared evidence period;
- machine-inferred evidence period and supporting text;
- document date as printed in the source;
- upload date; and
- conflicts, caveats, and review state.

### Date authority

File creation time and upload time are never treated as the evidence's
origination date. Filenames are hints only.

Use this precedence:

1. date or academic period visibly printed in the authoritative source;
2. issuer metadata or an externally verified record;
3. corroborated context from adjacent pages or related records;
4. citizen-declared period, visibly marked as self-reported;
5. Unknown/Pending when the period cannot be established.

Bi-fold records or partial scans may omit the school, grade, or year. The UI
must allow the citizen to add that missing context without silently inserting
it into the authoritative transcript.

### Submission-order independence

Recompute synthesis from the complete evidence set sorted and weighted by
evidence period, relevance, continuity, verification, and maturity. Uploading
old weak evidence after strong adult evidence—or the reverse—must produce the
same profile.

Childhood evidence may illuminate development but may not dominate an adult
profile. The existing 20% childhood influence cap is an explicit provisional
policy, not an objective truth. Confirmed continuity across later evidence may
increase relevance without allowing early disadvantage to become permanent.

## Phase 3: OCR integrity and citizen correction

Preserve three distinct objects:

1. **Authoritative original** — encrypted and immutable.
2. **Machine extraction** — reproducible raw OCR or text extraction.
3. **Citizen-reviewed transcript** — editable derived evidence.

The citizen must be able to correct OCR, especially table cells whose letters
may be recognized correctly but assigned to the wrong subject or grading
period. The system must:

- display the original beside the transcript;
- highlight material edits to names, dates, grades, scores, and headings;
- require an attestation that the citizen compared the transcript with the
  source;
- retain version history and hashes;
- flag substantial or internally inconsistent corrections for review; and
- submit the reviewed transcript to interpretation while retaining the
  original as the evidentiary anchor.

A citizen correction is not external verification. It is a transparent,
contestable transcription layer.

## Phase 4: Interpretation and Ten-Q synthesis

Keep the evaluation pipeline separated:

1. **Ingestion** extracts, hashes, classifies, and verifies evidence.
2. **Evidence contract** establishes the document's authorship, subjects,
   permitted scope, and allowable inference domains.
3. **Interpretation** maps bounded passages to possible Q observations.
4. **Synthesis** updates ranges and evidence confidence.
5. **Review** handles consequential, disputed, anomalous, or low-confidence
   findings.
6. **Contribution matching** consumes only approved, relevant observations.
7. **Audit** tests bias, gaming, consistency, and disparate effects.

Required scoring behavior:

- Unsupported Qs remain Pending; absence of evidence is not a low score.
- Contradictory evidence widens uncertainty rather than erasing a source.
- Clinical, legal, hardship, and protected personal material is excluded unless
  the citizen deliberately submits relevant evidence and policy permits it.
- Old evidence cannot erase demonstrated adult capability.
- Confidence explains source quantity, reliability, agreement, recency, and
  domain coverage in plain language.
- Ranges and evidence summaries are retained; false precision is prohibited.

### Psychometric crosswalks

Store and display separately:

- reported standardized score;
- reported percentile;
- normalized Ten-Q estimate;
- conversion method and version;
- observation scope; and
- confidence.

A WAIS standard score and percentile must never be conflated. VCI may support a
narrow verbal-conceptual Learning observation but cannot alone establish broad
Learning Q. Broad Learning Q requires evidence across additional learning
modalities, longitudinal development, or demonstrated acquisition and transfer
of knowledge.

### Evidence contract and subject resolution

Reading a document is not the same as governing evidence. Before interpretation,
the evaluator must determine:

1. what kind of document it is;
2. who created or issued it;
3. who and what it is about;
4. which passages are fictional, quoted, institutional, autobiographical,
   collaborative, or third-party;
5. which inference domains the citizen authorizes; and
6. which person or entity each proposed observation actually describes.

The guided submission panel must capture:

- document type;
- author or issuer;
- relationship to the citizen;
- authorship and collaboration state;
- named, quoted, and fictional subjects;
- intended evidence channel;
- permitted evaluation scope;
- included pages or sections;
- excluded pages or sections;
- autobiographical status;
- sensitivity classification;
- citizen-supplied context; and
- explicit consent to evaluation.

The citizen must review a plain-language **proposed evidence contract** before
evaluation. The accepted contract becomes immutable evaluation provenance. A
later correction creates a superseding contract and reevaluation; it does not
silently rewrite the historical evaluation.

Minimum document types include:

- standardized assessment;
- school record;
- employment record;
- certification or credential;
- authored autobiographical essay;
- authored non-autobiographical essay;
- authored fiction;
- technical project;
- creative portfolio;
- personal reflection;
- third-party evaluation;
- collaborative work;
- clinical or medical context;
- context-only material; and
- other, requiring an explanation.

### Authored-work interpretation

Authored work must be evaluated for what the citizen demonstrates by creating
it, separately from what the work says about any person.

For an authored essay, permissible observations may concern:

- sustained thesis and argument structure;
- distinction between assertion and support;
- conceptual integration and original synthesis;
- research use and domain accuracy;
- written communication and organization;
- reflection on assumptions, consequences, and counterarguments; and
- ethical reasoning without treating stated beliefs as verified conduct.

The document's subject alone is not evidence of the corresponding Q. An essay
about forests does not raise Natural Q merely because forests are discussed; it
must demonstrate accurate observation, ecological understanding, classification,
pattern recognition, stewardship reasoning, or relevant practice.

For authored fiction, permissible observations may concern:

- narrative structure, continuity, and revision;
- characterization as authorial modeling;
- creative and conceptual synthesis;
- integration of technical, medical, civic, historical, or social knowledge;
- handling of multiple perspectives and consequences; and
- demonstrated craft.

Fiction safeguards are mandatory:

- a character is not the citizen;
- a narrator is not presumed autobiographical;
- dialogue is not presumed to express the citizen's belief;
- a character's emotion, conduct, diagnosis, relationship, or moral decision
  cannot be scored as the citizen's personal state or behavior; and
- authorial modeling may support a carefully scoped Demonstrated observation,
  but cannot by itself prove lived Emotional, Social, or Moral capacity.

For autobiographical work, first-person claims remain Declared evidence unless
independently supported. The same work may separately provide Demonstrated
evidence of writing, reasoning, synthesis, or reflection.

### Evidence channels

Every observation must belong to one of three visible channels:

- **Declared**: what the citizen says about their experiences, beliefs,
  intentions, interests, goals, values, or self-assessment.
- **Demonstrated**: what the citizen directly shows through authored work,
  projects, portfolios, examinations, supervised exercises, or completed
  performance.
- **Observed**: what an identifiable third party or institution records about
  the citizen.

The channels must never be merged invisibly. A combined provisional estimate
may be calculated, but every interface and export must preserve the channel
breakdown, evidence volume, range, confidence, agreement, and conflict.

Observed evidence is attributable third-party evidence, not unquestioned
institutional truth. It must retain:

- source identity and role;
- relationship to the citizen;
- direct versus hearsay knowledge;
- possible conflict of interest;
- date and context;
- verification state;
- rubric or method used;
- opportunity for citizen response; and
- independent corroboration, when available.

Anonymous evidence may never alter a Ten-Q profile. Confidentially attributed
evidence may trigger a protected review only when its source remains verifiable,
withholding is reasoned and time-limited, the citizen receives enough substance
to respond, and no consequential finding relies on permanently secret evidence.

### Observation discipline

Each observation must:

- identify its actual subject;
- cite a bounded passage, result, or performance;
- state the permitted inference;
- map to one primary Q;
- map to at most one secondary Q, with a distinct written justification;
- carry an evidence channel, date, weight, range, and confidence;
- distinguish literal source fact from contextual interpretation and Ten-Q
  inference; and
- remain contestable by the citizen.

Semantic association is not sufficient. A second-grade notation such as
"inconsistent effort" cannot be copied across Emotional, Social, Creative,
Adaptability, Physical, Natural, and Moral merely because those domains are
humanly related. It may support a narrow historical Learning observation, or no
Q observation at all, depending on context.

A readable document that produces no admissible observation still creates an
immutable evaluation record containing:

- source identity and hash;
- accepted evidence contract;
- evaluator and policy versions;
- readability and extraction result;
- the reason no observation was admitted; and
- confirmation that the profile remained unchanged.

### Q subdomains and Moral-Q safeguards

Each Q requires a versioned subdomain registry rather than one unexplained
number. Subdomains must define permissible evidence, prohibited inference,
minimum breadth, synthesis behavior, and Pending criteria.

Moral Q does not measure ideological conformity, religious belief, sexual
values, political alignment, civic loyalty, cultural familiarity, or intrinsic
human worth. It measures evidence of ethical discernment and conduct-related
capacities while leaving belief unscored.

The Moral-Q registry should include:

- ethical perception;
- perspective-taking;
- consent and autonomy reasoning;
- harm recognition;
- proportionality;
- fairness and consistency;
- truthfulness and epistemic integrity;
- accountability;
- restorative capacity;
- responsible use of power;
- epistemic humility; and
- respect for personhood.

Authored work may demonstrate ethical reasoning but cannot prove moral
character. A broad Moral Q remains Pending until there is sufficient breadth and
convergence across multiple subdomains and evidence channels. The subdomain
profile remains more prominent than any later numerical synthesis.

The evaluator must not lower Moral Q because a citizen criticizes the Society,
supports or rejects naturalism, expresses religious belief or disbelief,
advocates any consensual relationship ethic, presents controversial political
arguments, challenges custom, or reaches a different conclusion from the
evaluator. Harmony adjudicates harm and responsibility; Learning must not turn
Harmony history into a concealed punishment or conformity score.

## Phase 5: Anti-gaming without presuming guilt

Add:

- document hashing and duplicate detection;
- source and issuer verification where feasible;
- self-submitted, citizen-reviewed, externally verified, and directly observed
  evidence classes;
- version history;
- anomaly detection;
- bounded reassessment frequency;
- conflict-of-interest disclosure;
- detection of selective or repeated uploads intended to chase a favorable
  result; and
- audit-visible model and methodology versions.

Verification protects the commons but must not treat every citizen as
fraudulent. Suspicion creates a review path, never an automatic moral judgment.

## Phase 6: Citizen procedural rights

Citizens may:

- inspect every item used;
- see how each item affected each Q;
- correct OCR errors;
- add context without rewriting the original;
- dispute an inference;
- submit counterevidence;
- refuse irrelevant clinical records;
- request reconsideration; and
- appeal a consequential decision outside the original evaluation chain.

Maintain separate objects for:

- **Learning profile** — developmental evidence and provisional synthesis.
- **Qualification decision** — a decision about one specific Contribution,
  course, or safety-critical responsibility.

Contribution matching must combine relevant demonstrated capability, interest
and consent, training, accommodations, supervision, mentorship, and current
safety requirements. It must recommend pathways rather than decree a citizen's
only permissible role.

## Phase 7: Learning profile interface and auditability

The Learning tab must separate overview, interpretation, evidence, and
contestability.

### Learning overview

The overview should provide:

1. a prominent radar of the canonical Ten Qs;
2. profile breadth and plain-language confidence;
3. a versioned **Learning Profile Summary**;
4. recent profile changes;
5. recommended next steps;
6. the guided evidence-submission panel;
7. secondary tabs for each Q; and
8. recent evidence and pending reviews.

Pending axes are unfilled or interrupted, never plotted as zero. The citizen may
switch the radar between Combined provisional, Declared, Demonstrated, and
Observed views.

Do not headline one universal Ten-Q total. Prefer:

- number of sufficiently evidenced Qs;
- overall evidence confidence;
- channel coverage;
- recent change; and
- unresolved evidence gaps.

The Learning Profile Summary must describe evidence rather than fix a citizen
into a personality label. It should cover demonstrated strengths, developing or
incompletely evidenced areas, evidence gaps, recent changes, and suggested
courses, projects, demonstrations, or documentation. It must be regenerated
from the approved profile version, display evaluator and policy versions, and
never become evidence used to score a later profile.

### Individual Q views

Ten sticky secondary tabs should display the current state and confidence for
each canonical Q. Each Q view should contain:

1. subdomain radar or grouped subdomain wheel;
2. current range, confidence, breadth, recency, source count, and version;
3. Declared, Demonstrated, and Observed breakdown;
4. expandable subdomain definitions and observations;
5. historical trajectory with uncertainty;
6. evidence-effect matrix;
7. full audit ledger; and
8. correction, challenge, exclusion, and reconsideration controls.

Every trajectory point must disclose:

- U-Date and source date;
- evidence item;
- state before;
- document-specific effect;
- state after;
- confidence and range change;
- admitted observations;
- rejected observations; and
- synthesis and policy versions.

Every evidence row must disclose:

- title and document type;
- channel;
- author or issuer;
- assessed subject;
- identity-linkage state;
- provenance;
- submission and issue dates;
- original SHA-256 hash and file lineage;
- extraction method and OCR confidence;
- citizen-approved scope and evidence contract;
- evaluator and policy versions;
- Qs and subdomains affected;
- weight, score effect, and confidence effect;
- challenges, corrections, and current status; and
- superseding evaluation, when applicable.

Expanded reasoning must keep separate:

1. literal source fact;
2. contextual interpretation;
3. Ten-Q inference;
4. deterministic synthesis; and
5. citizen response.

The governing interface rule is:

> The radar invites understanding; the ledger permits verification.

## Validation matrix

Use local test documents under:

`C:\Users\Robyn\Documents\Codex\Test Documents`

Required tests:

- text-searchable PDF, image-only PDF, JPG, and PNG;
- report-card tables with grading periods on one axis and subjects on another;
- partial and bi-fold scans missing printed year or grade;
- legal-name exact match, initials, chosen name, verified variant, historical
  misspelling, and genuine mismatch;
- substantial citizen OCR correction;
- duplicate and altered-file detection;
- adult-then-child and child-then-adult upload sequences producing identical
  synthesis;
- conflicting evidence widening ranges;
- WAIS score/percentile separation;
- VCI remaining a narrow observation;
- Pending Q behavior;
- authored essay evaluation using
  `C:\Users\Robyn\Documents\Codex\Test Documents\Utopian Society\Essays\The Feral Child.docx`;
- authored fiction evaluation using
  `C:\Users\Robyn\Documents\Codex\Test Documents\Utopian Society\Stories\Utopian Society - Robyn's Journey - Chapter 10 Complete.docx`;
- an authored essay producing distinct Declared and Demonstrated observations
  without topic-based Q inflation;
- authored fiction producing craft and synthesis observations without assigning
  any character's emotions, conduct, diagnosis, relationships, or beliefs to the
  citizen;
- each observation identifying the correct subject and affecting no more than
  one primary and one justified secondary Q;
- a no-admissible-observation result still creating an auditable unchanged
  evaluation record;
- channel-separated Declared, Demonstrated, and Observed trajectories;
- Moral Q remaining Pending until its breadth and convergence rules are met;
- disagreement with Utopian or conventional cultural values never producing a
  negative Moral-Q observation by itself;
- anonymous evidence never affecting a Q;
- every plotted point resolving to its source, inference, synthesis, and citizen
  response;
- appeal, correction, and reconsideration history; and
- no legal-name or sensitive-data leakage to public surfaces or logs.

## Acceptance criteria

The phase is complete when:

- the same evidence set yields the same synthesis regardless of upload order;
- original, extraction, transcript, inference, and synthesis remain separately
  auditable;
- every upload has an immutable, citizen-approved evidence contract;
- authored fiction cannot contaminate the citizen profile with character
  attributes;
- authored essays can supply rubric-bound demonstrated evidence without being
  scored merely for their subject;
- Declared, Demonstrated, and Observed evidence remain separately inspectable;
- Moral Q measures neither cultural conformity nor civic loyalty;
- every chart and summary is traceable to bounded evidence and versioned
  synthesis;
- a citizen can understand and contest every consequential inference;
- identity verification protects evidence integrity without exposing legal
  identity;
- childhood disadvantage cannot permanently suppress an adult profile;
- no single score automatically closes a civic pathway; and
- production remains unchanged until a separately reviewed release is
  authorized.
