# Utopian Society v3 Local Development

## Safety boundary and production status

OpenAI Build Week judging has concluded. The reviewed v3 public renderer and civic Worker were released on Kineticday, Aura 16, Utopian Year 1 (August 22, 2026). Further development remains local until it passes review and receives a separate release authorization.

- The unified local website is `http://localhost:9877`.
- The civic Worker is an internal local service at `http://127.0.0.1:8788`.
- Pages such as `/portal` and `/editorial` belong to the same website on port 9877; browser-visible navigation must never send a visitor to port 8788.
- The local D1 database is separate from production.
- The production editorial bridge reads from WordPress every five minutes and caches synchronized publications in D1. It contains no general authenticated WordPress write path; WordPress and Jetpack remain the authoring clients.

## Shared civic objects

v3 is organized around a small set of records used by multiple Circles:

- Citizen and civic standing
- Learning status
- Contribution position and assignment
- Affirmation decision
- CCU transaction and account balance
- Request, decision, residence, and harm process
- Publication and ticker announcement
- Transparency Ledger event

The first completed vertical slice is:

1. A citizen accepts a voluntary Contribution assignment.
2. The citizen submits a concise evidence record.
3. Affirmation applies the position's SEP multiplier.
4. A CCU transaction is credited exactly once.
5. Each meaningful transition creates a hash-linked Transparency Ledger event.

## Immigration assessment

The assessment uses ten civic domains with 40 approved questions in each bank. One assessment selects ten questions from every domain, for 100 scored questions, then adds the unscored swallow question as question 101. The server chooses and scores the questions. Correct answers are not shipped to the browser.

Passing requires both:

- at least 90 correct answers overall; and
- at least 7 correct answers in every domain.

## Editorial continuity

WordPress is the canonical editorial origin and retains the established WordPress.com and Jetpack authoring surface without creating a second editorial archive. The public custom domain renders the synchronized content through the new site.

The Editorial Studio can:

- inventory the current WordPress posts and their featured images;
- draft posts using the Society's civic author identity;
- create local ticker notices;
- assign visible Utopian dates while retaining Gregorian dates only as archival references; and
- download a reviewed WordPress handoff manifest;
- report the latest WordPress synchronization state; and
- request an authorized manual synchronization.

The handoff manifest is not a publisher. It reports `remoteWritesEnabled: false` and contains the precise fields that must be reviewed before a future authenticated WordPress action is designed. Ordinary publishing remains in WordPress; the bridge imports published material by WordPress post identity and modification time.

The WordPress statistics endpoint is available again, but those totals cover the WordPress-connected origin. Public application-route traffic is recorded by the separate aggregate first-party analytics stream. The two sources must remain visibly labeled and must not be summed.

## Local commands

```powershell
pnpm civic:migrate:local
pnpm civic:seed:local
pnpm civic:seed:editorial
pnpm civic:dev:local
pnpm dev
```

Validation:

```powershell
pnpm parity:v2
pnpm civic:test:assessment
pnpm civic:test:workflow
pnpm test
pnpm exec wrangler deploy --config cloudflare/civic-ledger/wrangler.local.jsonc --dry-run
```

## Release rule

No v3 work is deployed merely because it passes locally. A release requires a deliberate comparison against the frozen production baseline, visual review, a rollback plan, and explicit authorization after judging.
