import type { Metadata } from "next";
import Link from "next/link";
import { SexualCareExplorer } from "../../../components/SexualCareExplorer";
import { SiteHeader } from "../../../components/SiteHeader";

export const metadata: Metadata = {
  title: "Sexual & Reproductive Care",
  description: "A consent-led guide to Sexual Practitioners, sexual well-being, reproductive care, recognized therapies, and citizen safeguards in the Utopian Society.",
};

const safeguards = [
  ["Ask", "Every encounter begins with clear language about the citizen’s needs, the practitioner’s role, and whether any form of touch is even being considered."],
  ["Name", "Clothing, contact, safer-sex measures, privacy, records, support persons, session length, and aftercare are described before agreement."],
  ["Choose", "Consent is informed, specific, present-tense, and freely retractable. A yes to one action is never permission for another."],
  ["Pause", "Either person may slow, stop, change course, or end the encounter without debt, punishment, embarrassment, or loss of care."],
  ["Review", "Citizens may request another practitioner, a chaperone, a consent advocate, an ethical review, or a restorative pathway when harm is alleged."],
] as const;

const credentials = [
  ["Resident", "Learns anatomy, medical ethics, consent practice, and role boundaries under direct supervision."],
  ["Associate", "Provides approved services with partial autonomy and documented oversight."],
  ["Practitioner", "Works independently within a licensed scope and contributes to public Methodology Clauses."],
  ["Doctor or Sage", "Demonstrates advanced clinical or holistic mastery. The paths differ in emphasis, not civic dignity."],
] as const;

export default function SexualReproductiveCarePage() {
  return <main className="sexual-care-page">
    <SiteHeader />
    <section className="sexual-care-hero" aria-labelledby="sexual-care-title">
      <div className="sexual-care-hero-copy">
        <span className="eyebrow">Circle of Healing · Sexual & Reproductive Care</span>
        <h1 id="sexual-care-title">Pleasure belongs within health.</h1>
        <p>Sexual well-being can be tender, playful, clinical, restorative, reproductive, relational, or quietly personal. The Society meets it without shame—and without ever weakening consent.</p>
        <blockquote>“The body ceases to be treated as an object and returns to its rightful place as an instrument of connection, healing, and joy.”</blockquote>
        <div><a href="#sexual-practitioners">Meet the practitioners</a><a href="#care-pathfinder">Find a care path</a></div>
      </div>
      <Link className="sexual-care-return" href="/circles/healing">← Return to the Circle of Healing</Link>
    </section>
    <section className="sexual-care-orientation" aria-labelledby="sexual-care-orientation-title">
      <div><span className="eyebrow">Sexual care in ordinary language</span><h2 id="sexual-care-orientation-title">A skilled companion to your own autonomy.</h2></div>
      <div><p>A <b>Sexual Practitioner</b> is a healer recognized by the Circle of Healing to serve within the sexual-health domain. Some practitioners speak and teach. Some provide clinical or reproductive care. Some work with touch, intimacy, or consensual erotic practice under explicit credentials and published methodologies.</p><p>The practitioner does not own the encounter. Their skill creates options; the citizen’s sovereignty determines what happens.</p></div>
    </section>
    <SexualCareExplorer />
    <section className="sexual-consent-covenant" id="consent-covenant" aria-labelledby="sexual-consent-title">
      <header><span className="eyebrow">The consent covenant</span><h2 id="sexual-consent-title">Consent is the first clinical instrument.</h2><p>Not paperwork at the edge of care. The method by which care remains care.</p></header>
      <ol>{safeguards.map(([title, text], index) => <li key={title}><b>{String(index + 1).padStart(2, "0")}</b><h3>{title}</h3><p>{text}</p></li>)}</ol>
      <aside><b>Adult services only</b><p>Touch-inclusive, erotic, and surrogate modalities are limited to people who have completed the Society’s recognized rite of majority and possess present-tense capacity. Age-appropriate education and reproductive medicine for younger people never become adult erotic services.</p></aside>
    </section>
    <section className="sexual-credentials" aria-labelledby="sexual-credentials-title">
      <div className="sexual-credentials-copy"><span className="eyebrow">Trust must be earned publicly</span><h2 id="sexual-credentials-title">Training before intimacy. Accountability after it.</h2><p>Sexual Practitioners are not granted a vague license to improvise. The Circle of Healing defines allowed methods, required training, contraindications, hygiene, supervision, session limits, documentation, and aftercare. Continuing education includes consent jurisprudence, safer-sex science, disability-inclusive practice, LGBTQIA+ competency, and emerging evidence.</p><Link href="/corpus/circle-of-healing-charter">Read Section VII · Sexual Therapy & Practitioners →</Link></div>
      <ol>{credentials.map(([title, text], index) => <li key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
    </section>
    <section className="sexual-boundaries" aria-labelledby="sexual-boundaries-title">
      <div><span className="eyebrow">What remains inviolable</span><h2 id="sexual-boundaries-title">A service can be intimate without becoming entitled.</h2></div>
      <ul><li>No practitioner may leverage food, housing, standing, care access, or civic authority to obtain consent.</li><li>No citizen may purchase ownership of a practitioner’s time or body; contribution recognizes labor, not access without continuing consent.</li><li>No hesitation, freezing, silence, prior agreement, relationship, or earlier session is treated as present consent.</li><li>No private medical or intimate record enters a public ledger. The public may inspect standards and outcomes without exposing a person’s body or history.</li><li>Alleged coercion, exploitation, or professional misconduct may move through Healing’s ethical review and Harmony’s restorative jurisdiction.</li></ul>
    </section>
    <section className="sexual-authority" aria-labelledby="sexual-authority-title">
      <div><span className="eyebrow">Corpus authority</span><h2 id="sexual-authority-title">Freedom, consent, and context remain companions.</h2><p>This portal translates the civic system for daily use. The governing documents define the actual rights, credentials, limits, review processes, and lawful methodologies.</p></div>
      <nav aria-label="Sexual and reproductive care governing sources"><Link href="/corpus/circle-of-healing-charter"><span>Primary care authority</span><b>Circle of Healing Charter</b><i>→</i></Link><Link href="/corpus/sexual-expression-codex"><span>Embodied civic ethic</span><b>Sexual Expression Codex</b><i>→</i></Link><Link href="/corpus/article-iii-rights-freedoms"><span>Constitutional liberty</span><b>Article III · Rights & Freedoms</b><i>→</i></Link><Link href="/corpus/article-viii-continuance-medical-ethics"><span>Medical sovereignty</span><b>Article VIII · Continuance & Medical Ethics</b><i>→</i></Link></nav>
    </section>
    <footer className="site-footer"><span>The Utopian Society</span><p>The honest body and truthful heart are not adversaries of civility.</p><Link href="/">Enter through the frontispiece ↑</Link></footer>
  </main>;
}
