import Link from "next/link";
import { CivicTicker } from "./CivicTicker";

export function SiteHeader({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className={`site-header ${minimal ? "header-minimal" : ""}`}>
      <Link href="/" className="wordmark"><span className="wordmark-mark" role="img" aria-label="Five interlocking rings" /><strong>The Utopian Society Corpus</strong></Link>
      {!minimal && <nav aria-label="Corpus sections">
        <Link href="/utopian-society">Society</Link>
        <Link href="/charters-codices">Charters & Codices</Link>
        <Link href="/blogs-essays">Blogs & Essays</Link>
        <Link href="/lore">Lore</Link>
      </nav>}
      {minimal ? <CivicTicker /> : <span className="site-beta"><i /> Public beta</span>}
    </header>
  );
}
