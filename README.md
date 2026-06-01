# ReviewFly

Multi-tenant SaaS where small businesses collect AI-generated Google reviews via QR code, with a built-in sentiment gate that routes unhappy customers to WhatsApp.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript (strict)
- **Database**: PostgreSQL (native local, Supabase free tier in production)
- **DB Driver**: `postgres` (porsager) — parameterised tagged templates
- **Migrations**: Prisma (schema-only; runtime queries use `postgres` driver)
- **Auth**: Custom JWT (access + rotating refresh) — vendor-independent
- **Validation**: Zod
- **Logging**: pino with PII redaction
- **Styling**: Tailwind CSS with design tokens (Material 3-inspired)
- **Testing**: Vitest
- **Package Manager**: pnpm
- **Deployment**: Vercel (target)

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 15+ running locally

## Quick Start

```powershell
# 1. Install dependencies
pnpm install

# 2. Copy env template (then fill DATABASE_URL + secrets)
copy .env.example .env.local

# 3. Generate Prisma client
pnpm prisma:generate

# 4. Apply first migration (creates base tables)
pnpm prisma:migrate

# 5. Start dev server
pnpm dev

# Open http://localhost:3000
# Health: http://localhost:3000/api/v1/health
```

## Project Structure

```
reviewfly/
├── app/                     Next.js App Router (pages + API routes)
│   ├── api/v1/health/       Health endpoint (DB ping)
│   ├── layout.tsx           Root layout
│   └── page.tsx             Marketing placeholder
├── lib/
│   ├── env.ts               Zod env validator (fail-fast)
│   ├── db.ts                Postgres client (porsager)
│   ├── logger.ts            pino with PII redaction
│   └── adapters/            Interface-only swap layer
│       ├── ai/              Gemini, OpenAI, ...
│       ├── storage/         R2, S3, local
│       ├── rate-limit/      Upstash, memory
│       ├── email/           Resend, console
│       └── payments/        Razorpay
├── prisma/
│   └── schema.prisma        DB schema (5 base tables in Phase 0)
├── middleware.ts            Subdomain resolution
├── components/              UI components (CVL phase)
└── tests/                   Vitest unit + integration
```

## Environment Variables

See [.env.example](./.env.example) for the canonical list. Required at startup; the app fails to boot if any are missing or use placeholder values in production.

**Never commit `.env`, `.env.local`, or any non-example env file.**

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript no-emit check |
| `pnpm test` | Vitest run |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Apply migrations (dev) |
| `pnpm prisma:studio` | Open Prisma Studio |

## Status

Phase 0 (Bootstrap) in progress. See [PROGRESS.md](./PROGRESS.md).

## License

Proprietary. All rights reserved.
