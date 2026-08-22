import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";
import { civicBodies, CivicTier } from "../lib/circle-navigation";

export const metadata: Metadata = {
  title: "Civic Bodies",
  description: "The complete public directory of Foundational Circles, operational bodies, and shared constitutional instruments.",
};

const tiers: { id: CivicTier; eyebrow: string; title: string; description: string }[] = [
  { id: "foundational", eyebrow: "Seven equal mandates", title: "Foundational Circles", description: "Irreducible, society-wide constitutional responsibilities with independent authority, public accountability, and peer coordination." },
  { id: "operational", eyebrow: "Bounded civic authority", title: "Operational Circles and offices", description: "Specialized bodies that administer a Charter or Codex mandate without becoming an additional Foundational tier." },
  { id: "constitutional-instrument", eyebrow: "Shared across every Circle", title: "Constitutional instruments", description: "Common civic systems that coordinate the Society while remaining outside the governance hierarchy." },
];

export default function CirclesDirectoryPage() {
  return <main className="civic-directory-page">
    <SiteHeader />
    <header className="civic-directory-hero">
      <span className="eyebrow">The complete civic directory</span>
      <h1>Every body in the weave.</h1>
      <p>Authority becomes trustworthy when its purpose, parentage, limits, public pathway, and governing source are visible in one place.</p>
      <div><Link href="/?map=foundational">Open the Foundational map</Link><Link href="/?map=operational">Open the operational map</Link></div>
    </header>

    {tiers.map((tier) => <section className={`civic-directory-tier tier-${tier.id}`} key={tier.id}>
      <header><span>{tier.eyebrow}</span><h2>{tier.title}</h2><p>{tier.description}</p></header>
      <div className="civic-directory-grid">
        {civicBodies.filter(({ tier: bodyTier }) => bodyTier === tier.id).map((body, index) => <article key={body.slug}>
          <b>{String(index + 1).padStart(2, "0")}</b>
          <small>{body.status}</small>
          <h3>{body.title}</h3>
          <p>{body.summary}</p>
          {body.parentCircle && <dl><dt>Parent Circle</dt><dd>{body.parentCircle}</dd></dl>}
          {body.independentDomain && <dl><dt>Independent domain</dt><dd>{body.independentDomain}</dd></dl>}
          <Link href={`/circles/${body.slug}`}>Enter the civic page <span aria-hidden="true">→</span></Link>
        </article>)}
      </div>
    </section>)}

    <section className="council-boundary-note">
      <span className="eyebrow">Council authority</span>
      <h2>Independent within the domain. Bound by the weave.</h2>
      <p>Councils exercise independent authority within their assigned intra-Circle domains. They cannot override their Circle’s Charter, constitutional mandate, citizen oversight, another Council, or another Circle without constitutional process.</p>
      <Link href="/corpus/article-xvii-governance-structure-circles">Read the canonical topology →</Link>
    </section>

    <footer className="site-footer"><span>The Utopian Society</span><p>A living framework for ethical, civic, and human continuity.</p><Link href="/">Enter through the frontispiece ↑</Link></footer>
  </main>;
}
