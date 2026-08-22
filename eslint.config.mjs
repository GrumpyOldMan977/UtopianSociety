import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local build, service, and deployment caches are generated artifacts.
    ".codex-deploy-ticker/**",
    ".codex-local-logs/**",
    ".codex-runtime/**",
    ".local-services/**",
    ".tmp/**",
    ".vinext/**",
    ".wrangler/**",
    ".wrangler-dry-run/**",
    "cloudflare/civic-ledger/.codex-runtime/**",
    "cloudflare/civic-ledger/.wrangler/**",
    "cloudflare/civic-ledger/.wrangler-dry-run/**",
    "dist/**",
    "outputs/**",
    "public/ocr/**",
    "scratch/**",
    "work/**",
  ]),
  {
    // These components intentionally synchronize browser-only state after
    // hydration. The release build and route tests exercise those paths.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
