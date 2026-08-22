import type { Metadata } from "next";
import Link from "next/link";
import { CivicActionStudio } from "../components/CivicActionStudio";
import { CivicPortalFeature } from "../components/CivicPortalFeature";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "System Review",
  description: "The public interface for capacity, Continuance, methodology, uncertainty, dissent, and cross-system review.",
};

export default function SystemReviewPage() {
  return <main className="public-record-page system-review-page circle-civic-page circle-civic-balance">
    <SiteHeader />
    <header className="ledger-hero public-record-hero system-review-hero">
      <span className="eyebrow">Civic Portal · Public Record · Balance</span>
      <h1>A measurement opens a question. It does not close one.</h1>
      <p>System Review makes capacity signals, methods, uncertainty, consultation, minority findings, and later corrections visible before an indicator is allowed to influence civic action.</p>
      <nav aria-label="System Review navigation">
        <a href="#civic-action-studio">Open the review prototype</a>
        <Link href="/circles/balance">Enter the Circle of Balance</Link>
        <Link href="/?map=public-record">Return to the Public Record weave</Link>
      </nav>
    </header>

    <section className="public-record-purpose" aria-labelledby="review-purpose-title">
      <div><span className="eyebrow">Why this stands alone</span><h2 id="review-purpose-title">A cross-system record, stewarded by Balance.</h2></div>
      <p>Balance convenes the review because no single Circle may optimize its own mandate at everyone else’s expense. Source bodies retain their own authority, affected people retain a right to answer, and the public record preserves assumptions, dissent, revision, and limits.</p>
      <dl>
        <div><dt>Disclose</dt><dd>Sources, assumptions, confidence, uncertainty, and responsible interpreters</dd></div>
        <div><dt>Consult</dt><dd>Affected Circles, citizens, lived experience, and minority findings</dd></div>
        <div><dt>Limit</dt><dd>No equation may rank human worth, direct treatment, or compel population outcomes</dd></div>
      </dl>
    </section>

    <CivicPortalFeature slug="balance" />
    <CivicActionStudio slug="balance" />

    <footer className="site-footer"><span>The Utopian Society</span><p>A living framework for ethical, civic, and human continuity.</p><Link href="/">Enter through the frontispiece ↑</Link></footer>
  </main>;
}
