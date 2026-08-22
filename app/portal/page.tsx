import type { Metadata } from "next";
import Link from "next/link";
import { CitizenPortal } from "../components/CitizenPortal";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "My Civic Profile · Local v3",
  description: "A private local view of one citizen's life throughout the Utopian Society.",
};

export default function CitizenPortalPage() {
  return <main className="citizen-portal-page">
    <SiteHeader />
    <nav className="citizen-portal-breadcrumb" aria-label="Breadcrumb">
      <Link href="/">The Utopian Society</Link><span>/</span>
      <Link href="/?map=civic-portal">Civic Portal</Link><span>/</span>
      <Link href="/login">Login</Link><span>/</span><b>My Civic Profile</b>
    </nav>
    <CitizenPortal />
    <footer className="site-footer">
      <span>The Utopian Society</span>
      <p>Local v3 development · isolated from the frozen public beta.</p>
      <Link href="/">Return to the frontispiece ↑</Link>
    </footer>
  </main>;
}
