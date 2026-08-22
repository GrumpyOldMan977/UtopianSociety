"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPublicCivicProfile,
  PublicCivicProfile as PublicCivicProfileRecord,
  publicProfileAvatarUrl,
} from "../lib/civic-ledger";

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function visibilityLabel(value: string) {
  if (value === "public") return "Public";
  if (value === "civic") return "Public civic profile";
  return "Private";
}

export function PublicCivicProfile({
  slug,
}: {
  slug: string;
}) {
  const [profile, setProfile] = useState<PublicCivicProfileRecord | null>(null);
  const [avatarAvailable, setAvatarAvailable] = useState(false);
  const [status, setStatus] = useState("Opening the current public civic record.");

  useEffect(() => {
    let active = true;
    getPublicCivicProfile(slug)
      .then((record) => {
        if (!active) return;
        setProfile(record);
        setAvatarAvailable(record.hasAvatar);
        setStatus("");
      })
      .catch(() => {
        if (active) setStatus("This public civic profile is not available.");
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (!profile) {
    return <section className="public-profile-unavailable" role="status">
      <span className="eyebrow">Public civic profile</span>
      <h1>{status}</h1>
      <p>The citizen may have chosen privacy, or the civic record may be temporarily unavailable.</p>
      <Link href="/?map=civic-portal">Return to the Civic Portal</Link>
    </section>;
  }

  const initials = profile.civicName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 3)
    .join("");

  return <>
    <section className="public-profile-hero">
      <div className={`public-profile-mark${avatarAvailable ? " has-image" : ""}`}>
        {avatarAvailable
          ? <img
            src={publicProfileAvatarUrl(slug)}
            alt={`${profile.civicName}'s public profile portrait`}
            onError={() => setAvatarAvailable(false)}
          />
          : <span aria-label={`${profile.civicName}'s initials`}>{initials}</span>}
      </div>
      <div>
        <span className="eyebrow">Public civic profile · {profile.civicTitle}</span>
        <h1>{profile.civicName}</h1>
        <p>{profile.civicTitle || "Citizen of the Utopian Society"}</p>
        {status && <small className="public-profile-status" role="status">{status}</small>}
      </div>
    </section>

    <section className="public-profile-facts" aria-label="Public civic information">
      <article><span>Civic standing</span><strong>{titleCase(profile.civicStanding)}</strong></article>
      <article><span>Public role</span><strong>{profile.civicTitle || "Citizen"}</strong></article>
      <article><span>Primary contribution</span><strong>{profile.primaryContribution}</strong></article>
      <article><span>Profile visibility</span><strong>{visibilityLabel(profile.profileVisibility)}</strong></article>
    </section>

    <section className="public-profile-about" aria-labelledby="public-profile-about-title">
      <div>
        <span className="eyebrow">About</span>
        <h2 id="public-profile-about-title">About {profile.civicName.split(/\s+/)[0]}</h2>
      </div>
      <p>{profile.publicBio || "This citizen has not yet written a public biography."}</p>
    </section>

    <section className="public-profile-recognitions" aria-labelledby="public-profile-recognitions-title">
      <header>
        <span className="eyebrow">Circle-issued public record</span>
        <h2 id="public-profile-recognitions-title">Achievements &amp; recognitions</h2>
        <p>Only public recognitions issued through an accountable Circle record appear here. Citizens cannot award these entries to themselves.</p>
      </header>
      {profile.recognitions.length
        ? <ol>
          {profile.recognitions.map((recognition) => <li key={recognition.recognitionId}>
            <span>{titleCase(recognition.circleKey)} · {titleCase(recognition.recognitionType)}</span>
            <h3>{recognition.title}</h3>
            <p>{recognition.summary}</p>
            <small>{recognition.issuedBy}{recognition.utopianDate ? ` · ${recognition.utopianDate}` : ""}</small>
            {recognition.sourceUrl && <a href={recognition.sourceUrl}>Open public record</a>}
          </li>)}
        </ol>
        : <p className="public-profile-empty">No Circle-issued public recognitions have been recorded yet.</p>}
    </section>

    <section className="public-profile-boundary" aria-labelledby="public-profile-boundary-title">
      <header>
        <span className="eyebrow">Public profile controls</span>
        <h2 id="public-profile-boundary-title">What is visible—and what remains private.</h2>
        <p>The citizen chooses whether this page is visible and authors the About text. Civic standing and Circle-issued recognitions come from their accountable records.</p>
      </header>
      <div className="public-profile-privacy-grid">
        <article>
          <h3>Shown publicly</h3>
          <ul>
            <li>Civic name and chosen portrait</li>
            <li>Public role, contribution, and biography</li>
            <li>Public standing and Circle-issued recognitions</li>
          </ul>
        </article>
        <article>
          <h3>Kept in My Civic Profile</h3>
          <ul>
            <li>Legal identity and supporting documents</li>
            <li>Health, Harmony, residence, and account records</li>
            <li>Private requests, Learning evidence, and personal correspondence</li>
          </ul>
        </article>
      </div>
      <nav aria-label="Public profile destinations">
        <Link href="/login">Open My Civic Profile</Link>
        <Link href="/transparency-ledger">Open the public Ledger</Link>
      </nav>
    </section>
  </>;
}
