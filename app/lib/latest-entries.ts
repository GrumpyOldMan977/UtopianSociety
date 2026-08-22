import { getAllImportedPosts, postDisplayImage, postPath } from "./imported-posts";

export type LatestEntry = {
  title: string;
  date: string;
  href: string;
  excerpt: string;
  image?: string;
};

export async function getLatestEntries(): Promise<LatestEntry[]> {
  return (await getAllImportedPosts()).slice(0, 5).map((post) => ({
    title: post.title,
    date: post.utopianDateLabel,
    href: postPath(post.slug),
    excerpt: post.excerpt,
    image: postDisplayImage(post),
  }));
}
