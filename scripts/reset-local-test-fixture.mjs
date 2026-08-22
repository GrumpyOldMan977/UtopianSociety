import assert from "node:assert/strict";
import { paths, runLocalD1 } from "./lib/local-wrangler.mjs";

const endpoint = process.env.CIVIC_LEDGER_LOCAL_URL || "http://127.0.0.1:8788";
const origin = process.env.CIVIC_PORTAL_LOCAL_ORIGIN || "http://localhost:9877";
const civicId = "USC-LOCAL-WORKFLOW-TEST";
let sessionToken = "";

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${endpoint}${path}`, {
    method,
    headers: {
      Origin: origin,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};
  assert.ok(response.ok, `${method} ${path} failed: ${result.error || response.status}`);
  return result;
}

async function removeStoredObjects() {
  try {
    const login = await request("/v3/auth/login", {
      method: "POST",
      body: {
        loginName: "LocalWorkflowTest",
        password: "Local workflow test password 2026!",
        certificateNumber: "USV-2026-000000000001",
      },
    });
    sessionToken = login.sessionToken;
    assert.equal(login.civicId, civicId);
    const snapshot = await request("/v3/portal/demo");
    for (const document of snapshot.learning?.documents || []) {
      await request(`/v3/documents/${document.document_id}`, { method: "DELETE" });
    }
    if (snapshot.profile?.hasAvatar) {
      await request("/v3/profile/avatar", { method: "DELETE" });
    }
  } catch (error) {
    console.log(`Stored-object cleanup was skipped: ${error.message}`);
  }
}

await removeStoredObjects();
await runLocalD1(["--file", paths.resetSql], { capture: true });
await runLocalD1(["--file", paths.seedSql], { capture: true });

console.log(JSON.stringify({
  reset: true,
  civicId,
  citizenRecordsModified: false,
  localDatabaseOnly: true,
}, null, 2));
