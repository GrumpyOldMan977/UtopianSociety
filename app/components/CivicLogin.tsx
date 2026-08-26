"use client";

import { FormEvent, useEffect, useState } from "react";
import { CivicServiceError, loginCivicAccount } from "../lib/civic-ledger";

const ACTIVATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;

export function CivicLogin() {
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [activationToken, setActivationToken] = useState("");
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
    const pendingActivationToken = sessionStorage.getItem("utopia.pendingActivationToken");
    if (pendingActivationToken) {
      setActivationToken(pendingActivationToken);
      setFirstAccess(true);
      sessionStorage.removeItem("utopia.pendingActivationToken");
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
        activationToken: firstAccess ? activationToken.trim() : undefined,
      });
      sessionStorage.setItem("utopia.civicSession", result.sessionToken);
      sessionStorage.setItem("utopia.civicId", result.civicId);
      sessionStorage.setItem("utopia.civicName", result.civicName);
      window.location.assign("/portal");
    } catch (cause) {
      if (cause instanceof CivicServiceError && cause.code === "activation_token_required") {
        setFirstAccess(true);
      }
      setError(cause instanceof Error ? cause.message : "The civic login could not be completed.");
      setBusy(false);
    }
  }

  const activationTokenValid = ACTIVATION_TOKEN_PATTERN.test(activationToken.trim());
  const passwordReady = password.length >= PASSWORD_MIN_LENGTH;
  const passwordReadiness = !password.length
    ? `Enter at least ${PASSWORD_MIN_LENGTH} characters.`
    : passwordReady
      ? "Password length requirement met. This does not verify that the password is correct."
      : `${password.length} of ${PASSWORD_MIN_LENGTH} characters entered.`;
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
      <input id="civic-login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={firstAccess ? "new-password" : "current-password"} minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} aria-describedby="civic-password-requirement" required />
      <small id="civic-password-requirement" className={`civic-password-readiness ${passwordReady ? "is-ready" : "is-short"}`} aria-live="polite">{passwordReadiness}</small>
      <label className="civic-activation-choice"><input type="checkbox" checked={firstAccess} onChange={(event) => setFirstAccess(event.target.checked)} /><span>First sign-in</span></label>
      {firstAccess && <>
        <label htmlFor="civic-activation-token">One-time activation code</label>
        <input
          id="civic-activation-token"
          value={activationToken}
          onChange={(event) => setActivationToken(event.target.value.trim())}
          placeholder="Private code issued with your civic login"
          autoComplete="off"
          inputMode="text"
          pattern="[A-Za-z0-9_-]{32,128}"
          minLength={32}
          maxLength={128}
          aria-describedby="civic-activation-help"
          required
        />
        <small id="civic-activation-help">Use the private one-time code issued with your civic login name. A certificate number never activates, restores, or recovers an account.</small>
      </>}
      {error && <p className="portal-message is-error" role="alert">{error}</p>}
      <button className={passwordReady ? "is-password-ready" : "is-password-short"} type="submit" disabled={busy || !loginName.trim() || !passwordReady || (firstAccess && !activationTokenValid)}>{busy ? "Verifying…" : firstAccess ? "Activate My Civic Profile" : "Open My Civic Profile"}</button>
      <small>First activation requires the private one-time code delivered at naturalization. Afterward, use only your civic login name and password. Public certificate identifiers are never accepted as authentication.</small>
    </form>
  </section>;
}
