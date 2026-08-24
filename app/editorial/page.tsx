import type { Metadata } from "next";
import Link from "next/link";
import { EditorialStudio } from "../components/EditorialStudio";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Editorial Studio · The Utopian Society",
  description: "Private tools for drafts, ticker sources, archives, and analytics.",
};

export default function EditorialStudioPage() {
  return <main className="editorial-studio-page">
    <SiteHeader />
    <nav className="editorial-breadcrumb" aria-label="Breadcrumb"><Link href="/">Society</Link><span>/</span><Link href="/blogs-essays">Blogs & Essays</Link><span>/</span><strong>Editorial Studio</strong></nav>
    <EditorialStudio />
    <footer className="site-footer"><span>The Utopian Society</span><p>Private editorial tools.</p><Link href="/blogs-essays">Return to Blogs & Essays ↑</Link></footer>
  </main>;
}
