import Link from "next/link";
import { CivicTicker } from "./CivicTicker";
import { EditorialNavLink } from "./EditorialNavLink";

export function SiteHeader({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className={`site-header ${minimal ? "header-minimal" : ""}`}>
      <div className="site-header-primary">
        <Link href="/" className="wordmark"><span className="wordmark-mark" role="img" aria-label="Five interlocking rings" /><strong>The Utopian Society</strong></Link>
        <CivicTicker />
      </div>
      <nav aria-label="Society sections">
        <Link href="/utopian-society">Society</Link>
        <Link href="/?map=civic-portal">Civic Portal</Link>
        <Link href="/citizens">Citizens</Link>
        <Link href="/login">Login</Link>
        <Link href="/blogs-essays">Blogs & Essays</Link>
        <EditorialNavLink />
        <Link href="/lore">Lore</Link>
      </nav>
    </header>
  );
}
