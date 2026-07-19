import Link from "next/link";
import { SectionFrame } from "../components/SectionFrame";
import { getFeaturedEssays } from "../lib/featured-essays";
import { importedPosts, postDisplayImage, postPath } from "../lib/imported-posts";
import { getLatestEntries } from "../lib/latest-entries";

export default async function BlogsPage() {
  const [featured, latest] = await Promise.all([getFeaturedEssays(), getLatestEntries()]);
  const [leadEntry, ...workingRecord] = latest;

  return <SectionFrame eyebrow="West Ring · Reflection" title="Blogs & Essays" subtitle="Why the civilization was conceived: inquiry, critique, memory, and ideas still becoming." position="west">
    <section className="editorial-lead"><div><span className="eyebrow">Featured essays</span><h2>Ideas before they become institutions.</h2><p>The living workshop of the corpus—personal when necessary, critical when warranted, and always open to revision.</p></div><a href="#complete-archive">Browse all essays ↓</a></section>
    <section className="featured-editorial">{featured.map(({ title, meta, text, href, image }, i) => <Link href={href} key={href} className={i === 0 ? "feature-primary" : "feature-secondary"} style={i === 0 && image ? { backgroundImage: `linear-gradient(145deg, rgba(12, 42, 34, .48), rgba(14, 31, 27, .88)), url("${image}")` } : undefined}>{i > 0 && image && <span className="feature-card-image" style={{ backgroundImage: `url("${image}")` }} aria-hidden="true" />}<div className="feature-card-copy"><span>{meta}</span><h3>{title}</h3><p>{text}</p><i>Read essay →</i></div></Link>)}</section>
    <section className="archive-ledger"><header><span className="eyebrow">Latest entries</span><h2>The working record</h2></header><Link className="record-lead" href={leadEntry.href}><span className={`record-lead-art${leadEntry.image ? " has-image" : ""}`} style={leadEntry.image ? { backgroundImage: `url("${leadEntry.image}")` } : undefined}><i /><i /><b>01</b></span><span className="record-lead-copy"><small>Latest dispatch · {leadEntry.date}</small><strong>{leadEntry.title}</strong><p>{leadEntry.excerpt}</p><i>Read the newest entry →</i></span></Link><div className="record-list">{workingRecord.map(({ title, date, href }, i) => <Link href={href} key={href}><b>{String(i + 2).padStart(2, "0")}</b><strong>{title}</strong><span>{date}</span><i>→</i></Link>)}</div><footer><a href="#complete-archive">Open the complete chronological archive ↓</a></footer></section>
    <section className="post-archive" id="complete-archive" aria-labelledby="post-archive-title">
      <header>
        <span className="eyebrow">The local archive · {importedPosts.length} entries</span>
        <h2 id="post-archive-title">The whole working record.</h2>
        <p>Every published blog and essay now opens inside the Corpus while retaining its original date, classification, imagery, and source provenance.</p>
      </header>
      <div className="post-archive-grid">
        {importedPosts.map((post, index) => {
          const image = postDisplayImage(post);
          return <Link href={postPath(post.slug)} className={image ? "archive-post has-image" : "archive-post"} key={post.id}>
            <span className="archive-post-art" style={image ? { backgroundImage: `linear-gradient(180deg, transparent, rgba(5,28,23,.7)), url("${image}")` } : undefined} aria-hidden="true"><b>{String(index + 1).padStart(2, "0")}</b></span>
            <span className="archive-post-copy">
              <small>{post.categories.includes("Essays") ? "Essay" : "Working record"} · {post.dateLabel}</small>
              <strong>{post.title}</strong>
              <p>{post.excerpt}</p>
              <i>{post.readingMinutes} min read →</i>
            </span>
          </Link>;
        })}
      </div>
    </section>
  </SectionFrame>;
}
