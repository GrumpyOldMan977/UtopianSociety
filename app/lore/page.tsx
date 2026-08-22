import Link from "next/link";
import { SectionFrame } from "../components/SectionFrame";

const shelves = [
  { title: "Robyn’s Journey", text: "The central long-form narrative and its unfolding world.", roman: "I", status: "Forthcoming" },
  { title: "Short Stories", text: "Standalone lives, encounters, and civic moments beyond the novel.", roman: "II", status: "Forthcoming" },
  { title: "Mythic Narratives", text: "Stories through which a society explains itself to itself.", roman: "III", status: "1 published" },
  { title: "Characters", text: "People, relationships, contradictions, and interior lives.", roman: "IV", status: "Forthcoming" },
  { title: "Worldbuilding", text: "Places, customs, material life, language, ritual, memory, and play.", roman: "V", status: "1 playable work" },
];

export default function LorePage() {
  return (
    <SectionFrame
      eyebrow="South Ring · Narrative"
      title="Lore"
      subtitle="What it feels like to live there: stories, people, memory, place, and myth."
      position="south"
    >
      <section className="lore-threshold lore-threshold-published">
        <div className="lore-glyph lore-moon-glyph" aria-hidden="true">
          <i />
          <span>Gravity still speaks.<br />Tides still answer.</span>
        </div>
        <div>
          <span className="eyebrow">The public shelf opens</span>
          <h2>Lore begins with the Moon.</h2>
          <p>
            The first published work of the southern ring is a mythic telling of Earth,
            Theia, and the child made from their collision. It treats cosmic formation as
            relationship: a story of longing, impact, grief, distance, and continuity.
          </p>
          <Link className="lore-primary-link" href="/lore/birth-of-the-moon">
            Read <em>Birth of the Moon</em> <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="lore-feature" aria-labelledby="birth-of-the-moon-title">
        <div className="lore-feature-number">01</div>
        <div>
          <span className="eyebrow">Mythic narrative · Seven-part reading</span>
          <h2 id="birth-of-the-moon-title">Birth of the Moon</h2>
          <p>
            Before witness and name, two worlds learn that creation does not always arrive
            gently—and that what cannot remain whole may still become rhythm, memory, and light.
          </p>
        </div>
        <Link href="/lore/birth-of-the-moon" aria-label="Read Birth of the Moon">Enter the story</Link>
      </section>

      <section className="lore-feature" aria-labelledby="nine-kingdoms-title">
        <div className="lore-feature-number">02</div>
        <div>
          <span className="eyebrow">Playable chronicle · 196-card court</span>
          <h2 id="nine-kingdoms-title">9 Kingdoms Solitaire</h2>
          <p>
            Born from a deck of cards and an insistence that confinement would not have the
            final word, nine columns become realms of philosophy, guarded power, and consequence.
          </p>
        </div>
        <Link href="/lore/9-kingdoms-solitaire" aria-label="Play 9 Kingdoms Solitaire">Enter the Kingdoms</Link>
      </section>

      <section className="lore-shelves" aria-label="Lore shelves">
        {shelves.map((shelf) => (
          <article key={shelf.title}>
            <b>{shelf.roman}</b>
            <div><h3>{shelf.title}</h3><p>{shelf.text}</p></div>
            <span className={shelf.status !== "Forthcoming" ? "is-published" : undefined}>{shelf.status}</span>
          </article>
        ))}
      </section>

      <section className="lore-promise">
        <span className="eyebrow">Purpose of the southern ring</span>
        <blockquote>Governance states what a civilization values. Lore reveals whether those values can be lived.</blockquote>
        <p>The shelf can grow by work and series without changing the ring itself.</p>
      </section>
    </SectionFrame>
  );
}
