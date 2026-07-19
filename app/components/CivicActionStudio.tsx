"use client";

import { FormEvent, useState } from "react";
import { gregorianDateUTC, utopianDate } from "../lib/utopian-time";

type Action = {
  label: string;
  title: string;
  description: string;
  fields: { label: string; type?: "text" | "textarea" | "select" | "date"; options?: string[]; placeholder?: string }[];
  result: string;
};

const actions: Record<string, Action[]> = {
  healing: [
    {
      label: "Care request",
      title: "Prepare a care request",
      description: "This local prototype helps organize a request. It is not an emergency service, diagnosis, medical record, or submission.",
      fields: [
        { label: "Area of care", type: "select", options: ["Physical and preventive care", "Mental and emotional care", "Sexual or reproductive care", "Social or relational support", "End-of-life or Continuance conversation"] },
        { label: "Timing", type: "select", options: ["Routine", "Soon", "Urgent — seek available local emergency care now"] },
        { label: "Accessibility or communication needs", placeholder: "Language, mobility, sensory, privacy, or other needs" },
        { label: "What would feel supportive?", type: "textarea", placeholder: "Describe the support you are seeking without including identifying medical records." },
      ],
      result: "Your local care-request outline is ready. Nothing was sent or retained. In a durable civic platform, the next step would require explicit consent before secure transmission.",
    },
    {
      label: "Healing path",
      title: "Find a starting path",
      description: "Choose a need and setting to see how the Circle might guide—not prescribe—a first conversation.",
      fields: [
        { label: "Primary need", type: "select", options: ["Prevention and wellness", "Treatment or recovery", "Emotional support", "Sexual well-being", "Reproductive choice", "Relational support", "Decline, death, or Continuance"] },
        { label: "Preferred setting", type: "select", options: ["Private consultation", "Community clinic", "Garden or home visit", "Group education", "Remote conversation"] },
        { label: "Support person", type: "select", options: ["I prefer privacy", "I may bring someone", "Help me identify an advocate"] },
      ],
      result: "A suitable first step would combine a consent-led orientation with a healer or advocate qualified in the selected domain. You retain the right to pause, refuse, or choose another path.",
    },
  ],
  harmony: [
    {
      label: "Report harm",
      title: "Prepare a harm intake",
      description: "Organize a concern, immediate safety needs, consent boundaries, and the remedy you hope to explore. Nothing leaves this page.",
      fields: [
        { label: "What kind of help is needed?", type: "select", options: ["Listening and orientation", "Voluntary mediation", "Safety planning", "Restorative conference", "Procedural review"] },
        { label: "Immediate safety need", type: "select", options: ["None identified", "Separation or no-contact support", "Healing support", "Urgent outside assistance"] },
        { label: "What may be shared?", type: "textarea", placeholder: "State the information and people you consent to include." },
        { label: "What repair would you like explored?", type: "textarea" },
      ],
      result: "The local intake outline is ready. A real Harmony process would confirm safety and consent before contacting another person or scheduling a proceeding.",
    },
    {
      label: "Proceedings calendar",
      title: "Preview the public calendar",
      description: "Only procedural availability belongs in the public view; names, testimony, evidence, and private history do not.",
      fields: [{ label: "View", type: "select", options: ["Open orientation hours", "Mediation availability", "Restorative conferences", "Public procedural reviews"] }],
      result: "Preview: Spiraday 12 — two orientation openings; Conceptday 14 — one mediation opening; Percepday 16 — public procedural review. No private case details are displayed.",
    },
  ],
  contribution: [
    {
      label: "Contribution path",
      title: "Shape a contribution pathway",
      description: "Match interest, rhythm, accessibility, and learning needs without allowing urgency to become coercion.",
      fields: [
        { label: "Interest", type: "select", options: ["Care", "Food and ecology", "Learning", "Infrastructure", "Art and culture", "Administration", "Research"] },
        { label: "Current rhythm", type: "select", options: ["A few hours", "One day", "Standard contribution cycle", "Project-based", "Study or supported transition"] },
        { label: "Support needed", type: "textarea", placeholder: "Training, access, accommodation, caregiving, rest, or mentorship" },
      ],
      result: "A pathway outline is ready for a joint Contribution and Learning conversation. Essential care, food, shelter, education, dignity, and personhood never depend upon accepting the suggestion.",
    },
    {
      label: "Sector needs",
      title: "Read current sample needs",
      description: "The prototype distinguishes a request for help from a command and shows why the need exists.",
      fields: [{ label: "Sector", type: "select", options: ["Food systems", "Healing", "Learning", "Water and energy", "Transit", "Arts and civic memory"] }],
      result: "Sample need: two supported apprenticeship places requested for the next renewal cycle. Source, duration, accessibility, protected rest, and later review would be published with the request.",
    },
  ],
  balance: [
    {
      label: "State of balance",
      title: "Read an indicator with context",
      description: "A number is shown with source, uncertainty, human meaning, and the limit of what it may decide.",
      fields: [{ label: "Indicator", type: "select", options: ["Water security", "Healing capacity", "Housing", "Population", "Rest and renewal", "Civic confidence"] }],
      result: "Sample status: stable with emerging strain. Confidence: moderate. The signal opens review; it does not authorize rationing, treatment decisions, exclusion, or population control.",
    },
    {
      label: "Methods",
      title: "Inspect the method behind a signal",
      description: "A public method must disclose source, confidence, assumptions, human consequence, revision history, and what the measure may never decide.",
      fields: [{ label: "Method", type: "select", options: ["Capacity ratio", "Trend comparison", "Scenario range", "Continuance review", "Competing-needs matrix"] }],
      result: "Sample method record: source and collection date disclosed; uncertainty stated; affected Circles consulted; minority finding preserved; no authority to ration care, rank citizens, or compel population outcomes.",
    },
    {
      label: "Request review",
      title: "Submit missing context",
      description: "Explain what a model, summary, or aggregate measure may have missed.",
      fields: [{ label: "Affected system", type: "text" }, { label: "Missing context or consequence", type: "textarea" }, { label: "Who should be consulted?", type: "text" }],
      result: "The review outline is ready. A real request would publish the institutional question while protecting personal or clinical information.",
    },
  ],
  custodianship: [
    {
      label: "Request service",
      title: "Prepare a public-systems request",
      description: "Describe a shared infrastructure or ecological need and the access implications it creates.",
      fields: [
        { label: "System", type: "select", options: ["Water", "Energy", "Housing", "Transit", "Waste and sanitation", "Land and ecology", "Digital or archival system"] },
        { label: "Location or shared asset", type: "text" },
        { label: "Observed condition", type: "textarea" },
        { label: "Access or safety impact", type: "textarea" },
      ],
      result: "The service outline is ready. A durable system would assign a public tracking number, responsible Council, expected review time, and completion record.",
    },
    {
      label: "Stewardship ledger",
      title: "Preview a maintenance record",
      description: "See who accepted responsibility, what changed, what it cost in shared resources, and when the work will be inspected again.",
      fields: [{ label: "Public system", type: "select", options: ["Water", "Energy", "Transit", "Housing", "Ecology", "Archives"] }],
      result: "Sample ledger: request acknowledged; responsible Council named; access impact assessed; work window published; completion evidence and next inspection remain open to public review.",
    },
    {
      label: "Systems status",
      title: "Read a living-system status",
      description: "Public condition is visible without exposing private household use.",
      fields: [{ label: "System", type: "select", options: ["Water", "Energy", "Transit", "Soil", "Housing", "Records"] }],
      result: "Sample status: normal service, one scheduled maintenance window, no active access restriction. Source and revision history would accompany every live status.",
    },
  ],
  defense: [
    {
      label: "Readiness",
      title: "Read readiness without alarm",
      description: "The public view explains conditions, authority, responsible bodies, and whether any exceptional action exists.",
      fields: [{ label: "Area", type: "select", options: ["Weather", "Communications", "Evacuation", "Food and water continuity", "External threat", "Medical readiness"] }],
      result: "Sample status: ordinary readiness. No Crisis Ring is active and no exceptional authority is in force. Preparedness work remains educational and voluntary.",
    },
    {
      label: "Crisis record",
      title: "Inspect an expiring crisis action",
      description: "Exceptional authority is legible through its source, purpose, responsible people, narrow powers, review, and automatic termination.",
      fields: [{ label: "Record", type: "select", options: ["No active Crisis Ring", "Weather response example", "Communications continuity example", "Evacuation support example"] }],
      result: "Sample record: authority narrowly stated; rights limits published; Healing and Custodianship roles separated; public review scheduled; automatic expiration recorded. No active Crisis Ring exists in this local prototype.",
    },
    {
      label: "Training",
      title: "Choose resilience training",
      description: "Prepare an expression of interest in skills that protect life without militarizing civic life.",
      fields: [{ label: "Path", type: "select", options: ["First aid", "Communications", "Evacuation support", "Logistics", "Weather readiness", "Rights during crisis"] }, { label: "Accessibility needs", type: "text" }],
      result: "The training-interest outline is ready. No enrollment was submitted or retained.",
    },
  ],
  affirmation: [
    {
      label: "Prepare affirmation",
      title: "Prepare an act of contribution for witness",
      description: "Describe what was done, why it mattered, and how it may be verified without turning recognition into competition.",
      fields: [{ label: "Contribution", type: "textarea" }, { label: "Civic purpose", type: "textarea" }, { label: "Witness or evidence", type: "textarea" }, { label: "Privacy boundary", type: "textarea" }],
      result: "The affirmation outline is ready. A real process would confirm consent, evidence, criteria, and the wording of any public record before publication.",
    },
    {
      label: "Criteria and record",
      title: "Preview transparent recognition",
      description: "See how evidence, human witness, privacy, and equal treatment form a recognition record without rank or privilege.",
      fields: [{ label: "Contribution form", type: "select", options: ["Care labor", "Manual or technical labor", "Creative work", "Learning and mentorship", "Civic administration", "Ecological stewardship"] }],
      result: "Preview: contribution described in ordinary language; civic purpose and verification disclosed; privacy boundary honored; review route shown; no score, rank, or material privilege attached.",
    },
    {
      label: "Request review",
      title: "Challenge an affirmation process",
      description: "Identify bias, missing context, privacy harm, or a procedural failure.",
      fields: [{ label: "Concern", type: "select", options: ["Missing context", "Unequal criteria", "Privacy", "Evidence error", "Accessibility", "Conflict of interest"] }, { label: "What should be reconsidered?", type: "textarea" }],
      result: "The review outline is ready for an independent process supported by Harmony. Nothing was submitted or stored.",
    },
  ],
  "time-observance": [
    {
      label: "Convert a date",
      title: "Convert Gregorian to Utopian time",
      description: "The result uses the same uninterrupted UTC day count as the frontispiece clock.",
      fields: [{ label: "Gregorian date", type: "date" }],
      result: "date-conversion",
    },
    {
      label: "Return to today",
      title: "Read the current civic date",
      description: "Open the present month and restore the calendar to the current Utopian day.",
      fields: [],
      result: "today-conversion",
    },
  ],
};

export function CivicActionStudio({ slug }: { slug: string }) {
  const available = actions[slug] ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const active = available[activeIndex];

  const conversion = (() => {
    if (!active || !active.result.includes("conversion")) return "";
    const raw = active.result === "today-conversion" ? new Date() : values["Gregorian date"] ? new Date(`${values["Gregorian date"]}T12:00:00Z`) : null;
    if (!raw || Number.isNaN(raw.getTime())) return "Choose a Gregorian date to see its Utopian equivalent.";
    const converted = utopianDate(raw);
    return `${gregorianDateUTC(raw)} corresponds to ${converted.weekday} · ${converted.month} ${converted.day} · ${converted.yearLabel}.`;
  })();

  if (!active) return null;

  const switchAction = (index: number) => {
    setActiveIndex(index);
    setValues({});
    setComplete(false);
    setError("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const missing = active.fields.find((field) => !(values[field.label] ?? "").trim());
    if (missing) {
      setComplete(false);
      setError(`Complete “${missing.label}” before creating the local preview.`);
      return;
    }
    setError("");
    setComplete(true);
  };

  return <section className="civic-action-studio" id="civic-action-studio" aria-labelledby={`${slug}-studio-title`}>
    <div className="civic-action-heading">
      <span className="eyebrow">Local civic prototype</span>
      <h2 id={`${slug}-studio-title`}>Practice the pathway without creating a record.</h2>
      <p>Everything here remains in this page only. It sends nothing, stores nothing, and does not imply that a real civic office has acted.</p>
    </div>
    <div className="civic-action-shell">
      <div className="civic-action-tabs" role="group" aria-label="Choose a prototype">
        {available.map((item, index) => <button type="button" key={item.label} id={`${slug}-action-control-${index}`} aria-pressed={index === activeIndex} aria-controls={`${slug}-action-panel`} onClick={() => switchAction(index)}>{String(index + 1).padStart(2, "0")}<span>{item.label}</span></button>)}
      </div>
      <form onSubmit={submit} className="civic-action-form" id={`${slug}-action-panel`} role="region" aria-labelledby={`${slug}-action-control-${activeIndex}`}>
        <header><span>{active.label}</span><h3>{active.title}</h3><p>{active.description}</p></header>
        {active.fields.length > 0 && <div className="civic-action-fields">
          {active.fields.map((field) => <label key={field.label}><span>{field.label}</span>
            {field.type === "textarea" ? <textarea required rows={4} value={values[field.label] ?? ""} placeholder={field.placeholder} onChange={(event) => setValues({ ...values, [field.label]: event.target.value })} />
              : field.type === "select" ? <select required value={values[field.label] ?? ""} onChange={(event) => setValues({ ...values, [field.label]: event.target.value })}><option value="">Choose one</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>
                : <input required type={field.type ?? "text"} value={values[field.label] ?? ""} placeholder={field.placeholder} onChange={(event) => setValues({ ...values, [field.label]: event.target.value })} />}
          </label>)}
        </div>}
        <button className="civic-action-submit" type="submit">Create local preview</button>
        {error && <p className="civic-action-error" role="alert">{error}</p>}
        {complete && <output className="civic-action-result" aria-live="polite"><b>Local result</b><p>{conversion || active.result}</p><small>No information was transmitted or retained.</small></output>}
      </form>
    </div>
  </section>;
}
