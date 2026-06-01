/**
 * Structured JSON logger (pino) with PII redaction.
 *
 * - Required fields auto-added per log entry: level, time, env.
 * - Sensitive keys are redacted before serialization.
 * - Pretty output in development; raw JSON in production.
 */

import pino from "pino";
import { env } from "@/lib/env";

const isDev = env.NODE_ENV !== "production";

export const logger = pino({
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
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export type Logger = typeof logger;
