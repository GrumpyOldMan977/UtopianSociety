import postData from "../data/wordpress-posts.json";
import { gregorianDateUTC, utopianDateLong } from "./utopian-time";

type ImportedPostSource = {
  id: number;
  slug: string;
  title: string;
  date: string;
  modified: string;
  dateLabel: string;
  author: string;
  categories: string[];
  tags: string[];
  excerpt: string;
  content: string;
  featuredImage: string | null;
  featuredAlt: string;
  sourceUrl: string;
  readingMinutes: number;
  wordCount: number;
};

type SynchronizedPublication = {
  wordpressId: number | null;
  slug: string;
  title: string;
  status: string;
  excerpt: string;
  contentHtml: string;
  featuredImage: string | null;
  authorName: string;
  publicationDate: string | null;
  sourceModifiedAt: string | null;
  sourceUrl: string | null;
  readingMinutes: number;
  wordCount: number;
  metadata: { categories?: string[]; tags?: string[]; featuredAlt?: string };
};

export type ImportedPost = ImportedPostSource & {
  utopianDateLabel: string;
  gregorianDateLabel: string;
};

const decodeDisplayText = (value: string) => value
  .replaceAll("&hellip;", "…")
  .replaceAll("&mdash;", "—")
  .replaceAll("&ndash;", "–")
  .replaceAll("&rsquo;", "’")
  .replaceAll("&lsquo;", "‘")
  .replaceAll("&rdquo;", "”")
  .replaceAll("&ldquo;", "“");

function publicationDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export const importedPosts: ImportedPost[] = (postData as ImportedPostSource[]).map((post) => ({
  ...post,
  title: decodeDisplayText(post.title),
  excerpt: decodeDisplayText(post.excerpt),
  utopianDateLabel: utopianDateLong(publicationDate(post.date)),
  gregorianDateLabel: gregorianDateUTC(publicationDate(post.date)),
}));

const CIVIC_LEDGER_API = process.env.CIVIC_LEDGER_PUBLIC_API
  || "https://utopian-civic-ledger.utopian-society-civic.workers.dev";

function synchronizedPost(publication: SynchronizedPublication): ImportedPost | null {
  if (!publication.wordpressId || !publication.publicationDate || !publication.contentHtml) return null;
  const date = publication.publicationDate;
  const modified = publication.sourceModifiedAt || date;
  const publicationMoment = publicationDate(date);
  return {
    id: publication.wordpressId,
    slug: publication.slug,
    title: decodeDisplayText(publication.title),
    date,
    modified,
    dateLabel: date.slice(0, 10),
    author: publication.authorName || "Adreto Nagdo Senoviros",
    categories: Array.isArray(publication.metadata?.categories) ? publication.metadata.categories : [],
    tags: Array.isArray(publication.metadata?.tags) ? publication.metadata.tags : [],
    excerpt: decodeDisplayText(publication.excerpt),
    content: publication.contentHtml,
    featuredImage: publication.featuredImage,
    featuredAlt: publication.metadata?.featuredAlt || publication.title,
    sourceUrl: publication.sourceUrl || `https://utopiansocietycorpus.wpcomstaging.com/${publication.slug}/`,
    readingMinutes: Math.max(1, Number(publication.readingMinutes) || 1),
    wordCount: Math.max(0, Number(publication.wordCount) || 0),
    utopianDateLabel: utopianDateLong(publicationMoment),
    gregorianDateLabel: gregorianDateUTC(publicationMoment),
  };
}

export async function getAllImportedPosts(): Promise<ImportedPost[]> {
  try {
    const response = await fetch(`${CIVIC_LEDGER_API}/v3/publications?type=post&limit=100`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`Publication bridge returned ${response.status}`);
    const payload = await response.json() as { publications?: SynchronizedPublication[] };
    const synchronized = (payload.publications || []).map(synchronizedPost).filter((post): post is ImportedPost => Boolean(post));
    if (!synchronized.length) return importedPosts;
    const merged = new Map<string, ImportedPost>();
    for (const post of importedPosts) merged.set(post.slug, post);
    for (const post of synchronized) merged.set(post.slug, post);
    return [...merged.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  } catch {
    return importedPosts;
  }
}

export const postPath = (slug: string) => `/blogs-essays/${slug}`;

export const getImportedPost = async (slug: string) => (await getAllImportedPosts()).find((post) => post.slug === slug);

export const getEssayPosts = async () => (await getAllImportedPosts()).filter((post) => post.categories.includes("Essays"));

export function postDisplayImage(post: ImportedPost) {
  if (post.featuredImage) return post.featuredImage;
  return post.content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || undefined;
}

export async function adjacentPosts(slug: string) {
  const posts = await getAllImportedPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index < 0) return { newer: undefined, older: undefined };
  return {
    newer: index > 0 ? posts[index - 1] : undefined,
    older: index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}
