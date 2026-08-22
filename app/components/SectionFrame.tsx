import Link from "next/link";
import { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";

export function SectionFrame({ eyebrow, title, subtitle, position, children }: { eyebrow: string; title: string; subtitle: string; position: string; children: ReactNode }) {
  return <main className={`section-page section-${position}`}>
    <SiteHeader />
    <section className="section-hero">
      <div className="section-orbit" aria-hidden="true"><i /><i /><i /></div>
      <div className="section-celtic-corners" aria-hidden="true"><i /><i /><i /><i /></div>
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>
      <Link href="/" className="return-knot">← Return to the frontispiece</Link>
    </section>
    {children}
    <footer className="site-footer"><span>The Utopian Society</span><p>A living framework for ethical, civic, and human continuity.</p><Link href="/">Enter through the frontispiece ↑</Link></footer>
  </main>;
}
