import type { MetadataRoute } from "next";
import { civicBodies } from "./lib/circle-navigation";
import { corpusDocuments } from "./lib/corpus-documents";
import { importedPosts } from "./lib/imported-posts";

const SITE_URL = "https://utopiansocietycorpus.org";

const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/utopian-society"), changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/circles"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/blogs-essays"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/lore"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/charters-codices"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/transparency-ledger"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/proceedings-calendar"), changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/system-review"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/citizens/adreto-nagdo-senoviros"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/lore/birth-of-the-moon"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/lore/9-kingdoms-solitaire"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/circles/healing/sexual-reproductive-care"), changeFrequency: "monthly", priority: 0.7 },
  ];

  entries.push(...civicBodies.map((body) => ({
    url: absoluteUrl(`/circles/${body.slug}`),
    changeFrequency: "monthly" as const,
    priority: body.tier === "foundational" ? 0.8 : 0.7,
  })));

  entries.push(...corpusDocuments.map((document) => ({
    url: absoluteUrl(`/corpus/${document.slug}`),
    changeFrequency: "monthly" as const,
    priority: document.kind === "constitution" || document.kind === "declaration" ? 0.8 : 0.7,
  })));

  entries.push(...importedPosts.map((post) => ({
    url: absoluteUrl(`/blogs-essays/${post.slug}`),
    lastModified: new Date(post.modified || post.date),
    changeFrequency: "monthly" as const,
    priority: post.categories.includes("Essays") ? 0.7 : 0.6,
  })));

  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
