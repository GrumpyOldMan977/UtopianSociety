import type { Metadata } from "next";
import Link from "next/link";
import { ReadAloudControls } from "../../components/ReadAloudControls";
import { SectionFrame } from "../../components/SectionFrame";
import { birthOfTheMoonSections } from "../../lib/birth-of-the-moon";

export const metadata: Metadata = {
  title: "Birth of the Moon · The Utopian Society",
  description: "A mythic telling of Earth, Theia, loss, continuity, and the birth of the Moon.",
};

export default function BirthOfTheMoonPage() {
  return (
    <SectionFrame
      eyebrow="Lore · Mythic narrative"
      title="Birth of the Moon"
      subtitle="A story of Earth, Theia, collision, grief, and the continuity that remained in orbit."
      position="south"
    >
      <article className="lore-reading">
        <header className="lore-reading-header">
          <div className="lore-moon-mark" aria-hidden="true"><i /><span /></div>
          <div>
            <span className="eyebrow">The first work on the public Lore shelf</span>
            <p>
              Told in a prologue, five movements, and an epilogue, this mythic account
              gives relationship and memory to the ancient formation of the Earth–Moon system.
            </p>
            <nav aria-label="Story movements">
              {birthOfTheMoonSections.map((section, index) => (
                <a href={`#movement-${index}`} key={section.label}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>{section.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </header>

        <ReadAloudControls targetId="lore-authored-text" title="Birth of the Moon" />

        <div className="lore-reading-body" id="lore-authored-text">
          {birthOfTheMoonSections.map((section, index) => (
            <section className="lore-movement" id={`movement-${index}`} key={section.label}>
              <header>
                <span>{section.label}</span>
                <h2>{section.title}</h2>
              </header>
              <div>
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p className={paragraphIndex === 0 ? "lore-dropcap" : undefined} key={paragraphIndex}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="lore-reading-end">
          <span aria-hidden="true">☾</span>
          <p>The Moon endures as distance, rhythm, and reply.</p>
          <Link href="/lore">Return to the Lore shelf</Link>
        </footer>
      </article>
    </SectionFrame>
  );
}
