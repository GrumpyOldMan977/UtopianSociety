import type { Metadata } from "next";
import Link from "next/link";
import { PublicCivicProfile } from "../../components/PublicCivicProfile";
import { SiteHeader } from "../../components/SiteHeader";
import { CIVIC_LEDGER_API, type PublicCivicProfile as PublicCivicProfileRecord } from "../../lib/civic-ledger";

type PublicProfilePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const response = await fetch(`${CIVIC_LEDGER_API}/v3/public/citizens/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Profile unavailable");
    const profile = await response.json() as PublicCivicProfileRecord;
    return {
      title: `${profile.civicName} · Public Civic Profile`,
      description: profile.publicBio || `The public civic profile of ${profile.civicName}.`,
    };
  } catch {
    return { title: "Public Civic Profile" };
  }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { slug } = await params;
  return <main className="citizen-portal-page public-civic-profile">
    <SiteHeader />
    <nav className="citizen-portal-breadcrumb" aria-label="Breadcrumb">
      <Link href="/">The Utopian Society</Link><span>/</span>
      <Link href="/citizens">Citizens</Link><span>/</span><b>Public Profile</b>
    </nav>
    <PublicCivicProfile slug={slug} />
  </main>;
}
