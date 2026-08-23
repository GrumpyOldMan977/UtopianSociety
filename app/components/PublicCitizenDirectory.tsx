"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getPublicCitizenDirectory,
  publicProfileAvatarUrl,
  type PublicCitizenDirectoryEntry,
} from "../lib/civic-ledger";

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(civicName: string) {
  return civicName.split(/\s+/).map((part) => part[0]).slice(0, 3).join("");
}

function CitizenDirectoryCard({ citizen }: { citizen: PublicCitizenDirectoryEntry }) {
  const [avatarAvailable, setAvatarAvailable] = useState(citizen.hasAvatar);
  return <article className="citizen-directory-card">
    <Link className={`citizen-directory-portrait${avatarAvailable ? " has-image" : ""}`} href={`/citizens/${citizen.slug}`} aria-label={`Open ${citizen.civicName}'s public profile`}>
      {avatarAvailable
        ? <img src={publicProfileAvatarUrl(citizen.slug)} alt="" onError={() => setAvatarAvailable(false)} />
        : <span aria-hidden="true">{initials(citizen.civicName)}</span>}
    </Link>
    <div>
      <span>{citizen.civicTitle || "Citizen"}</span>
      <h2><Link href={`/citizens/${citizen.slug}`}>{citizen.civicName}</Link></h2>
      <p>{citizen.publicBio || "This citizen has chosen a public profile and has not yet written a public biography."}</p>
      <dl>
        <div><dt>Standing</dt><dd>{titleCase(citizen.civicStanding)}</dd></div>
        <div><dt>Contribution</dt><dd>{citizen.primaryContribution}</dd></div>
      </dl>
      <Link className="citizen-directory-open" href={`/citizens/${citizen.slug}`}>Open public profile</Link>
    </div>
  </article>;
}

export function PublicCitizenDirectory() {
  const [citizens, setCitizens] = useState<PublicCitizenDirectoryEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicCitizenDirectory()
      .then((result) => {
        if (active) setCitizens(result.citizens);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, []);

  if (error) return <section className="citizen-directory-state" role="status">
    <span className="eyebrow">Public civic identities</span>
    <h2>The directory is temporarily unavailable.</h2>
    <p>No profile visibility has changed. The public civic record may be consulted again shortly.</p>
  </section>;

  if (!citizens) return <section className="citizen-directory-state" role="status" aria-live="polite">
    <span className="eyebrow">Public civic identities</span>
    <h2>Reading citizen-authorized profiles…</h2>
  </section>;

  if (!citizens.length) return <section className="citizen-directory-state" role="status">
    <span className="eyebrow">Public civic identities</span>
    <h2>No citizens have chosen directory visibility yet.</h2>
    <p>Certified standing may remain in the Citizen Register while profile presentation stays private.</p>
  </section>;

  return <section className="citizen-directory-list" aria-labelledby="citizen-directory-list-title">
    <header>
      <span className="eyebrow">Citizen-authorized public profiles</span>
      <h2 id="citizen-directory-list-title">{citizens.length === 1 ? "One public civic profile" : `${citizens.length} public civic profiles`}</h2>
      <p>Every profile here is included because its citizen selected broad public visibility. Certificate identifiers and private Civic Profile records are never part of this directory.</p>
    </header>
    <div>{citizens.map((citizen) => <CitizenDirectoryCard citizen={citizen} key={citizen.slug} />)}</div>
  </section>;
}
