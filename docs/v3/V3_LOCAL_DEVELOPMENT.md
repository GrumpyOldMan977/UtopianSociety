# Utopian Society v3 Local Development

## Safety boundary

The public beta remains frozen for OpenAI Build Week judging. v3 development is local only until a reviewed release is authorized after Spiraday, Solvane 28, Utopian Year 1.

- The unified local website is `http://localhost:9877`.
- The civic Worker is an internal local service at `http://127.0.0.1:8788`.
- Pages such as `/portal` and `/editorial` belong to the same website on port 9877; browser-visible navigation must never send a visitor to port 8788.
- The local D1 database is separate from production.
- The editorial bridge inventories WordPress and prepares manifests, but it contains no authenticated WordPress write path.

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

WordPress remains the intended public editorial surface so Jetpack statistics and Android publishing can be restored without creating a second public archive.

The local Editorial Studio can:

- inventory the current WordPress posts and their featured images;
- draft posts using the Society's civic author identity;
- create local ticker notices;
- assign visible Utopian dates while retaining Gregorian dates only as archival references; and
- download a reviewed WordPress handoff manifest.

The handoff manifest is not a publisher. It reports `remoteWritesEnabled: false` and contains the precise fields that must be reviewed before a future authenticated WordPress action is designed.

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
