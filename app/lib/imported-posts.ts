import postData from "../data/wordpress-posts.json";
import { gregorianDateUTC, utopianDateLong } from "./utopian-time";

export type ImportedPost = {
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

export const importedPosts = (postData as ImportedPost[]).map((post) => ({
  ...post,
  title: decodeDisplayText(post.title),
  excerpt: decodeDisplayText(post.excerpt),
  utopianDateLabel: utopianDateLong(publicationDate(post.date)),
  gregorianDateLabel: gregorianDateUTC(publicationDate(post.date)),
}));

export const postPath = (slug: string) => `/blogs-essays/${slug}`;

export const getImportedPost = (slug: string) => importedPosts.find((post) => post.slug === slug);

export const getEssayPosts = () => importedPosts.filter((post) => post.categories.includes("Essays"));

export function postDisplayImage(post: ImportedPost) {
  if (post.featuredImage) return post.featuredImage;
  return post.content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || undefined;
}

export function adjacentPosts(slug: string) {
  const index = importedPosts.findIndex((post) => post.slug === slug);
  if (index < 0) return { newer: undefined, older: undefined };
  return {
    newer: index > 0 ? importedPosts[index - 1] : undefined,
    older: index < importedPosts.length - 1 ? importedPosts[index + 1] : undefined,
  };
}
