"use client";

import Link from "next/link";
import { useState } from "react";

const domains = [
  { id: "physical", number: "01", title: "Physical", subtitle: "Prevention, treatment, recovery", text: "Physical care joins evidence, prevention, nutrition, movement, treatment, pain relief, rehabilitation, and ecological awareness. Advanced medicine and traditional practice may coexist when evidence, safety, consent, and honest limits remain visible." },
  { id: "emotional", number: "02", title: "Mental & Emotional", subtitle: "Distress met without stigma", text: "Mental and emotional care is ordinary care. Counseling, peer support, crisis response, rest, community, and clinical treatment are offered without shame, forced conformity, or the presumption that distress erases a person's voice." },
  { id: "sexual", number: "03", title: "Sexual & Reproductive", subtitle: "Body sovereignty in practice", text: "Sexual and reproductive care protects pleasure, safety, contraception, pregnancy, abortion, fertility, infection prevention, gendered or embodied needs, and the right to decline. Every practice remains consent-led and free of stigma.", href: "/circles/healing/sexual-reproductive-care" },
  { id: "social", number: "04", title: "Social & Relational", subtitle: "Belonging affects health", text: "Isolation, housing, caregiving, family life, conflict, access, and community shape health. Healing coordinates support while preserving Harmony's jurisdiction over disputes and refusing to medicalize ordinary difference." },
];

export function HealingWholePerson() {
  const [active, setActive] = useState(0);
  const domain = domains[active];
  return <section className="whole-person-care" id="whole-person-care" aria-labelledby="whole-person-title">
    <div className="whole-person-heading">
      <span className="eyebrow">The whole person</span>
      <h2 id="whole-person-title">Four dimensions, one sovereign life.</h2>
      <p>Select a domain to see how care expands beyond the treatment of isolated symptoms.</p>
    </div>
    <div className="whole-person-interface">
      <div className="whole-person-orbit" aria-label="Dimensions of holistic care">
        <i className="whole-person-core" aria-hidden="true"><span>Consent</span><small>remains central</small></i>
        {domains.map((item, index) => item.href
          ? <Link className={`whole-person-domain domain-${index + 1}`} href={item.href} key={item.id} aria-label={`Open ${item.title} care`}><b>{item.number}</b><span>{item.title}</span><small>{item.subtitle}</small><em>Enter care portal →</em></Link>
          : <button className={`whole-person-domain domain-${index + 1}${active === index ? " active" : ""}`} aria-pressed={active === index} onClick={() => setActive(index)} key={item.id}><b>{item.number}</b><span>{item.title}</span><small>{item.subtitle}</small></button>)}
      </div>
      <article className="whole-person-detail" aria-live="polite"><span>{domain.number} · {domain.title}</span><h3>{domain.subtitle}</h3><p>{domain.text}</p><small>Care is offered, never imposed.</small></article>
    </div>
  </section>;
}
