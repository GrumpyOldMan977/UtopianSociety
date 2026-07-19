"use client";

import { useState } from "react";

const thresholds = [
  {
    number: "01",
    title: "Hopeful",
    subtitle: "Declaration of Intent",
    principle: "You have formally asked to be considered.",
    summary: "A Hopeful is someone who has declared an intention to seek membership and entered the evaluation process. Hopeful status is an aspiration toward membership—not residency, citizenship, or inclusion in the Society's official population count.",
    expressions: ["A voluntary Declaration of Intent", "A brief statement of purpose", "Dignity, transparency, and procedural fairness"],
  },
  {
    number: "02",
    title: "Hopeful Evaluation",
    subtitle: "Good faith, compatibility, and capacity",
    principle: "The Hopeful and the Society learn one another.",
    summary: "Several Circles review good faith, civic compatibility, possible contribution, population capacity, and cultural understanding. Expectations must be explained openly. The result may be acceptance into residency, deferral, or a reasoned denial.",
    expressions: ["Multi-Circle interviews", "Cultural norms explained in advance", "A recorded outcome with reasons"],
  },
  {
    number: "03",
    title: "Provisional Resident",
    subtitle: "Live, contribute, and integrate",
    principle: "Compatibility is experienced in ordinary civic life.",
    summary: "A Hopeful who completes evaluation may be granted Provisional Residency. A Resident may live and work within the Society, receives defined rights and protections, contributes through civic sectors, and participates in community life while long-term compatibility is reviewed.",
    expressions: ["Protected residence within capacity", "Contribution matched to ability and interest", "A later review for citizenship eligibility"],
  },
  {
    number: "04",
    title: "Citizen",
    subtitle: "Formal civic recognition",
    principle: "The covenant becomes fully mutual.",
    summary: "After the residency period and Circle review, an eligible Resident may be formally recognized as a Citizen with full civic rights and responsibilities. The online process below grants virtual symbolic recognition only; it does not complete this constitutional pathway.",
    expressions: ["Full participation in civic governance", "Constitutional rights and responsibilities", "A continuing right of voluntary renunciation"],
  },
] as const;

export function ImmigrationThreshold() {
  const [active, setActive] = useState(0);
  const threshold = thresholds[active];

  return <section className="immigration-threshold" aria-labelledby="immigration-threshold-title">
    <div className="immigration-threshold-heading">
      <span className="eyebrow">The Immigration Codex in ordinary language</span>
      <h2 id="immigration-threshold-title">From Hopeful to Citizen.</h2>
      <p>Hopeful, Resident, and Citizen are defined civic classifications—not decorative labels. Select each stage to see what it means, what happens there, and what standing the person holds.</p>
    </div>

    <div className="threshold-experience">
      <div className="threshold-map">
        <div className="threshold-arches" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="threshold-route-guide" aria-hidden="true"><span>Citizen</span><i>↑</i><span>Begin as Hopeful</span></div>
        <ol>
          {thresholds.map((item, index) => <li key={item.title}>
            <button type="button" aria-pressed={active === index} onClick={() => setActive(index)}>
              <b>{item.number}</b>
              <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
            </button>
          </li>)}
        </ol>
        <p>Every threshold remains reviewable. None abolishes the right to leave.</p>
      </div>

      <article className="threshold-detail" aria-live="polite">
        <header><span>{threshold.number} · {threshold.title}</span><h3>{threshold.principle}</h3></header>
        <p>{threshold.summary}</p>
        <div><b>Expressed through</b><ul>{threshold.expressions.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </article>
    </div>
  </section>;
}
