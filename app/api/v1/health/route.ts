/**
 * Health endpoint.
 *
 * - GET + HEAD both supported (uptime pingers use HEAD).
 * - Validates env (already done at import time via lib/env).
 * - Pings DB with `SELECT 1`.
 * - Returns:
 *     200  { status: "ok", db: "up", env: "...", uptime: <seconds> }
 *     503  { status: "degraded", db: "down" }
 *
 * Never expose stack traces or internal error messages.
 */

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const startedAt = Date.now();

export async function GET() {
  let dbOk = false;
  try {
    await sql`SELECT 1`;
    dbOk = true;
  } catch (err) {
    logger.error({ err }, "health: db ping failed");
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    db: dbOk ? "up" : "down",
    env: env.APP_ENV,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}

export async function HEAD() {
  try {
    await sql`SELECT 1`;
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
