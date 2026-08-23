"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getPublicCitizenDirectory,
  type PublicCitizenDirectoryEntry,
} from "../lib/civic-ledger";

function CitizenDirectoryEntry({ citizen }: { citizen: PublicCitizenDirectoryEntry }) {
  const position = citizen.civicTitle && citizen.civicTitle !== "Citizen"
    ? citizen.civicTitle
    : null;

  return <article className="citizen-directory-card">
    <div className="citizen-directory-identity">
      <h2><Link href={`/citizens/${citizen.slug}`}>{citizen.civicName}</Link></h2>
      {position && <p className="citizen-directory-position">{position}</p>}
    </div>
    <Link
      className="citizen-directory-open"
      href={`/citizens/${citizen.slug}`}
      aria-label={`Open ${citizen.civicName}'s public profile`}
    >View profile</Link>
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
    <div>{citizens.map((citizen) => <CitizenDirectoryEntry citizen={citizen} key={citizen.slug} />)}</div>
  </section>;
}
