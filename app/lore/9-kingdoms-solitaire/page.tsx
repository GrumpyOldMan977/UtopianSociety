import type { Metadata } from "next";
import Link from "next/link";
import { NineKingdomsGame } from "../../components/NineKingdomsGame";
import { SectionFrame } from "../../components/SectionFrame";
import { NINE_KINGDOM_RANKS, NINE_KINGDOM_SUITS } from "../../lib/nine-kingdoms";
import styles from "./nine-kingdoms.module.css";

export const metadata: Metadata = {
  title: "9 Kingdoms Solitaire",
  description: "A playable lore prototype of the hierarchical solitaire game conceived from confinement and built as a 196-card court.",
  openGraph: {
    title: "9 Kingdoms Solitaire",
    description: "A playable 196-card court in the Lore of The Utopian Society.",
    images: [{ url: "/images/lore/9-kingdoms-solitaire-og.png", alt: "Nine illuminated Kingdom cards on a forest-green game table" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/lore/9-kingdoms-solitaire-og.png"],
  },
};

const principles = [
  ["Nine Kingdoms", "Nine columns hold twenty-one cards each. Their exposed cards are Thrones; the top two form a Court, and the top three a Castle."],
  ["A living hierarchy", "Every card is a person rather than a number: Gentry rise through Noble rank into a Royal court."],
  ["Field before hand", "The seven-card reserve waits while a Kingdom can unveil a new figure or complete a required Royal arrangement."],
  ["Order from upheaval", "Guarding, arrangements, invasions, Chapel, and Graveyard turn solitaire into a story of power and consequence."],
];

export default function NineKingdomsSolitairePage() {
  return (
    <SectionFrame
      eyebrow="Lore · Playable chronicle"
      title="9 Kingdoms Solitaire"
      subtitle="A court of philosophies. A field of guarded power. One player against the whole hierarchy."
      position="south"
    >
      <article className={styles.origin}>
        <div>
          <span className={styles.kicker}>Origin of the game</span>
          <h2>A deck of cards became a world.</h2>
        </div>
        <div className={styles.originCopy}>
          <p>
            Conceived during confinement, when ordinary solitaire had exhausted its mystery,
            9 Kingdoms began as an act of invention: nine columns became realms, exposed cards
            became Thrones, and every move acquired rank, allegiance, and consequence.
          </p>
          <p>
            This Lore Edition is the first playable record of that idea. It preserves the
            original 14-suit, 14-rank court while making the still-open rules visible and
            testable rather than pretending they were always settled.
          </p>
        </div>
        <dl>
          <div><dt>Kingdoms</dt><dd>9</dd></div>
          <div><dt>Philosophic suits</dt><dd>{NINE_KINGDOM_SUITS.length}</dd></div>
          <div><dt>Ranks per court</dt><dd>{NINE_KINGDOM_RANKS.length}</dd></div>
          <div><dt>Unique figures</dt><dd>{NINE_KINGDOM_SUITS.length * NINE_KINGDOM_RANKS.length}</dd></div>
        </dl>
      </article>

      <section className={styles.principles} aria-label="Foundations of play">
        {principles.map(([title, text], index) => (
          <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></article>
        ))}
      </section>

      <NineKingdomsGame />

      <nav className={styles.returnShelf} aria-label="Lore navigation">
        <Link href="/lore">← Return to the Lore shelf</Link>
        <a href="#game-board-title">Deal another chronicle ↑</a>
      </nav>
    </SectionFrame>
  );
}
