"use client";

import { useState } from "react";

type Feature = {
  eyebrow: string;
  title: string;
  introduction: string;
  items: { number: string; title: string; subtitle: string; detail: string; meta?: string }[];
  note: string;
};

const features: Record<string, Feature> = {
  harmony: {
    eyebrow: "The restorative path",
    title: "A proceeding moves toward repair—not spectacle.",
    introduction: "A person may enter for listening, mediation, safety planning, a restorative conference, or procedural review. Privacy narrows what is public; accountability keeps the process visible.",
    items: [
      { number: "01", title: "Receive", subtitle: "A harm is named", detail: "Harmony receives the person’s account, immediate safety needs, desired privacy, and the kind of help being requested. Intake does not presume guilt or compel confrontation.", meta: "Private orientation" },
      { number: "02", title: "Stabilize", subtitle: "Safety before dialogue", detail: "Separation, Healing support, an advocate, accessible communication, or temporary boundaries may be arranged before anyone is asked to meet.", meta: "Consent checkpoint" },
      { number: "03", title: "Clarify", subtitle: "Scope and evidence", detail: "The parties learn what may be shared, which facts remain contested, what authority governs, and whether a restorative process is appropriate.", meta: "Procedural review" },
      { number: "04", title: "Convene", subtitle: "A level place to speak", detail: "A mediator guides listening, accountability, impact, needs, and possible repair. No bench is raised above the people whose lives are involved.", meta: "Scheduled proceeding" },
      { number: "05", title: "Restore", subtitle: "Agreement becomes action", detail: "Repair may include acknowledgment, restitution, changed conditions, education, care, boundaries, or reintegration—proportionate to the harm and freely understood.", meta: "Visible obligations" },
      { number: "06", title: "Review", subtitle: "No outcome is beyond question", detail: "Completion, noncompliance, renewed harm, procedural error, and appeal remain reviewable. Public lessons exclude private identity unless disclosure is lawfully required.", meta: "Continuing accountability" },
    ],
    note: "Public calendars identify proceeding type, availability, and status—not the names or intimate histories of participants.",
  },
  contribution: {
    eyebrow: "The field of contribution",
    title: "Need, ability, rest, and learning remain in one conversation.",
    introduction: "Contribution does not assign human worth. It helps citizens see where useful work is needed, what they can presently offer, and how the Society supports renewal or a different path.",
    items: [
      { number: "01", title: "Food & cultivation", subtitle: "Seasonal need · steady", detail: "Growing, preservation, nutrition, distribution, soil knowledge, and resilient food systems. Learning and Custodianship support apprenticeship and ecology.", meta: "Open apprenticeships" },
      { number: "02", title: "Care & belonging", subtitle: "Human need · elevated", detail: "Healing, companionship, elder support, accessibility, child care, and emotional labor are counted as substantive civic contribution.", meta: "Protected rest required" },
      { number: "03", title: "Making & maintenance", subtitle: "Infrastructure · steady", detail: "Repair, fabrication, energy, water, housing, transport, and technical stewardship join Custodianship’s public systems plan.", meta: "Skill exchange active" },
      { number: "04", title: "Learning & culture", subtitle: "Renewal · open", detail: "Teaching, research, art, memory, mentorship, and retraining return knowledge to the commons rather than hoarding it as rank.", meta: "Mentors requested" },
    ],
    note: "A need indicator is an invitation to coordinate—not authority to compel a citizen, cancel rest, or disregard health and accessibility.",
  },
  balance: {
    eyebrow: "The civic observatory",
    title: "Every indicator carries uncertainty and a human right to answer.",
    introduction: "Balance reads relationships between systems. Its measurements can open review, reveal strain, and test assumptions; they cannot turn a person into a variable to be governed.",
    items: [
      { number: "74", title: "Water continuity", subtitle: "Stable · watched", detail: "Reservoir, rainfall, treatment, ecological flow, and repair capacity are read together. The limiting resource—not the most abundant—sets the warning threshold.", meta: "Confidence: high" },
      { number: "68", title: "Care capacity", subtitle: "Strain emerging", detail: "Waiting time, practitioner rest, accessibility, medicines, prevention, and lived reports are reviewed with Healing before any recommendation is made.", meta: "Confidence: moderate" },
      { number: "81", title: "Contribution renewal", subtitle: "Within range", detail: "Participation, rest, retraining, unmet need, and unequal burdens are considered without converting productivity into citizenship value.", meta: "Minority finding open" },
      { number: "63", title: "Ecological resilience", subtitle: "Review requested", detail: "Soil, biodiversity, energy, waste, transport, and long-range risk require Custodianship evidence and public context before interpretation.", meta: "Revision due" },
    ],
    note: "These values are illustrative local prototypes. A durable observatory must publish sources, methodology, confidence, dissent, revisions, and the people responsible for interpretation.",
  },
  custodianship: {
    eyebrow: "The systems beneath daily life",
    title: "Infrastructure becomes trustworthy when its condition is legible.",
    introduction: "Custodianship holds systems in public trust. Citizens should be able to see what is working, what is strained, who is responding, and when a correction was last verified.",
    items: [
      { number: "01", title: "Water", subtitle: "Available · normal", detail: "Collection, treatment, quality, ecological flow, storage, and access remain visible without exposing household use.", meta: "Verified this civic day" },
      { number: "02", title: "Energy", subtitle: "Available · watch", detail: "Generation, storage, grid balance, repair reserves, and critical-service continuity are maintained as a shared system.", meta: "Storage review open" },
      { number: "03", title: "Transit", subtitle: "Partial interruption", detail: "A northern route accessibility repair is scheduled. Alternate service and expected restoration remain part of the public record.", meta: "Restoration: 2 civic days" },
      { number: "04", title: "Land & habitat", subtitle: "Stable · seasonal care", detail: "Soil, watersheds, biodiversity, food landscapes, housing boundaries, and restoration projects are read as one living commons.", meta: "Seasonal survey active" },
      { number: "05", title: "Civic knowledge", subtitle: "Available · preserved", detail: "Archives, public software, provenance, access permissions, and format migration protect continuity without centralizing truth beyond review.", meta: "Integrity check passed" },
    ],
    note: "A maintenance ledger records systems, decisions, materials, access, responsible teams, expected restoration, verification, and later correction—not private household behavior.",
  },
  defense: {
    eyebrow: "The watch without dominion",
    title: "Preparedness should calm the public, not govern through fear.",
    introduction: "Defense faces outward, prepares openly, and returns exceptional authority to the people. Every crisis action must name its evidence, scope, responsible body, review, and expiration.",
    items: [
      { number: "01", title: "Ordinary readiness", subtitle: "Current condition", detail: "Communications, first aid, shelter, evacuation routes, food, water, and continuity teams maintain routine preparedness with no exceptional power active.", meta: "Status: attentive" },
      { number: "02", title: "Public guidance", subtitle: "Know before urgency", detail: "Citizens may learn warning signals, gathering points, mutual-aid roles, accessibility plans, and how to verify authentic public information.", meta: "Training seats open" },
      { number: "03", title: "Crisis Ring", subtitle: "Temporary by design", detail: "A Crisis Ring exists only for a defined threat and dissolves automatically when its lawful duration ends unless renewed through public constitutional process.", meta: "No Ring convened" },
      { number: "04", title: "After-action record", subtitle: "Authority returns", detail: "Every exceptional action receives public review, minority findings, harm assessment, restoration, and a permanent record of termination.", meta: "Last exercise reviewed" },
    ],
    note: "Defense may never become internal suppression. Torture, domination, indefinite emergency authority, and prohibited weapons remain outside legitimate protection.",
  },
  affirmation: {
    eyebrow: "The civic witness",
    title: "Recognition records truth without manufacturing rank.",
    introduction: "Affirmation preserves useful work in civic memory through three independent forms of witness. A person may challenge the evidence, criteria, interpretation, privacy, or process.",
    items: [
      { number: "01", title: "Human witness", subtitle: "People describe the work", detail: "Peers, recipients, mentors, or collaborators attest to what occurred, how it served, and what context a numerical trace cannot show.", meta: "Narrative evidence" },
      { number: "02", title: "Procedural witness", subtitle: "Criteria remain public", detail: "The record names the applicable standard, consent to publication, evidence considered, conflicts of interest, and the path of review.", meta: "Reviewable process" },
      { number: "03", title: "Systemic witness", subtitle: "The commons remembers", detail: "Completed projects, service logs, learning artifacts, repair records, and civic outcomes confirm contribution without ranking one form of labor above another.", meta: "Provenance preserved" },
    ],
    note: "Affirmation may verify contribution, but it cannot grant human worth, command labor, create inherited standing, or convert recognition into privilege.",
  },
};

export function CivicPortalFeature({ slug }: { slug: string }) {
  const feature = features[slug];
  const [active, setActive] = useState(0);
  if (!feature) return null;
  const item = feature.items[active];
  return <section className={`civic-feature civic-feature-${slug}`} aria-labelledby={`${slug}-feature-title`}>
    <header><span className="eyebrow">{feature.eyebrow}</span><h2 id={`${slug}-feature-title`}>{feature.title}</h2><p>{feature.introduction}</p></header>
    <div className="civic-feature-interface">
      <nav aria-label={`${feature.eyebrow} views`}>{feature.items.map((entry, index) => <button type="button" key={entry.title} id={`${slug}-feature-control-${index}`} className={index === active ? "active" : ""} aria-pressed={index === active} aria-controls={`${slug}-feature-panel`} onClick={() => setActive(index)}><b>{entry.number}</b><span>{entry.title}<small>{entry.subtitle}</small></span></button>)}</nav>
      <article id={`${slug}-feature-panel`} role="region" aria-labelledby={`${slug}-feature-control-${active}`} aria-live="polite"><span>{item.meta}</span><h3>{item.title}</h3><p>{item.detail}</p><small>{item.subtitle}</small></article>
    </div>
    <blockquote>{feature.note}</blockquote>
  </section>;
}
