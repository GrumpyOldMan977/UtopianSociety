import type { Metadata } from "next";
import Link from "next/link";
import { CitizenshipExit } from "../../components/CitizenshipExit";
import { ImmigrationApplication } from "../../components/ImmigrationApplication";
import { ImmigrationThreshold } from "../../components/ImmigrationThreshold";
import { SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "Immigration · Civic Portal",
  description: "The virtual Hopeful pathway, civic comprehension assessment, oath, and symbolic naturalization portal of the Utopian Society Corpus.",
};

export default function ImmigrationPage() {
  return <main className="immigration-page">
    <SiteHeader />

    <section className="immigration-hero">
      <div className="immigration-hero-copy">
        <span className="eyebrow">Civic threshold · The Hopeful pathway</span>
        <h1>Immigration</h1>
        <p>Belonging begins with informed consent, mutual understanding, and a door that opens in both directions.</p>
        <blockquote>No person approaching the Society in good faith shall be barred from seeking entry.</blockquote>
        <div><a href="#immigration-workspace">Begin symbolic application</a><a href="#citizenship-exit">Citizen exit</a><Link href="/corpus/immigration-codex">Read the Immigration Codex</Link></div>
      </div>
      <Link className="immigration-hero-return" href="/?map=civic-life">← Return to Civic Life</Link>
    </section>

    <section className="immigration-orientation" aria-labelledby="immigration-orientation-title">
      <div>
        <span className="eyebrow">Before the threshold</span>
        <h2 id="immigration-orientation-title">A process of mutual discovery—not a test of human worth.</h2>
      </div>
      <p>The published Codex establishes a longer physical pathway through Hopeful evaluation, population review, residency, and lived integration. This portal creates a distinct virtual pathway: it teaches that framework, tests comprehension, receives a voluntary oath, and recognizes symbolic online citizenship without pretending to grant legal or physical status.</p>
    </section>

    <ImmigrationThreshold />

    <ImmigrationApplication />

    <CitizenshipExit />

    <section className="immigration-authority" aria-labelledby="immigration-authority-title">
      <div>
        <span className="eyebrow">Corpus authority</span>
        <h2 id="immigration-authority-title">The portal explains and performs. The Corpus governs.</h2>
        <p>The assessment and symbolic certificate do not replace the procedures required for Hopeful evaluation, residency, citizenship, capacity review, or appeal. Those remain controlled by the Constitution and its living documents.</p>
      </div>
      <nav aria-label="Immigration governing documents">
        <Link href="/corpus/immigration-codex"><span>Primary authority</span><b>Immigration Codex</b><i>→</i></Link>
        <Link href="/corpus/article-ii-membership-citizenship"><span>Constitution</span><b>Article II · Membership & Citizenship</b><i>→</i></Link>
        <Link href="/circles/balance"><span>Capacity</span><b>Circle of Balance</b><i>→</i></Link>
        <Link href="/circles/learning"><span>Preparation</span><b>Circle of Learning</b><i>→</i></Link>
      </nav>
    </section>

    <footer className="site-footer"><span>The Utopian Society Corpus</span><p>Belonging entered freely, understood clearly, and recorded responsibly.</p><Link href="/">Enter through the frontispiece ↑</Link></footer>
  </main>;
}
