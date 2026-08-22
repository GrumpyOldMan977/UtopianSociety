# Production v2 Parity Baseline

This is the mandatory Gate Zero record for local v3 development. Production remains frozen for OpenAI Build Week judging; the local branch may not begin architectural v3 work until this baseline passes.

## Canonical production surface

- Public origin: `https://utopiansocietycorpus.org`
- Civic service: `https://utopian-civic-ledger.utopian-society-civic.workers.dev`
- Freeze notice: `BETA · Public site frozen for review, updates planned Spiraday, Solvane 28, Utopian Year 1, once judging completes.`
- Public population at capture: one active virtual symbolic citizen.
- Canonical civic identity: `Adreto Nagdo Senoviros`.
- Public content inventory: 27 locally rendered posts and 34 corpus documents.
- Foundational topology: seven Foundational Circles, plus operational Circles and shared civic instruments.

## Required parity checks

`scripts/verify-v2-parity.mjs` verifies every imported post, every imported corpus document, every civic route, the frontispiece, the public ticker, and the public ledger/population endpoints against the current local build. Dynamic weather, headlines, clock values, and ledger timestamps are intentionally checked for availability rather than byte equality.

Run after building:

```powershell
pnpm run build
pnpm run parity:v2
```

The verifier must report `"parity": "verified"` before v3 schema or interaction work proceeds.

## Freeze boundary

This record authorizes local development only. It does not authorize a production deployment, WordPress mutation, Cloudflare remote migration, public ledger write, or replacement of the submitted judging build.
