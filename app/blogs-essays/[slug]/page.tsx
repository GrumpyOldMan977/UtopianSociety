import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/SiteHeader";
import { ReadAloudControls } from "../../components/ReadAloudControls";
import { adjacentPosts, getImportedPost, importedPosts, postDisplayImage, postPath } from "../../lib/imported-posts";

type ContentsEntry = { id: string; label: string; level: number };

function plainText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#8217;|&#x2019;|&rsquo;/gi, "’").replace(/\s+/g, " ").trim();
}

function headingId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
}

function prepareContent(source: string) {
  const contents: ContentsEntry[] = [];
  const used = new Map<string, number>();
  const html = source.replace(/<h([2-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attributes, inner) => {
    const label = plainText(inner);
    if (!label) return full;
    const base = headingId(label);
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const id = count ? `${base}-${count + 1}` : base;
    contents.push({ id, label, level: Number(level) });
    const cleaned = String(attributes).replace(/\s+id=("[^"]*"|'[^']*')/i, "");
    return `<h${level}${cleaned} id="${id}">${inner}</h${level}>`;
  });
  return { html, contents };
}

export function generateStaticParams() {
  return importedPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getImportedPost(slug);
  if (!post) return {};
  const image = postDisplayImage(post);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: image ? { title: post.title, description: post.excerpt, images: [{ url: image }] } : undefined,
  };
}

export default async function ImportedPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getImportedPost(slug);
  if (!post) notFound();
  const image = postDisplayImage(post);
  const { html, contents } = prepareContent(post.content);
  const { newer, older } = await adjacentPosts(post.slug);
  const type = post.categories.includes("Essays") ? "Essay" : "Working record";
  const isLocalAnnouncement = post.id >= 1000000;

  return <main className="imported-post-page">
    <SiteHeader />
    <header className={image ? "post-frontispiece has-image" : "post-frontispiece"}>
      <div className="post-frontispiece-art" style={image ? { backgroundImage: `url("${image}")` } : undefined} role={image ? "img" : undefined} aria-label={image ? post.featuredAlt || post.title : undefined} />
      <div className="post-frontispiece-shade" aria-hidden="true" />
      <div className="post-celtic-corners" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="post-frontispiece-copy">
        <span className="eyebrow">West Ring · {type}</span>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <dl>
          <div><dt>Written by</dt><dd>{post.author}</dd></div>
          <div><dt>Published</dt><dd title={`Gregorian archival reference: ${post.gregorianDateLabel}`}>{post.utopianDateLabel}</dd></div>
          <div><dt>Reading time</dt><dd>{post.readingMinutes} minutes</dd></div>
        </dl>
      </div>
      <Link className="post-return" href="/blogs-essays">← Return to Blogs & Essays</Link>
    </header>

    <div className="post-reading-field">
      <aside className="post-marginalia" aria-label="Article information">
        <span className="eyebrow">In this entry</span>
        {contents.length > 0 ? <nav>{contents.map((entry) => <a className={entry.level === 3 ? "is-nested" : ""} href={`#${entry.id}`} key={entry.id}>{entry.label}</a>)}</nav> : <p>This entry unfolds as one continuous reflection.</p>}
        <div className="post-classification"><small>Filed under</small>{post.categories.map((category) => <span key={category}>{category}</span>)}</div>
      </aside>
      <article className="post-vellum">
        <div className="post-vellum-knot" aria-hidden="true"><i /><i /><i /><i /></div>
        <ReadAloudControls targetId="post-authored-text" title={post.title} />
        <div className="post-body" id="post-authored-text" dangerouslySetInnerHTML={{ __html: html }} />
        <footer className="post-provenance">
          <span>Corpus provenance</span>
          <p>{isLocalAnnouncement ? "Published directly within the Utopian Society as part of the living working record." : "Synchronized read-only from the published WordPress editorial edition. The presentation has changed; the authored text and original publication date remain intact."}</p>
          <a href={post.sourceUrl} target="_blank" rel="noreferrer">{isLocalAnnouncement ? "View the public Build Week submission ↗" : "View the source edition ↗"}</a>
        </footer>
      </article>
    </div>

    <nav className="post-sequence" aria-label="Chronological post navigation">
      {newer ? <Link href={postPath(newer.slug)}><small>Newer entry</small><strong>{newer.title}</strong><span>←</span></Link> : <span />}
      {older ? <Link href={postPath(older.slug)}><small>Older entry</small><strong>{older.title}</strong><span>→</span></Link> : <span />}
    </nav>
    <footer className="site-footer"><span>The Utopian Society</span><p>The West Ring preserves thought while it is still becoming.</p><Link href="/">Enter through the frontispiece ↑</Link></footer>
  </main>;
}
