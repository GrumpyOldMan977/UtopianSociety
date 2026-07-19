"use client";

import { useState } from "react";

const levels = [
  {
    id: "roots",
    number: "01",
    stage: "Roots",
    title: "Foundational learning",
    summary: "The roots establish a body of shared knowledge from which every citizen can continue growing.",
    philosophy: "A society cannot deliberate freely when knowledge is hoarded or when citizens are denied the tools needed to question inherited assumptions. Foundational learning therefore belongs to everyone, without tuition, rank, or a predetermined vocation.",
    expressions: ["Philosophy and ethical inquiry", "Logic and mathematics", "Natural science and ecology", "History, language, and civic memory"],
  },
  {
    id: "trunk",
    number: "02",
    stage: "Trunk",
    title: "The civic core",
    summary: "The trunk joins knowledge to citizenship by developing the capacities required to live and work with others.",
    philosophy: "Knowledge becomes civic only when it can travel through empathy, communication, cooperation, and moral judgment. The core does not demand conformity; it gives unlike people a shared means of listening, reasoning, repairing misunderstanding, and acting responsibly.",
    expressions: ["Communication and interpretation", "Empathy and social understanding", "Cooperation and restorative practice", "Ethical application and civic participation"],
  },
  {
    id: "branches",
    number: "03",
    stage: "Branches",
    title: "Fields of application",
    summary: "The branches carry common learning outward into the many practical forms through which society is sustained.",
    philosophy: "Disciplines are distinct without being isolated. Agriculture touches ecology; medicine touches ethics; engineering touches beauty and public trust. Learners specialize while remaining able to see how their work enters the lives and responsibilities of other Circles.",
    expressions: ["Agriculture, medicine, and environment", "Infrastructure, energy, and technology", "Art, culture, and human expression", "Governance, research, and public service"],
  },
  {
    id: "canopy",
    number: "04",
    stage: "Canopy",
    title: "Aspirational development",
    summary: "The canopy is the continuing renewal of knowledge through mastery, discovery, mentorship, and reinvention.",
    philosophy: "No citizen is finished learning, and no early choice becomes a lifelong sentence. The canopy shelters research, deep mastery, teaching, retraining, and the freedom to begin again. Its fruits return to the roots as shared knowledge for the generations that follow.",
    expressions: ["Advanced study and research", "Mentorship and teaching", "Retraining and vocational renewal", "New knowledge returned to the commons"],
  },
] as const;

type LevelId = (typeof levels)[number]["id"];

export function LearningKnowledgeTree() {
  const [activeId, setActiveId] = useState<LevelId>("roots");
  const active = levels.find((level) => level.id === activeId) ?? levels[0];

  return <div className="learning-tree-experience">
    <div className="learning-tree-canvas" role="group" aria-label="The four levels of the Utopian Society University Tree of Knowledge">
      <div className="tree-of-life" aria-hidden="true">
        <div className="tree-halo tree-halo-one" />
        <div className="tree-halo tree-halo-two" />
        <div className="tree-crown"><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="tree-branches"><i /><i /><i /><i /><i /><i /></div>
        <div className="tree-trunk" />
        <div className="tree-roots"><i /><i /><i /><i /><i /><i /></div>
        <div className="tree-ground" />
      </div>

      {levels.map((level) => <button
        type="button"
        key={level.id}
        className={`tree-level tree-level-${level.id}`}
        aria-pressed={activeId === level.id}
        aria-controls="learning-tree-detail"
        onMouseEnter={() => setActiveId(level.id)}
        onFocus={() => setActiveId(level.id)}
        onClick={() => setActiveId(level.id)}
      >
        <b>{level.number}</b>
        <span>{level.stage}</span>
        <small>{level.title}</small>
      </button>)}

      <p className="tree-instruction">Hover, focus, or select a level to follow knowledge through the tree.</p>
    </div>

    <article className={`learning-tree-detail learning-tree-detail-${active.id}`} id="learning-tree-detail" aria-live="polite">
      <header>
        <span>{active.number} · {active.stage}</span>
        <h3>{active.title}</h3>
      </header>
      <p className="tree-detail-summary">{active.summary}</p>
      <div className="tree-philosophy">
        <b>Guiding philosophy</b>
        <p>{active.philosophy}</p>
      </div>
      <div className="tree-expressions">
        <b>Expressed through</b>
        <ul>{active.expressions.map((expression) => <li key={expression}>{expression}</li>)}</ul>
      </div>
    </article>
  </div>;
}
