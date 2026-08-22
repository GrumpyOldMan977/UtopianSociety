# Utopian Society: Next Codex Task Handoff

## Read first

1. `docs/v3/LEARNING_EQUITY_SECURITY_PLAN.md`
2. `docs/v3/V3_LOCAL_DEVELOPMENT.md`
3. `docs/v3/PRODUCTION_V2_PARITY_BASELINE.md`
4. `CONTRIBUTION_CHARTER_FEASIBILITY_REVIEW.md`

The next task is to implement the Learning Equity, Evidence, and Security Plan
locally. Do not deploy.

## Hard safety boundaries

- Production is frozen; no WordPress mutation, Cloudflare production
  deployment, remote migration, or public ledger write is authorized.
- Preserve the dirty working tree. Existing modifications belong to the user.
- Never place private legal names, credentials, uploaded evidence, health data,
  or document contents in public logs, public profiles, repository
  documentation, or fixtures.
- The citizen's chosen civic identity remains the public identity.

## Local topology

- Unified browser site: `http://localhost:9877`
- Civic Worker API: `http://127.0.0.1:8788`
- Local service supervisors:
  - `scripts/run-local-site.ps1`
  - `scripts/run-local-worker.ps1`
- Scheduled tasks:
  - `Utopian Society Local Site`
  - `Utopian Society Civic Worker`

The Worker is an internal API. Browser navigation stays on port 9877.

## Relevant implementation

- Citizen portal and Learning UI:
  - `app/components/CitizenPortal.tsx`
  - `app/citizen-portal.css`
  - `app/citizens/`
  - `app/api/learning/`
- Browser OCR:
  - `app/lib/browser-ocr.ts`
  - `public/ocr/`
- Worker evaluation and persistence:
  - `cloudflare/civic-ledger/src/index.js`
  - `cloudflare/civic-ledger/wrangler.local.jsonc`
  - migrations `0009` through `0012`
- Local evaluation test:
  - `scripts/test-local-learning-evaluation.mjs`

## Confirmed behavior

- Uploads up to 10 MB have been accepted locally.
- Browser OCR can read image-only PDFs and provides a citizen-review screen.
- The reviewed transcript, rather than the image-only PDF, now reaches the
  evaluator.
- Evidence accumulates into a longitudinal profile.
- Unsupported Qs remain Pending.
- A childhood report-card evaluation changed several Qs and exposed a
  chronology flaw: synthesis still needs explicit evidence-period weighting
  and upload-order independence.
- Historical report cards may be partial scans whose grade, school, or academic
  year appears only on an unscanned side. Filename metadata is not
  authoritative.

## First implementation slice

1. Add private profile settings for legal name, optional chosen civic name, and
   verified historical variants.
2. Add evidence-period and provenance fields without exposing private identity.
3. Make synthesis independent of upload order and maturity-aware.
4. Add tests for alias matching, partial scans, OCR edits, and reverse upload
   order.
5. Then implement procedural-rights and anti-gaming surfaces.

## Machine constraint

The development laptop has 4 GB RAM. This prior Codex task became large enough
to starve both local Node runtimes. Use a fresh focused task, avoid broad
parallel builds, do not keep duplicate dev servers alive, and run validation in
small batches.

## Recovery check

At the start of the new task:

```powershell
netstat -ano | findstr ":9877 :8788"
Invoke-WebRequest http://localhost:9877/ -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:8788/health -UseBasicParsing
```

If the scheduled tasks show Running but neither port is bound, end and restart
those two scheduled tasks after the old Codex task has released memory.
