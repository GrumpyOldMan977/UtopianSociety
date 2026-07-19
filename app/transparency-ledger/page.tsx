import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";
import { TransparencyLedger } from "../components/TransparencyLedger";

export const metadata: Metadata = {
  title: "Transparency Ledger",
  description: "The append-only public record of civic standing, decisions, changes, provenance, and correction.",
};

export default function TransparencyLedgerPage() {
  return <main className="transparency-ledger-page">
    <SiteHeader />
    <header className="ledger-hero">
      <span className="eyebrow">Civic Portal · Public Record</span>
      <h1>Authority must leave a visible trace.</h1>
      <p>The Transparency Ledger holds the Society’s public memory: civic standing, site and corpus changes, decisions, provenance, and corrections—without turning private life into public property.</p>
      <nav aria-label="Ledger page navigation">
        <a href="#citizen-register">Citizen Register</a>
        <a href="#ledger-stream">Change Record</a>
        <Link href="/?map=public-record">Return to the Public Record weave</Link>
      </nav>
    </header>
    <div className="ledger-page-body">
      <TransparencyLedger />
    </div>
    <footer className="site-footer"><span>The Utopian Society Corpus</span><p>A living framework for ethical, civic, and human continuity.</p><Link href="/">Enter through the frontispiece ↑</Link></footer>
  </main>;
}

