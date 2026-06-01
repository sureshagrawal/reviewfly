import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";

// Manually load .env.local for test runs so files that import lib/env.ts
// (which validates at module load) don't blow up. Vitest does NOT pick up
// .env.local automatically the way Next.js does.
function loadEnvLocal() {
  const path = resolve(__dirname, ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf-8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip trailing inline comments (# starting after whitespace).
    const hashIdx = value.search(/\s+#/);
    if (hashIdx !== -1) value = value.slice(0, hashIdx).trim();
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "app/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
