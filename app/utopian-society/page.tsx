import { SectionFrame } from "../components/SectionFrame";
import { corpusPath } from "../lib/corpus-documents";

const articleGroups = [
  ["Foundations of civic life", [["I", "Foundation"], ["II", "Membership & Citizenship"], ["III", "Rights & Freedoms"], ["IV", "Duties & Responsibilities"], ["V", "Justice & Resolution"], ["VI", "Safeguards & Lessons"]]],
  ["Continuance and stewardship", [["VII", "Continuance Clause"], ["VIII", "Continuance & Medical Ethics"], ["IX", "End of Life & Legacy"], ["X", "Rituals & Continuity"], ["XI", "Landmarks & Legacy Structures"], ["XII", "Education & Learning"], ["XIII", "Environmental Stewardship"]]],
  ["Governance and representation", [["XIV", "Governance Framework"], ["XV", "Circle Formation and Civic Representation"], ["XVI", "Governance of Sectors & Contribution"], ["XVII", "Governance Structure & Circles"], ["XVIII", "Legislative Process and Review"]]],
  ["Defense and enduring legacy", [["XIX", "Military & Defense"], ["XX", "Prohibition of Weapons and Torture"], ["XXI", "Legacy & Continuity of Governance"]]],
] as const;

const slug = (roman: string, title: string) => corpusPath(`article-${roman.toLowerCase()}-${title.toLowerCase().replaceAll("&", "").replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`);

export default function SocietyPage() {
  return <SectionFrame eyebrow="North Ring · Principles" title="Utopian Society" subtitle="What the civilization is: its declaration, founding charter, and constitutional form." position="north">
    <section className="reading-path society-reading-path">
      <div className="society-path-heading">
        <div><span className="eyebrow">A deliberate entrance</span><h2>Begin with first principles.</h2></div>
        <p>Four documents form the threshold: orientation, declaration, compact, and constitutional structure.</p>
      </div>
      <div className="society-procession">
        <div className="procession-arch" aria-hidden="true"><span>The founding sequence</span></div>
        {[
          ["01", "Orientation", "About the Utopian Society", "Orientation to the project and the corpus as a living civic framework.", corpusPath("about")],
          ["02", "Founding assertion", "Declaration of Existence", "The founding assertion from which the Society proceeds.", corpusPath("declaration-of-existence")],
          ["03", "Civic compact", "The Charter", "The compact that establishes the Society and its continuing purpose.", corpusPath("the-charter-of-the-utopian-society")],
          ["04", "Living framework", "The Constitution", "Twenty-one articles defining rights, duties, continuity, and governance.", corpusPath("constitution-of-the-utopian-society")],
        ].map(([no, role, title, text, href], index) => <a href={href} className={`procession-step ${index % 2 === 0 ? "step-left" : "step-right"}`} key={no}><span className="procession-node">{no}</span><span className="procession-copy"><small>{role}</small><strong>{title}</strong><span>{text}</span><i>Read document →</i></span></a>)}
      </div>
    </section>
      <section className="constitution-epigraph-band">
        <blockquote>
          <p>The Constitution is thus a living document—flexible enough to adapt, firm enough to endure.</p>
          <cite>
            <a
              href={corpusPath("article-xxi-legacy-continuity-of-governance")}
            >
              Article XXI · Section 21.02 — Preservation of the Constitution ↗
            </a>
          </cite>
        </blockquote>
      </section>
    <section className="constitution-index society-constitution">
      <div className="section-intro">
        <div className="constitution-heading">
          <span className="eyebrow">The constitutional body</span>
          <h2>Twenty-one articles. Four movements.</h2>
          <p>The sequence remains intact while its themes become legible at a glance.</p>
        </div>
      </div>
      <div className="article-groups society-article-groups">{articleGroups.map(([group, articles], index) => <article data-movement={String(index + 1).padStart(2, "0")} key={group}><header><span>Movement {String(index + 1).padStart(2, "0")}</span><b>{articles[0][0]}–{articles[articles.length - 1][0]}</b></header><h3>{index === 0 ? <>Foundations<br />of civic life</> : index === 3 ? <>Defense and<br />enduring legacy</> : group}</h3>{articles.map(([roman, title]) => <a href={slug(roman, title)} key={roman}><b>{roman}</b><span>{title}</span><i>→</i></a>)}</article>)}</div>
    </section>
  </SectionFrame>;
}
