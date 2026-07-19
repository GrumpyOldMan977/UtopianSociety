import { SectionFrame } from "../components/SectionFrame";

const shelves = [
  ["Robyn’s Journey", "The central long-form narrative and its unfolding world.", "I"],
  ["Short Stories", "Standalone lives, encounters, and civic moments beyond the novel.", "II"],
  ["Mythic Fragments", "Stories through which a society explains itself to itself.", "III"],
  ["Characters", "People, relationships, contradictions, and interior lives.", "IV"],
  ["Worldbuilding", "Places, customs, material life, language, ritual, and memory.", "V"],
];

export default function LorePage() {
  return <SectionFrame eyebrow="South Ring · Narrative" title="Lore" subtitle="What it feels like to live there: stories, people, memory, place, and myth." position="south">
    <section className="lore-threshold"><div className="lore-glyph" aria-hidden="true"><span>Once imagined,<br />a civilization<br />must be inhabited.</span></div><div><span className="eyebrow">The unwritten public shelf</span><h2>The lore exists. Its publication has not yet begun.</h2><p>This section is designed as a threshold rather than an empty archive. The manuscripts remain in OneDrive while their reading order, editorial state, and eventual place in the corpus are prepared.</p><strong>No unpublished story is exposed in this prototype.</strong></div></section>
    <section className="lore-shelves">{shelves.map(([title, text, roman]) => <article key={title}><b>{roman}</b><div><h3>{title}</h3><p>{text}</p></div><span>Forthcoming</span></article>)}</section>
    <section className="lore-promise"><span className="eyebrow">Purpose of the southern ring</span><blockquote>Governance states what a civilization values. Lore reveals whether those values can be lived.</blockquote><p>When publication begins, this page can grow by work and series without changing the ring itself.</p></section>
  </SectionFrame>;
}
