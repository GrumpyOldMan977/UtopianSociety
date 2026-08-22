import { getEssayPosts, postDisplayImage, postPath, type ImportedPost } from "./imported-posts";

const SITE_ID = "251167125";
const STATS_START_DATE = "2025-12-21";
const REFRESH_SECONDS = 6 * 60 * 60;

export type FeaturedEssay = {
  title: string;
  meta: string;
  text: string;
  href: string;
  image?: string;
};

type RankedPost = { id: number; views: number };

const fallbackSlugs = [
  "an-introspection-into-my-identity",
  "between-empire-and-garden",
  "finite-time-stolen-life",
];

function normalizeRankedPost(value: unknown): RankedPost | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = Number(item.post_id ?? item.id ?? item.ID);
  const views = Number(item.views ?? item.view_count ?? item.total_views);
  return Number.isFinite(id) && id > 0 && Number.isFinite(views) ? { id, views } : null;
}

function rankedPosts(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  const data = payload as Record<string, unknown>;
  const possibleLists: unknown[] = [data.summary];
  if (Array.isArray(data.days)) {
    for (const day of data.days) {
      if (day && typeof day === "object") {
        const record = day as Record<string, unknown>;
        possibleLists.push(record.postviews, record.posts);
      }
    }
  }
  const totals = new Map<number, number>();
  for (const list of possibleLists) {
    if (!Array.isArray(list)) continue;
    for (const value of list) {
      const post = normalizeRankedPost(value);
      if (post) totals.set(post.id, (totals.get(post.id) ?? 0) + post.views);
    }
  }
  return [...totals.entries()].map(([id, views]) => ({ id, views })).sort((a, b) => b.views - a.views);
}

async function fetchViewRanking(token: string) {
  const endpoint = new URL(`https://public-api.wordpress.com/rest/v1.1/sites/${SITE_ID}/stats/top-posts`);
  endpoint.searchParams.set("start_date", STATS_START_DATE);
  endpoint.searchParams.set("date", new Date().toISOString().slice(0, 10));
  endpoint.searchParams.set("summarize", "true");
  endpoint.searchParams.set("skip_archives", "true");
  endpoint.searchParams.set("max", "100");
  const response = await fetch(endpoint, {
    headers: { authorization: `Bearer ${token}` },
    next: { revalidate: REFRESH_SECONDS },
  });
  if (!response.ok) throw new Error(`WordPress statistics returned ${response.status}`);
  return rankedPosts(await response.json());
}

function card(post: ImportedPost, meta: string): FeaturedEssay {
  return {
    title: post.title,
    meta,
    text: post.excerpt,
    href: postPath(post.slug),
    image: postDisplayImage(post),
  };
}

async function fallback() {
  const essays = await getEssayPosts();
  return fallbackSlugs
    .map((slug) => essays.find((post) => post.slug === slug))
    .filter((post): post is ImportedPost => Boolean(post))
    .map((post, index) => card(post, index === 0 ? "Most read · Reader landmark" : `Reader favorite #${index + 1}`));
}

export async function getFeaturedEssays(): Promise<FeaturedEssay[]> {
  const token = process.env.WPCOM_ACCESS_TOKEN;
  if (!token) return await fallback();
  try {
    const essays = new Map((await getEssayPosts()).map((post) => [post.id, post]));
    const featured = (await fetchViewRanking(token))
      .filter(({ id }) => essays.has(id))
      .slice(0, 3)
      .map(({ id, views }, index) => card(
        essays.get(id)!,
        `${index === 0 ? "Most read" : `Reader favorite #${index + 1}`} · ${views.toLocaleString("en-US")} views`,
      ));
    return featured.length === 3 ? featured : await fallback();
  } catch {
    return await fallback();
  }
}
