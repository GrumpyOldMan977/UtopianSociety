"use client";

import { FormEvent, useMemo, useState } from "react";

const interests = {
  living: { label: "Living systems", branch: "Agriculture, Environment & Stewardship", circle: "Custodianship", project: "Join a field inquiry linking ecology, measurement, and restoration." },
  care: { label: "Care and human flourishing", branch: "Medicine, Healing & Human Development", circle: "Healing", project: "Begin with observation, consent practice, and a supported care apprenticeship." },
  making: { label: "Making and infrastructure", branch: "Craft, Engineering & Infrastructure", circle: "Contribution", project: "Pair foundational systems study with a workshop or maintenance apprenticeship." },
  culture: { label: "Art, language and culture", branch: "Art, Culture & Communication", circle: "Harmony", project: "Develop a public work that joins expression, memory, and civic relationship." },
  civic: { label: "Civic systems and ethics", branch: "Governance, Ethics & Civic Design", circle: "Harmony", project: "Study constitutional foundations while observing a public Circle process." },
  technology: { label: "Technology and data", branch: "Technology, Archives & Responsible Innovation", circle: "Custodianship", project: "Build systems literacy through a transparent, human-supervised data project." },
} as const;

const learningModes = {
  guided: "Mentor-guided study",
  applied: "Apprenticeship and practice",
  inquiry: "Research and inquiry",
  communal: "Collaborative project Circle",
} as const;

const rhythms = {
  light: "A light weekly rhythm",
  steady: "A steady study-and-contribution rhythm",
  immersive: "An immersive temporary learning season",
} as const;

export function LearningCivicStudio() {
  const [interest, setInterest] = useState<keyof typeof interests>("living");
  const [mode, setMode] = useState<keyof typeof learningModes>("applied");
  const [rhythm, setRhythm] = useState<keyof typeof rhythms>("steady");
  const [prepared, setPrepared] = useState(false);

  const suggestion = useMemo(() => interests[interest], [interest]);

  const prepareEnrollment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPrepared(true);
  };

  return <section className="learning-studio" id="learning-studio" aria-labelledby="learning-studio-title">
    <div className="civic-section-heading civic-section-heading-light">
      <span className="eyebrow">Interactive local prototype</span>
      <h2 id="learning-studio-title">Shape a path through the Tree of Knowledge.</h2>
      <p>This studio demonstrates how a citizen could begin a conversation with Learning. It makes a recommendation locally in this browser and sends nothing anywhere.</p>
    </div>

    <div className="learning-studio-grid">
      <form className="pathway-form" id="enrollment" onSubmit={prepareEnrollment}>
        <label>
          <span>What draws your curiosity?</span>
          <select value={interest} onChange={(event) => { setInterest(event.target.value as keyof typeof interests); setPrepared(false); }}>
            {Object.entries(interests).map(([value, item]) => <option value={value} key={value}>{item.label}</option>)}
          </select>
        </label>
        <label>
          <span>How would you like to learn?</span>
          <select value={mode} onChange={(event) => { setMode(event.target.value as keyof typeof learningModes); setPrepared(false); }}>
            {Object.entries(learningModes).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>What rhythm is realistic now?</span>
          <select value={rhythm} onChange={(event) => { setRhythm(event.target.value as keyof typeof rhythms); setPrepared(false); }}>
            {Object.entries(rhythms).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <button type="submit">Prepare an enrollment conversation</button>
        <small>No account is required and no response is retained. This is a safe interface prototype.</small>
      </form>

      <article className="pathway-result" aria-live="polite">
        <span>Suggested first branch</span>
        <h3>{suggestion.branch}</h3>
        <dl>
          <div><dt>Learning mode</dt><dd>{learningModes[mode]}</dd></div>
          <div><dt>Initial rhythm</dt><dd>{rhythms[rhythm]}</dd></div>
          <div><dt>Partner Circle</dt><dd>{suggestion.circle}</dd></div>
        </dl>
        <p>{suggestion.project}</p>
        {prepared ? <div className="prototype-confirmation">
          <strong>Your conversation outline is ready.</strong>
          <p>A future secure portal would now request identity, consent, accessibility preferences, mentor availability, and permission to create a Living Profile entry. This prototype deliberately stops before collecting any of them.</p>
        </div> : <p className="pathway-prompt">Choose the closest fit, then prepare the conversation. The recommendation is an opening, never a placement decree.</p>}
      </article>
    </div>
  </section>;
}
