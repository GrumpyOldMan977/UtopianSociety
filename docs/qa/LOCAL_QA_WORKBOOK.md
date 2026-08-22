# Local Website QA Workbook

## Scope and safety

This workbook tests the unified local website at `http://localhost:9877` and its internal civic Worker at `http://127.0.0.1:8788`.

- Production is outside this test boundary and must remain unchanged.
- Use `LocalWorkflowTest`, never Adreto, for mutating civic tests.
- Reset the fixture before and after a workflow run.
- Do not enter real health, Harmony, identity, or education records into the fixture.

## One-command automated run

From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-local-qa.ps1
```

The runner:

1. Locates the bundled Codex Node runtime even when a new PowerShell window lacks Node in `PATH`.
2. Requires HTTP 200 from the site and Worker.
3. Builds the site and runs the unit/render tests.
4. Crawls critical visitor routes and their discovered internal links.
5. Resets the test fixture.
6. Exercises Immigration assessment, Contribution, Affirmation, CCU, private storage, Learning storage, USU, Healing, Harmony, Balance, FTB, and the ledger.
7. Resets the fixture again.

AI interpretation is intentionally skipped in the repeatable suite so the run consumes no Cloudflare Workers AI allowance. OCR and AI interpretation remain separate manual test cases.

## Visitor pass

Use a private browser window with no civic session.

| ID | Route or action | Expected result |
| --- | --- | --- |
| V-01 | Open `/` | Frontispiece, live clock, civic wire, and four public rings render without an error overlay. |
| V-02 | Traverse every frontispiece map | Every label is readable, keyboard focus is visible, Back One Weave works, and the clock remains the center. |
| V-03 | Open `/blogs-essays` and three posts | Utopian dates display; featured images load; Read Aloud starts, pauses, resumes, and stops. |
| V-04 | Open `/utopian-society` and at least three corpus documents | Local document templates load and internal references do not leave the local site. |
| V-05 | Open `/circles`, Learning, Immigration, and Healing | Unique civic art and interactive sections render; prototype boundaries are stated where applicable. |
| V-06 | Open `/lore` and `/lore/birth-of-the-moon` | Lore landing and story reading copy render locally. |
| V-07 | Open `/transparency-ledger` | Ledger scroll region works independently; live population is visible; dates use Utopian standard. |
| V-08 | Open `/portal` while signed out | Private civic information is not rendered; the page directs the visitor to Login. |
| V-09 | Open Adreto's public profile | Only public fields, public role, public contribution, About, and public recognitions appear. |

## Civic pass

Use only the fixture:

- Login: `LocalWorkflowTest`
- Activation certificate: `USV-2026-000000000001`
- Password: `Local workflow test password 2026!`

Run `pnpm civic:reset:test-fixture` before and after the pass.

| ID | Action | Expected result |
| --- | --- | --- |
| C-01 | Activate/login through `/login` | Login succeeds and `/portal` shows the private fixture profile. |
| C-02 | Upload and remove an avatar under 10 MB | Preview and stored avatar load; removal succeeds. |
| C-03 | Accept a Contribution role, record hours, submit evidence, affirm | Hours remain hours; SEP is applied once; CCU and ledger each change once. |
| C-04 | Save a Learning goal and enroll in an eligible USU course | Goal and enrollment persist during the session. |
| C-05 | Upload a 3.6–10 MB Learning text document | Upload, encrypted retrieval, and deletion succeed. |
| C-06 | Request a Healing appointment with synthetic text | Request appears only in the private fixture view. |
| C-07 | File a synthetic Harm | Harm appears in private Harmony state; no finding of responsibility is invented. |
| C-08 | Inspect Balance and FTB | Population is live; all resource, capacity, treasury, price, and risk values are visibly labelled simulation. |
| C-09 | Log out and revisit `/portal` | Private data disappears and the signed-out boundary returns. |

## Learning equity manual pass

Use synthetic or deliberately approved test documents.

1. Upload a text-searchable document and confirm preview, contract, identity match, evidence period, and consent are required.
2. Upload an image-only PDF and confirm browser OCR produces a citizen-editable transcript.
3. Correct at least one OCR cell, attest against the authoritative original, and retain the reviewed transcript.
4. Confirm the evaluator receives the reviewed transcript, not the unreadable PDF.
5. Confirm unsupported Qs remain Pending.
6. Confirm childhood evidence is visibly dated and cannot overwrite stronger adult evidence by submission order.
7. Confirm clinical, legal, hardship, identity, belief, sexuality, and Harmony history are not silently converted into ability scores.
8. Confirm confidence explains evidence quantity, source reliability, agreement, recency, and domain breadth in plain language.
9. Confirm challenge, correction, exclusion, and reset controls work.

## Responsive and accessibility pass

Repeat V-01, V-02, V-03, V-08, C-01, and C-03 at:

- 1440 × 900 desktop
- 1024 × 768 tablet landscape
- 390 × 844 Android-sized portrait
- 360 × 800 narrow portrait

Check:

- keyboard-only operation and visible focus;
- no trapped focus in the calendar or civic forms;
- headings follow a coherent order;
- form fields have labels and errors are announced;
- animated ticker content has one accessible, non-repeating representation;
- `prefers-reduced-motion` stops the marquee and decorative motion;
- 200% zoom does not hide actions or require horizontal page scrolling.

## Defect capture

Copy this block into `LOCAL_QA_ISSUES.md`:

```markdown
### QA-XXX — Short title

- Severity: P0 / P1 / P2 / P3
- Status: Open / Fixed locally / Verified locally / Deferred
- Role: Visitor / Citizen / Both
- Viewport:
- Route:
- Preconditions:
- Steps:
  1.
  2.
- Expected:
- Actual:
- Evidence:
- Suspected area:
```

Severity guide:

- P0: data loss, credential exposure, or production mutation.
- P1: core path unavailable, privacy boundary failure, or incorrect civic decision/value.
- P2: important path is confusing, inaccessible, or partially broken.
- P3: cosmetic, wording, or low-impact consistency issue.
