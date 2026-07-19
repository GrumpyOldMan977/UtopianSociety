"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ASSESSMENT_PASSING_SCORE, immigrationDomains, immigrationQuestions } from "../lib/immigration-assessment";
import { gregorianDateUTC, utopianDate } from "../lib/utopian-time";
import { issueNaturalizationCertificate } from "../lib/civic-ledger";

type Stage = "declaration" | "assessment" | "result" | "oath" | "certificate";

type Certificate = {
  serial: string;
  civicName: string;
  score: number;
  utopianDate: string;
  gregorianDate: string;
  preview?: boolean;
};

const PAGE_SIZE = 10;
const oathText = "I enter this symbolic civic covenant freely. I affirm the dignity and sovereignty of every person; consent as informed, ongoing, and retractable; contribution according to ability without reducing human worth to productivity; stewardship of the living world; lifelong learning; restorative accountability; transparent civic participation; and the peaceful right of exit. I will meet disagreement without domination, seek repair where harm occurs, and approach this Society in good faith.";
const contactAddressPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stageNumber(stage: Stage) {
  if (stage === "declaration") return 1;
  if (stage === "assessment" || stage === "result") return 2;
  if (stage === "oath") return 3;
  return 4;
}

export function ImmigrationApplication() {
  const [stage, setStage] = useState<Stage>("declaration");
  const [civicName, setCivicName] = useState("");
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState("");
  const [region, setRegion] = useState("");
  const [motivation, setMotivation] = useState("");
  const [contribution, setContribution] = useState("");
  const [acknowledgements, setAcknowledgements] = useState([false, false, false, false]);
  const [answers, setAnswers] = useState<number[]>(() => Array(immigrationQuestions.length).fill(-1));
  const [assessmentPage, setAssessmentPage] = useState(0);
  const [assessmentError, setAssessmentError] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [signature, setSignature] = useState("");
  const [oathAccepted, setOathAccepted] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issuanceError, setIssuanceError] = useState("");
  const issuanceKey = useRef("");

  const activeStep = stageNumber(stage);
  const totalPages = Math.ceil(immigrationQuestions.length / PAGE_SIZE);
  const visibleQuestions = immigrationQuestions.slice(assessmentPage * PAGE_SIZE, (assessmentPage + 1) * PAGE_SIZE);
  const answeredCount = answers.filter((answer) => answer >= 0).length;

  const domainResults = useMemo(() => immigrationDomains.map((domain) => {
    const questions = immigrationQuestions.filter((question) => question.domain === domain);
    const correct = questions.filter((question) => answers[question.id - 1] === question.correctIndex).length;
    return { domain, correct, total: questions.length };
  }), [answers]);

  function updateAcknowledgement(index: number, checked: boolean) {
    setAcknowledgements((current) => current.map((value, currentIndex) => currentIndex === index ? checked : value));
  }

  function beginAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedContact = contact.trim();
    if (normalizedContact && !contactAddressPattern.test(normalizedContact)) {
      setContactError("Enter a complete address such as firstname.middleinitial.lastname@example.com, or leave this optional field blank.");
      return;
    }
    if (!acknowledgements.every(Boolean)) return;
    setContact(normalizedContact);
    setContactError("");
    setStage("assessment");
    document.getElementById("immigration-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function answerQuestion(questionId: number, optionIndex: number) {
    setAnswers((current) => current.map((answer, index) => index === questionId - 1 ? optionIndex : answer));
    setAssessmentError("");
  }

  function changeAssessmentPage(direction: -1 | 1) {
    if (direction === 1 && visibleQuestions.some((question) => answers[question.id - 1] < 0)) {
      setAssessmentError("Please answer every question on this page before continuing.");
      return;
    }
    setAssessmentPage((current) => Math.min(totalPages - 1, Math.max(0, current + direction)));
    setAssessmentError("");
    document.getElementById("assessment-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function completeAssessment() {
    if (visibleQuestions.some((question) => answers[question.id - 1] < 0) || answeredCount !== immigrationQuestions.length) {
      setAssessmentError("All 100 questions must be answered before the assessment can be completed.");
      return;
    }
    const correct = immigrationQuestions.filter((question) => answers[question.id - 1] === question.correctIndex).length;
    setScore(correct);
    setStage("result");
    document.getElementById("immigration-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function retakeAssessment() {
    setAnswers(Array(immigrationQuestions.length).fill(-1));
    setAssessmentPage(0);
    setScore(null);
    setAssessmentError("");
    setIssuanceError("");
    issuanceKey.current = "";
    setStage("assessment");
  }

  async function issueCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (score === null || score < ASSESSMENT_PASSING_SCORE || !oathAccepted || signature.trim().toLocaleLowerCase() !== civicName.trim().toLocaleLowerCase()) return;
    setIssuing(true);
    setIssuanceError("");
    if (!issuanceKey.current) issuanceKey.current = crypto.randomUUID();
    try {
      const issued = await issueNaturalizationCertificate({
        civicName: civicName.trim(),
        signature: signature.trim(),
        oathAccepted,
        assessmentVersion: "immigration-v1",
        answers,
        issuanceKey: issuanceKey.current,
      });
      setCertificate(issued.certificate);
      setStage("certificate");
      document.getElementById("immigration-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setIssuanceError(error instanceof Error ? error.message : "The civic record could not issue this certificate.");
    } finally {
      setIssuing(false);
    }
  }

  function previewCertificate() {
    const now = new Date();
    const civicDate = utopianDate(now);
    setCertificate({
      serial: "DESIGN-PREVIEW",
      civicName: civicName.trim() || "Adreto Nagdo Senoviros",
      score: 100,
      utopianDate: `${civicDate.weekday}, ${civicDate.month} ${civicDate.day}, ${civicDate.yearLabel}`,
      gregorianDate: gregorianDateUTC(now),
      preview: true,
    });
    setStage("certificate");
    document.getElementById("immigration-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <section className="immigration-workspace" id="immigration-workspace" aria-labelledby="immigration-workspace-title">
    <div className="immigration-process-header">
      <div>
        <span className="eyebrow">Hopeful intake · Civic naturalization</span>
        <h2 id="immigration-workspace-title">Enter the covenant with clarity.</h2>
      </div>
      <p>Your statements, contact field, and individual answers remain in this browser. Only successful certificate details—civic name, score, dates, serial, and standing—enter the public civic record.</p>
    </div>

    <ol className="immigration-stepper" aria-label="Symbolic naturalization process">
      {["Declaration", "Assessment", "Oath", "Certificate"].map((label, index) => <li className={activeStep === index + 1 ? "is-current" : activeStep > index + 1 ? "is-complete" : ""} key={label}>
        <b>{String(index + 1).padStart(2, "0")}</b><span>{label}</span>
      </li>)}
    </ol>

    {stage === "declaration" && <form className="immigration-form" onSubmit={beginAssessment}>
      <header>
        <span>Declaration of Intent</span>
        <h3>Tell the Society how you wish to be known.</h3>
        <p>This is an invitation to speak in your own voice, not a test of ideology. The application remains in this tab only.</p>
      </header>
      <div className="immigration-form-grid">
        <label><span>Civic name for the certificate <em>required</em></span><input required minLength={2} value={civicName} onChange={(event) => setCivicName(event.target.value)} autoComplete="name" /></label>
        <label>
          <span>Contact address <em>optional · session only</em></span>
          <input
            type="text"
            inputMode="email"
            spellCheck={false}
            value={contact}
            onChange={(event) => { setContact(event.target.value); setContactError(""); }}
            autoComplete="email"
            aria-invalid={contactError ? "true" : undefined}
            aria-describedby={contactError ? "contact-address-error" : undefined}
          />
          {contactError && <small className="immigration-inline-error" id="contact-address-error" role="alert">{contactError}</small>}
        </label>
        <label className="field-wide"><span>Current region or community <em>optional</em></span><input value={region} onChange={(event) => setRegion(event.target.value)} /></label>
        <label className="field-wide"><span>Why are you seeking symbolic membership? <em>required · at least 80 characters</em></span><textarea required minLength={80} rows={5} value={motivation} onChange={(event) => setMotivation(event.target.value)} /></label>
        <label className="field-wide"><span>How might you contribute, learn, create, care, or participate? <em>required · at least 40 characters</em></span><textarea required minLength={40} rows={4} value={contribution} onChange={(event) => setContribution(event.target.value)} /></label>
      </div>
      <fieldset className="immigration-acknowledgements">
        <legend>Before entering the assessment, I understand:</legend>
        {[
          "Membership is voluntary, and the peaceful right of exit remains fundamental.",
          "Consent, contribution, ecological stewardship, learning, and restorative accountability form the civic covenant.",
          "The Society's naturalist cultural traditions will be explained transparently and never remove my right to choose or refuse.",
          "This online pathway grants virtual symbolic recognition only; it is not legal nationality, physical residency, or completion of the constitutional Residency Pathway.",
        ].map((label, index) => <label key={label}><input type="checkbox" checked={acknowledgements[index]} onChange={(event) => updateAcknowledgement(index, event.target.checked)} /><span>{label}</span></label>)}
      </fieldset>
      <div className="immigration-declaration-actions">
        <button className="immigration-primary-action" type="submit" disabled={!acknowledgements.every(Boolean)}>Begin the 100-question assessment</button>
        <button className="immigration-preview-action" type="button" onClick={previewCertificate}>Preview certificate design</button>
      </div>
      <small className="immigration-preview-note">Local design preview only—no assessment result, citizenship standing, certificate number, or ledger record is issued.</small>
    </form>}

    {stage === "assessment" && <div className="immigration-assessment">
      <header id="assessment-heading">
        <div><span>Civic Comprehension Assessment</span><h3>Questions {assessmentPage * PAGE_SIZE + 1}–{Math.min((assessmentPage + 1) * PAGE_SIZE, immigrationQuestions.length)}</h3></div>
        <div className="assessment-progress" aria-label={`${answeredCount} of 100 questions answered`}><b>{answeredCount}</b><span>of 100 answered</span><i><span style={{ width: `${answeredCount}%` }} /></i></div>
      </header>
      <p className="assessment-note">Passing requires {ASSESSMENT_PASSING_SCORE} correct answers. The portal shows a local result first; the civic server independently verifies all 100 answers before issuing a record.</p>
      <div className="assessment-question-list">
        {visibleQuestions.map((question) => <fieldset className="assessment-question" key={question.id}>
          <legend><b>{String(question.id).padStart(3, "0")}</b><span>{question.prompt}</span><small>{question.domain}</small></legend>
          <div>{question.options.map((option, optionIndex) => <label className={answers[question.id - 1] === optionIndex ? "is-selected" : ""} key={option}>
            <input type="radio" name={`question-${question.id}`} checked={answers[question.id - 1] === optionIndex} onChange={() => answerQuestion(question.id, optionIndex)} />
            <span>{option}</span>
          </label>)}</div>
        </fieldset>)}
      </div>
      {assessmentError && <p className="immigration-error" role="alert">{assessmentError}</p>}
      <div className="assessment-navigation">
        <button type="button" onClick={() => changeAssessmentPage(-1)} disabled={assessmentPage === 0}>Previous ten</button>
        <span>Page {assessmentPage + 1} of {totalPages}</span>
        {assessmentPage < totalPages - 1
          ? <button type="button" onClick={() => changeAssessmentPage(1)}>Next ten</button>
          : <button className="immigration-primary-action" type="button" onClick={completeAssessment}>Complete assessment</button>}
      </div>
    </div>}

    {stage === "result" && score !== null && <div className={`immigration-result ${score >= ASSESSMENT_PASSING_SCORE ? "has-passed" : "has-not-passed"}`}>
      <header><span>Assessment result</span><h3>{score} / 100</h3><p>{score >= ASSESSMENT_PASSING_SCORE ? "Civic comprehension standard met." : `The ${ASSESSMENT_PASSING_SCORE}% standard has not yet been met.`}</p></header>
      <div className="domain-results">{domainResults.map((result) => <div key={result.domain}><span>{result.domain}</span><b>{result.correct}/{result.total}</b><i><span style={{ width: `${(result.correct / result.total) * 100}%` }} /></i></div>)}</div>
      {score >= ASSESSMENT_PASSING_SCORE
        ? <button className="immigration-primary-action" type="button" onClick={() => setStage("oath")}>Proceed to the voluntary oath</button>
        : <div className="result-actions"><button type="button" onClick={retakeAssessment}>Retake all 100 questions</button><Link href="/corpus/immigration-codex">Review the Immigration Codex</Link></div>}
    </div>}

    {stage === "oath" && <form className="immigration-oath" onSubmit={issueCertificate}>
      <header><span>The Virtual Civic Oath</span><h3>A promise entered freely.</h3><p>The oath may be declined. Refusal ends this symbolic process without penalty.</p></header>
      <blockquote>{oathText}</blockquote>
      <p className="oath-clarification">This oath creates no legal nationality or physical residency. It records a voluntary symbolic relationship with the online Utopian Society Corpus.</p>
      <label className="oath-consent"><input type="checkbox" checked={oathAccepted} onChange={(event) => setOathAccepted(event.target.checked)} /><span>I have read this oath, understand its symbolic scope, and enter it voluntarily.</span></label>
      <label className="oath-signature"><span>Type your civic name exactly to sign</span><input value={signature} onChange={(event) => setSignature(event.target.value)} autoComplete="off" /></label>
      {issuanceError && <p className="immigration-error oath-issuance-error" role="alert">{issuanceError}</p>}
      <button className="immigration-primary-action" type="submit" disabled={issuing || !oathAccepted || signature.trim().toLocaleLowerCase() !== civicName.trim().toLocaleLowerCase()}>{issuing ? "Reserving the civic record…" : "Issue symbolic-naturalization certificate"}</button>
    </form>}

    {stage === "certificate" && certificate && <div className="immigration-completion">
      <div className={`immigration-certificate${certificate.preview ? " is-preview" : ""}`} aria-label={`${certificate.preview ? "Design preview of the certificate" : "Certificate of Virtual Symbolic Naturalization"} for ${certificate.civicName}`}>
        <div className="certificate-knot" aria-hidden="true"><i /><i /><i /><i /></div>
        {certificate.preview && <span className="certificate-preview-ribbon">Design preview · Not issued</span>}
        <span className="certificate-eyebrow">The Utopian Society Corpus</span>
        <h3>Certificate of Virtual<br />Symbolic Naturalization</h3>
        <p className="certificate-preamble">Let the living record acknowledge that</p>
        <strong>{certificate.civicName}</strong>
        <p>{certificate.preview ? "is shown here solely to preview the appearance and print treatment of the symbolic-naturalization certificate." : "has demonstrated civic comprehension, entered the virtual oath freely, and is welcomed as a symbolic citizen of the online Utopian Society Corpus."}</p>
        <div className="certificate-seal"><span className="certificate-seal-mark" role="img" aria-label="Five interlocking rings of the Utopian Society" /></div>
        <dl>
          <div><dt>Utopian date</dt><dd>{certificate.utopianDate}</dd></div>
          <div><dt>Gregorian reference</dt><dd>{certificate.gregorianDate}</dd></div>
          <div><dt>Assessment</dt><dd>{certificate.preview ? "Design preview" : `${certificate.score}% · Standard met`}</dd></div>
          <div><dt>Certificate</dt><dd>{certificate.serial}</dd></div>
        </dl>
        <small>{certificate.preview ? "Unissued design preview only. It records no civic standing and is not valid as symbolic recognition." : "Symbolic recognition only. This certificate is not legal nationality, government identification, a visa, physical residency, or full constitutional citizenship under the Immigration Codex."}</small>
      </div>
      <div className="certificate-actions">
        <button className="immigration-primary-action" type="button" onClick={() => window.print()}>{certificate.preview ? "Print the design preview" : "Print or save the certificate"}</button>
        {certificate.preview && <button className="immigration-preview-action" type="button" onClick={() => setStage("declaration")}>Return to the application</button>}
        <Link href="/corpus/immigration-codex">Read the governing Codex</Link>
      </div>
      {!certificate.preview && <div className="ledger-preview">
        <header><span>Public Transparency Ledger · Recorded</span><h3>Civic standing now belongs to the living record.</h3></header>
        <div>
          <span>{certificate.serial}</span>
          <strong>{certificate.civicName}</strong>
          <span>{certificate.gregorianDate}</span>
          <b>Virtual symbolic citizen</b>
          <i>{certificate.score}% · Comprehension standard met</i>
        </div>
        <p>The server reserved this unique certificate number and atomically entered the recognition in the citizen register and immutable Transparency Ledger. Contact information, personal statements, and individual answers were not retained. <Link href="/transparency-ledger">Open the public civic record.</Link></p>
      </div>}
    </div>}
  </section>;
}
