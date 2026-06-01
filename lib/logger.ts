/**
 * Structured JSON logger (pino) with PII redaction.
 *
 * - Required fields auto-added per log entry: level, time, env.
 * - Sensitive keys are redacted before serialization.
 * - Uses pino's synchronous stream (no worker thread) to avoid the
 *   `pino-pretty` MODULE_NOT_FOUND noise in Next.js dev.
 *   In production, JSON logs go straight to stdout (Vercel/Render aggregate).
 *   In dev, a small inline formatter renders them readable in the terminal.
 */

import pino from "pino";
import { env } from "@/lib/env";

const isDev = env.NODE_ENV !== "production";

// Inline dev formatter that runs in the same thread (no worker).
// Pino's destination contract is `{ write(msg: string) }` where msg is a
// newline-terminated JSON string. We parse it back and pretty-print.
function makeDevStream() {
  const lvlNames: Record<number, string> = {
    10: "trace",
    20: "debug",
    30: "info",
    40: "warn",
    50: "error",
    60: "fatal",
  };
  return {
    write(line: string): void {
      let obj: {
        level?: number;
        time?: number;
        msg?: string;
        err?: { message?: string; stack?: string };
        [k: string]: unknown;
      };
      try {
        obj = JSON.parse(line.trim()) as typeof obj;
      } catch {
        process.stdout.write(line);
        return;
      }
      const lvl = lvlNames[obj.level ?? 30] ?? "info";
      const t = obj.time
        ? new Date(obj.time).toISOString().slice(11, 23)
        : "";
      const { level: _l, time: _t, msg, err, ...rest } = obj;
      void _l;
      void _t;
      const writer =
        lvl === "error" || lvl === "fatal"
          ? console.error
          : lvl === "warn"
          ? console.warn
          : // eslint-disable-next-line no-console
            console.log;
      const extras = Object.keys(rest).length ? " " + JSON.stringify(rest) : "";
      writer(`[${t}] ${lvl} ${msg ?? ""}${extras}`);
      if (err) writer(err.stack ?? err.message ?? "");
    },
  };
}

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    base: { env: env.APP_ENV },
    redact: {
      paths: [
        "password",
        "passwordHash",
        "password_hash",
        "token",
        "accessToken",
        "refreshToken",
        "authorization",
        "cookie",
        "set-cookie",
        "email",
        "phone",
        "ip",
        "secret",
        "apiKey",
        "api_key",
        "*.password",
        "*.token",
        "*.secret",
        "headers.authorization",
        "headers.cookie",
        "req.headers.authorization",
        "req.headers.cookie",
      ],
      censor: "[REDACTED]",
    },
  },
  isDev ? makeDevStream() : process.stdout,
);

export type Logger = typeof logger;
