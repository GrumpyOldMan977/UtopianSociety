import { corpusPath } from "./corpus-documents";

export type CivicService = {
  title: string;
  description: string;
  label: string;
  href: string;
  state: "available" | "prototype" | "planned";
};

export type CivicRelationship = {
  circle: string;
  purpose: string;
};

export type CivicProfile = {
  slug: string;
  civicName: string;
  invitation: string;
  plainLanguage: string;
  scene: string;
  principle: string;
  dailyLife: string[];
  services: CivicService[];
  relationships: CivicRelationship[];
};

export const tenQs = [
  ["IQ", "Intellectual", "Reason, analyze, recognize patterns, and form coherent understanding."],
  ["EQ", "Emotional", "Understand emotion, regulate the self, and meet others with empathy."],
  ["SQ", "Social", "Communicate, cooperate, participate, and strengthen civic relationship."],
  ["CQ", "Creative", "Imagine, make, improvise, and discover possibilities that did not exist before."],
  ["AQ", "Adaptability", "Remain flexible, resilient, and capable of growing through change."],
  ["MQ", "Moral", "Join conscience to action through integrity, justice, and ethical reflection."],
  ["PQ", "Physical", "Develop bodily awareness, coordination, health, and sustainable vitality."],
  ["NQ", "Natural", "Read living systems and understand humanity's ecological interdependence."],
  ["TQ", "Technological", "Use tools and data responsibly, with systems literacy and ethical restraint."],
  ["LQ", "Learning", "Practice curiosity, reflection, and the ability to learn, unlearn, and relearn."],
] as const;

export const learningPathways = [
  {
    stage: "Roots",
    title: "Foundational learning",
    description: "Philosophy, logic, mathematics, natural science, ethics, and history provide common ground for every path.",
  },
  {
    stage: "Trunk",
    title: "The civic core",
    description: "Communication, empathy, cooperation, and ethical application connect knowledge to citizenship.",
  },
  {
    stage: "Branches",
    title: "Fields of application",
    description: "Agriculture, environment, infrastructure, medicine, art, culture, energy, technology, and governance become interwoven practice.",
  },
  {
    stage: "Canopy",
    title: "Aspirational development",
    description: "Citizens may retrain, deepen mastery, change vocation, conduct research, teach, or begin again at any season of life.",
  },
] as const;

export const civicProfiles: Record<string, CivicProfile> = {
  learning: {
    slug: "learning",
    civicName: "The Learning Dome",
    invitation: "Discover how you learn, where your curiosity leads, and how knowledge becomes service.",
    plainLanguage: "Learning is lifelong, cost-free, cooperative, and woven into daily contribution. The Circle does not rank human worth. It helps each citizen understand their strengths, find mentorship, and build a path that joins curiosity to civic purpose.",
    scene: "A cathedral of glass and sunlight: circles of learners, floor tablets, gardens, workshops, questions in motion, and no raised desk from which obedience is demanded.",
    principle: "We guide, not command. Curiosity must remain safe enough to make mistakes.",
    dailyLife: [
      "Explore the Ten Qs through reflection, projects, and mentor conversation.",
      "Enter the Utopian Society University at any Renewal cycle in life.",
      "Combine study with apprenticeships, research, artistry, craft, and civic work.",
      "Request retraining or a new vocational path without losing dignity or contribution standing.",
    ],
    services: [
      { title: "Explore the Ten Qs", description: "Meet the ten interwoven forms of intelligence without reducing yourself to a score.", label: "Begin reflection", href: "#ten-qs", state: "available" },
      { title: "Find a learning path", description: "Match an interest, learning mode, and available rhythm to a suggested University branch.", label: "Open the pathway studio", href: "#learning-studio", state: "prototype" },
      { title: "Request enrollment", description: "Prepare an expression of interest for study, apprenticeship, mentorship, or research.", label: "Open enrollment prototype", href: "#enrollment", state: "prototype" },
      { title: "Read the governing Charter", description: "Follow the formal mandate, safeguards, Ten Q model, Living Profile, and University structure.", label: "Read the Charter", href: corpusPath("circle-of-learning-charter"), state: "available" },
    ],
    relationships: [
      { circle: "Contribution", purpose: "Turns study into apprenticeship, civic projects, vocational placement, and recognized contribution." },
      { circle: "Harmony", purpose: "Protects pedagogical ethics and helps resolve conflict without humiliation or competitive discipline." },
      { circle: "Custodianship", purpose: "Maintains archives, learning infrastructure, data protection, and the Central Knowledge Nexus." },
      { circle: "Healing", purpose: "Supports accessibility, neurological diversity, emotional balance, and humane changes of pace." },
    ],
  },
  healing: {
    slug: "healing",
    civicName: "The Commons of Whole-Person Care",
    invitation: "Seek care, understand your choices, find a healing path, and remain sovereign within every act of medicine.",
    plainLanguage: "Healing is a constitutional right and a common civic duty. The Circle joins physical medicine, mental and emotional care, sexual and reproductive health, social belonging, prevention, and dignified end-of-life choice without allowing any healer or institution to take ownership of a person's body.",
    scene: "A sunlit conservatory of timber, warm stone, medicinal gardens, private consultation alcoves, water, and open paths—care embedded in ordinary life rather than hidden behind an institutional wall.",
    principle: "Care may be offered with skill and urgency; consent remains with the person receiving it.",
    dailyLife: ["Request routine or timely care without payment or rank.", "Choose a physical, emotional, sexual, reproductive, relational, or preventive pathway.", "State accessibility, privacy, contact, support-person, and consent preferences.", "Refuse, pause, change, or withdraw from care without surrendering dignity."],
    services: [
      { title: "Request care", description: "Prepare a private, non-persistent request describing the kind of support and timing you need.", label: "Open local intake", href: "#civic-action-studio", state: "prototype" },
      { title: "Find a healing path", description: "Explore care domains and the kinds of healers, mentors, and settings associated with them.", label: "Explore pathways", href: "#whole-person-care", state: "available" },
      { title: "Consent and privacy", description: "Review the rights to informed choice, refusal, revocation, access, and narrow emergency intervention.", label: "Read your safeguards", href: "#consent-governs-care", state: "available" },
      { title: "Read the governing Charter", description: "Follow the Circle's authority, ethics, roles, education, substance rules, and oversight.", label: "Read the Charter", href: corpusPath("circle-of-healing-charter"), state: "available" },
    ],
    relationships: [
      { circle: "Learning", purpose: "Educates healers and citizens while leaving individual clinical judgment and consent with Healing and the patient." },
      { circle: "Contribution", purpose: "Coordinates staffing, apprenticeships, and protected rest without conditioning care on productivity." },
      { circle: "Balance", purpose: "Reviews system-wide capacity and Continuance resources without directing treatment or overriding autonomy." },
      { circle: "Harmony", purpose: "Receives disputes and supports restoration without converting mediation into diagnosis or treatment." },
    ],
  },
  contribution: {
    slug: "contribution",
    civicName: "The Exchange of Useful Hands",
    invitation: "Find meaningful work, offer skill, request a new path, and see how shared effort sustains shared life.",
    plainLanguage: "Contribution coordinates useful participation without treating productivity as human worth. It connects citizens to sectors, apprenticeships, resources, rest, and retraining while keeping the economy reciprocal and transparent.",
    scene: "Glass-and-timber pantries, herb-lined paths, workshops open to daylight, shared harvests, and quiet consoles that record use without turning belonging into a purchase.",
    principle: "Everyone contributes; everyone eats. Measurement serves renewal, never domination.",
    dailyLife: ["Offer time or skill to an active civic need.", "Review a contribution rhythm and protected rest.", "Request retraining or reallocation with Learning support.", "See anonymized sector needs and renewal indicators."],
    services: [
      { title: "Contribution profile", description: "Review roles, skills, mentorship, rest, and current civic participation.", label: "Open local prototype", href: "#civic-action-studio", state: "prototype" },
      { title: "Sector needs", description: "See where help is requested without converting urgency into coercion.", label: "Open needs preview", href: "#civic-action-studio", state: "prototype" },
      { title: "Request a new path", description: "Begin retraining or a supported change of vocation with Learning.", label: "Shape a local pathway", href: "#civic-action-studio", state: "prototype" },
      { title: "Read the governing Charter", description: "Examine contribution flow, safeguards, renewal, and mathematical foundations.", label: "Read the Charter", href: corpusPath("circle-of-contribution-charter"), state: "available" },
    ],
    relationships: [
      { circle: "Learning", purpose: "Provides apprenticeship, retraining, mentorship, and the return of practical discoveries to education." },
      { circle: "Balance", purpose: "Reviews cross-system capacity and whether contribution remains sustainable across the whole Society." },
      { circle: "Healing", purpose: "Protects health, accessibility, recovery, and the right to a humane pace." },
      { circle: "Custodianship", purpose: "Connects labor and resource needs to infrastructure, ecology, and technical stewardship." },
    ],
  },
  harmony: {
    slug: "harmony",
    civicName: "The Place Where Harm Is Faced",
    invitation: "Ask for help, report harm, seek mediation, and follow a restorative process without surrendering dignity.",
    plainLanguage: "Harmony is the Society's restorative and mediating conscience. It receives concerns, protects voice, schedules dialogue, and helps people repair relationship. It does not punish, diagnose, or secretly decide a person's worth.",
    scene: "An equal circle of seats opening toward a quiet garden, warm stone beneath the feet, translucent screens for shared evidence, and no bench raised above the people who must speak.",
    principle: "Peace is the presence of people willing to face conflict together.",
    dailyLife: ["Report harm or request mediation.", "Choose what information may be shared and with whom.", "See the schedule and status of a restorative proceeding.", "Read anonymized outcomes and procedural lessons in the public ledger."],
    services: [
      { title: "Report harm", description: "A consent-led form for concerns, safety needs, requested remedy, and supporting evidence.", label: "Open local intake", href: "#civic-action-studio", state: "prototype" },
      { title: "Harmony calendar", description: "A public, privacy-preserving schedule of proceedings and open mediation times.", label: "Open the proceedings calendar", href: "/proceedings-calendar", state: "prototype" },
      { title: "Case path", description: "A private timeline showing intake, consent, evidence, conference, outcome, and appeal.", label: "Explore the process", href: "#civic-action-studio", state: "prototype" },
      { title: "Read restorative authority", description: "Follow the constitutional and Codex foundations for justice, repair, and review.", label: "Read the Restoration Codex", href: corpusPath("restoration-codex"), state: "available" },
    ],
    relationships: [
      { circle: "Restoration", purpose: "Provides the controlling framework for repair, accountability, proportion, and reintegration." },
      { circle: "Learning", purpose: "Builds conflict literacy and ensures educational settings resolve harm without competitive discipline." },
      { circle: "Healing", purpose: "Supports care and recovery without allowing mediation to become diagnosis or treatment." },
      { circle: "Custodianship", purpose: "Protects evidence, access permissions, scheduling systems, and an auditable procedural record." },
    ],
  },
  balance: {
    slug: "balance",
    civicName: "The Observatory of Equilibrium",
    invitation: "Understand capacity, population, continuity, and the consequences that travel between civic systems.",
    plainLanguage: "Balance combines signals from across the Society so no single Circle optimizes its own work at everyone else's expense. It forecasts, questions, and recommends; it does not govern people by equation.",
    scene: "A high observation room of stone, glass, and living maps where water, food, population, rest, ecology, and civic confidence move as one readable horizon.",
    principle: "A measurement is a question offered to conscience, never a command issued to a life.",
    dailyLife: ["Read public capacity and sustainability indicators.", "Understand why a cross-Circle review was opened.", "Submit context that numerical models may have missed.", "Review recommendations, minority findings, and later corrections."],
    services: [
      { title: "State of balance", description: "Public indicators with human context, uncertainty, source, and revision history.", label: "Open System Review", href: "/system-review", state: "prototype" },
      { title: "Request review", description: "Ask Balance to examine an emerging cross-system strain or overlooked consequence.", label: "Prepare local review", href: "/system-review#civic-action-studio", state: "prototype" },
      { title: "Methods library", description: "Inspect formulas, assumptions, limitations, audits, and public challenges.", label: "Inspect a method", href: "/system-review#civic-action-studio", state: "prototype" },
      { title: "Read Continuance authority", description: "Review the constitutional basis for continuity and humane capacity planning.", label: "Read Article VII", href: corpusPath("article-vii-continuance-clause"), state: "available" },
    ],
    relationships: [
      { circle: "Contribution", purpose: "Supplies renewal, labor, and sector information while retaining responsibility for contribution systems." },
      { circle: "Custodianship", purpose: "Supplies environmental, infrastructure, energy, water, and resource measurements." },
      { circle: "Healing", purpose: "Adds clinical and human context without surrendering medical decisions to forecasting." },
      { circle: "Harmony", purpose: "Reviews ethical strain, public challenge, and disputes about interpretation or procedure." },
    ],
  },
  custodianship: {
    slug: "custodianship",
    civicName: "The Living Systems Commons",
    invitation: "See the systems beneath daily life, request care for shared infrastructure, and follow every repair to completion.",
    plainLanguage: "Custodianship tends the physical and digital commons: water, energy, transit, land, records, tools, and resilient infrastructure. It maintains systems in public trust and must make their condition legible to the people who depend on them.",
    scene: "Basalt terraces, sapphire glass, water channels, solar domes, ecological workstations, and living maps that pulse with the rhythms of soil, energy, transit, and weather.",
    principle: "Caretakers of motion, never owners of the systems held in trust.",
    dailyLife: ["Report a repair, access, environmental, or infrastructure need.", "See service status and expected restoration time.", "Read water, energy, soil, transit, and resilience indicators.", "Inspect public maintenance history and technical provenance."],
    services: [
      { title: "Request service", description: "Report a shared-system problem and follow its public, accountable path to resolution.", label: "Open local request", href: "#civic-action-studio", state: "prototype" },
      { title: "Living systems", description: "Read public infrastructure and ecological conditions without exposing private household data.", label: "Preview system status", href: "#civic-action-studio", state: "prototype" },
      { title: "Technical record", description: "Inspect decisions, maintenance, provenance, accessibility work, and later corrections.", label: "Preview the ledger", href: "#civic-action-studio", state: "prototype" },
      { title: "Read constitutional stewardship", description: "Follow the Society's environmental and governance foundations.", label: "Read Article XIII", href: corpusPath("article-xiii-environmental-stewardship"), state: "available" },
    ],
    relationships: [
      { circle: "Balance", purpose: "Combines systems data into cross-Circle capacity analysis without taking control of infrastructure." },
      { circle: "Contribution", purpose: "Coordinates skilled participation, maintenance needs, apprenticeships, and protected rest." },
      { circle: "Learning", purpose: "Trains stewards, preserves technical knowledge, and makes systems understandable to citizens." },
      { circle: "Defense", purpose: "Coordinates resilience and emergency continuity under strict constitutional limits." },
    ],
  },
  defense: {
    slug: "defense",
    civicName: "The Watch Without Dominion",
    invitation: "Understand present risk, prepare together, and see every exceptional power return to the people.",
    plainLanguage: "Defense protects the Society from external threat and helps coordinate resilience. Its authority is deliberately narrow, temporary, documented, and reviewable. It may never become a tool of internal suppression.",
    scene: "A quiet ridge above the valley: weather instruments, communication beacons, emergency stores, and an open coordination table facing outward rather than a fortress turned toward its own people.",
    principle: "Protection is legitimate only while it remains accountable to those protected.",
    dailyLife: ["See current readiness without alarmist language.", "Join resilience, first-aid, communications, or evacuation training.", "Review every temporary crisis action and its expiration.", "Challenge secrecy or exceptional authority through public review."],
    services: [
      { title: "Readiness status", description: "A calm public account of conditions, preparation, and actions currently in force.", label: "Open readiness preview", href: "#civic-action-studio", state: "prototype" },
      { title: "Resilience training", description: "Enroll in first aid, communications, evacuation, logistics, and community preparedness.", label: "Prepare local interest", href: "#civic-action-studio", state: "prototype" },
      { title: "Crisis action record", description: "Inspect authority, duration, responsible bodies, evidence, review, and termination.", label: "Inspect sample record", href: "#civic-action-studio", state: "prototype" },
      { title: "Read constitutional limits", description: "Review the Society's defense mandate and absolute prohibitions.", label: "Read Article XIX", href: corpusPath("article-xix-military-defense"), state: "available" },
    ],
    relationships: [
      { circle: "Custodianship", purpose: "Supports communications, infrastructure, logistics, and continuity of essential systems." },
      { circle: "Healing", purpose: "Coordinates medical readiness and recovery while preserving clinical independence." },
      { circle: "Harmony", purpose: "Protects rights, reviews exceptional conduct, and supports post-crisis restoration." },
      { circle: "The People", purpose: "Retain final civic authority over exceptional powers, review, and return to ordinary governance." },
    ],
  },
  affirmation: {
    slug: "affirmation",
    civicName: "The Civic Practice of Being Witnessed",
    invitation: "Record useful work, invite fair witness, understand the criteria, and challenge a process that failed to see clearly.",
    plainLanguage: "Affirmation verifies contribution; it does not manufacture a person's value. Its task is to preserve truthful civic memory through human acknowledgment, published procedure, and a reviewable record that recognizes intellectual, creative, manual, emotional, and care labor without hierarchy.",
    scene: "An open hall of small witness circles, shared work tables, quiet recording alcoves, and a public wall where acts of service are preserved as memory rather than displayed as rank.",
    principle: "Affirmation reveals value already present; it does not grant human worth.",
    dailyLife: ["Prepare a contribution for peer verification.", "See the evidence and criteria used in an affirmation.", "Add human context alongside quantitative confirmation.", "Request review when a process overlooked, distorted, or exposed a contribution unfairly."],
    services: [
      { title: "Prepare an affirmation", description: "Describe a contribution, its civic purpose, and the witnesses or evidence that can confirm it.", label: "Open local prototype", href: "#civic-action-studio", state: "prototype" },
      { title: "Recognition record", description: "Preview how verified contribution may appear without creating status, rank, or competition.", label: "Preview record", href: "#civic-action-studio", state: "prototype" },
      { title: "Request review", description: "Identify missing context, bias, privacy concerns, or procedural error for a later Harmony-supported review.", label: "Review prototype", href: "#civic-action-studio", state: "prototype" },
      { title: "Read the governing Charter", description: "Examine the human, procedural, and systemic layers of civic witness.", label: "Read the Charter", href: corpusPath("circle-of-affirmation-charter"), state: "available" },
    ],
    relationships: [
      { circle: "Contribution", purpose: "Coordinates useful participation while Affirmation independently verifies the record within its assigned domain." },
      { circle: "Harmony", purpose: "Supports review of contested process, privacy, bias, and procedural fairness." },
      { circle: "Custodianship", purpose: "Preserves provenance, permissions, integrity, and continuity of the civic record." },
      { circle: "Learning", purpose: "Teaches citizens how criteria, evidence, interpretation, and appeals work." },
    ],
  },
  "time-observance": {
    slug: "time-observance",
    civicName: "The Living Measure of Time",
    invitation: "Read today's Utopian date, explore the year, understand observances, and convert between civic and Gregorian time.",
    plainLanguage: "Time and Observance is the Society's shared civil instrument, not an eighth Foundational Circle. It coordinates dates, weeks, seasons, Bridging, and public remembrance while protecting every person's freedom to participate, reinterpret, or abstain.",
    scene: "A circular civic observatory open to the sky, its floor marking thirteen months, its garden changing with the seasons, and its central clock remaining visible from every path.",
    principle: "Shared rhythm may invite belonging; it must never compel belief.",
    dailyLife: ["Read the current Utopian date and Gregorian reference.", "Explore thirteen months, seven weekdays, and the Bridging outside both.", "Find upcoming civic and celestial observances.", "Understand why the conversion moves independently of Gregorian leap years."],
    services: [
      { title: "Open the living calendar", description: "Explore the current month and return instantly to today's Utopian date.", label: "Open calendar", href: "#living-calendar", state: "available" },
      { title: "Convert a date", description: "Preview a Utopian conversion using the same continuity rule as the center clock.", label: "Open converter", href: "#civic-action-studio", state: "prototype" },
      { title: "Observance guide", description: "Review the civic meaning of months, seasons, Bridging, and voluntary observance.", label: "Browse the year", href: "#living-calendar", state: "available" },
      { title: "Read the governing Charter", description: "Examine the reference epoch, continuity rule, calendar structure, and protections against coercion.", label: "Read the Charter", href: corpusPath("charter-of-time-and-observance"), state: "available" },
    ],
    relationships: [
      { circle: "Council of Seasons", purpose: "Stewards public continuity, seasonal coordination, and cross-Circle observance without becoming a separate Foundational mandate." },
      { circle: "Learning", purpose: "Explains the system, its astronomy, and the distinction between civic date and exact celestial event." },
      { circle: "Custodianship", purpose: "Preserves the reference standard, public record, and reliable technical implementation." },
      { circle: "Harmony", purpose: "Protects accessibility, cultural interpretation, voluntary participation, and freedom from compelled observance." },
    ],
  },
};

export const getCivicProfile = (slug: string) => civicProfiles[slug];
