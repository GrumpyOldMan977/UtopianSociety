import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const manifestPath = resolve(root, process.argv[2] || "ledger/releases/2026-07-19-ledger-automation.json");
const manifestName = basename(manifestPath);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (!/^[a-z0-9][a-z0-9:._/-]{2,119}$/i.test(String(manifest.releaseKey || ""))) {
  throw new Error("The release manifest does not contain a valid releaseKey.");
}
if (!Array.isArray(manifest.entries) || manifest.entries.length < 1 || manifest.entries.length > 25) {
  throw new Error("The release manifest must contain between 1 and 25 entries.");
}
if (!/^[A-Za-z0-9._-]+\.json$/.test(manifestName)) {
  throw new Error("The release manifest filename must be a simple JSON filename.");
}

const executable = process.platform === "win32" ? "npx.cmd" : "npx";
const objectPath = `utopian-civic-files/ledger/releases/inbox/${manifestName}`;
const args = [
  "wrangler", "r2", "object", "put", objectPath,
  "--file", manifestPath,
  "--content-type", "application/json",
  "--remote",
  "--force",
  "--config", resolve(root, "cloudflare/civic-ledger/wrangler.jsonc"),
];

await new Promise((resolveRun, rejectRun) => {
  const child = spawn(executable, args, { cwd: root, stdio: "inherit" });
  child.once("error", rejectRun);
  child.once("exit", (code) => {
    if (code === 0) resolveRun();
    else rejectRun(new Error(`Cloudflare R2 release enqueue failed with exit code ${code}.`));
  });
});

console.log(`Queued ${manifest.releaseKey} in the Cloudflare civic release inbox.`);
