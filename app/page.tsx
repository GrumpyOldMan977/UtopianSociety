import { CorpusKnotNavigator } from "./components/CorpusKnotNavigator";
import { SiteHeader } from "./components/SiteHeader";

export default function Home() {
  return (
    <main>
      <SiteHeader minimal />
      <section className="frontispiece living-frontispiece" aria-labelledby="frontispiece-title">
        <h1 id="frontispiece-title">The Utopian Society Corpus</h1>
        <p className="inscription">A living framework for ethical, civic, and human continuity.</p>
        <CorpusKnotNavigator />
      </section>
    </main>
  );
}
