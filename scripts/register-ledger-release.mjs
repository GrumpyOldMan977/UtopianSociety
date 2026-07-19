import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DEFAULT_API = "https://utopian-civic-ledger.utopian-society-civic.workers.dev";
const manifestPath = resolve(process.argv[2] || "ledger/releases/2026-07-19-ledger-automation.json");
const adminKey = process.env.LEDGER_ADMIN_KEY;
const api = (process.env.CIVIC_LEDGER_API || DEFAULT_API).replace(/\/$/, "");

if (!adminKey) {
  throw new Error("LEDGER_ADMIN_KEY is required. Keep it in the deployment environment, never in the repository.");
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const endpoint = `${api}/v1/admin/releases`;
const waits = [0, 500, 1_500, 3_500];
let lastError;
let completed = false;

for (let attempt = 0; attempt < waits.length; attempt += 1) {
  if (waits[attempt]) await new Promise((resolveWait) => setTimeout(resolveWait, waits[attempt]));
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${adminKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(manifest),
    });
    const result = await response.json();
    if (response.ok) {
      const created = result.entries?.filter((entry) => entry.created).length || 0;
      const existing = (result.entries?.length || 0) - created;
      console.log(`Ledger release ${result.releaseKey} registered: ${created} created, ${existing} already present.`);
      completed = true;
      break;
    }
    const message = result.error || `Ledger registration failed with HTTP ${response.status}.`;
    if (response.status < 500 && response.status !== 429) throw new Error(message);
    lastError = new Error(message);
  } catch (error) {
    lastError = error;
    if (attempt === waits.length - 1) break;
  }
}

if (!completed) throw lastError || new Error("Ledger release registration failed after all retry attempts.");
