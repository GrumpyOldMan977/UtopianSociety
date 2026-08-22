import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const wrangler = resolve(workspace, "node_modules/wrangler/bin/wrangler.js");
const config = resolve(workspace, "cloudflare/civic-ledger/wrangler.local.jsonc");
const database = "utopian-civic-v3-local";

export async function runLocalD1(args, { capture = false } = {}) {
  const commandArgs = [
    wrangler,
    "d1",
    "execute",
    database,
    "--config",
    config,
    "--local",
    ...args,
  ];

  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, commandArgs, {
      cwd: workspace,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Local D1 command failed with exit code ${code}.${stderr ? `\n${stderr}` : ""}`));
        return;
      }
      resolvePromise({ stdout, stderr });
    });
  });
}

export const paths = {
  workspace,
  resetSql: resolve(workspace, "cloudflare/civic-ledger/local/reset-workflow-test.sql"),
  seedSql: resolve(workspace, "cloudflare/civic-ledger/local/seed.sql"),
};
