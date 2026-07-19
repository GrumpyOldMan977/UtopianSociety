import { corpusPath } from "./corpus-documents";

export type RingPosition =
  | "north"
  | "northeast"
  | "east"
  | "southeast"
  | "south"
  | "southwest"
  | "west"
  | "northwest";

export type NavigatorViewId =
  | "root"
  | "society"
  | "civic-portal"
  | "civic-life"
  | "civic-services"
  | "public-record"
  | "circle-system"
  | "foundational"
  | "operational"
  | `family-${string}`;

export type NavigatorNode = {
  id: string;
  title: string;
  subtitle: string;
  subtitleLines?: string[];
  position: RingPosition;
  href?: string;
  nextView?: NavigatorViewId;
  primary?: boolean;
};

export type NavigatorView = {
  id: NavigatorViewId;
  eyebrow: string;
  title: string;
  description: string;
  parent?: NavigatorViewId;
  nodes: NavigatorNode[];
};

export type CivicTier = "foundational" | "operational" | "constitutional-instrument";

export type CivicBody = {
  slug: string;
  title: string;
  shortTitle: string;
  tier: CivicTier;
  parentCircle?: string;
  independentDomain?: string;
  authorityLimits?: string;
  status: string;
  summary: string;
  mandate: string[];
  boundary: string;
  sourceLinks: { label: string; href: string }[];
};

export const civicBodies: CivicBody[] = [
  {
    slug: "contribution",
    title: "Circle of Contribution",
    shortTitle: "Contribution",
    tier: "foundational",
    status: "Foundational Circle · Charter published",
    summary: "Stewards of contribution, sectors, reciprocal labor, and the dignity of useful participation.",
    mandate: ["Coordinate sectors and contribution pathways", "Protect rest, accessibility, and meaningful work", "Maintain transparent contribution systems without reducing worth to output"],
    boundary: "Contribution administers labor and sector systems. Balance reviews cross-system sustainability; Harmony retains disputes and Restoration retains formal accountability.",
    sourceLinks: [
      { label: "Circle of Contribution Charter", href: corpusPath("circle-of-contribution-charter") },
      { label: "Article XVI · Governance of Sectors & Contribution", href: corpusPath("article-xvi-governance-of-sectors-contribution") },
    ],
  },
  {
    slug: "learning",
    title: "Circle of Learning",
    shortTitle: "Learning",
    tier: "foundational",
    status: "Foundational Circle · Charter published",
    summary: "Guardians of education, archives, mentorship, evidence literacy, and lifelong inquiry.",
    mandate: ["Sustain lifelong and accessible learning", "Preserve knowledge across generations", "Audit civic methods and cultivate evidence literacy"],
    boundary: "Learning tests and teaches methods; it does not turn expertise into appointment, determine clinical care, or command another Circle's substantive work.",
    sourceLinks: [
      { label: "Circle of Learning Charter", href: corpusPath("circle-of-learning-charter") },
      { label: "Article XII · Education & Learning", href: corpusPath("article-xii-education-learning") },
    ],
  },
  {
    slug: "healing",
    title: "Circle of Healing",
    shortTitle: "Healing",
    tier: "foundational",
    status: "Foundational Circle · Charter published · Draft v2.2 classification",
    summary: "Stewards of health, bodily autonomy, medical ethics, freely accessible care, and the dignity of the whole person.",
    mandate: ["Protect bodily autonomy and informed, revocable consent", "Provide equitable physical, mental, sexual, reproductive, and relational care", "Maintain public standards for healers, care access, privacy, and ethical practice"],
    boundary: "Healing governs care and medical ethics. Balance reviews system-wide capacity and Continuance resources; Harmony retains disputes and restoration; Learning supports education without directing clinical judgment.",
    sourceLinks: [
      { label: "Circle of Healing Charter", href: corpusPath("circle-of-healing-charter") },
      { label: "Article VIII · Continuance & Medical Ethics", href: corpusPath("article-viii-continuance-medical-ethics") },
      { label: "Article IX · End of Life & Legacy", href: corpusPath("article-ix-end-of-life-legacy") },
      { label: "Sexual Expression Codex", href: corpusPath("sexual-expression-codex") },
    ],
  },
  {
    slug: "harmony",
    title: "Circle of Harmony",
    shortTitle: "Harmony",
    tier: "foundational",
    status: "Foundational Circle · Daughter Charter in draft",
    summary: "The Society's restorative, mediating, ethical, and cultural conscience—service without supremacy.",
    mandate: ["Mediate interpersonal and inter-Circle disputes", "Support restoration, rights review, and ritual repair", "Preserve civic trust without compelling conformity"],
    boundary: "Harmony may convene, mediate, audit, and recommend. It may not punish, diagnose, command resources, or decide binding civic questions without separate lawful authority.",
    sourceLinks: [
      { label: "Article V · Justice & Resolution", href: corpusPath("article-v-justice-resolution") },
      { label: "Restoration Codex", href: corpusPath("restoration-codex") },
    ],
  },
  {
    slug: "custodianship",
    title: "Circle of Custodianship",
    shortTitle: "Custodianship",
    tier: "foundational",
    status: "Foundational Circle · Charter pending",
    summary: "Stewards of Earth, infrastructure, resources, technical integrity, and the systems upon which civic life depends.",
    mandate: ["Maintain infrastructure and essential systems", "Preserve ecological and resource integrity", "Safeguard technical records, provenance, and resilience"],
    boundary: "Custodianship maintains systems and measurements. Balance interprets combined capacity; Healing retains clinical care; Defense remains constitutionally distinct.",
    sourceLinks: [
      { label: "Article XIII · Environmental Stewardship", href: corpusPath("article-xiii-environmental-stewardship") },
      { label: "Article XVII · Governance Structure & Circles", href: corpusPath("article-xvii-governance-structure-circles") },
    ],
  },
  {
    slug: "balance",
    title: "Circle of Balance",
    shortTitle: "Balance",
    tier: "foundational",
    status: "Foundational Circle · Daughter Charter Draft v1.0",
    summary: "Integrators of population capacity, Continuance ethics, re-entry, ratios, and cross-system equilibrium.",
    mandate: ["Assess population sustainability and carrying capacity", "Hold Continuance ethics with competent Circles", "Review re-entry and cross-system effects through humane measurement"],
    boundary: "Balance may integrate and forecast but may not engineer population, practice medicine, adjudicate disputes, command labor, or govern by equation.",
    sourceLinks: [
      { label: "Article VII · Continuance Clause", href: corpusPath("article-vii-continuance-clause") },
      { label: "Immigration Codex", href: corpusPath("immigration-codex") },
      { label: "Article XVII · Governance Structure & Circles", href: corpusPath("article-xvii-governance-structure-circles") },
    ],
  },
  {
    slug: "defense",
    title: "Circle of Defense",
    shortTitle: "Defense",
    tier: "foundational",
    status: "Foundational Circle · Charter pending",
    summary: "Guardians of sovereignty and preparedness under strict non-domination and crisis safeguards.",
    mandate: ["Prepare for external threats and civic resilience", "Protect without aggression or internal suppression", "Submit every crisis action to public record and review"],
    boundary: "Defense acts only under constitutional authority. The Crisis Ring is temporary; Custodianship supports systems, and the people retain final civic authority.",
    sourceLinks: [
      { label: "Article XIX · Military & Defense", href: corpusPath("article-xix-military-defense") },
      { label: "Article XX · Prohibition of Weapons and Torture", href: corpusPath("article-xx-prohibition-of-weapons-and-torture") },
    ],
  },
  {
    slug: "affirmation",
    title: "Circle of Affirmation",
    shortTitle: "Affirmation",
    tier: "operational",
    parentCircle: "Contribution",
    independentDomain: "Verification, acknowledgment, and preservation of contribution records.",
    authorityLimits: "Affirmation verifies contribution; it does not create human worth, command labor, or replace Harmony review.",
    status: "Operational Circle · Charter published",
    summary: "A civic witness that verifies useful contribution without converting recognition into rank or privilege.",
    mandate: ["Verify contribution through human, procedural, and systemic witness", "Preserve transparent criteria and reviewable records", "Protect equal recognition across intellectual, manual, creative, emotional, and care labor"],
    boundary: "Affirmation possesses independent authority within contribution verification. Contribution coordinates labor, Harmony reviews disputed process, and Custodianship protects the record.",
    sourceLinks: [
      { label: "Circle of Affirmation Charter", href: corpusPath("circle-of-affirmation-charter") },
      { label: "Circle of Contribution Charter", href: corpusPath("circle-of-contribution-charter") },
    ],
  },
  {
    slug: "immigration",
    title: "Immigration Civic Office",
    shortTitle: "Immigration",
    tier: "operational",
    independentDomain: "Hopeful intake, civic education, assessment, oath, entry, and voluntary exit.",
    authorityLimits: "Immigration administers a Codex pathway; it cannot create physical residency, legal nationality, or secret civic standing.",
    status: "Operational civic office · Codex published",
    summary: "The voluntary path by which a Hopeful learns, consents, demonstrates understanding, and enters symbolic civic standing.",
    mandate: ["Provide an understandable and voluntary entry pathway", "Protect informed consent and the continuing right of exit", "Maintain an accurate, public citizenship record when durable services exist"],
    boundary: "Immigration administers entry and exit under the Immigration Codex. Balance reviews capacity, Learning provides civic education, and Harmony protects procedural fairness.",
    sourceLinks: [
      { label: "Immigration Codex", href: corpusPath("immigration-codex") },
      { label: "Article II · Membership & Citizenship", href: corpusPath("article-ii-membership-citizenship") },
    ],
  },
  {
    slug: "time-observance",
    title: "Time and Observance",
    shortTitle: "Time & Observance",
    tier: "constitutional-instrument",
    independentDomain: "The shared civil calendar, reference epoch, observances, and public conversion standard.",
    authorityLimits: "The calendar coordinates time; it cannot compel belief, worship, celebration, or conformity.",
    status: "Shared constitutional instrument · Charter published",
    summary: "The common rhythm by which the Society coordinates civic time while preserving voluntary observance.",
    mandate: ["Maintain the Utopian calendar and reference epoch", "Publish conversions, observances, and continuity rules", "Protect voluntary participation and accurate public timekeeping"],
    boundary: "Time and Observance is stewarded through the Council of Seasons and embodied by the center clock. It coordinates every Circle without becoming an eighth Foundational mandate.",
    sourceLinks: [
      { label: "Charter of Time and Observance", href: corpusPath("charter-of-time-and-observance") },
      { label: "Article X · Rituals & Continuity", href: corpusPath("article-x-rituals-continuity") },
    ],
  },
];

export const foundationalCircles = civicBodies.filter((body) => body.tier === "foundational");
export const operationalBodies = civicBodies.filter((body) => body.tier === "operational");

const circleHref = (slug: string) => `/circles/${slug}`;

const relatedNodes: Record<string, NavigatorNode[]> = {
  contribution: [
    { id: "contribution-charter", title: "The Charter", subtitle: "Published civic instrument", position: "east", href: corpusPath("circle-of-contribution-charter") },
    { id: "sectors", title: "Sector Governance", subtitle: "Constitutional relationship", position: "south", href: corpusPath("article-xvi-governance-of-sectors-contribution") },
    { id: "affirmation", title: "Affirmation", subtitle: "Operational civic witness", position: "west", href: circleHref("affirmation") },
  ],
  learning: [
    { id: "learning-charter", title: "The Charter", subtitle: "Published civic instrument", position: "east", href: corpusPath("circle-of-learning-charter") },
    { id: "education", title: "Education", subtitle: "Constitutional foundation", position: "south", href: corpusPath("article-xii-education-learning") },
    { id: "affirmation", title: "Affirmation", subtitle: "Related operational Circle", position: "west", href: circleHref("affirmation") },
  ],
  healing: [
    { id: "healing-charter", title: "The Charter", subtitle: "Published civic instrument", position: "east", href: corpusPath("circle-of-healing-charter") },
    { id: "medical-ethics", title: "Medical Ethics", subtitle: "Constitutional foundation", position: "south", href: corpusPath("article-viii-continuance-medical-ethics") },
    { id: "sexual-health", title: "Sexual Well-Being", subtitle: "Related governing Codex", position: "west", href: corpusPath("sexual-expression-codex") },
    { id: "end-of-life", title: "End of Life", subtitle: "Legacy and autonomy", position: "southeast", href: corpusPath("article-ix-end-of-life-legacy") },
  ],
  harmony: [
    { id: "justice", title: "Justice & Resolution", subtitle: "Constitutional foundation", position: "east", href: corpusPath("article-v-justice-resolution") },
    { id: "restoration", title: "Restoration", subtitle: "Controlling Codex", position: "south", href: corpusPath("restoration-codex") },
    { id: "rights", title: "Rights Safeguards", subtitle: "Constitutional relationship", position: "west", href: corpusPath("article-iii-rights-freedoms") },
  ],
  custodianship: [
    { id: "healing", title: "Healing", subtitle: "Foundational peer Circle", position: "east", href: circleHref("healing") },
    { id: "earth", title: "Earth Stewardship", subtitle: "Constitutional foundation", position: "south", href: corpusPath("article-xiii-environmental-stewardship") },
    { id: "systems", title: "Civic Systems", subtitle: "Infrastructure mandate", position: "west", href: corpusPath("article-xiv-governance-framework") },
  ],
  balance: [
    { id: "population", title: "Population & Capacity", subtitle: "Charter office", position: "east", href: circleHref("balance") + "#mandate" },
    { id: "continuance", title: "Continuance Ethics", subtitle: "Charter council", position: "south", href: corpusPath("article-vii-continuance-clause") },
    { id: "reentry", title: "Re-entry Review", subtitle: "Charter council", position: "west", href: corpusPath("article-ii-membership-citizenship") },
  ],
  defense: [
    { id: "defense-article", title: "Defense", subtitle: "Constitutional foundation", position: "east", href: corpusPath("article-xix-military-defense") },
    { id: "prohibition", title: "Prohibitions", subtitle: "Weapons and torture", position: "south", href: corpusPath("article-xx-prohibition-of-weapons-and-torture") },
    { id: "crisis", title: "Crisis Ring", subtitle: "Temporary civic body", position: "west", href: corpusPath("article-xiv-governance-framework") },
  ],
};

const familyViews = Object.fromEntries(
  foundationalCircles.map((circle): [NavigatorViewId, NavigatorView] => {
    const id = `family-${circle.slug}` as NavigatorViewId;
    return [id, {
      id,
      eyebrow: "Circle family map",
      title: circle.title,
      description: "The Foundational Circle holds North; linked bodies and controlling instruments occupy the remaining rings.",
      parent: "foundational",
      nodes: [
        { id: circle.slug, title: circle.shortTitle, subtitle: "Enter the Circle page", position: "north", href: circleHref(circle.slug), primary: true },
        ...(relatedNodes[circle.slug] ?? []),
      ],
    }];
  }),
) as Record<NavigatorViewId, NavigatorView>;

export const navigatorViews: Record<NavigatorViewId, NavigatorView> = {
  root: {
    id: "root",
    eyebrow: "Frontispiece · A Living Corpus",
    title: "Enter the living corpus",
    description: "Choose a ring to enter the corpus, or open its living center.",
    nodes: [
      { id: "society", title: "Utopian Society", subtitle: "Read the constitutional framework.", position: "north", nextView: "society" },
      { id: "civic-portal", title: "Civic Portal", subtitle: "Enter services and civic life.", position: "east", nextView: "civic-portal" },
      { id: "lore", title: "Lore", subtitle: "Life within the imagined society.", position: "south", href: "/lore" },
      { id: "essays", title: "Blogs & Essays", subtitle: "The evolution of ideas.", position: "west", href: "/blogs-essays" },
    ],
  },
  society: {
    id: "society",
    eyebrow: "North Ring · Utopian Society",
    title: "Enter the civic corpus",
    description: "Read what the Society is, how it is constituted, and which instruments govern its civic bodies.",
    parent: "root",
    nodes: [
      { id: "foundations", title: "Foundations", subtitle: "Orientation, Declaration, and Charter", position: "north", href: "/utopian-society" },
      { id: "instruments", title: "Charters & Codices", subtitle: "Civic instruments and living law", position: "east", href: "/charters-codices" },
      { id: "constitution", title: "Constitution", subtitle: "The living framework", position: "south", href: corpusPath("constitution-of-the-utopian-society") },
      { id: "circles", title: "Circle System", subtitle: "The interwoven bodies of governance", position: "west", nextView: "circle-system" },
    ],
  },
  "civic-portal": {
    id: "civic-portal",
    eyebrow: "East Ring · Civic Portal",
    title: "Enter civic life",
    description: "The public interface between the governing corpus and the people who learn, participate, seek care, request review, and keep the common record.",
    parent: "root",
    nodes: [
      { id: "directory", title: "Civic Directory", subtitle: "Every Circle, office, and public interface", position: "north", href: "/circles" },
      { id: "pathways", title: "Citizen Pathways", subtitle: "Entry, standing, rights, and voluntary exit", position: "east", nextView: "civic-life" },
      { id: "services", title: "Services & Participation", subtitle: "Care, learning, contribution, and support", position: "south", nextView: "civic-services" },
      { id: "record", title: "Public Record", subtitle: "Transparency, calendars, status, and review", position: "west", nextView: "public-record" },
    ],
  },
  "civic-life": {
    id: "civic-life",
    eyebrow: "The Lived Covenant",
    title: "Enter civic life",
    description: "Membership becomes tangible through belonging, protected freedom, reciprocal responsibility, and an open path of entry.",
    parent: "civic-portal",
    nodes: [
      { id: "membership", title: "Membership", subtitle: "Citizenship and civic standing", position: "north", href: corpusPath("article-ii-membership-citizenship") },
      { id: "immigration", title: "Immigration", subtitle: "Begin the Hopeful pathway", position: "east", href: "/circles/immigration", primary: true },
      { id: "rights", title: "Rights & Freedoms", subtitle: "The protected civic field", position: "south", href: corpusPath("article-iii-rights-freedoms") },
      { id: "duties", title: "Duties", subtitle: "Reciprocity and responsibility", position: "west", href: corpusPath("article-iv-duties-responsibilities") },
    ],
  },
  "civic-services": {
    id: "civic-services",
    eyebrow: "Civic Portal · Services & Participation",
    title: "Begin with a human need",
    description: "The portal translates constitutional mandates into understandable civic pathways without replacing the documents that govern them.",
    parent: "civic-portal",
    nodes: [
      { id: "learning-service", title: "Learning & Growth", subtitle: "Education, mentorship, and lifelong development", position: "north", href: circleHref("learning") },
      { id: "healing-service", title: "Care & Well-Being", subtitle: "Health, autonomy, access, and support", position: "east", href: circleHref("healing") },
      { id: "contribution-service", title: "Contribution & Work", subtitle: "Participation, sectors, renewal, and retraining", position: "south", href: circleHref("contribution") },
      { id: "harmony-service", title: "Harmony & Restoration", subtitle: "Mediation, harm response, and peaceful repair", position: "west", href: circleHref("harmony") },
    ],
  },
  "public-record": {
    id: "public-record",
    eyebrow: "Civic Portal · Public Record",
    title: "Authority must leave a visible trace",
    description: "Public records make civic action reviewable while protecting intimate, medical, and personally identifying information where privacy is required.",
    parent: "civic-portal",
    nodes: [
      { id: "ledger", title: "Transparency Ledger", subtitle: "Standing, decisions, provenance, and correction", position: "north", href: "/transparency-ledger" },
      { id: "proceedings", title: "Proceedings Calendar", subtitle: "Availability and status without private histories", position: "east", href: "/proceedings-calendar" },
      { id: "time-record", title: "Civic Time", subtitle: "Calendar, observances, and public conversion", position: "south", href: `${circleHref("time-observance")}#living-calendar` },
      { id: "review", title: "System Review", subtitle: "Capacity, Continuance, and public methodology", position: "west", href: "/system-review" },
    ],
  },
  "circle-system": {
    id: "circle-system",
    eyebrow: "The Circle System",
    title: "Governance without a pyramid",
    description: "The Circle classes clarify relationship and function without implying rank or supremacy.",
    parent: "society",
    nodes: [
      { id: "foundational-circles", title: "Foundational Circles", subtitle: "Independent constitutional mandates", position: "north", nextView: "foundational" },
      { id: "operational-circles", title: "Operational Circles", subtitle: "Bounded civic mandates", position: "east", nextView: "operational" },
      { id: "councils", title: "Councils & Assemblies", subtitle: "Independent domains within each Circle", position: "south", href: corpusPath("article-xvii-governance-structure-circles") },
      { id: "framework", title: "Governance Framework", subtitle: "Authority, transparency, and review", position: "west", href: corpusPath("article-xiv-governance-framework") },
      { id: "formation", title: "Circle Formation", subtitle: "Selection, scale, and representation", position: "southeast", href: corpusPath("article-xv-circle-formation-and-civic-representation") },
    ],
  },
  foundational: {
    id: "foundational",
    eyebrow: "Foundational Circles",
    title: "Seven equal mandates",
    description: "Seven Foundational Circles hold irreducible, society-wide constitutional responsibilities around the living center of time.",
    parent: "circle-system",
    nodes: [
      { id: "contribution", title: "Contribution", subtitle: "Labor and reciprocal participation", subtitleLines: ["Labor and", "reciprocal participation"], position: "north", nextView: "family-contribution" },
      { id: "learning", title: "Learning", subtitle: "Knowledge and education", subtitleLines: ["Knowledge and", "education"], position: "northeast", nextView: "family-learning" },
      { id: "harmony", title: "Harmony", subtitle: "Restoration and mediation", subtitleLines: ["Restoration and", "mediation"], position: "east", nextView: "family-harmony" },
      { id: "healing", title: "Healing", subtitle: "Care and bodily autonomy", subtitleLines: ["Care and", "bodily autonomy"], position: "southeast", nextView: "family-healing" },
      { id: "balance", title: "Balance", subtitle: "Capacity and equilibrium", subtitleLines: ["Capacity and", "equilibrium"], position: "south", nextView: "family-balance" },
      { id: "custodianship", title: "Custodianship", subtitle: "Earth and civic systems", subtitleLines: ["Earth and", "civic systems"], position: "southwest", nextView: "family-custodianship" },
      { id: "defense", title: "Defense", subtitle: "Protection without domination", subtitleLines: ["Protection without", "domination"], position: "west", nextView: "family-defense" },
    ],
  },
  operational: {
    id: "operational",
    eyebrow: "Operational Circles and Instruments",
    title: "Focused authority, visible boundaries",
    description: "These bodies administer bounded civic pathways without becoming additional Foundational mandates.",
    parent: "circle-system",
    nodes: [
      { id: "affirmation", title: "Affirmation", subtitle: "Verification and civic witness", position: "north", href: circleHref("affirmation") },
      { id: "immigration", title: "Immigration", subtitle: "Hopeful entry and voluntary exit", position: "east", href: circleHref("immigration") },
      { id: "time", title: "Time & Observance", subtitle: "The shared civil calendar", position: "south", href: circleHref("time-observance") },
      { id: "directory", title: "All Civic Bodies", subtitle: "The complete public directory", position: "west", href: "/circles" },
    ],
  },
  ...familyViews,
};

export const isNavigatorView = (value: string | null): value is NavigatorViewId => Boolean(value && value in navigatorViews);
export const getCivicBody = (slug: string) => civicBodies.find((body) => body.slug === slug);
export const getCircle = getCivicBody;
