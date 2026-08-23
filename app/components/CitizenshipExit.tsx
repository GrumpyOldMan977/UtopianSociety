"use client";

import { FormEvent, useState } from "react";
import { gregorianDateUTC, utopianDate } from "../lib/utopian-time";

type ExitReceipt = {
  declaration: string;
  civicName: string;
  reference: string;
  standing: string;
  outcome: string;
  utopianDate: string;
  gregorianDate: string;
  publicNote: string;
};

function makeDeclarationNumber() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return `USE-${new Date().getUTCFullYear()}-${bytes[0].toString(16).padStart(8, "0").toUpperCase()}`;
}

export function CitizenshipExit() {
  const [civicName, setCivicName] = useState("");
  const [reference, setReference] = useState("");
  const [standing, setStanding] = useState("Virtual symbolic citizen");
  const [outcome, setOutcome] = useState("Withdrawn by citizen");
  const [reason, setReason] = useState("");
  const [openMatter, setOpenMatter] = useState("");
  const [publicNote, setPublicNote] = useState("");
  const [voluntary, setVoluntary] = useState(false);
  const [ledgerUnderstood, setLedgerUnderstood] = useState(false);
  const [signature, setSignature] = useState("");
  const [receipt, setReceipt] = useState<ExitReceipt | null>(null);

  function submitExit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!voluntary || !ledgerUnderstood || signature.trim().toLocaleLowerCase() !== civicName.trim().toLocaleLowerCase()) return;
    const now = new Date();
    const civicDate = utopianDate(now);
    setReceipt({
      declaration: makeDeclarationNumber(),
      civicName: civicName.trim(),
      reference: reference.trim(),
      standing,
      outcome: standing === "Virtual symbolic citizen" ? outcome : "Exit declaration received · verification required",
      utopianDate: `${civicDate.weekday}, ${civicDate.month} ${civicDate.day}, ${civicDate.yearLabel}`,
      gregorianDate: gregorianDateUTC(now),
      publicNote: publicNote.trim(),
    });
  }

  if (receipt) return <section className="citizenship-exit" id="citizenship-exit" aria-labelledby="citizenship-exit-title">
    <div className="exit-heading"><span className="eyebrow">The peaceful right of exit</span><h2 id="citizenship-exit-title">The declaration has been prepared.</h2><p>This local demonstration has not changed or retained a civic record. A connected portal would verify identity, preserve the declaration, and publish the named status change to the Transparency Ledger.</p></div>
    <div className="citizenship-exit-receipt">
      <span>Citizen-directed status declaration</span>
      <h3>{receipt.outcome}</h3>
      <dl>
        <div><dt>Civic name</dt><dd>{receipt.civicName}</dd></div>
        <div><dt>Prior standing</dt><dd>{receipt.standing}</dd></div>
        <div><dt>Private verification reference</dt><dd>{receipt.reference}</dd></div>
        <div><dt>Declaration</dt><dd>{receipt.declaration}</dd></div>
        <div><dt>Utopian date</dt><dd>{receipt.utopianDate}</dd></div>
        <div><dt>Gregorian reference</dt><dd>{receipt.gregorianDate}</dd></div>
      </dl>
      {receipt.publicNote && <blockquote>“{receipt.publicNote}”</blockquote>}
      <small>The public record would contain only the named change in civic standing. The verification reference, questionnaire answers, and internal review material remain protected.</small>
    </div>
    <button className="exit-reset" type="button" onClick={() => setReceipt(null)}>Prepare another declaration</button>
  </section>;

  return <section className="citizenship-exit" id="citizenship-exit" aria-labelledby="citizenship-exit-title">
    <div className="exit-heading">
      <span className="eyebrow">The peaceful right of exit</span>
      <h2 id="citizenship-exit-title">Citizenship entered freely may be left freely.</h2>
      <p>No explanation is required to leave. The questionnaire helps preserve an accurate record, distinguish withdrawal from inactivity, and offer repair or conversation without making either a condition of exit.</p>
    </div>
    <form className="citizenship-exit-form" onSubmit={submitExit}>
      <header><span>Voluntary exit questionnaire · Local demonstration</span><h3>Direct your own civic standing.</h3><p>Nothing entered here is transmitted or retained. Completing this form cannot presently alter an existing record.</p></header>
      <div className="exit-form-grid">
        <label><span>Civic name <em>required</em></span><input required minLength={2} value={civicName} onChange={(event) => setCivicName(event.target.value)} /></label>
        <label><span>Private civic account reference <em>required · local demonstration only</em></span><input required minLength={4} value={reference} onChange={(event) => setReference(event.target.value)} /></label>
        <label><span>Standing being left</span><select value={standing} onChange={(event) => setStanding(event.target.value)}><option>Virtual symbolic citizen</option><option>Resident or constitutional citizen</option></select></label>
        <label><span>Requested public status</span><select value={outcome} onChange={(event) => setOutcome(event.target.value)} disabled={standing !== "Virtual symbolic citizen"}><option>Withdrawn by citizen</option><option>Inactive by citizen choice</option></select></label>
        <label className="exit-wide"><span>What influenced the decision? <em>optional · private</em></span><select value={reason} onChange={(event) => setReason(event.target.value)}><option value="">No answer</option><option>Change in life or available capacity</option><option>Values or governance disagreement</option><option>Privacy or personal-boundary concern</option><option>Harm or unresolved conflict</option><option>Participation no longer desired</option><option>Another reason</option></select></label>
        <label className="exit-wide"><span>Is any harm, dispute, obligation, or proceeding still open? <em>optional · never a barrier to exit</em></span><select value={openMatter} onChange={(event) => setOpenMatter(event.target.value)}><option value="">No answer</option><option>No open matter known</option><option>Yes · preserve and route the record separately</option><option>Unsure · request a private records review</option></select></label>
        <label className="exit-wide"><span>Public farewell or ledger note <em>optional · public if supplied</em></span><textarea rows={4} maxLength={500} value={publicNote} onChange={(event) => setPublicNote(event.target.value)} /></label>
      </div>
      <div className="exit-consents">
        <label><input type="checkbox" checked={voluntary} onChange={(event) => setVoluntary(event.target.checked)} /><span>I am directing this change voluntarily. I understand that reasons, repair, mediation, and conversation may be offered but cannot be required before exit.</span></label>
        <label><input type="checkbox" checked={ledgerUnderstood} onChange={(event) => setLedgerUnderstood(event.target.checked)} /><span>I understand that my civic name, date, prior standing, and exit status belong in the public Transparency Ledger; verification references and private questionnaire answers do not.</span></label>
      </div>
      <label className="exit-signature"><span>Type your civic name exactly to sign</span><input value={signature} onChange={(event) => setSignature(event.target.value)} autoComplete="off" /></label>
      <button className="exit-submit" type="submit" disabled={!voluntary || !ledgerUnderstood || signature.trim().toLocaleLowerCase() !== civicName.trim().toLocaleLowerCase()}>Prepare the exit declaration</button>
    </form>
  </section>;
}
