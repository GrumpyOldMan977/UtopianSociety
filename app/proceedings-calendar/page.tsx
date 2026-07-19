import type { Metadata } from "next";
import Link from "next/link";
import { CivicActionStudio } from "../components/CivicActionStudio";
import { CivicPortalFeature } from "../components/CivicPortalFeature";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Proceedings Calendar",
  description: "The privacy-preserving public schedule of Harmony orientations, mediations, restorative proceedings, and procedural reviews.",
};

export default function ProceedingsCalendarPage() {
  return <main className="public-record-page proceedings-calendar-page circle-civic-page circle-civic-harmony">
    <SiteHeader />
    <header className="ledger-hero public-record-hero proceedings-hero">
      <span className="eyebrow">Civic Portal · Public Record · Harmony</span>
      <h1>Proceedings should be visible. People’s histories should not.</h1>
      <p>The calendar publishes open times, proceeding types, accessibility, and procedural status without exposing names, testimony, evidence, or intimate history.</p>
      <nav aria-label="Proceedings Calendar navigation">
        <a href="#civic-action-studio">Open the calendar prototype</a>
        <Link href="/circles/harmony">Enter the Circle of Harmony</Link>
        <Link href="/?map=public-record">Return to the Public Record weave</Link>
      </nav>
    </header>

    <section className="public-record-purpose" aria-labelledby="proceedings-purpose-title">
      <div><span className="eyebrow">Why this stands alone</span><h2 id="proceedings-purpose-title">A shared calendar, administered by Harmony.</h2></div>
      <p>The calendar is public civic infrastructure rather than a case file. Harmony controls scheduling and procedure; participants control private information. The Transparency Ledger receives only the lawful public trace of a proceeding and any later correction.</p>
      <dl>
        <div><dt>Public</dt><dd>Type, availability, accessibility, status, and review window</dd></div>
        <div><dt>Protected</dt><dd>Names, testimony, evidence, medical information, and personal history</dd></div>
        <div><dt>Authority</dt><dd>Circle of Harmony under restorative and constitutional safeguards</dd></div>
      </dl>
    </section>

    <CivicPortalFeature slug="harmony" />
    <CivicActionStudio slug="harmony" initialAction={1} />

    <footer className="site-footer"><span>The Utopian Society Corpus</span><p>A living framework for ethical, civic, and human continuity.</p><Link href="/">Enter through the frontispiece ↑</Link></footer>
  </main>;
}
