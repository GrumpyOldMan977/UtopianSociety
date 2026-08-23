import type { Metadata } from "next";
import Link from "next/link";
import { PublicCitizenDirectory } from "../components/PublicCitizenDirectory";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Citizen Directory",
  description: "Public civic profiles shared by citizens of the Utopian Society.",
};

export default function CitizenDirectoryPage() {
  return <main className="citizen-directory-page">
    <SiteHeader />
    <section className="citizen-directory-hero">
      <span className="eyebrow">The Citizen Directory</span>
      <h1>Civic lives, shared by choice.</h1>
      <p>Meet citizens who have chosen to make their civic profile broadly public. Recognition is visible; authentication, certificate identifiers, and private records remain protected.</p>
      <nav aria-label="Citizen directory destinations">
        <Link href="/transparency-ledger#citizen-register">Open the Citizen Register</Link>
        <Link href="/login">Open My Civic Profile</Link>
      </nav>
    </section>
    <PublicCitizenDirectory />
  </main>;
}
