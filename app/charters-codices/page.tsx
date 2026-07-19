import { SectionFrame } from "../components/SectionFrame";
import { corpusPath } from "../lib/corpus-documents";

const charters = [
  ["Circle of Affirmation", "Recognition, identity, and the civic practice of being seen.", "circle-of-affirmation-charter"],
  ["Circle of Contribution", "Participation, useful work, and reciprocal belonging.", "circle-of-contribution-charter"],
  ["Circle of Healing", "Care, restoration, and collective response to injury.", "circle-of-healing-charter"],
  ["Circle of Learning", "Education as a lifelong civic and human practice.", "circle-of-learning-charter"],
  ["Time and Observance", "The calendar, civic memory, ritual, and shared time.", "charter-of-time-and-observance"],
];
const codices = [
  ["Restoration Codex", "Repair and reconciliation following harm or imbalance.", "restoration-codex"],
  ["Sexual Expression Codex", "Autonomy, dignity, consent, and embodied life.", "sexual-expression-codex"],
  ["Codex of Blooming", "Human development, flourishing, and the conditions for growth.", "codex-of-blooming"],
  ["Immigration Codex", "Movement, refuge, belonging, and civic inclusion.", "immigration-codex"],
];

function LibraryColumn({ title, mark, items }: { title: string; mark: string; items: string[][] }) {
  return <article className="library-column"><header><span>{mark}</span><h2>{title}</h2></header>{items.map(([name, text, slug], i) => <a href={slug === "immigration-codex" ? "/circles/immigration" : corpusPath(slug)} key={slug}><b>{String(i + 1).padStart(2, "0")}</b><div><h3>{name}</h3><p>{text}</p></div><i>→</i></a>)}</article>;
}

export default function ChartersPage() {
  return <SectionFrame eyebrow="North Ring · Civic Instruments" title="Charters & Codices" subtitle="How the civilization functions: institutions, circles, standards, repair, and living law." position="north">
    <section className="civic-library">
      <div className="east-library-heading"><span className="eyebrow">The civic library</span><h2>Two bodies of living law.</h2><p>Institutions and practices remain distinct, but neither can function responsibly without the other.</p></div>
      <div className="library-note"><span>Charters establish civic bodies and observances.</span><i /><span>Codices articulate practices, protections, and responses.</span></div>
      <div className="library-grid"><LibraryColumn title="Charters" mark="C" items={charters} /><LibraryColumn title="Codices" mark="X" items={codices} /></div>
    </section>
    <section className="relation-band"><span className="eyebrow">An evolving framework</span><h2>Neither shelf stands alone.</h2><p>Charters create the institutions that carry civic responsibility. Codices give those institutions principled ways to act. Both remain accountable to the Constitution.</p><a href={corpusPath("constitution-of-the-utopian-society")}>Return to the constitutional source →</a></section>
  </SectionFrame>;
}
