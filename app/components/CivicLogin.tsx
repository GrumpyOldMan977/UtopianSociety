"use client";

import { FormEvent, useEffect, useState } from "react";
import { CivicServiceError, loginCivicAccount } from "../lib/civic-ledger";

const CERTIFICATE_PATTERN = /^USV-\d{4}-[A-F0-9]{12}$/;

function formatCertificateNumber(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 19);
  const prefix = compact.slice(0, 3);
  const year = compact.slice(3, 7);
  const serial = compact.slice(7, 19);
  return [prefix, year, serial].filter(Boolean).join("-");
}

export function CivicLogin() {
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [firstAccess, setFirstAccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const pendingLoginName = sessionStorage.getItem("utopia.pendingLoginName");
    if (pendingLoginName) {
      setLoginName(pendingLoginName);
      setFirstAccess(true);
      sessionStorage.removeItem("utopia.pendingLoginName");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await loginCivicAccount({
        loginName: loginName.trim(),
        password,
        certificateNumber: firstAccess ? certificateNumber : undefined,
      });
      sessionStorage.setItem("utopia.civicSession", result.sessionToken);
      sessionStorage.setItem("utopia.civicId", result.civicId);
      sessionStorage.setItem("utopia.civicName", result.civicName);
      window.location.assign("/portal");
    } catch (cause) {
      if (cause instanceof CivicServiceError && cause.code === "credential_upgrade_required") {
        setFirstAccess(true);
      }
      setError(cause instanceof Error ? cause.message : "The civic login could not be completed.");
      setBusy(false);
    }
  }

  const certificateValid = CERTIFICATE_PATTERN.test(certificateNumber);
  return <section className="civic-login-panel" aria-labelledby="civic-login-title">
    <div className="civic-login-intro">
      <span className="eyebrow">Private civic access</span>
      <h1 id="civic-login-title">Your life in the Society begins here.</h1>
      <p>A Civic Profile gathers only the records belonging to the signed-in citizen: standing, learning, contribution, Common Credit, residence, care pathways, requests, and private Harmony matters.</p>
    </div>
    <form onSubmit={submit}>
      <span className="eyebrow">Private civic access</span>
      <label htmlFor="civic-login-name">Civic login name</label>
      <input id="civic-login-name" value={loginName} onChange={(event) => setLoginName(event.target.value)} autoComplete="username" required />
      <label htmlFor="civic-login-password">Password</label>
      <input id="civic-login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={firstAccess ? "new-password" : "current-password"} minLength={10} maxLength={128} required />
      <label className="civic-activation-choice"><input type="checkbox" checked={firstAccess} onChange={(event) => setFirstAccess(event.target.checked)} /><span>First sign-in or credential upgrade</span></label>
      {firstAccess && <>
        <label htmlFor="civic-certificate-number">Immigration certificate number</label>
        <input
          id="civic-certificate-number"
          value={certificateNumber}
          onChange={(event) => setCertificateNumber(formatCertificateNumber(event.target.value))}
          placeholder="USV-2026-000000000000"
          autoComplete="off"
          inputMode="text"
          pattern="USV-\d{4}-[A-Fa-f0-9]{12}"
          minLength={21}
          maxLength={21}
          aria-describedby="civic-certificate-help"
          required
        />
        <small id="civic-certificate-help">Enter the complete 21-character certificate number: USV, the four-digit reference year, and 12 hexadecimal characters. It activates or upgrades the account once; the original password is never stored.</small>
      </>}
      {error && <p className="portal-message is-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy || !loginName.trim() || password.length < 10 || (firstAccess && !certificateValid)}>{busy ? "Verifying…" : firstAccess ? "Activate or Upgrade My Civic Profile" : "Open My Civic Profile"}</button>
      <small>First activation and one-time credential upgrades also require the Immigration certificate number. Afterward, use only your civic login name and password. Your private records are available only through your authenticated civic session.</small>
    </form>
  </section>;
}
