# Local QA Issue Register

Production is not part of this register. Statuses refer to the local v3 working copy only.

## Active

### QA-006 — Full Core Web Vitals trace is unavailable in the current tool set

- Severity: P3
- Status: Deferred
- Role: Both
- Route: Representative public and civic routes
- Preconditions: Chrome DevTools performance MCP is not configured in this task.
- Steps:
  1. Attempt to start the Cloudflare web-performance workflow.
  2. Inspect available browser tools.
- Expected: Collect FCP, LCP, TBT, CLS, and Speed Index traces.
- Actual: Browser rendering and manual timing are available, but the required DevTools performance tools are not.
- Workaround: Run the route suite and visual responsive audit now; collect formal Web Vitals when DevTools MCP is available.

### QA-007 — Browser OCR of dense historical report-card tables remains error-prone

- Severity: P2
- Status: Open, known limitation
- Role: Citizen
- Route: `/portal`, Learning tab
- Preconditions: Image-only grayscale report card containing subjects by rows and quarters by columns.
- Steps:
  1. Upload the PDF as Learning evidence.
  2. Generate browser OCR.
  3. Compare cells with the authoritative scan.
- Expected: A structurally faithful draft requiring limited correction.
- Actual: OCR may recognize grade letters while losing their row or quarter association.
- Workaround: The original and transcript remain side by side; the citizen must verify every grade against both axes before attesting.

## Resolved locally

### QA-001 — Civic-wire announcement used retired port 3000

- Severity: P2
- Status: Verified locally
- Role: Both
- Route: Global header
- Steps:
  1. Open any route.
  2. Activate the local v3 announcement.
- Expected: Same-origin `/portal` navigation on port 9877.
- Actual: The stored local announcement linked to `http://localhost:3000/portal`.
- Resolution: Local data is corrected during this QA run and route smoke now rejects ports 3000, 3001, and 3002.
- Verification: The automated crawler inspected 92 routes without finding a retired port in rendered HTML.

### QA-002 — Scrolling civic wire was duplicated for assistive technology

- Severity: P2
- Status: Verified locally
- Role: Both
- Route: Global header
- Steps:
  1. Inspect the accessibility tree or read the header with a screen reader.
- Expected: One concise, navigable list of current wire items.
- Actual: One animated copy was exposed plus a repeated live-region paragraph containing the same items.
- Resolution: Both visual marquee copies are decorative; one hidden semantic list carries the links without an intrusive live region.
- Verification: The visual track is `aria-hidden`, its cloned links are removed from the tab order, and the semantic list remains keyboard-navigable.

### QA-003 — Civic-wire accessible copy produced doubled punctuation

- Severity: P3
- Status: Verified locally
- Role: Both
- Route: Global header
- Actual: Item labels ending in punctuation were joined with another period.
- Resolution: The accessible representation is now a semantic list rather than a punctuation-joined paragraph.
- Verification: Browser inspection found one semantic ticker list and no exposed duplicate copy.

### QA-004 — Fresh PowerShell could not run project tests

- Severity: P2
- Status: Verified locally
- Role: Developer
- Preconditions: Node is absent from the shell's `PATH`.
- Expected: A documented QA command locates the bundled workspace runtime.
- Actual: `pnpm test` failed before tests began.
- Resolution: `scripts/run-local-qa.ps1` resolves the bundled Node and pnpm executables and prepends Node for child processes.
- Verification: The one-command runner completed from a PowerShell process without relying on a preconfigured Node path.

### QA-005 — Automated civic workflow accumulated fixture data

- Severity: P1
- Status: Verified locally
- Role: Citizen test fixture
- Route: Worker integration workflow
- Expected: The same test begins and ends with an empty fixture.
- Actual: Assignments, CCU, goals, enrollment, appointment, Harm, sessions, assessment attempts, and ledger entries accumulated.
- Resolution: A test-only reset deletes mutable fixture artifacts, resets activation and CCU state, preserves all citizens, and runs before/after civic QA. Transparency Ledger events remain because the ledger is append-only; their fixture civic ID and actor label keep them auditable and distinguishable from citizen activity.
- Verification: Repeated runs began at the baseline, completed the full workflow, and restored the mutable fixture state afterward.

### QA-008 — Test-citizen activation inherited a stale certificate number

- Severity: P1
- Status: Verified locally
- Role: Citizen test fixture
- Route: `/login`
- Expected: A reset fixture can always be activated with the documented test certificate.
- Actual: A previous workflow left a generated certificate number in the local activation record, so a later activation could not use the documented value.
- Resolution: The fixture reset now restores `USV-2026-000000000001` together with the rest of the activation baseline.
- Verification: Browser activation and the automated 101-question Immigration assessment both passed after reset.

### QA-009 — Mobile header and portal content could create horizontal overflow

- Severity: P2
- Status: Verified locally
- Role: Both
- Routes: Global header, `/login`, and `/portal`
- Expected: No horizontal page scrolling at an Android-sized viewport.
- Actual: Legacy ticker positioning overlapped the navigation; the login panel could exceed the viewport; and the civic breadcrumb extended past the right edge.
- Resolution: The ticker returns to document flow, the header clips decorative overflow, the mobile navigation stays on one line, the login panel can shrink, and the breadcrumb wraps.
- Verification: Browser inspection at a 312-pixel effective viewport reported no horizontal overflow on the homepage, login, or signed-out portal.

### QA-010 — Local Transparency Ledger bypassed the local Worker proxy

- Severity: P1
- Status: Verified locally
- Role: Both
- Route: `/transparency-ledger`
- Expected: Local development reads the local D1 ledger through `/api/civic`.
- Actual: The component used the public Worker URL directly and displayed a resting/offline state despite the local Worker being healthy.
- Resolution: The Ledger now resolves its API at request time and uses the same-origin proxy on localhost.
- Verification: The local page loaded population `1`, 56 Ledger entries, UTC status time, Utopian reference dates, and its independent scroll region without console errors.
