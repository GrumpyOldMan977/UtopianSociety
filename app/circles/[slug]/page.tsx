import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CivicActionStudio } from "../../components/CivicActionStudio";
import { CivicPortalFeature } from "../../components/CivicPortalFeature";
import { CorpusKnotNavigator } from "../../components/CorpusKnotNavigator";
import { HealingWholePerson } from "../../components/HealingWholePerson";
import { LearningCivicStudio } from "../../components/LearningCivicStudio";
import { LearningKnowledgeTree } from "../../components/LearningKnowledgeTree";
import { SiteHeader } from "../../components/SiteHeader";
import { TimeObservanceCalendar } from "../../components/TimeObservanceCalendar";
import { getCivicProfile, tenQs } from "../../lib/circle-civic";
import { civicBodies, getCivicBody, NavigatorViewId } from "../../lib/circle-navigation";

export const generateStaticParams = () => civicBodies.filter(({ slug }) => slug !== "immigration").map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const circle = getCivicBody(slug);
  if (!circle) return {};
  return { title: circle.title, description: getCivicProfile(slug)?.invitation ?? circle.summary };
}

const serviceState = {
  available: "Available here",
  prototype: "Non-persistent preview",
  planned: "Civic service planned",
} as const;

const tierLabel = {
  foundational: "Foundational Circle · Civic front door",
  operational: "Operational Circle · Civic front door",
  "constitutional-instrument": "Shared constitutional instrument",
} as const;

export default async function CirclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const circle = getCivicBody(slug);
  const civic = getCivicProfile(slug);
  if (!circle || !civic) notFound();

  const isLearning = slug === "learning";
  const isHealing = slug === "healing";
  const isTime = slug === "time-observance";
  const mapView = circle.tier === "foundational" ? `family-${circle.slug}` as NavigatorViewId : "operational";
  const returnHref = circle.tier === "foundational" ? "/?map=foundational" : "/?map=operational";
  const returnLabel = circle.tier === "foundational" ? "Foundational Circles" : "operational map";

  return <main className={`circle-civic-page circle-civic-${slug}`}>
    <SiteHeader />

    <section className="civic-hero" aria-labelledby="civic-title">
      <div className="civic-hero-visual" aria-hidden="true">
        <i className="civic-hero-dome" />
        <i className="civic-hero-orbit civic-hero-orbit-one" />
        <i className="civic-hero-orbit civic-hero-orbit-two" />
        <i className="civic-hero-light" />
      </div>
      <div className="civic-hero-copy">
        <span className="eyebrow">{tierLabel[circle.tier]}</span>
        <h1 id="civic-title">{circle.title}</h1>
        <p>{civic.invitation}</p>
        <blockquote>{civic.principle}</blockquote>
        <div className="civic-hero-actions">
          <a href="#civic-services">What can I do here?</a>
          <a href="#corpus-authority">Read its authority</a>
        </div>
      </div>
      <Link href={returnHref} className="civic-return">← Return to the {returnLabel}</Link>
    </section>

    <section className="civic-welcome" aria-labelledby="civic-welcome-title">
      <div><span className="eyebrow">In ordinary language</span><h2 id="civic-welcome-title">{civic.civicName}</h2></div>
      <p>{civic.plainLanguage}</p>
    </section>

    <section className="civic-services" id="civic-services" aria-labelledby="civic-services-title">
      <div className="civic-section-heading">
        <span className="eyebrow">Citizen services</span>
        <h2 id="civic-services-title">Begin with an action, not a legal document.</h2>
        <p>Working links are identified plainly. Planned services remain visible as part of the portal design, but they do not collect or retain real information.</p>
      </div>
      <div className="civic-service-grid">
        {civic.services.map((service, index) => <Link className={`civic-service-card service-${service.state}`} href={service.href} key={service.title}>
          <span>0{index + 1}</span><small>{serviceState[service.state]}</small><h3>{service.title}</h3><p>{service.description}</p><i>{service.label} →</i>
        </Link>)}
      </div>
    </section>

    {isLearning && <>
      <section className="ten-q-section" id="ten-qs" aria-labelledby="ten-q-title">
        <div className="civic-section-heading civic-section-heading-light">
          <span className="eyebrow">The spectrum of intelligence</span><h2 id="ten-q-title">Ten mirrors reflecting one mind.</h2>
          <p>The Ten Qs are not a ranking and do not determine human worth. They help a citizen and mentor notice strengths, imbalances, interests, and possibilities for growth.</p>
        </div>
        <div className="ten-q-grid">{tenQs.map(([short, title, description]) => <article key={short}><span>{short}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>
      <section className="knowledge-tree" aria-labelledby="knowledge-tree-title">
        <div className="knowledge-tree-heading">
          <span className="eyebrow">Utopian Society University</span><h2 id="knowledge-tree-title">A university distributed through civic life.</h2>
          <p>The Utopian Society University (USU) is organized as a Tree of Knowledge. Its campus is not confined to one building; gardens, workshops, laboratories, studios, archives, and contribution sites all become places of study.</p>
        </div>
        <LearningKnowledgeTree />
      </section>
      <LearningCivicStudio />
    </>}

    {isHealing && <>
      <HealingWholePerson />
      <section className="healing-covenant" id="consent-governs-care" aria-labelledby="healing-covenant-title">
        <div><span className="eyebrow">The care covenant</span><h2 id="healing-covenant-title">Consent governs care.</h2></div>
        <ul>
          <li><b>Ask</b><span>Care begins with the person’s stated needs, not an institution’s presumption.</span></li>
          <li><b>Explain</b><span>Options, limits, risks, privacy, and alternatives must be understandable.</span></li>
          <li><b>Choose</b><span>Consent is informed, specific, revocable, and never purchased through deprivation.</span></li>
          <li><b>Review</b><span>Every pathway remains open to refusal, a second view, accessibility support, and ethical review.</span></li>
        </ul>
      </section>
    </>}

    {isTime && <TimeObservanceCalendar />}
    {!isLearning && !isHealing && !isTime && <CivicPortalFeature slug={slug} />}
    {!isLearning && <CivicActionStudio slug={slug} />}

    <section className="civic-daily-life" aria-labelledby="daily-life-title">
      <div className="civic-scene"><span className="eyebrow">Seen from within</span><p>{civic.scene}</p><small>Experiential direction drawn from the Society&apos;s narrative world; procedural authority remains with the Corpus.</small></div>
      <div className="civic-daily-list"><span className="eyebrow">In daily life</span><h2 id="daily-life-title">What this body makes possible.</h2><ol>{civic.dailyLife.map((item, index) => <li key={item}><b>{String(index + 1).padStart(2, "0")}</b><span>{item}</span></li>)}</ol></div>
    </section>

    <section className="civic-relationships" aria-labelledby="relationships-title">
      <div className="civic-section-heading"><span className="eyebrow">No Circle stands alone</span><h2 id="relationships-title">The work becomes legitimate through relationship.</h2></div>
      <div className="relationship-grid">{civic.relationships.map((relationship) => <article key={relationship.circle}><span>{relationship.circle}</span><p>{relationship.purpose}</p></article>)}</div>
    </section>

    <section className="civic-authority" id="corpus-authority" aria-labelledby="civic-authority-title">
      <div className="civic-authority-copy">
        <span className="eyebrow">Corpus authority</span><h2 id="civic-authority-title">Plain language opens the door. The documents remain the foundation.</h2><p>{circle.boundary}</p>
        {circle.independentDomain && <p><b>Independent domain:</b> {circle.independentDomain}</p>}
        {circle.authorityLimits && <p><b>Authority limits:</b> {circle.authorityLimits}</p>}
        <div className="civic-authority-links">{circle.sourceLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}<i>→</i></Link>)}</div>
      </div>
      <div className="civic-mandate-card" id="mandate"><span>{circle.status}</span><h3>What this body holds</h3><ul>{circle.mandate.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </section>

    <section className="circle-map-section" aria-labelledby="circle-map-title">
      <div className="circle-map-intro"><span className="eyebrow">The civic map remains present</span><h2 id="circle-map-title">Move through the weave.</h2><p>Foundational bodies keep a family map. Operational bodies return to their bounded civic tier.</p></div>
      <CorpusKnotNavigator initialView={mapView} compact />
    </section>

    <footer className="site-footer"><span>The Utopian Society Corpus</span><p>A living framework for ethical, civic, and human continuity.</p><Link href="/">Enter through the frontispiece ↑</Link></footer>
  </main>;
}
