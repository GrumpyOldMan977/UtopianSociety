import { readFile } from "node:fs/promises";

const endpoint = process.env.CIVIC_LEDGER_LOCAL_URL || "http://127.0.0.1:8788";
const origin = process.env.CIVIC_PORTAL_LOCAL_ORIGIN || "http://localhost:9877";
const posts = JSON.parse(await readFile(new URL("../app/data/wordpress-posts.json", import.meta.url), "utf8"));

const inventory = posts.map((post) => ({
  wordpressId: post.id,
  slug: post.slug,
  type: "post",
  title: post.title,
  canonicalUrl: post.sourceUrl,
  sourceModifiedAt: post.modified,
  publicationDate: post.date,
  excerpt: post.excerpt,
  featuredImage: post.featuredImage,
  categories: post.categories,
  tags: post.tags,
}));

const response = await fetch(`${endpoint}/v3/editorial/import-wordpress`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: origin,
  },
  body: JSON.stringify({
    cursor: `wordpress-export:${new Date().toISOString()}`,
    posts: inventory,
  }),
});

const result = await response.json();
if (!response.ok) throw new Error(result.error || `Editorial inventory failed with ${response.status}.`);

console.log(JSON.stringify({
  ...result,
  source: "app/data/wordpress-posts.json",
  authorPolicy: "Civic publication records use Adreto Nagdo Senoviros.",
}, null, 2));
