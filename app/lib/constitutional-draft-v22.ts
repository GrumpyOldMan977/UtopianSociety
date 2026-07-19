export type ConstitutionalDraft = {
  slug: string;
  edition: string;
  status: string;
  updated: string;
  gregorianUpdated: string;
  html: string;
};

const status = "Draft v2.2 · Founder review copy · Unratified";
const updated = "Spiraday · Solvane 7 · Utopian Year 1";
const gregorianUpdated = "July 16, 2026";

const article = (slug: string, html: string): ConstitutionalDraft => ({ slug, edition: "Constitution Draft v2.2", status, updated, gregorianUpdated, html });

export const constitutionalDrafts: Record<string, ConstitutionalDraft> = {
  "article-xiv-governance-framework": article("article-xiv-governance-framework", `
    <p class="draft-notice"><strong>Constitution Draft v2.2 — Unratified.</strong> This local reconciliation copy establishes the proposed seven-Circle structure for Founder review. It does not replace the published Constitution until ratified.</p>
    <h2>Section 14.01 — The Seven Foundational Circles</h2>
    <p>The Utopian Society shall maintain seven Foundational Circles. Each holds an irreducible, society-wide constitutional mandate; operates continuously; possesses a jurisdiction that cannot safely be absorbed elsewhere; answers independently to the people; and coordinates as a peer with every other Foundational Circle.</p>
    <ol>
      <li><strong>The Circle of Contribution</strong> administers sectors, contribution pathways, reciprocal labor, renewal, protected rest, apprenticeship coordination, and the dignity of useful participation.</li>
      <li><strong>The Circle of Learning</strong> administers lifelong education, mentorship, evidence literacy, archives of knowledge, the Utopian Society University, and public understanding of civic method.</li>
      <li><strong>The Circle of Healing</strong> administers individual and public health, medical ethics, bodily autonomy, equitable care access, provider standards, health education, privacy, informed consent, and the right of refusal, subject to <a href="/corpus/article-viii-continuance-medical-ethics">Article VIII</a> and the <a href="/corpus/circle-of-healing-charter">Circle of Healing Charter</a>.</li>
      <li><strong>The Circle of Harmony</strong> administers mediation, procedural justice, peaceful dispute resolution, harm response, and restoration under the <a href="/corpus/restoration-codex">Restoration Codex</a> and the <a href="/circles/harmony#corpus-authority">Harmony Charter</a>.</li>
      <li><strong>The Circle of Custodianship</strong> administers land, ecology, resources, infrastructure, energy, water, transport, housing systems, public technical systems, and archival preservation. It shall not direct medicine, adjudicate harm, or exercise military authority.</li>
      <li><strong>The Circle of Balance</strong> administers systemic capacity, equilibrium, resource conflicts, Continuance review, long-range risk, and analysis of competing civic needs. Its models inform conscience and review; they do not govern persons by equation.</li>
      <li><strong>The Circle of Defense</strong> administers sovereignty, civil resilience, protection from external threat, and tightly limited crisis protection under <a href="/corpus/article-xix-military-defense">Articles XIX</a> and <a href="/corpus/article-xx-prohibition-of-weapons-and-torture">XX</a>.</li>
    </ol>
    <h2>Section 14.02 — Equality, Boundaries, and Non-Domination</h2>
    <p>The seven Foundational Circles are equal in civic dignity and peer standing. Equality does not erase the breadth or boundary of a mandate. No Circle may claim another Circle’s jurisdiction, condition a constitutional right upon obedience outside lawful process, or convert coordination into supremacy.</p>
    <h2>Section 14.03 — Council of Seasons</h2>
    <p>The Council of Seasons shall remain the rotating cross-Circle coordinating council. Each Foundational Circle shall provide a properly selected representative. The Council may synchronize calendars, shared dependencies, cross-Circle review, and public deliberation. It may not replace a Circle’s independent mandate, become a permanent executive, or treat the center measure of Time and Observance as an eighth governance mandate.</p>
    <h2>Section 14.04 — Transparency, Privacy, and Public Review</h2>
    <p>Authority, procedure, membership, conflicts, decisions, reasons, sources, amendments, and review pathways shall be public by default. Personal health, intimate life, protected testimony, active safety information, and narrowly necessary private records shall remain protected. Privacy shall never conceal the existence, legal basis, duration, or review of public power.</p>
    <h2>Section 14.05 — Harmony, Deadlock, and Jurisdictional Conflict</h2>
    <p>Harmony owns the procedure for mediation and restorative dispute resolution. When Circles disagree over jurisdiction, Harmony shall first convene a documented boundary conference. If mediation cannot resolve the question, the matter proceeds to constitutional review without allowing either Circle to seize interim supremacy. Urgent action must be narrow, reversible, time-limited, and publicly recorded.</p>
    <h2>Section 14.06 — Crisis Ring</h2>
    <p>A Crisis Ring may be formed only for a defined emergency, with an explicit purpose, membership, authority, expiration, public record, and later review. Defense may coordinate external protection; Custodianship may sustain public systems; Healing retains clinical authority; Harmony protects procedure and restoration. The Crisis Ring dissolves automatically when its term or lawful purpose ends.</p>
  `),

  "article-xv-circle-formation-and-civic-representation": article("article-xv-circle-formation-and-civic-representation", `
    <p class="draft-notice"><strong>Constitution Draft v2.2 — Unratified.</strong> These common formation rules apply to all seven Foundational Circles and to their Councils for Founder review.</p>
    <h2>Section 15.01 — Public Formation</h2>
    <p>Every Foundational Circle and Council shall be constituted through direct public election by the citizens entitled to participate in that civic domain. Representation shall remain accessible, reviewable, recallable, and protected from inherited office, purchase, credential monopoly, or permanent incumbency.</p>
    <h2>Section 15.02 — Eligibility and Weighted Qualification</h2>
    <p>Eligibility requires good civic standing, satisfaction of rotation requirements, disclosure of relevant conflicts, and relevant demonstrated skill or lived experience. Expertise is a weighted qualification, not an exclusive barrier. No credential may silence persons whose lives are governed by the domain, and no claim of lived experience alone removes the duty to learn the office’s methods and limits.</p>
    <p>Where candidates are equally eligible after the public vote and the published weighting of relevant qualification, lot may be used solely to resolve a genuine tie. Lot shall never replace election, conceal a political choice, or evade accessibility and competence requirements.</p>
    <h2>Section 15.03 — Rotation, Continuity, and Apprenticeship</h2>
    <p>Terms shall rotate often enough to prevent ownership of office and slowly enough to preserve competence. Each body shall maintain staggered terms, documented handover, open apprenticeships, accessible civic education, and a continuity plan. Apprentices may observe and contribute under supervision but may not exercise authority not yet entrusted to them.</p>
    <h2>Section 15.04 — Councils and Independent Intra-Circle Authority</h2>
    <p>A Council is a coordinating and representative body with independent domain authority within its Circle. Its Charter or constituting instrument shall state its assigned domain, powers, membership, evidence standard, public accountability pathway, appeal route, and authority limits.</p>
    <p>A Council may decide matters within its assigned domain without requiring routine permission from the parent Circle. It remains bound by the Constitution, the Circle’s Charter, citizen oversight, protected rights, and the jurisdiction of every other Council and Circle. It may not enlarge its own domain or override another body without constitutional process.</p>
    <h2>Section 15.05 — Recusal and Conflicts of Interest</h2>
    <p>Members shall disclose personal, familial, financial, professional, therapeutic, supervisory, or other material conflicts. A conflicted member shall recuse from access, deliberation, decision, and private influence. The record shall identify the recusal without disclosing protected personal facts.</p>
    <h2>Section 15.06 — Accessibility and Equal Participation</h2>
    <p>Elections, candidacy, deliberation, evidence, and public review shall provide reasonable access across disability, language, literacy, technology, caregiving, geography, and economic circumstance. Accessibility is a condition of lawful representation, not a discretionary accommodation.</p>
    <h2>Section 15.07 — Recall, Vacancy, and Review</h2>
    <p>Citizens may initiate recall for abuse of authority, persistent neglect, undisclosed conflict, loss of standing, or repeated violation of the body’s mandate. A fair notice and response process shall precede removal except where narrow temporary suspension is necessary to prevent immediate harm. Vacancies shall be filled by the same public and eligibility principles used for ordinary selection.</p>
  `),

  "article-xvi-governance-of-sectors-contribution": article("article-xvi-governance-of-sectors-contribution", `
    <p class="draft-notice"><strong>Constitution Draft v2.2 — Unratified.</strong> This article keeps sector and labor administration with Contribution while replacing deprecated punitive language with restorative procedure.</p>
    <h2>Section 16.01 — Contribution Jurisdiction</h2>
    <p>The Circle of Contribution shall administer sectors, contribution pathways, apprenticeships, allocation of shared work, retraining, renewal, protected rest, and reciprocal participation. Contribution shall never equate output with dignity or condition food, shelter, health care, learning, personhood, or protected rights upon productivity.</p>
    <h2>Section 16.02 — Sector Councils</h2>
    <p>Contribution Councils may exercise independent authority within sectors and functions formally assigned by the Contribution Charter or a lawful public instrument. Each Council shall publish its domain, membership, current needs, method, decisions, conflicts, review pathway, and limits. A sector Council may not command another sector, enlarge its own jurisdiction, or convert a request for participation into coercion.</p>
    <h2>Section 16.03 — Required Cross-Circle Consultation</h2>
    <p>Contribution shall consult:</p>
    <ul>
      <li><strong>Learning</strong> when a decision affects education, apprenticeship, retraining, evidence literacy, or the public return of knowledge;</li>
      <li><strong>Healing</strong> when a decision affects health, disability, recovery, caregiving, medical risk, access, or humane pace;</li>
      <li><strong>Balance</strong> when a decision affects capacity, cross-system equilibrium, Continuance, or competing civic needs;</li>
      <li><strong>Custodianship</strong> when a decision affects land, infrastructure, energy, water, transport, housing, resources, or technical systems; and</li>
      <li><strong>Harmony</strong> when a decision concerns harm, conflict, procedural fairness, restoration, or the rights of affected persons.</li>
    </ul>
    <p>Consultation does not transfer jurisdiction. The responsible body shall publish how relevant findings were considered and why any recommendation was not adopted.</p>
    <h2>Section 16.04 — Renewal, Capacity, and Protected Transition</h2>
    <p>Every contribution pathway shall provide review, rest, accessibility, caregiving recognition, apprenticeship, retraining, and voluntary transition. Where a person cannot participate in an ordinary rhythm, the Society shall first examine health, access, learning, care burdens, placement, and systemic failure before attributing fault.</p>
    <h2>Section 16.05 — Restoration Instead of Punitive Classification</h2>
    <p>The Constitution rejects the deprecated language of “parasitic,” “criminal,” or inherently unworthy citizens. Alleged refusal, exploitation, deception, or harm shall be addressed through evidence, dialogue, support, proportionate boundaries, and the procedures of the <a href="/corpus/restoration-codex">Restoration Codex</a>. Harmony retains dispute and restorative jurisdiction; Healing retains health and capacity care; Contribution retains sector administration.</p>
    <h2>Section 16.06 — Public Measures and Human Meaning</h2>
    <p>Contribution measures shall disclose source, uncertainty, revision history, accessibility effects, and the decisions they may not make. No equation, score, affirmation, or sector need may become an autonomous order or a ranking of human worth.</p>
  `),

  "article-xvii-governance-structure-circles": article("article-xvii-governance-structure-circles", `
    <p class="draft-notice"><strong>Constitution Draft v2.2 — Unratified.</strong> This article is the proposed canonical topology of the Circle system for Founder review.</p>
    <h2>Section 17.01 — Circle Classes</h2>
    <p>The Circle system distinguishes authority by source, breadth, duration, and boundary without creating a pyramid of human dignity.</p>
    <ol>
      <li><strong>Foundational Circles</strong> hold irreducible, society-wide constitutional mandates requiring continuous operation, distinct jurisdiction, independent public accountability, and peer coordination.</li>
      <li><strong>Operational Circles</strong> implement a bounded Charter or Codex mandate and remain within the limits of that instrument.</li>
      <li><strong>Councils</strong> are coordinating and representative bodies with independent domain authority within their Circle.</li>
      <li><strong>Temporary Rings</strong> address a crisis or defined project and dissolve automatically when their purpose or lawful term ends.</li>
    </ol>
    <h2>Section 17.02 — The Seven Foundational Circles</h2>
    <dl>
      <dt>Contribution</dt><dd>Sectors, reciprocal labor, contribution pathways, renewal, retraining, and protected rest.</dd>
      <dt>Learning</dt><dd>Education, mentorship, evidence literacy, public knowledge, archives of learning, and lifelong inquiry.</dd>
      <dt>Healing</dt><dd>Individual and public health, medical ethics, bodily autonomy, care access, provider standards, privacy, consent, and health education under <a href="/corpus/article-viii-continuance-medical-ethics">Article VIII</a> and the <a href="/corpus/circle-of-healing-charter">Healing Charter</a>.</dd>
      <dt>Harmony</dt><dd>Harm, restoration, mediation, procedural justice, and peaceful dispute resolution under the <a href="/circles/harmony#corpus-authority">Harmony Charter</a> and <a href="/corpus/restoration-codex">Restoration Codex</a>.</dd>
      <dt>Custodianship</dt><dd>Land, ecology, infrastructure, energy, water, transport, housing systems, public technical systems, and archival preservation.</dd>
      <dt>Balance</dt><dd>Systemic capacity, equilibrium, resource conflicts, Continuance review, long-range risk, and competing civic needs under the <a href="/circles/balance#corpus-authority">Balance Charter</a>.</dd>
      <dt>Defense</dt><dd>Sovereignty, civil resilience, external threats, and tightly limited crisis protection under <a href="/corpus/article-xix-military-defense">Articles XIX</a> and <a href="/corpus/article-xx-prohibition-of-weapons-and-torture">XX</a>.</dd>
    </dl>
    <h2>Section 17.03 — Operational Circles</h2>
    <p>An Operational Circle administers a specialized, bounded function. The Circle of Affirmation and the Immigration civic office remain operational unless constitutional review demonstrates that either satisfies every Foundational test. Time and Observance is a shared constitutional instrument stewarded through the Council of Seasons and experienced through the center calendar; it is not an eighth Foundational Circle.</p>
    <h2>Section 17.04 — Councils</h2>
    <p>A Council holds independent authority within an assigned intra-Circle domain. Its authority is substantive rather than merely advisory, but remains bounded by the Constitution, the parent Circle’s Charter, the constituting instrument, public oversight, protected rights, and the jurisdictions of other bodies.</p>
    <p>No Council may claim authority outside its assigned domain, override another Council or Circle, or amend its own jurisdiction without lawful constitutional process. Cross-domain questions require documented consultation, consent where rights or private information are involved, and a visible path of review.</p>
    <h2>Section 17.05 — Temporary Rings</h2>
    <p>A Temporary Ring shall publish its purpose, members, powers, resources, records, review body, and automatic expiration before exercising authority. It may not perpetuate itself by declaring its task unfinished, absorb a permanent mandate, or carry exceptional power into ordinary governance.</p>
    <h2>Section 17.06 — Equality of Dignity and Difference of Mandate</h2>
    <p>Every Circle, Council, Ring, member, witness, applicant, and citizen possesses equal civic dignity. The law may distinguish responsibility, qualification, confidentiality, and jurisdiction only as necessary to perform a legitimate mandate. Breadth of office never creates greater personhood.</p>
    <h2>Section 17.07 — Canonical Cross-References</h2>
    <p>This topology shall be read together with <a href="/corpus/article-viii-continuance-medical-ethics">Article VIII</a>, <a href="/corpus/article-xix-military-defense">Articles XIX</a> and <a href="/corpus/article-xx-prohibition-of-weapons-and-torture">XX</a>, the <a href="/corpus/circle-of-healing-charter">Healing Charter</a>, <a href="/circles/harmony#corpus-authority">Harmony Charter</a>, <a href="/circles/balance#corpus-authority">Balance Charter</a>, and <a href="/corpus/restoration-codex">Restoration Codex</a>. Where an older text uses “Criminal Codex,” it shall be read as “Restoration Codex” pending formal amendment. Where an older list omits Healing or assigns medicine or defense to Custodianship, this Draft v2.2 records the proposed reconciliation without claiming ratification.</p>
  `),
};

export const getConstitutionalDraft = (slug: string) => constitutionalDrafts[slug];
