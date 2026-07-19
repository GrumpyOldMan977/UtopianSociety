export type ImmigrationQuestion = {
  id: number;
  domain: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const immigrationDomains = [
  "Membership Foundations",
  "The Civic Covenant",
  "Population Stewardship",
  "Civic Classifications",
  "Admission",
  "Hopeful Evaluation",
  "Residency",
  "Citizenship",
  "Exit and Review",
  "Capacity and Transparency",
] as const;

function q(
  id: number,
  domain: (typeof immigrationDomains)[number],
  prompt: string,
  correct: string,
  distractors: [string, string, string],
  explanation: string,
): ImmigrationQuestion {
  const choices = [correct, ...distractors];
  const shift = id % choices.length;
  const options = choices.map((_, index) => choices[(index + shift) % choices.length]);
  return { id, domain, prompt, options, correctIndex: (choices.length - shift) % choices.length, explanation };
}

export const immigrationQuestions: ImmigrationQuestion[] = [
  q(1,"Membership Foundations","Membership in the Society is fundamentally what kind of relationship?","A voluntary civic covenant",["An inherited nationality","A purchased entitlement","A compulsory labor contract"],"Membership rests on conscious and voluntary commitment."),
  q(2,"Membership Foundations","Who may seek entry in good faith?","Any person may seek consideration",["Only relatives of citizens","Only wealthy sponsors","Only people born nearby"],"The right to seek entry is not limited by bloodline, wealth, or nationality."),
  q(3,"Membership Foundations","Which factor may not decide an admission?","Ancestry",["Good-faith intent","Civic understanding","Willingness to contribute"],"Bloodline and ancestry are prohibited bases for admission."),
  q(4,"Membership Foundations","The covenant of citizenship is defined primarily by what?","Intent, participation, and contribution",["Lineage and inheritance","Property ownership","Religious agreement"],"The civic covenant is entered through chosen participation rather than lineage."),
  q(5,"Membership Foundations","What right remains sacred throughout membership?","The peaceful right of exit",["The right to permanent office","The right to inherited rank","The right to avoid all accountability"],"Consent to belong requires a genuine freedom to leave."),
  q(6,"Membership Foundations","What does the Immigration Codex govern?","How applications are evaluated",["Who is allowed to aspire","Which ancestry is preferred","Which beliefs citizens must privately hold"],"The Codex regulates procedure, not the right to aspire toward membership."),
  q(7,"Membership Foundations","Equality of consideration rejects which practice?","Purchasing preferential admission",["Reviewing civic understanding","Discussing contribution interests","Explaining cultural norms"],"Wealth may not purchase civic belonging or priority."),
  q(8,"Membership Foundations","Admission under the Codex is described as what?","Neither automatic nor arbitrary",["Automatic for every applicant","Secretly discretionary","Reserved for citizens' relatives"],"Admission follows a structured, reviewable process."),
  q(9,"Membership Foundations","What must immigration preserve while welcoming people?","Ecological and civic stability",["Unlimited population growth","A single cultural identity","Permanent administrative control"],"Openness is balanced with stewardship and institutional continuity."),
  q(10,"Membership Foundations","Why are civic classifications defined?","To clarify standing, rights, and responsibilities",["To create hereditary castes","To assign human worth","To prevent peaceful departure"],"Classifications describe a person's present relationship to the civic covenant."),

  q(11,"The Civic Covenant","Consent within the Society must be what?","Informed, ongoing, and freely retractable",["Assumed after silence","Permanent once given","Granted by a civic officer"],"Consent is an active and continuing condition, not a one-time surrender."),
  q(12,"The Civic Covenant","How does the Society regard contribution?","As meaningful participation, not a measure of human worth",["As the price of dignity","As a basis for social rank","As compulsory productivity at any cost"],"Contribution sustains shared life without defining a person's value."),
  q(13,"The Civic Covenant","Ecological stewardship begins with recognition of what?","Resources and ecosystems have real limits",["Technology removes every limit","Growth is always beneficial","Nature exists only for extraction"],"The Society plans within the regenerative capacity of living systems."),
  q(14,"The Civic Covenant","What does lifelong learning permit?","Learning, unlearning, retraining, and beginning again",["One permanent vocation","Education only during youth","Knowledge restricted to officials"],"Learning remains available throughout a citizen's life."),
  q(15,"The Civic Covenant","Restorative accountability seeks primarily to do what?","Face harm, repair it, and restore trustworthy relationship",["Inflict vengeance","Hide conflict","Assign permanent shame"],"Accountability is directed toward repair and reintegration where possible."),
  q(16,"The Civic Covenant","Does civic compatibility require ideological uniformity?","No, it requires respect for the constitutional framework",["Yes, all private beliefs must match","Yes, disagreement is prohibited","No, because the Constitution has no authority"],"Diversity of perspective is welcome within the shared civic covenant."),
  q(17,"The Civic Covenant","What kind of diversity is welcomed?","Diversity of background, philosophy, and perspective",["Only occupational diversity","Only approved ancestry","Only beliefs chosen by a panel"],"Difference is compatible with membership when people respect consent and civic responsibility."),
  q(18,"The Civic Covenant","The Hopeful review emphasizes which qualities?","Present intent, character, and willingness to adapt",["Nationality and wealth","Family reputation alone","Momentary nervousness"],"Applicants are not reduced to origin or past circumstance."),
  q(19,"The Civic Covenant","Why is evaluation described as reciprocal discovery?","Both the applicant and Society assess mutual fit",["Only the Society may ask questions","The applicant must surrender doubt","Admission is already decided"],"The Hopeful is also deciding whether this society aligns with their life."),
  q(20,"The Civic Covenant","How should unfamiliar cultural norms be handled?","Explained clearly in advance and approached through consent",["Concealed until admission","Used as a surprise test","Forced immediately"],"Cultural transparency protects meaningful choice and mutual understanding."),

  q(21,"Population Stewardship","What is the Maximum Sustainable Population?","The highest population supportable without degrading civic or ecological health",["A mandatory growth target","The number of applicants each year","The current population plus every Hopeful"],"MSP is a protective ceiling, not a goal."),
  q(22,"Population Stewardship","What is the Operational Population Buffer?","A deliberate margin below maximum capacity",["A list of rejected applicants","An emergency tax","A permanent ban on immigration"],"The buffer preserves room for change, disruption, and renewal."),
  q(23,"Population Stewardship","Which event is the population buffer designed to absorb?","Births and unforeseen demographic change",["Hereditary promotions","Private land purchases","Secret admissions"],"The buffer accounts for births, admissions, emergencies, and system strain."),
  q(24,"Population Stewardship","Which belongs in population monitoring?","Births, deaths, admissions, departures, and status transitions",["Private beliefs","Unrecorded rumors","Ancestral prestige"],"Transparent demographic movement supports responsible planning."),
  q(25,"Population Stewardship","Which system must be considered when determining capacity?","Water availability",["Luxury demand","Inherited titles","Campaign popularity"],"Water, food, housing, health, energy, ecology, and education constrain capacity."),
  q(26,"Population Stewardship","What is the Available Immigration Capacity formula?","AIC = MSP - (CP + OPB + PNG)",["AIC = CP + MSP","AIC = OPB - births","AIC = applicants multiplied by jobs"],"Capacity subtracts current population, safety buffer, and projected natural growth from MSP."),
  q(27,"Population Stewardship","Under the limiting-resource principle, what sets the population ceiling?","The essential resource nearest its sustainable limit",["The most abundant resource","The largest Circle","The number of applications"],"Abundance in one system cannot cancel a critical shortage in another."),
  q(28,"Population Stewardship","How are Transients counted while residing in the Society?","They count toward Current Population",["They are never counted","They count only after citizenship","They count twice"],"Temporary residents still use infrastructure and resources."),
  q(29,"Population Stewardship","When may infrastructure expansion increase MSP?","After relevant Circles verify real operational capacity",["When construction is announced","Whenever applicants request it","Without ecological review"],"Capacity must reflect functioning systems rather than theoretical promises."),
  q(30,"Population Stewardship","What does a negative AIC mean for that cycle?","No new residency admissions may occur",["Every applicant is rejected forever","MSP no longer matters","Admissions double next year"],"A negative result means the Society is already within its protected buffer."),

  q(31,"Civic Classifications","Who is a Citizen?","A full covenant member with civic rights and responsibilities",["Any visitor","Every Hopeful","Only a Circle officer"],"Citizenship is full participation in the civic covenant."),
  q(32,"Civic Classifications","Who is a Resident?","Someone admitted to live and contribute during integration",["A person with full voting authority","An applicant not yet admitted","A former citizen leaving"],"Residency precedes full citizenship and allows lived mutual evaluation."),
  q(33,"Civic Classifications","Who is a Hopeful?","A person who has formally entered the membership evaluation process",["A full citizen","A temporary academic visitor","A hereditary candidate"],"Hopeful status recognizes aspiration without yet granting residency."),
  q(34,"Civic Classifications","What is a Transient?","A person present temporarily for a defined purpose",["A permanent resident","A full citizen","A person barred from applying"],"Transient presence supports exchange or sector contribution without implying permanent membership."),
  q(35,"Civic Classifications","Who is an Independent?","A former citizen who has relinquished civic membership",["A Hopeful awaiting review","A visitor at the University","A resident with voting rights"],"Independent status protects voluntary exit while clarifying civic standing."),
  q(36,"Civic Classifications","Which Circle administers academic exchange Transients?","The Circle of Learning",["The Circle of Defense","The Circle of Harmony alone","No Circle"],"Academic exchange belongs with Learning."),
  q(37,"Civic Classifications","Sector Contribution Transients respond to what?","A temporary need for expertise or labor not yet locally available",["A desire to bypass evaluation","A hereditary claim","A request for permanent office"],"Temporary expertise may support development while Learning prepares future capacity."),
  q(38,"Civic Classifications","What does good-standing Transient priority guarantee?","Priority consideration, not admission",["Immediate citizenship","Permanent residency","Exemption from capacity limits"],"Demonstrated participation informs priority but never overrides the full process."),
  q(39,"Civic Classifications","What must a Transient do to remain beyond the allowed term?","Enter the standard Hopeful pathway",["Renew Transient status indefinitely","Purchase citizenship","Receive a private exception"],"Transient status cannot become an indirect permanent-residency route."),
  q(40,"Civic Classifications","Which framework governs a citizen's transition to Independent status?","The Restoration Codex",["A punitive civic code","A private employment policy","The Learning Charter alone"],"The Society uses restorative, due-process language for civic exit and incompatibility."),

  q(41,"Admission","What limits the number of residency admissions?","Available population capacity",["The popularity of applicants","Ancestral quotas","Wealth collected"],"Admissions remain subordinate to ecological and infrastructural reality."),
  q(42,"Admission","When capacity is limited, who has first stated priority?","Citizens and their children",["External Hopefuls","Wealthy Transients","Foreign officials"],"The Codex establishes an explicit priority order before Transients and external Hopefuls."),
  q(43,"Admission","What may continue during an immigration pause?","Applications may still be submitted, evaluated, and recorded",["Residency admissions continue normally","All records are destroyed","Only secret interviews occur"],"Evaluation may continue even when physical admission must wait for capacity."),
  q(44,"Admission","Why are admission records maintained?","To demonstrate fairness and procedural integrity",["To publish private details","To create social rank","To eliminate appeals"],"Reviewable records protect applicants and public trust."),
  q(45,"Admission","Why do multiple Circles participate in decisions?","To prevent unilateral authority and incorporate several civic perspectives",["To make the process unknowable","To avoid documentation","To guarantee every admission"],"Distributed review reduces favoritism and institutional self-protection."),
  q(46,"Admission","If a qualified applicant is deferred for capacity, what does deferral mean?","Admission may be reconsidered when capacity becomes available",["Permanent rejection","Automatic citizenship next cycle","Loss of the right to appeal"],"Capacity deferral is not a judgment of personal worth or compatibility."),
  q(47,"Admission","Which is a recognized evaluation outcome?","Acceptance into residency",["Hereditary citizenship","Unrecorded exile","Permanent office"],"The stated outcomes are acceptance, deferral, or documented denial."),
  q(48,"Admission","What is the intended character of a formal interview?","Dialogue rather than interrogation",["A loyalty spectacle","A surprise cultural test","A private trial"],"The interview helps both sides understand compatibility and expectations."),
  q(49,"Admission","Which Circles jointly examine contribution alignment?","Contribution, Learning, and Balance",["Defense alone","Harmony alone","No civic bodies"],"Skills, learning pathways, sector needs, and capacity require shared review."),
  q(50,"Admission","Must an applicant arrive with one fixed occupation?","No; willingness to contribute matters, and paths may be developed",["Yes; only one occupation is permitted","Yes; the role can never change","No; contribution is prohibited"],"The Society may identify training or alternative avenues of meaningful participation."),

  q(51,"Hopeful Evaluation","What does the Declaration of Intent establish?","A sincere wish to pursue membership and engage honestly",["Perfect agreement with every idea","Guaranteed admission","A surrender of the right to leave"],"The declaration clarifies intent without functioning as an ideology test."),
  q(52,"Hopeful Evaluation","What is examined in a good-faith review?","Sincerity and the absence of deceptive or exploitative motives",["Preferred ancestry","Personal wealth","Momentary anxiety"],"The review concerns constructive intent and honesty."),
  q(53,"Hopeful Evaluation","How should prior conduct be treated?","As relevant context, but not the sole definition of a person",["As an automatic permanent bar","As irrelevant in every case","As proof of inherited guilt"],"The Society recognizes accountability and the possibility of new beginnings."),
  q(54,"Hopeful Evaluation","Which value belongs in civic compatibility review?","Restorative accountability",["Hereditary rank","Profit maximization","Compulsory conformity"],"Consent, contribution, stewardship, learning, and restoration form the review's civic center."),
  q(55,"Hopeful Evaluation","What must an applicant show regarding the constitutional framework?","A willingness to coexist respectfully within it",["Identical private beliefs","Unquestioning obedience","A promise never to disagree"],"Compatibility is respect for the covenant, not enforced uniformity."),
  q(56,"Hopeful Evaluation","Which may count as meaningful contribution?","Caregiving",["Only paid professional work","Only physical labor","Only Circle office"],"Care, art, research, education, skilled work, and many other forms may sustain civic life."),
  q(57,"Hopeful Evaluation","Who determines whether physical population capacity permits residency?","The Circle of Balance through the capacity framework",["The applicant alone","A private sponsor","The interview recorder"],"Compatibility cannot override the Society's sustainable population limits."),
  q(58,"Hopeful Evaluation","Why are formal evaluation proceedings recorded?","To support accountability and later procedural review",["To entertain the public","To shame applicants","To replace written decisions"],"Records protect both the applicant and the integrity of the process."),
  q(59,"Hopeful Evaluation","How is momentary discomfort with naturalist cultural norms treated?","It is not by itself a determining factor",["It causes automatic denial","It proves bad faith","It eliminates consent"],"Applicants receive advance notice and may choose their state of dress; respect and understanding matter."),
  q(60,"Hopeful Evaluation","Who conducts formal applicant interviews?","A panel drawn from multiple civic Circles",["One permanent immigration ruler","An anonymous commercial vendor","Only the applicant's employer"],"Multi-Circle panels prevent a single institution from controlling admission."),

  q(61,"Residency","What may follow successful Hopeful evaluation?","Provisional Residency",["Immediate hereditary citizenship","Permanent Transient status","Automatic Circle leadership"],"Successful evaluation opens the lived residency pathway."),
  q(62,"Residency","What is the central purpose of residency?","Mutual evaluation through real participation in community life",["Unpaid punishment","A secret probation","Immediate voting control"],"Residency lets both the person and the Society experience long-term compatibility."),
  q(63,"Residency","Which protection is afforded to residents?","Access to housing, healthcare, and education",["Automatic constitutional office","Exemption from civic rules","Authority to exceed capacity limits"],"Residents receive fundamental protections while integrating."),
  q(64,"Residency","May residents vote in constitutional governance before citizenship?","No",["Yes, immediately","Only if wealthy","Only through inheritance"],"Residents participate in communal life and discussion but full voting authority follows citizenship."),
  q(65,"Residency","What guides a resident's contribution?","Abilities, knowledge, and physical capacity",["A fixed hereditary occupation","Maximum output regardless of health","Private profit alone"],"Contribution should be meaningful, humane, and suited to the person."),
  q(66,"Residency","What does cultural integration not require?","Abandoning personal identity, heritage, or belief",["Learning civic customs","Respecting consent","Understanding communal responsibility"],"Integration builds familiarity without demanding cultural erasure."),
  q(67,"Residency","How should residency reviews operate?","Constructively and supportively",["Punitively and secretly","Without documentation","As public humiliation"],"Reviews identify challenges and help residents adapt successfully."),
  q(68,"Residency","What can make a resident eligible for citizenship?","Sustained compatibility and active contribution",["Payment of a fee","Ancestry alone","One successful quiz alone"],"Full citizenship follows lived trust and completion of the residency pathway."),
  q(69,"Residency","What changes when citizenship is formally granted?","The person receives full civic rights and responsibilities",["The right of exit disappears","Private beliefs become regulated","Contribution becomes a measure of worth"],"Citizenship is mutual recognition of full covenant membership."),
  q(70,"Residency","May a resident withdraw from the pathway?","Yes, at any time and without penalty",["No, residency is permanent","Only after losing all protections","Only with hereditary approval"],"A voluntary society protects the freedom to decide that membership is not the right path."),

  q(71,"Citizenship","What does full citizenship recognize?","A trusted and integrated member of the civic community",["A superior social class","A purchased title","A temporary visitor"],"Citizenship reflects lived participation and mutual trust."),
  q(72,"Citizenship","Where is formal recognition of citizenship recorded?","The Society's governance archives",["A private employer file only","Nowhere","A hereditary registry"],"A public institution must preserve an accountable record of civic status."),
  q(73,"Citizenship","Which is a civic right of citizens?","Participation in assemblies and constitutional voting",["Permanent control of a Circle","Secrecy from all review","Authority over another person's consent"],"Citizens may deliberate, vote, propose initiatives, and oversee institutions."),
  q(74,"Citizenship","Which is a civic responsibility?","Respect for consent and restorative accountability",["Avoiding all dialogue","Maximizing private wealth","Demanding ideological conformity"],"Rights and responsibilities sustain one another within the covenant."),
  q(75,"Citizenship","Can citizens help form and oversee civic Circles?","Yes",["No, Circles are hereditary","Only foreign officials may","Only during an emergency"],"Citizen participation keeps governance accountable and distributed."),
  q(76,"Citizenship","May a civic role require additional preparation?","Yes, relevant training and experience may be required",["No role may require competence","Only wealth qualifies","Ancestry is the sole qualification"],"Eligibility is equal, while particular responsibilities may require demonstrated readiness."),
  q(77,"Citizenship","What is the stated purpose of defensive service?","Protection, preparedness, and shared responsibility",["Expansion and domination","Internal suppression","Permanent emergency rule"],"Defense exists to preserve sovereignty under constitutional restraint."),
  q(78,"Citizenship","May citizenship be revoked arbitrarily?","No",["Yes, by any Circle member","Yes, without notice","Yes, because it is temporary"],"Any change to citizenship requires transparent, fair, multi-Circle process."),
  q(79,"Citizenship","May a citizen voluntarily renounce citizenship?","Yes",["No","Only by purchasing exit","Only if ancestry is revoked"],"Voluntary renunciation protects autonomy and the sacred right of departure."),
  q(80,"Citizenship","How long does citizenship ordinarily continue?","For life unless voluntarily relinquished or altered through due process",["One year","Until employment changes","Only while holding office"],"Citizenship is stable and non-transactional."),

  q(81,"Exit and Review","What principle governs voluntary departure?","A person may leave peacefully",["Departure is treason","Exit requires inherited permission","Leaving erases all prior rights"],"The freedom to leave is essential to voluntary membership."),
  q(82,"Exit and Review","When residency might be terminated, what safeguard is required?","Review by multiple civic Circles",["A private verbal order","Automatic punishment","No explanation"],"Termination cannot be unilateral or arbitrary."),
  q(83,"Exit and Review","What must accompany a residency termination decision?","Clear documentation and available review avenues",["Public shaming","Erasure of records","Permanent secrecy"],"The resident must understand the decision and possible appeal."),
  q(84,"Exit and Review","Who may appeal an immigration determination?","An applicant who believes procedure or evidence was mishandled",["Only a hereditary sponsor","No one","Only a Circle officer reviewing their own decision"],"The Codex recognizes meaningful procedural review."),
  q(85,"Exit and Review","Which is a valid ground for review?","Relevant evidence was overlooked",["The applicant dislikes capacity limits","Ancestry was not favored","A bribe was refused"],"Appeals examine fairness, evidence, procedure, and application of standards."),
  q(86,"Exit and Review","Why is multi-Circle oversight used in appeals?","So an institution does not exclusively review its own decision",["To prevent applicants from speaking","To hide responsibility","To eliminate written outcomes"],"Independent civic perspectives strengthen impartiality."),
  q(87,"Exit and Review","Which may be an appeal outcome?","Revision and continuation of evaluation",["Unrecorded punishment","Automatic hereditary status","Permanent office"],"Review may affirm, revise, or reconsider the original determination."),
  q(88,"Exit and Review","What happens after the final immigration review?","The determination becomes final within that process",["It remains contested forever","All documentation is destroyed","Capacity rules disappear"],"Finality follows a meaningful opportunity for review."),
  q(89,"Exit and Review","How are administrative or capacity denials treated?","Reapplication may occur in a later civic cycle",["They permanently bar a person","They grant instant citizenship","They require public confession"],"Temporary capacity or documentation barriers are not permanent judgments."),
  q(90,"Exit and Review","Which framework replaces deprecated punitive language in current Corpus continuity?","The Restoration Codex",["A punishment code","A vengeance charter","No due-process framework"],"Restoration is the current language for harm, accountability, repair, and reintegration."),

  q(91,"Capacity and Transparency","What must immigration calculations remain?","Publicly auditable",["Secret","Controlled by applicants","Based on rumor"],"Transparent calculations allow citizens to examine the reasons behind capacity decisions."),
  q(92,"Capacity and Transparency","Why is the OPB preventative rather than punitive?","It preserves resilience before systems reach crisis",["It ranks applicants by worth","It imposes ideological discipline","It hides unused resources"],"A safety margin allows society to absorb shocks without destabilization."),
  q(93,"Capacity and Transparency","What is the Birth Reserve for?","Expected natural population growth",["Hereditary privilege","Military expansion","Unrecorded admissions"],"Population planning must leave room for future generations."),
  q(94,"Capacity and Transparency","What is the Emergency Reserve Threshold for?","Unexpected ecological, health, or infrastructure strain",["Permanent exclusion","Private luxury development","Political campaigning"],"Emergency capacity protects the Society's ability to respond humanely to disruption."),
  q(95,"Capacity and Transparency","If capacity approaches the buffer threshold, what may occur?","Intake may be reduced, slowed, or paused",["Ecological limits are ignored","Applicants become citizens automatically","Population records are suspended"],"Admissions adjust to real system conditions rather than political pressure."),
  q(96,"Capacity and Transparency","What should a denial communicate?","A brief, understandable explanation",["Nothing","Only a secret code","The applicant's ancestry"],"Clear reasons are part of respectful and reviewable procedure."),
  q(97,"Capacity and Transparency","What should public admissions reporting avoid?","Unnecessary exposure of private applicant information",["Aggregate capacity figures","Published procedures","Documented standards"],"Transparency concerns decisions and systems, not indiscriminate disclosure of personal data."),
  q(98,"Capacity and Transparency","What does cultural-norm transparency protect?","The applicant's ability to make an informed choice",["A surprise test","Forced participation","Institutional secrecy"],"People must understand the community they are considering joining."),
  q(99,"Capacity and Transparency","What does the online certificate in this portal represent?","Virtual symbolic citizenship only",["Legal nationality","Physical residency","A completed constitutional residency pathway"],"The website may recognize symbolic civic commitment without misrepresenting legal or Corpus status."),
  q(100,"Capacity and Transparency","What does passing this assessment demonstrate?","Comprehension of the civic framework",["Human worth","Perfect ideological conformity","Guaranteed physical admission"],"The assessment tests understanding; it does not measure worth or replace the Codex's lived evaluation process."),
];

export const ASSESSMENT_PASSING_SCORE = 90;
