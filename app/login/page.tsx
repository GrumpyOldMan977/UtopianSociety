import type { Metadata } from "next";
import Link from "next/link";
import { CivicLogin } from "../components/CivicLogin";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Civic Login",
  description: "Enter a private Utopian Society Civic Profile.",
};

export default function CivicLoginPage() {
  return <main className="citizen-portal-page civic-login-page">
    <SiteHeader />
    <nav className="citizen-portal-breadcrumb" aria-label="Breadcrumb">
      <Link href="/">The Utopian Society</Link><span>/</span>
      <Link href="/?map=civic-portal">Civic Portal</Link><span>/</span><b>Login</b>
    </nav>
    <CivicLogin />
    <section className="civic-login-pathway">
      <span className="eyebrow">Not yet a citizen?</span>
      <h2>Begin as a Hopeful.</h2>
      <p>Learn the covenant, complete the randomized civic assessment, enter the oath voluntarily, and receive a symbolic-naturalization certificate.</p>
      <Link href="/circles/immigration">Enter Immigration →</Link>
    </section>
  </main>;
}
