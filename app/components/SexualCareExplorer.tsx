"use client";

import { FormEvent, useMemo, useState } from "react";

const modalities = [
  { id: "therapy", number: "01", title: "Sex therapy", subtitle: "Conversation without touch", description: "A licensed counselor helps an individual, partners, or a relationship constellation explore desire, shame, trauma recovery, pain, communication, differing levels of interest, and changing sexual lives.", examples: ["Desire and arousal concerns", "Trauma-informed recovery", "Relationship and communication support", "Sexual identity and body confidence"], boundary: "Talk-based. The practitioner does not participate in sexual contact." },
  { id: "coaching", number: "02", title: "Sex coaching & education", subtitle: "Language, skills, and confidence", description: "A guidance-oriented practitioner teaches sexual communication, anatomy, consent literacy, technique, safer-sex practices, pleasure, and ways to discuss curiosity or boundaries without shame.", examples: ["Consent and boundary language", "Pleasure and anatomy education", "Couples or individual coaching", "Safer-sex planning"], boundary: "Education and guided practice follow an agreed methodology; contact is not assumed." },
  { id: "pelvic", number: "03", title: "Pelvic & embodied care", subtitle: "Comfort, function, and body trust", description: "Clinical and somatic practitioners support pelvic health, sexual pain, recovery after surgery or childbirth, mobility, disability-inclusive adaptation, and the gradual restoration of comfort in one’s body.", examples: ["Pelvic-floor care", "Pain and mobility support", "Postpartum or surgical recovery", "Disability-inclusive adaptation"], boundary: "Every examination or technique is explained separately and may be declined or stopped." },
  { id: "touch", number: "04", title: "Intimacy touch", subtitle: "Supervised, touch-inclusive modalities", description: "A specifically credentialed practitioner may provide intimacy massage, erotic-wellness education, body-awareness practice, or full-body therapeutic massage with an optional erotic extension when the approved methodology permits it.", examples: ["Intimacy massage", "Arousal and body literacy", "Grounding and aftercare", "Full-body therapeutic massage"], boundary: "Adults only. Boundaries, clothing, touch, duration, chaperone preference, and aftercare are agreed before any contact." },
  { id: "service", number: "05", title: "Erotic service practice", subtitle: "Mutuality without commodification", description: "A licensed Sexual Practitioner may offer consensual adult sexual services within a published methodology, hygiene standards, screening rules, and the Society’s egalitarian contribution system.", examples: ["Consent-led erotic service", "Safer-sex and screening protocols", "Client- or practitioner-requested chaperone", "Clearly bounded session agreements"], boundary: "Neither client nor practitioner owes access to a body. Consent remains present-tense and revocable for everyone." },
  { id: "surrogacy", number: "06", title: "Sacred surrogacy", subtitle: "A therapeutic partner in gradual healing", description: "A Sacred Surrogate works within a coordinated therapeutic plan to help an adult address trauma, disability, intimacy phobia, shame, or severe disconnection through pacing, education, touch, and carefully bounded relational practice.", examples: ["Gradual exposure and body trust", "Disability and access support", "Therapist-coordinated practice", "Reflection and integration"], boundary: "The surrogate’s role, scope, communication with other clinicians, and exit conditions are documented in advance." },
  { id: "fertility", number: "07", title: "Fertility & reproductive guidance", subtitle: "Choice across the reproductive life", description: "Practitioners support contraception, conception, fertility awareness, pregnancy choices, reproductive loss, menopause, sexual function, and family-planning decisions without prescribing a preferred outcome.", examples: ["Contraception and fertility literacy", "Conception support", "Pregnancy-choice counseling", "Menopause and reproductive transitions"], boundary: "The citizen’s reproductive decision remains their own; information and care do not become pressure." },
  { id: "companionship", number: "08", title: "Companionship & reconnection", subtitle: "Belonging may be therapeutic", description: "Non-contact companionship and guided relational practice can support people experiencing isolation, grief, disability, social anxiety, or the loss of confidence that sometimes follows illness or life transition.", examples: ["Non-contact companionship", "Social and relational confidence", "Affection and boundary practice", "Reconnection after illness or loss"], boundary: "Companionship never implies consent to touch, romance, or sexual contact." },
] as const;

const careNeeds = [
  ["conversation", "I want to talk, understand, or heal"], ["skills", "I want education or practical skills"], ["body", "I want help with pain, function, or body trust"], ["touch", "I want to explore a touch-inclusive modality"], ["reproductive", "I want reproductive or fertility guidance"], ["connection", "I want companionship or relational reconnection"],
] as const;
const needMap: Record<string, string[]> = { conversation: ["therapy", "surrogacy"], skills: ["coaching", "pelvic"], body: ["pelvic", "touch"], touch: ["touch", "surrogacy", "service"], reproductive: ["fertility", "therapy"], connection: ["companionship", "coaching", "surrogacy"] };

export function SexualCareExplorer() {
  const [active, setActive] = useState(0);
  const [need, setNeed] = useState("conversation");
  const [format, setFormat] = useState("private");
  const [boundary, setBoundary] = useState("conversation-only");
  const [support, setSupport] = useState("none-requested");
  const [submitted, setSubmitted] = useState(false);
  const modality = modalities[active];
  const matches = useMemo(() => needMap[need].map((id) => modalities.find((item) => item.id === id)!).filter(Boolean), [need]);

  function buildBrief(event: FormEvent) { event.preventDefault(); setSubmitted(true); }

  return <>
    <section className="sexual-modalities" id="sexual-practitioners" aria-labelledby="sexual-modalities-title">
      <header><span className="eyebrow">Sexual Practitioners</span><h2 id="sexual-modalities-title">Care has many forms—and none is assumed.</h2><p>Select a practice to understand what it offers, what it does not imply, and where consent is made concrete.</p></header>
      <div className="sexual-modalities-interface">
        <nav aria-label="Sexual practitioner services">{modalities.map((item, index) => <button className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-pressed={index === active} key={item.id}><b>{item.number}</b><span>{item.title}<small>{item.subtitle}</small></span></button>)}</nav>
        <article aria-live="polite"><span>{modality.number} · Recognized modality</span><h3>{modality.title}</h3><p className="sexual-modality-lede">{modality.description}</p><h4>Services may include</h4><ul>{modality.examples.map((example) => <li key={example}>{example}</li>)}</ul><blockquote>{modality.boundary}</blockquote></article>
      </div>
    </section>
    <section className="sexual-pathfinder" id="care-pathfinder" aria-labelledby="sexual-pathfinder-title">
      <header><span className="eyebrow">Private care pathfinder</span><h2 id="sexual-pathfinder-title">Begin with what you want—not what someone assumes.</h2><p>This private preview helps you prepare a first conversation. It sends, stores, and diagnoses nothing.</p></header>
      <div className="sexual-pathfinder-layout">
        <form onSubmit={buildBrief}>
          <label><span>What brings you here?</span><select value={need} onChange={(event) => { setNeed(event.target.value); setSubmitted(false); }}>{careNeeds.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label><span>Preferred setting</span><select value={format} onChange={(event) => { setFormat(event.target.value); setSubmitted(false); }}><option value="private">Private one-to-one session</option><option value="partners">With partner(s)</option><option value="remote">Remote conversation first</option><option value="unsure">I want help choosing</option></select></label>
          <label><span>Starting boundary</span><select value={boundary} onChange={(event) => { setBoundary(event.target.value); setSubmitted(false); }}><option value="conversation-only">Conversation only</option><option value="non-erotic-touch">Non-erotic touch may be discussed</option><option value="touch-discussion">Touch-inclusive care may be discussed</option><option value="undecided">I am not ready to decide</option></select></label>
          <label><span>Support preference</span><select value={support} onChange={(event) => { setSupport(event.target.value); setSubmitted(false); }}><option value="none-requested">No support person requested yet</option><option value="support-person">Bring a trusted support person</option><option value="chaperone">Request a trained chaperone</option><option value="advocate">Request a consent advocate</option></select></label>
          <button type="submit">Prepare my private brief</button><small>No name, contact information, intimate history, or health record is requested.</small>
        </form>
        <aside className={submitted ? "ready" : ""} aria-live="polite"><span>{submitted ? "Private brief ready" : "Possible first paths"}</span><h3>{submitted ? "You set the first boundary." : "Based on the need you selected"}</h3><div>{matches.map((match) => <p key={match.id}><b>{match.title}</b><small>{match.subtitle}</small></p>)}</div>{submitted && <dl><dt>Setting</dt><dd>{format.replaceAll("-", " ")}</dd><dt>Boundary</dt><dd>{boundary.replaceAll("-", " ")}</dd><dt>Support</dt><dd>{support.replaceAll("-", " ")}</dd></dl>}<blockquote>Nothing begins until the practitioner confirms scope, explains alternatives, and hears an affirmative choice.</blockquote></aside>
      </div>
    </section>
  </>;
}
