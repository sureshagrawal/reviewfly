// Prisma 7 config — datasource URL moved here from schema.prisma.
// Loaded by `prisma migrate dev` and `prisma generate`. Runtime queries in
// the app go through `lib/db.ts` (the `postgres` driver), not Prisma client.
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (overrides), then .env (fallback) — matches Next.js.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prefer DIRECT_DATABASE_URL for migrations (bypasses any pooler).
    // Falls back to DATABASE_URL if not set.
    url: process.env["DIRECT_DATABASE_URL"] || process.env["DATABASE_URL"],
  },
});
