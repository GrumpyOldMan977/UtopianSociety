import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/SiteHeader";
import { corpusDocuments, corpusPath, getCorpusDocument, getRingDocuments, type CorpusDocument } from "../../lib/corpus-documents";
import { getConstitutionalDraft } from "../../lib/constitutional-draft-v22";
import { gregorianDateUTC, utopianDate } from "../../lib/utopian-time";

export const dynamic = "force-dynamic";

type WordPressPage = {
  title: { rendered: string };
  content: { rendered: string };
  link: string;
  modified_gmt: string;
};

type ContentsEntry = { id: string; label: string; level: number };

const civicGateways: Record<string, { href: string; label: string }> = {
  "circle-of-learning-charter": { href: "/circles/learning", label: "Enter the Circle of Learning" },
  "article-xii-education-learning": { href: "/circles/learning", label: "Enter the Circle of Learning" },
  "circle-of-healing-charter": { href: "/circles/healing", label: "Enter the Circle of Healing" },
  "article-viii-continuance-medical-ethics": { href: "/circles/healing", label: "Enter the Circle of Healing" },
  "article-ix-end-of-life-legacy": { href: "/circles/healing", label: "Enter the Circle of Healing" },
  "sexual-expression-codex": { href: "/circles/healing/sexual-reproductive-care", label: "Enter Sexual & Reproductive Care" },
  "circle-of-contribution-charter": { href: "/circles/contribution", label: "Enter the Circle of Contribution" },
  "article-xvi-governance-of-sectors-contribution": { href: "/circles/contribution", label: "Enter the Circle of Contribution" },
  "restoration-codex": { href: "/circles/harmony", label: "Enter the Circle of Harmony" },
  "article-v-justice-resolution": { href: "/circles/harmony", label: "Enter the Circle of Harmony" },
  "article-vii-continuance-clause": { href: "/circles/balance", label: "Enter the Circle of Balance" },
  "article-xiii-environmental-stewardship": { href: "/circles/custodianship", label: "Enter the Circle of Custodianship" },
  "article-xix-military-defense": { href: "/circles/defense", label: "Enter the Circle of Defense" },
  "article-xx-prohibition-of-weapons-and-torture": { href: "/circles/defense", label: "Enter the Circle of Defense" },
  "circle-of-affirmation-charter": { href: "/circles/affirmation", label: "Enter the Circle of Affirmation" },
  "immigration-codex": { href: "/circles/immigration", label: "Enter Immigration" },
  "article-ii-membership-citizenship": { href: "/circles/immigration", label: "Enter Immigration" },
  "charter-of-time-and-observance": { href: "/circles/time-observance", label: "Open Time & Observance" },
  "article-x-rituals-continuity": { href: "/circles/time-observance", label: "Open Time & Observance" },
};

const decodeEntities = (value: string) => value
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", "\"")
  .replaceAll("&#039;", "'")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">");

const plainText = (value: string) => decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());

const headingSlug = (value: string) => value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";

const contributionV2CoreEquationsHtml = `
  <section class="equation-suite" aria-label="Core equations and indices, revised realism edition">
    <h2>II. Core Equations and Indices</h2>
    <p class="equation-edition">Revised Realism Edition</p>

    <article class="equation-card">
      <h3>Renewal Function <span>(R)</span></h3>
      <p class="equation-display" aria-label="R equals P times E, divided by T times S">R = (P × E) ÷ (T × S)</p>
      <dl class="equation-variables">
        <div><dt>P</dt><dd>Verified acts of contribution.</dd></div>
        <div><dt>E</dt><dd>Efficiency ratio of output to resource use.</dd></div>
        <div><dt>T</dt><dd>Temporal strain: energy and hours expended.</dd></div>
        <div><dt>S</dt><dd>Societal stress index: collective fatigue.</dd></div>
      </dl>
      <p class="equation-reading">When R ≥ 1, renewal balances exertion. When R &lt; 1, mandatory rest cycles initiate until equilibrium is restored.</p>
    </article>

    <article class="equation-card">
      <h3>Reciprocity Index <span>(R<sub>i</sub>)</span></h3>
      <p class="equation-display" aria-label="R sub i equals C plus H plus L plus E, divided by D">R<sub>i</sub> = (C + H + L + E) ÷ D</p>
      <dl class="equation-variables">
        <div><dt>C</dt><dd>Contribution efficiency.</dd></div>
        <div><dt>H</dt><dd>Health sustainability.</dd></div>
        <div><dt>L</dt><dd>Learning propagation.</dd></div>
        <div><dt>E</dt><dd>Ecological balance.</dd></div>
        <div><dt>D</dt><dd>Deviation from equilibrium.</dd></div>
      </dl>
      <p class="equation-reading">When R<sub>i</sub> ≥ 1, Circles remain harmonized. Below 1, corrective collaboration begins.</p>
    </article>

    <article class="equation-card">
      <h3>Continuity Constant <span>(κ)</span></h3>
      <p class="equation-display" aria-label="kappa equals R times R sub i, divided by the sum of delta t">κ = (R × R<sub>i</sub>) ÷ ΣΔt</p>
      <p class="equation-reading">This constant measures how long moral and operational balance sustains over time, where Δt is one contribution month.</p>
    </article>

    <article class="equation-card">
      <h3>Equilibrium of Inquiry <span>(EqI)</span></h3>
      <p class="equation-display" aria-label="E q I equals I times E, divided by R">EqI = (I × E) ÷ R</p>
      <dl class="equation-variables">
        <div><dt>I</dt><dd>Intensity of inquiry.</dd></div>
        <div><dt>E</dt><dd>Empathy coefficient.</dd></div>
        <div><dt>R</dt><dd>Resolution efficiency.</dd></div>
      </dl>
      <p class="equation-reading">EqI ≥ 1 maintains parity between curiosity and conscience.</p>
    </article>

    <article class="equation-card">
      <h3>Renewal Index <span>(R<sub>i</sub>)</span></h3>
      <p class="equation-display" aria-label="R sub i equals H plus C plus S, divided by L">R<sub>i</sub> = (H + C + S) ÷ L</p>
      <dl class="equation-variables">
        <div><dt>H</dt><dd>Hours of rest.</dd></div>
        <div><dt>C</dt><dd>Cultural participation.</dd></div>
        <div><dt>S</dt><dd>Social cohesion.</dd></div>
        <div><dt>L</dt><dd>Labor days, with a maximum of twelve per twenty-eight-day month.</dd></div>
      </dl>
      <p class="equation-reading">R<sub>i</sub> ≥ 1 sustains balance; R<sub>i</sub> &gt; 1.1 indicates cultural flourishing.</p>
    </article>
  </section>`;

const contributionV2AppendixHtml = `
  <section class="mathematical-appendix" aria-label="Appendix VII, Mathematical Foundations, Revised Realism Edition">
    <header class="appendix-title">
      <span>Appendix VII</span>
      <h1>Mathematical Foundations</h1>
      <p>Revised Realism Edition</p>
    </header>

    <section class="appendix-purpose">
      <h2>Purpose</h2>
      <p>The Mathematical Foundations articulate the quantitative and philosophical structures that sustain balance within the Utopian Society. This edition grounds prior speculative concepts in real-world scientific and ethical practice. Mathematics is treated not as futuristic abstraction but as the shared language through which conscience, ecology, and productivity remain in equilibrium. Every equation within this appendix expresses measurable harmony between contribution, renewal, and human well-being.</p>
    </section>

    <section class="appendix-section">
      <h2>I. Foundational Principles</h2>
      <ul class="appendix-points">
        <li><strong>Unity of Quantitative and Qualitative Values</strong><span>The Society unites measurable output with moral insight. Every function includes variables for emotional well-being, ecological integrity, and civic satisfaction alongside productivity and efficiency.</span></li>
        <li><strong>Transparency of Calculation</strong><span>All civic equations, algorithms, and constants are publicly auditable through the Societal Ledger. Citizens learn not only the results but the reasoning that sustains their governance.</span></li>
        <li><strong>Dynamic Adaptability</strong><span>No formula remains static. The Circle of Contribution reviews mathematical models annually, updating constants as new data, discoveries, and ethical insights emerge.</span></li>
        <li><strong>Temporal Standardization</strong><span>All calculations align with the Utopian calendar of twenty-eight-day contribution months and the annual Bridging Day, linking rhythm of life with rhythm of work.</span></li>
        <li><strong>Moral Equilibrium</strong><span>Precision exists to serve compassion. Efficiency that violates empathy fails validation.</span></li>
        <li><strong>Participatory Comprehension</strong><span>Civic education ensures mathematical literacy for all citizens so that governance remains participatory, not technocratic.</span></li>
      </ul>
    </section>

    ${contributionV2CoreEquationsHtml}

    <section class="appendix-section">
      <h2>III. Temporal and Spatial Modeling</h2>
      <ul class="appendix-points">
        <li><strong>Temporal Scaling</strong><span>Models operate on monthly, seasonal, and decennial intervals, allowing trends in renewal and strain to be forecast across generations.</span></li>
        <li><strong>Spatial Distribution Models</strong><span>Resource allocation uses network optimization and vector equilibrium principles similar to modern supply-chain and ecological modeling.</span></li>
      </ul>
      <article class="equation-card">
        <h3>Energy Flow Equation <span>(Eƒ)</span></h3>
        <p class="equation-display" aria-label="E f equals the sum of L times R sub i, divided by kappa">Eƒ = Σ(L × R<sub>i</sub>) ÷ κ</p>
        <p class="equation-reading">This equation assesses how human energy transforms into renewal value.</p>
      </article>
      <ul class="appendix-points">
        <li><strong>Feedback Loops</strong><span>Predictive simulations detect imbalance before crisis and trigger adjustments in labor, rest, and contribution ratios.</span></li>
        <li><strong>Harmony Transform</strong><span>A data visualization technique that converts emotional and cultural data into harmonic waveforms, used for pattern analysis in civic planning.</span></li>
        <li><strong>Vector of Continuance</strong><span>Tracks intergenerational transfer of skill, resource, and wisdom, ensuring continuity without stagnation.</span></li>
      </ul>
    </section>

    <section class="appendix-section">
      <h2>IV. Ethical Application</h2>
      <ul class="appendix-points">
        <li><strong>Transparency and Oversight</strong><span>All equations undergo peer and public review. Citizens can trace how each variable affects policy.</span></li>
        <li><strong>Educational Integration</strong><span>Schools treat mathematics as ethical meditation, showing that proportionality and fairness are not abstract—they are measurable virtues.</span></li>
        <li><strong>Empirical Verification</strong><span>Equations must correspond to lived outcomes. If results diverge from observation, formulas are revised, not enforced.</span></li>
        <li><strong>Cross-Circle Cooperation</strong><span>Models affecting more than one Circle require co-validation by at least two others.</span></li>
        <li><strong>Ethical Damping</strong><span>Automated systems include moderation coefficients to prevent volatile adjustments that exceed human adaptability.</span></li>
        <li><strong>Mercy Clause</strong><span>When precision conflicts with dignity, data yields to compassion.</span></li>
      </ul>
    </section>

    <section class="appendix-section">
      <h2>V. Integration into the Societal Ledger</h2>
      <ul class="appendix-points">
        <li><strong>Quantitative Transparency</strong><span>The Ledger visualizes civic balance through open dashboards displaying Renewal, Reciprocity, and Continuity metrics.</span></li>
        <li><strong>Predictive Analytics</strong><span>AI-assisted models forecast stress and renewal trends, assisting Circles in preventive planning.</span></li>
        <li><strong>Ethical Algorithm Clause</strong><span>Algorithms remain interpretive aids, never autonomous decision-makers. Human oversight is mandatory.</span></li>
        <li><strong>Continuance Calibration</strong><span>Annual recalibration aligns mathematical models with real data from civic audits.</span></li>
        <li><strong>Public Accessibility</strong><span>Citizens experiment with simplified versions of civic equations through educational interfaces to foster understanding.</span></li>
        <li><strong>Temporal Rebalancing Function</strong><span>Adjusts constants as environmental and social conditions evolve, maintaining systemic coherence.</span></li>
      </ul>
    </section>

    <section class="appendix-section">
      <h2>VI. Future Extensions and Research</h2>
      <ul class="appendix-points">
        <li><strong>Continuance Modeling Frameworks</strong><span>Research explores advanced simulation models for predicting renewal and contribution trends across decades, using cloud-based computation rather than speculative physics.</span></li>
        <li><strong>Multidisciplinary Empathy Models</strong><span>Studies of cognitive and emotional interaction between individuals and communities replace prior interdimensional concepts, grounding inquiry in psychology, sociology, and communication theory.</span></li>
        <li><strong>Ethical Systems Analysis</strong><span>The emerging field once called “moral thermodynamics” is now treated as the study of value transfer, examining how moral energy—compassion, fairness, and trust—is maintained or dissipated through civic systems.</span></li>
        <li><strong>Celestial Harmony Equations</strong><span>The Circle of Seasons correlates astronomical cycles with ecological and psychological rhythms to refine the civic calendar without invoking speculative cosmology.</span></li>
      </ul>
      <article class="equation-card equation-card-constant">
        <h3>Universal Constant of Dignity <span>(Ω<sub>D</sub>)</span></h3>
        <p class="equation-display" aria-label="Omega sub D equals one">Ω<sub>D</sub> = 1</p>
        <p class="equation-reading">A philosophical constant representing absolute parity between individual dignity and collective prosperity.</p>
      </article>
      <ul class="appendix-points">
        <li><strong>Interdisciplinary Continuance Studies</strong><span>Cross-Circle research programs explore resilience and empathy within complex adaptive systems, using existing data science and behavioral research methodologies.</span></li>
      </ul>
    </section>

    <blockquote class="appendix-coda">Through the Mathematical Foundations, the Utopian Society unites ethics and precision in a realistic and achievable harmony. Numbers become instruments of conscience; equations become civic architecture. This grounded framework ensures that mathematics remains both testable and humane—the logic of compassion expressed in measure and proportion.</blockquote>
  </section>`;

const contributionAppendixVIIHtml = `
  <section class="mathematical-appendix" aria-label="Appendix VII, Mathematical Foundations of Equilibrium">
    <header class="appendix-title">
      <span>Appendix VII</span>
      <h1>Mathematical Foundations of Equilibrium</h1>
      <p>Circle of Contribution Charter Companion Document</p>
    </header>

    <p class="appendix-notation-note"><strong>Editorial note.</strong> Mathematical notation has been normalized for web legibility; the underlying meaning remains unchanged.</p>

    <section class="appendix-purpose">
      <h2>Purpose</h2>
      <p>To formalize and expand upon the symbolic relationships, constants, and feedback systems underlying the egalitarian economy of the Utopian Society. This appendix serves as a bridge between philosophy and empiricism, translating the Society’s ethical economy into measurable dynamics. It invites continued refinement by mathematicians, systems theorists, and civic engineers to ensure that the economy’s equilibrium remains not only moral but mathematically sustainable.</p>
    </section>

    <section class="appendix-section">
      <h2>I. Assumptions, Constants, and Variables</h2>
      <div class="equation-table-wrap" role="region" aria-label="Constants and variables" tabindex="0">
        <table class="equation-table">
          <thead><tr><th>Symbol</th><th>Definition</th><th>Default value</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>C<sub>b</sub></td><td>Baseline contribution credit per hour</td><td>1.0</td><td>Universal labor value, non-inflationary</td></tr>
            <tr><td>T<sub>c</sub></td><td>Contribution (work) days per cycle</td><td>3</td><td>Standard 3-on / 4-off model</td></tr>
            <tr><td>T<sub>r</sub></td><td>Rest and renewal days per cycle</td><td>4</td><td>Ensures recovery and personal time</td></tr>
            <tr><td>M<sub>s</sub></td><td>Sector multiplier range</td><td>1.25–1.5</td><td>SEP demand-responsive incentive rate</td></tr>
            <tr><td>α</td><td>Fatigue decay rate</td><td>0.1</td><td>Represents energy loss per work cycle</td></tr>
            <tr><td>β</td><td>Recovery coefficient</td><td>0.8</td><td>Fraction of vitality restored per rest cycle</td></tr>
            <tr><td>γ</td><td>Sector responsiveness constant</td><td>Variable</td><td>Reflects SEP’s agility to shifts in labor demand</td></tr>
            <tr><td>Θ</td><td>Social harmony elasticity</td><td>0.05–0.1</td><td>Sensitivity of emotional balance to economic strain</td></tr>
            <tr><td>δ</td><td>Knowledge diffusion rate</td><td>0.03–0.08</td><td>Speed of skill reallocation via Circle of Learning</td></tr>
          </tbody>
        </table>
      </div>
      <p>These constants serve as the foundation for simulating behavior within the Circle of Contribution’s systemic model, offering measurable points for calibration in both social and technical research.</p>
    </section>

    <section class="equation-suite" aria-label="Core equations of contribution flow">
      <h2>II. Core Equations of Contribution Flow</h2>
      <article class="equation-card">
        <h3>Contribution Yield Function</h3>
        <p class="equation-display" aria-label="C C U sub i equals h sub i times C sub b times M sub s">CCU<sub>i</sub> = h<sub>i</sub> × C<sub>b</sub> × M<sub>s</sub></p>
        <p class="equation-reading">Where h<sub>i</sub> represents the total hours contributed by citizen <em>i</em>, and M<sub>s</sub> the active sector multiplier. This simple but fundamental expression defines personal economic input and reward under a unified egalitarian standard.</p>
      </article>
      <article class="equation-card">
        <h3>Sector Equilibrium Differential</h3>
        <p class="equation-display" aria-label="d S over d t equals gamma times N sub d minus N sub a">dS/dt = γ(N<sub>d</sub> − N<sub>a</sub>)</p>
        <p class="equation-reading">Where S is the stability index of a sector, N<sub>d</sub> is the labor demand, and N<sub>a</sub> is the available workforce. The <strong>Sector Equilibrium Program (SEP)</strong> corrects imbalances by increasing M<sub>s</sub> until N<sub>a</sub> ≥ N<sub>d</sub>. Once achieved, M<sub>s</sub> → 1.0, restoring parity.</p>
      </article>
      <article class="equation-card">
        <h3>Systemic Balance Ratio</h3>
        <p class="equation-display" aria-label="B equals the sum over i of C C U sub i, divided by P sub t">B = (Σ<sub>i</sub> CCU<sub>i</sub>) ÷ P<sub>t</sub></p>
        <p class="equation-reading">B expresses total productive contribution relative to total population P<sub>t</sub>. A sustainable society maintains 0.9 ≤ B ≤ 1.1, signifying near-perfect equilibrium between work and life.</p>
      </article>
    </section>

    <section class="equation-suite" aria-label="Fatigue, renewal, and wellness modeling">
      <h2>III. Fatigue, Renewal, and Wellness Modeling</h2>
      <article class="equation-card">
        <h3>Fatigue Decay Function</h3>
        <p class="equation-display" aria-label="E sub i equals E sub zero times e to the negative alpha h sub i">E<sub>i</sub> = E<sub>0</sub>e<sup>−αh<sub>i</sub></sup></p>
        <p class="equation-reading">Models the diminishing vitality of contributor <em>i</em> as labor accumulates without rest. Exponential decay ensures that prolonged overwork rapidly reduces efficiency.</p>
      </article>
      <article class="equation-card">
        <h3>Renewal Function <span>(Restorative Growth)</span></h3>
        <p class="equation-display" aria-label="E prime sub i equals E sub i plus one minus E sub i times beta">E′<sub>i</sub> = E<sub>i</sub> + (1 − E<sub>i</sub>)β</p>
        <p class="equation-reading">Represents recovery within rest cycles, allowing near-complete rejuvenation after each 4-day rest phase. Together with the 3:4 rhythm, this proves mathematically optimal for maintaining societal vitality E′<sub>i</sub> ≈ E<sub>0</sub> across cycles.</p>
      </article>
      <article class="equation-card">
        <h3>Contribution-Resilience Composite</h3>
        <p class="equation-display" aria-label="R sub c equals B times E prime sub i, minus alpha T sub c">R<sub>c</sub> = (B × E′<sub>i</sub>) − (αT<sub>c</sub>)</p>
        <p class="equation-reading">Defines resilience in the workforce as a function of total output, wellness, and sustainable workload. When R<sub>c</sub> ≥ 1.0, society is considered in equilibrium.</p>
      </article>
    </section>

    <section class="equation-suite" aria-label="Trade, surplus, and external equilibrium">
      <h2>IV. Trade, Surplus, and External Equilibrium</h2>
      <article class="equation-card">
        <h3>Domestic Surplus Function</h3>
        <p class="equation-display" aria-label="S sub d equals max of P sub o minus P sub c, and zero">S<sub>d</sub> = max(P<sub>o</sub> − P<sub>c</sub>, 0)</p>
        <p class="equation-reading">Surplus S<sub>d</sub> arises only when total output P<sub>o</sub> exceeds domestic consumption P<sub>c</sub>. Only this positive balance may be exported.</p>
      </article>
      <article class="equation-card">
        <h3>Floating Exchange Translation Index <span>(FETI)</span></h3>
        <p class="equation-display" aria-label="V sub x equals the sum over j of S sub d j times R sub j">V<sub>x</sub> = Σ<sub>j</sub>(S<sub>dj</sub> × R<sub>j</sub>)</p>
        <p class="equation-reading">Each export class (<em>j</em>) carries a conversion rate R<sub>j</sub> governed by global market parity. The FETI preserves internal CCU stability by isolating foreign trade valuation from domestic currency, ensuring autarkic integrity.</p>
      </article>
      <article class="equation-card">
        <h3>Ethical Surplus Bound</h3>
        <p class="equation-display" aria-label="eta equals S sub d divided by P sub o, less than or equal to zero point two">η = S<sub>d</sub> ÷ P<sub>o</sub> ≤ 0.2</p>
        <p class="equation-reading">Defines the ethical threshold for exportable surplus—no more than 20% of total productive output may be diverted externally, maintaining internal security and ecological balance.</p>
      </article>
    </section>

    <section class="equation-suite" aria-label="Cultural and emotional stability index">
      <h2>V. Cultural and Emotional Stability Index</h2>
      <article class="equation-card">
        <h3>Stability Index <span>(K)</span></h3>
        <p class="equation-display equation-display-wide" aria-label="K equals R sub f plus H sub e plus P sub a plus L sub s, divided by four">K = (R<sub>f</sub> + H<sub>e</sub> + P<sub>a</sub> + L<sub>s</sub>) ÷ 4</p>
        <dl class="equation-variables">
          <div><dt>R<sub>f</sub></dt><dd>Rest Fulfillment Index: citizen-reported contentment with rest/work balance.</dd></div>
          <div><dt>H<sub>e</sub></dt><dd>Harmony Engagement: participation in observances and festivals.</dd></div>
          <div><dt>P<sub>a</sub></dt><dd>Perceived Appreciation: societal recognition of individual effort.</dd></div>
          <div><dt>L<sub>s</sub></dt><dd>Learning Satisfaction: participation in continuing education.</dd></div>
        </dl>
        <p class="equation-reading">If K &lt; 0.7, the Circles of Harmony and Learning jointly enact cultural recalibration programs to rejuvenate morale. When K ≥ 0.9, society enters a Cultural Resonance Phase, marked by high creativity, empathy, and joy.</p>
      </article>
    </section>

    <section class="equation-suite" aria-label="Systemic equilibrium and stability conditions">
      <h2>VI. Systemic Equilibrium and Stability Conditions</h2>
      <p>The Circle of Contribution defines steady-state equilibrium as:</p>
      <article class="equation-card">
        <p class="equation-display equation-display-wide" aria-label="d S over d t equals zero; d E sub i over d t equals zero; B is between zero point nine and one point one; K is at least zero point seven; and R sub c is at least one point zero">dS/dt = 0; dE<sub>i</sub>/dt = 0; 0.9 ≤ B ≤ 1.1; K ≥ 0.7; R<sub>c</sub> ≥ 1.0</p>
        <p class="equation-reading">If all five conditions are satisfied simultaneously, the economy is in <strong>Harmonic Equilibrium</strong>—a phase in which production, wellness, and emotion synchronize to sustain both material sufficiency and spiritual vitality.</p>
      </article>
      <p>For analytical modeling, perturbations (shocks) such as labor surges, disease, or external embargoes can be simulated by introducing time-dependent variables to α, β, γ, Θ, and δ. Stability is confirmed when equilibrium reasserts within 3T<sub>c</sub> cycles or fewer.</p>
    </section>

    <section class="appendix-section">
      <h2>VII. Observational and Practical Implications</h2>
      <p>This model establishes a mathematical language for the Society’s self-assessment. By translating abstract ethics into quantifiable terms, the Circle of Contribution enables:</p>
      <ul class="appendix-points">
        <li><strong>Burnout prevention</strong><span>Predictive modeling of burnout thresholds and rest efficacy.</span></li>
        <li><strong>Labor distribution</strong><span>Real-time labor distribution analysis via SEP data feedback.</span></li>
        <li><strong>Economic health</strong><span>Integration of emotional and cultural variables into economic health indicators.</span></li>
        <li><strong>Mathematical Sociology</strong><span>Educational training at USU, ensuring future citizens can interpret and adapt civic models empirically.</span></li>
      </ul>
      <p>The model remains open-source—each generation encouraged to refine constants and algorithms to reflect new discoveries and cultural evolution. As the Society matures, so too will its mathematics.</p>
      <p class="appendix-created">Created: Minday · Gleirn 4 · The Founding Interval</p>
      <p class="appendix-conversion">Gregorian equivalent: October 5, 2025</p>
      <p class="appendix-updated">Last updated: Percepday · Solvane 6 · Utopian Year 1</p>
      <p class="appendix-conversion">Gregorian equivalent: July 15, 2026</p>
    </section>
  </section>`;

function prepareWordPressContent(source: string, documentKind: CorpusDocument["kind"], documentSlug: string) {
  let html = source
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, "");

  const legacyFragmentLinks: Record<string, string> = {
    "_Entry_into_Society": "/corpus/article-ii-membership-citizenship#section-2-01-entry-into-society",
    "_Right_of_Exit": "/corpus/article-ii-membership-citizenship#section-2-02-right-of-exit",
    "_Rights_&amp;_Freedoms": "/corpus/article-iii-rights-freedoms",
    "_Crisis_Ring_Protocols": "/corpus/article-xiv-governance-framework#section-14-06-crisis-ring",
  };
  for (const [legacyId, localHref] of Object.entries(legacyFragmentLinks)) {
    const escapedId = legacyId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(`href=("|')#${escapedId}\\1`, "gi"), `href="${localHref}"`);
  }

  if (documentSlug === "circle-of-contribution-charter") {
    html = html
      .replace("Section III:<br>Economic Systems and Instrument</h1>", "Section III:<br>Economic Systems and Instruments</h1>")
      .replace(
        /<h2([^>]*)>(\s*Section VI:<br>Data Systems, Metrics, and Transparency Protocols\s*)<\/h2>/i,
        "<h1$1>$2</h1>",
      );
    html = html.replace(
      /<h1[^>]*>\s*Appendix VII:[\s\S]*$/i,
      contributionAppendixVIIHtml,
    );
  }

  if (documentKind === "article") {
    html = html.replace(/<h([3-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, inner) => `<p class="constitutional-clause clause-level-${level}">${inner}</p>`);
  }

  for (const document of corpusDocuments) {
    const escapedSlug = document.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(
      new RegExp(`https?:\\/\\/utopiansocietycorpus\\.org\\/${escapedSlug}\\/?`, "gi"),
      corpusPath(document.slug),
    );
  }

  const contents: ContentsEntry[] = [];
  const usedIds = new Map<string, number>();
  html = html.replace(/<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (whole, levelText, attributes, inner) => {
    const label = plainText(inner);
    if (!label) return whole;
    const suppliedId = attributes.match(/\sid=("|')([^"']+)\1/i)?.[2];
    const baseId = suppliedId || headingSlug(label);
    const repetition = usedIds.get(baseId) || 0;
    usedIds.set(baseId, repetition + 1);
    const id = repetition ? `${baseId}-${repetition + 1}` : baseId;
    const cleanAttributes = suppliedId ? attributes.replace(/\sid=("|')([^"']+)\1/i, "") : attributes;
    contents.push({ id, label, level: Number(levelText) });
    return `<h${levelText}${cleanAttributes} id="${id}">${inner}</h${levelText}>`;
  });

  return { html, contents };
}

async function loadWordPressPage(slug: string): Promise<WordPressPage | null> {
  const response = await fetch(`https://utopiansocietycorpus.org/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&_fields=title,content,link,modified_gmt`);
  if (!response.ok) return null;
  const pages = await response.json() as WordPressPage[];
  return pages[0] || null;
}

export default async function CorpusDocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const document = getCorpusDocument(slug);
  if (!document) notFound();

  const localDraft = getConstitutionalDraft(document.slug);
  const publishedPage = await loadWordPressPage(document.slug);
  if (!publishedPage && !localDraft) notFound();
  const wordpressPage: WordPressPage = publishedPage ?? {
    title: { rendered: document.title },
    content: { rendered: localDraft?.html ?? "" },
    link: `https://utopiansocietycorpus.org/${document.slug}/`,
    modified_gmt: "2026-07-16T12:00:00",
  };

  const { html, contents } = prepareWordPressContent(localDraft?.html ?? wordpressPage.content.rendered, document.kind, document.slug);
  const ringDocuments = getRingDocuments(document.ring);
  const sequenceIndex = ringDocuments.findIndex((entry) => entry.slug === document.slug);
  const previous = ringDocuments[sequenceIndex - 1];
  const next = ringDocuments[sequenceIndex + 1];
  const sequenceNumber = String(sequenceIndex + 1).padStart(2, "0");
  const ring = document.ring === "east"
    ? { label: "East Ring", path: "/charters-codices", returnLabel: "Return to the East Ring" }
    : { label: "North Ring", path: "/utopian-society", returnLabel: "Return to the North Ring" };
  const sealLabel = document.kind === "article" ? "Article" : document.kind === "codex" ? "Codex" : document.ring === "east" ? "Charter" : "Document";
  const modifiedAt = localDraft ? new Date("2026-07-16T12:00:00Z") : new Date(`${wordpressPage.modified_gmt}Z`);
  const revisionDate = utopianDate(modifiedAt);
  const revisionLabel = revisionDate.year === null
    ? revisionDate.yearLabel
    : revisionDate.bridge
      ? `${revisionDate.month} ${revisionDate.day} · ${revisionDate.yearLabel}`
      : `${revisionDate.weekday} · ${revisionDate.month} ${revisionDate.day} · ${revisionDate.yearLabel}`;
  const gregorianRevision = gregorianDateUTC(modifiedAt);
  const civicGateway = civicGateways[document.slug];

  return <main className={`corpus-document-page document-${document.kind} document-ring-${document.ring}`}>
    <SiteHeader />
    <header className="document-hero">
      <div className="document-hero-art" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="document-hero-copy">
        <span className="document-eyebrow">{ring.label} · {document.role}</span>
        <h1>{document.title}</h1>
        <p>{document.summary}</p>
      </div>
      <div className="document-seal" aria-hidden="true">
        <span>{document.roman || sequenceNumber}</span>
        <small>{sealLabel}</small>
      </div>
      <Link href={ring.path} className="document-return">← {ring.returnLabel}</Link>
    </header>

    <div className={`document-ribbon${localDraft ? " document-ribbon-draft" : ""}`}>
      <span>{ring.label} document {sequenceNumber} of {ringDocuments.length}</span>
      {document.movement && <b>{document.movement}</b>}
      {localDraft && <span className="local-draft-ribbon">{localDraft.edition} · {localDraft.status}</span>}
      <span title={`Gregorian archival reference: ${gregorianRevision}`}>Corpus text last revised · {revisionLabel}</span>
    </div>

    <div className="document-shell">
      <aside className="document-rail">
        <div className="document-rail-block">
          <span className="document-rail-label">Corpus position</span>
          <strong>{document.role}</strong>
          <p>{document.movement || "The founding sequence"}</p>
        </div>
        {contents.length > 1 && <nav className="document-contents" aria-label="In this document">
          <span className="document-rail-label">In this document</span>
          {contents.map((entry) => <a className={`contents-level-${entry.level}`} href={`#${entry.id}`} key={entry.id}>{entry.label}</a>)}
        </nav>}
        <div className="document-rail-links">
          {civicGateway && <Link className="document-source-link document-civic-link" href={civicGateway.href}>{civicGateway.label} →</Link>}
        </div>
      </aside>

      <article className="document-folio">
        <div className="folio-braid" aria-hidden="true" />
        <div className="document-body" dangerouslySetInnerHTML={{ __html: html }} />
        <footer className="document-attestation">
          <span>Living corpus text</span>
          {localDraft && <p className="draft-attestation">This is a visibly unratified reconciliation copy. Created date remains with the governing document. Last Updated: {localDraft.updated} / {localDraft.gregorianUpdated}.</p>}
        </footer>
      </article>
    </div>

    <nav className="document-sequence" aria-label="Corpus document sequence">
      {previous ? <Link href={corpusPath(previous.slug)}><small>Previous</small><strong>← {previous.title}</strong></Link> : <span />}
      {next ? <Link href={corpusPath(next.slug)}><small>Continue</small><strong>{next.title} →</strong></Link> : <Link href={ring.path}><small>Return</small><strong>{ring.label} →</strong></Link>}
    </nav>

    <footer className="site-footer"><span>The Utopian Society Corpus</span><p>A living framework for ethical, civic, and human continuity.</p><Link href="/">Enter through the frontispiece ↑</Link></footer>
  </main>;
}
