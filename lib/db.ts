/**
 * Postgres database client (porsager/postgres driver).
 *
 * - Tagged-template parameterised queries (no string concat → zero injection surface).
 * - Single shared client instance across the app.
 * - Lazy connection (driver connects on first query).
 *
 * Usage:
 *   import { sql } from "@/lib/db";
 *   const rows = await sql`SELECT * FROM businesses WHERE id = ${id}`;
 */

import postgres from "postgres";
import { env } from "@/lib/env";

declare global {
  var __reviewfly_sql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  return postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // disabled for pgbouncer/transaction-mode pooler compatibility
    onnotice: () => {}, // silence NOTICE messages in logs
  });
}

// Reuse the same client across hot reloads in dev.
export const sql = globalThis.__reviewfly_sql ?? createClient();
if (env.NODE_ENV !== "production") globalThis.__reviewfly_sql = sql;
