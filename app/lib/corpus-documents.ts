export type CorpusDocument = {
  slug: string;
  title: string;
  role: string;
  summary: string;
  kind: "orientation" | "declaration" | "charter" | "constitution" | "article" | "codex";
  ring: "north" | "east";
  roman?: string;
  movement?: string;
};

const foundingDocuments: CorpusDocument[] = [
  {
    slug: "about",
    title: "About the Utopian Society",
    role: "Orientation",
    summary: "An introduction to the project, its purpose, and the corpus as a living civic framework.",
    kind: "orientation",
    ring: "north",
  },
  {
    slug: "declaration-of-existence",
    title: "Declaration of Existence",
    role: "Founding assertion",
    summary: "The declaration from which the Society proceeds: a public assertion of dignity, care, and human possibility.",
    kind: "declaration",
    ring: "north",
  },
  {
    slug: "the-charter-of-the-utopian-society",
    title: "The Charter of the Utopian Society",
    role: "Civic compact",
    summary: "A civic covenant of equals, establishing the Society's shared rights, responsibilities, and enduring purpose.",
    kind: "charter",
    ring: "north",
  },
  {
    slug: "constitution-of-the-utopian-society",
    title: "Constitution of the Utopian Society",
    role: "Living framework",
    summary: "The constitutional body that gives durable form to the Society's rights, duties, continuity, and governance.",
    kind: "constitution",
    ring: "north",
  },
];

const articleDefinitions = [
  ["I", "Foundation", "Foundations of civic life"],
  ["II", "Membership & Citizenship", "Foundations of civic life"],
  ["III", "Rights & Freedoms", "Foundations of civic life"],
  ["IV", "Duties & Responsibilities", "Foundations of civic life"],
  ["V", "Justice & Resolution", "Foundations of civic life"],
  ["VI", "Safeguards & Lessons", "Foundations of civic life"],
  ["VII", "Continuance Clause", "Continuance and stewardship"],
  ["VIII", "Continuance & Medical Ethics", "Continuance and stewardship"],
  ["IX", "End of Life & Legacy", "Continuance and stewardship"],
  ["X", "Rituals & Continuity", "Continuance and stewardship"],
  ["XI", "Landmarks & Legacy Structures", "Continuance and stewardship"],
  ["XII", "Education & Learning", "Continuance and stewardship"],
  ["XIII", "Environmental Stewardship", "Continuance and stewardship"],
  ["XIV", "Governance Framework", "Governance and representation"],
  ["XV", "Circle Formation and Civic Representation", "Governance and representation"],
  ["XVI", "Governance of Sectors & Contribution", "Governance and representation"],
  ["XVII", "Governance Structure & Circles", "Governance and representation"],
  ["XVIII", "Legislative Process and Review", "Governance and representation"],
  ["XIX", "Military & Defense", "Defense and enduring legacy"],
  ["XX", "Prohibition of Weapons and Torture", "Defense and enduring legacy"],
  ["XXI", "Legacy & Continuity of Governance", "Defense and enduring legacy"],
] as const;

const slugify = (value: string) => value.toLowerCase().replaceAll("&", "").replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const articles: CorpusDocument[] = articleDefinitions.map(([roman, title, movement]) => ({
  slug: `article-${roman.toLowerCase()}-${slugify(title)}`,
  title: `Article ${roman}. ${title}`,
  role: `Constitutional article ${roman}`,
  summary: `Article ${roman} of the Constitution, addressing ${title.toLowerCase()} within the Society's living civic framework.`,
  kind: "article",
  ring: "north",
  roman,
  movement,
}));

const eastDocuments: CorpusDocument[] = [
  {
    slug: "circle-of-affirmation-charter",
    title: "Circle of Affirmation Charter",
    role: "Civic charter",
    summary: "Recognition, identity, and the civic practice of being seen.",
    kind: "charter",
    ring: "east",
    movement: "Charters",
  },
  {
    slug: "circle-of-contribution-charter",
    title: "Circle of Contribution Charter",
    role: "Civic charter",
    summary: "Participation, useful work, and reciprocal belonging.",
    kind: "charter",
    ring: "east",
    movement: "Charters",
  },
  {
    slug: "circle-of-healing-charter",
    title: "Circle of Healing Charter",
    role: "Civic charter",
    summary: "Care, restoration, and collective response to injury.",
    kind: "charter",
    ring: "east",
    movement: "Charters",
  },
  {
    slug: "circle-of-learning-charter",
    title: "Circle of Learning Charter",
    role: "Civic charter",
    summary: "Education as a lifelong civic and human practice.",
    kind: "charter",
    ring: "east",
    movement: "Charters",
  },
  {
    slug: "charter-of-time-and-observance",
    title: "Charter of Time and Observance",
    role: "Civic charter",
    summary: "The calendar, civic memory, ritual, and shared time.",
    kind: "charter",
    ring: "east",
    movement: "Charters",
  },
  {
    slug: "restoration-codex",
    title: "Restoration Codex",
    role: "Living codex",
    summary: "Repair and reconciliation following harm or imbalance.",
    kind: "codex",
    ring: "east",
    movement: "Codices",
  },
  {
    slug: "sexual-expression-codex",
    title: "Sexual Expression Codex",
    role: "Living codex",
    summary: "Autonomy, dignity, consent, and embodied life.",
    kind: "codex",
    ring: "east",
    movement: "Codices",
  },
  {
    slug: "codex-of-blooming",
    title: "Codex of Blooming",
    role: "Living codex",
    summary: "Human development, flourishing, and the conditions for growth.",
    kind: "codex",
    ring: "east",
    movement: "Codices",
  },
  {
    slug: "immigration-codex",
    title: "Immigration Codex",
    role: "Living codex",
    summary: "Movement, refuge, belonging, and civic inclusion.",
    kind: "codex",
    ring: "east",
    movement: "Codices",
  },
];

export const corpusDocuments = [...foundingDocuments, ...articles, ...eastDocuments];

export const corpusPath = (slug: string) => `/corpus/${slug}`;

export const getCorpusDocument = (slug: string) => corpusDocuments.find((document) => document.slug === slug);

export const getRingDocuments = (ring: CorpusDocument["ring"]) => corpusDocuments.filter((document) => document.ring === ring);
