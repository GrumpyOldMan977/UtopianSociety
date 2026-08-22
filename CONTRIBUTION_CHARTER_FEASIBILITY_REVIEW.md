# Circle of Contribution Charter — Civic Portal Feasibility Review

**Status:** Local working review; not a constitutional amendment  
**Source reviewed:** Published Circle of Contribution Charter and Appendices I–VII  
**Purpose:** Distinguish what can be implemented faithfully now, what requires a policy decision, and what should remain an explicitly labeled simulation.

## 1. Finding

The Charter describes a feasible civic information system, but it does not yet describe a fully executable economy. Conventional web infrastructure can support positions, assignments, schedules, verification, CCU accounts, sector dashboards, public aggregates, pooled projects, review queues, and an append-only ledger. The project does not need a novel blockchain or autonomous AI to demonstrate those functions.

The current text nevertheless contains conflicting numbers, undefined thresholds, overlapping authorities, and several aspirational mathematical claims. Those gaps must not be converted into hidden software policy. During local development, unresolved mechanisms should be visible as simulated, steward-set, or awaiting ratification.

Section VIII also conditions synchronized operation of the EDF, SEP, CCB, and FTB on ratification. Until ratification, the portal is a civic simulator and demonstrator rather than the Society's legally operative economy.

## 2. Feasibility by mechanism

| Charter mechanism | Feasibility | Implementation boundary |
|---|---|---|
| Sector and position directory | Feasible now | Publish needs, qualifications, accessibility, schedules, responsible sector, and current policy version. |
| Contribution assignments | Feasible now | Use explicit states, voluntary acceptance, accommodations, protected rest, and reviewable changes. |
| Schedule Weavers and 3-on / 4-off rhythm | Feasible with rules | Treat 3:4 as the norm while defining emergency coverage, caregiving, part-time work, asynchronous work, disability accommodations, and calendar boundaries. |
| Peer verification | Feasible now | Require contributor attestation plus independent peer or witness and authorized workgroup-steward confirmation. |
| Circle of Affirmation integration | Feasible after reconciliation | The Contribution Charter assigns verification to peers and workgroup stewards but does not name Affirmation. The portal may use Affirmation as the verification service only after that mapping is formally stated. |
| CCU issuance and accounts | Feasible now | Use immutable, balanced postings; never edit a stored balance. Essential goods and rights remain outside CCU payment. |
| Pooling and donations | Feasible after policy detail | Define ownership, authorization, reversals, dissolution, death, household membership changes, and fraud review. |
| Seasonal sunset, dormancy, Cycle Pool, and Equity Gate | Not yet executable | The exact season, dormancy period, retention threshold, notices, exemptions, and appeal process are absent. |
| SEP multiplier | Feasible as human-approved policy | Calculate a recommendation from public inputs, require human ratification, publish rationale and effective dates, then snapshot the rate when an assignment begins. |
| Autonomous real-time SEP adjustment | Not permissible as written elsewhere | The Charter also requires democratic consultation, human-legible rationale, oversight, and human final authority. Automation may recommend and monitor; it should not activate policy alone. |
| Learning and apprenticeship feedback | Feasible now | Share aggregate demand and qualification data; never compel a Learning path or treat education as a worth ranking. |
| Civic and public ledgers | Feasible now | Separate private personal entries, sector records, public procedural events, and aggregate public data. Append corrections rather than overwriting history. |
| Blockchain-inspired distribution | Unnecessary for the demonstrator | An append-only relational ledger with hashes, checksums, audit logs, backups, and independent exports can satisfy the present integrity goal more simply. |
| HPM and well-being indices | Feasible only as research indicators | Define methodology, consent, sample thresholds, uncertainty, and review. Do not convert subjective well-being into individual scoring. |
| FTB and imported-goods interface | Partially feasible | The portal can display external prices and steward-approved adjustments; real conversion requires a defined FETI formula, reserves, legal structure, and trade policy. |
| Predictive AI | Feasible as assistance | AI may forecast, explain, and flag anomalies. It may not assign work, approve a multiplier, issue a final audit finding, or make a civic decision. |

## 3. Conflicts and missing rules that block faithful automation

### SEP ceiling

Sections III and VII and Appendices I, V, VI, and VII use a typical or maximum range of **1.25×–1.5×**. Section V permits **1.25×–2.0×**. The simulator must not choose one silently. Until amended, seeded demonstrations should use rates no higher than 1.5× and label them illustrative, not authoritative.

### Timing of the SEP decision

The multiplier represents sector need, not a reward invented after seeing a person's output. The active policy must therefore be published before acceptance, copied into the assignment as an immutable snapshot, and used after verification to calculate issuance. Retroactive rate changes would be unfair and difficult to audit.

### Verification and Affirmation

Appendix I requires peer verification and multi-signature oversight by workgroup stewards. Appendix III requires another participant or sector lead and human review. The later operational Circle of Affirmation is compatible with this function, but the Charter does not assign it explicitly. The system should model `ContributionLog`, `PeerAttestation`, `StewardVerification`, and `AffirmationRecord` separately so the constitutional relationship can be resolved without rewriting transaction history.

### CCU lifecycle

The Charter simultaneously describes CCUs as personal contribution, spendable credit, poolable household value, donations, seasonally returning credit, dormant credit, inherited or released credit, a source of additional rest, and the basis of a universal distribution. The following must be established before durable balances are authoritative:

- seasonal sunset date and timezone;
- dormancy duration and required notice;
- retention threshold and exemptions;
- whether household pooling transfers ownership or delegates spending;
- whether person-to-person transfer is allowed;
- Cycle Pool allocation authority and audit method;
- meaning and amount of any universal base distribution;
- treatment of pending disputes, death, exit, and reinstatement;
- whether accrued rest is a separate entitlement rather than a CCU purchase.

### FETI and outside money

FETI is named but not mathematically specified. Imported goods cannot simultaneously track external market value and be wholly insulated from external volatility without a buffer, subsidy, reserve, or periodically fixed policy rate. Local development should support a manual, versioned `TradeAdjustment` record and reveal the external reference, steward decision, effective period, and rationale. It should not advertise automatic fair conversion.

### Sector topology and authority

The Charter uses several overlapping maps: nine primary sectors, thirteen Root Domains, Essential and Enrichment classifications, guilds, councils, the ESC, multiple tribunals, review panels, and committees. Before role-based permissions are finalized, a concordance must determine which names are current, which bodies are nested, and which possess independent authority.

### Transparency and privacy

Statements that every raw dataset or all records are public conflict with personal ledgers, encryption, consent, deletion rights, anonymized aggregates, and protection from profiling. The portal will implement the narrower, dignity-preserving interpretation:

1. citizens see their complete personal Contribution record;
2. authorized officers see only the records required by their role;
3. sectors receive operational records and aggregates;
4. the public sees methods, policy decisions, aggregate flows, and privacy-safe ledger events;
5. confidential evidence never becomes public merely because its outcome is recorded.

Biometric signatures are not required for the local portal. Cryptographic account signatures, explicit attestation, and logged steward approval are sufficient and less intrusive.

## 4. Charter-faithful first vertical slice

The first durable local demonstration should proceed in this order:

1. A sector steward publishes a need using a defined sector and measurable sufficiency target.
2. A draft SEP recommendation is generated from visible inputs.
3. Authorized human stewards review, amend if necessary, ratify, and publish the SEP policy with an effective period and appeal path.
4. A position is published with the active multiplier, schedule, accessibility, prerequisites, support, and governing source.
5. A citizen voluntarily accepts the position; the assignment snapshots the policy version.
6. The citizen records time and a plain-language account of the contribution.
7. A peer or witness attests to the record.
8. An authorized workgroup steward verifies it, with recusal and conflict disclosure.
9. Affirmation records the verified contribution without ranking the citizen's human worth.
10. The CCB issues `verified hours × snapshotted multiplier`, using balanced and immutable postings.
11. The citizen sees the assignment, affirmation, CCU posting, renewal position, and review path.
12. The public ledger receives only the appropriate civic event and aggregate effect.

This is technically achievable and faithful to the Charter's strongest safeguards. It also creates the reusable spine needed by Learning, the civic market, housing requests, and later Circle workflows.

## 5. Data needed for the first slice

- `Sector` and `SectorNeed`
- `SEPRecommendation` and ratified `SEPPolicy`
- `Position` and `Assignment`
- `ContributionLog`
- `PeerAttestation`
- `StewardVerification`
- `AffirmationRecord`
- `CCUAccount`, `CCUPosting`, and `CCUTransaction`
- `SchedulePattern`, `RenewalEntitlement`, and accommodation records
- private audit events and privacy-safe public `LedgerEvent`
- conflict, recusal, review, and appeal records

Every policy-bearing record must include its governing source, version, effective U-date, actor, rationale, and superseding record when changed.

## 6. Decision

Proceed with the citizen-account foundation and the Charter-faithful Contribution slice locally. Do not activate autonomous SEP changes, seasonal CCU expiry, Equity Gate redistribution, universal distributions, FETI conversion, or real imported-goods settlement until their policy gaps are resolved and the underlying text is reconciled.
