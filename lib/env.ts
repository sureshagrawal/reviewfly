/**
 * Environment variable validator (fail-fast at startup).
 *
 * - All required vars validated via Zod.
 * - Bad/missing vars throw a clear error on import.
 * - Never reads `.env` or `.env.local` directly; relies on Next.js runtime
 *   environment (which loads `.env*` files itself).
 *
 * See `.env.example` for the canonical variable list.
 */

import { z } from "zod";

const NodeEnv = z.enum(["development", "test", "staging", "production"]);
const LogLevel = z.enum(["trace", "debug", "info", "warn", "error", "fatal"]);
const StorageBackend = z.enum(["local", "r2", "s3"]);
const EmailBackend = z.enum(["console", "resend"]);
const RateLimitBackend = z.enum(["memory", "upstash"]);
const AIProvider = z.enum(["openai", "gemini", "mock"]);

/** Treat empty strings as undefined for optional fields. */
const optStr = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());
const optUrl = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().url().optional(),
);
const optEmail = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().email().optional(),
);

const envSchema = z.object({
  // App
  NODE_ENV: NodeEnv.default("development"),
  APP_NAME: z.string().min(1).default("ReviewFly"),
  APP_ENV: NodeEnv.default("development"),
  LOG_LEVEL: LogLevel.default("info"),

  // URLs
  APP_URL: z.string().url(),
  APP_ROOT_DOMAIN: z.string().min(1),
  OWNER_SUBDOMAIN: z.string().min(1).default("owner"),
  ALLOWED_ORIGINS: z.string().min(1),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: optUrl,

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be >= 32 chars"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be >= 32 chars"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),
  ENABLE_REGISTER: z
    .preprocess(
      (v) => (typeof v === "string" ? v.toLowerCase() === "true" : Boolean(v)),
      z.boolean(),
    )
    .default(false),
  COOKIE_DOMAIN: optStr,
  COOKIE_SECURE: z
    .preprocess(
      (v) => (typeof v === "string" ? v.toLowerCase() === "true" : Boolean(v)),
      z.boolean(),
    )
    .default(false),

  // OAuth (optional)
  GOOGLE_OAUTH_CLIENT_ID: optStr,
  GOOGLE_OAUTH_CLIENT_SECRET: optStr,
  GOOGLE_OAUTH_REDIRECT_URI: optUrl,

  // Cache & rate-limit
  RATE_LIMIT_BACKEND: RateLimitBackend.default("memory"),
  REDIS_URL: optStr,
  UPSTASH_REDIS_REST_URL: optUrl,
  UPSTASH_REDIS_REST_TOKEN: optStr,

  // Storage
  STORAGE_BACKEND: StorageBackend.default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./.uploads"),
  R2_ACCOUNT_ID: optStr,
  R2_ACCESS_KEY_ID: optStr,
  R2_SECRET_ACCESS_KEY: optStr,
  R2_BUCKET_NAME: optStr,
  R2_PUBLIC_URL: optUrl,

  // Email
  EMAIL_BACKEND: EmailBackend.default("console"),
  RESEND_API_KEY: optStr,
  EMAIL_FROM: optEmail.default("noreply@reviewfly.app"),

  // AI
  AI_PROVIDER: AIProvider.default("mock"),
  AI_MODEL: z.string().default("gpt-4o-mini"),
  GEMINI_API_KEY: optStr,
  OPENAI_API_KEY: optStr,
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(400),

  // Payments
  RAZORPAY_KEY_ID: optStr,
  RAZORPAY_KEY_SECRET: optStr,
  RAZORPAY_WEBHOOK_SECRET: optStr,

  // Monitoring
  SENTRY_DSN: optStr,
  SENTRY_ENVIRONMENT: z.string().default("development"),

  // Cron
  CRON_SECRET: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(16).optional(),
  ),
});

function parseEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration. Fix the following and restart:\n${issues}\n` +
        `See .env.example for the canonical variable list.`,
    );
  }

  // Production guard: forbid placeholder secrets in production.
  if (parsed.data.NODE_ENV === "production") {
    const forbidden = ["replace-with", "localhost", "changeme", "example"];
    const sensitive = {
      JWT_ACCESS_SECRET: parsed.data.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET,
      DATABASE_URL: parsed.data.DATABASE_URL,
    };
    for (const [key, value] of Object.entries(sensitive)) {
      if (forbidden.some((bad) => value.toLowerCase().includes(bad))) {
        throw new Error(
          `Production guard: ${key} contains placeholder/localhost value.`,
        );
      }
    }
  }

  return parsed.data;
}

export const env = parseEnv();
export type Env = typeof env;
