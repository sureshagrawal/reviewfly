# ReviewFly — Progress Tracker

Updated at the end of every working session. Anti-hallucination rule: when memory and this file conflict, **this file wins**.

---

## Current Phase

**Phase 1d.5 — Universal flow capability COMPLETE** as of 2026-06-01.
Tenant can now build any review-collection flow without code:
- Token interpolation (`{step_key}` in label/helper/info body)
- Inline option descriptions (`Name | Description` per line)
- Configurable rating scale (3/5/10 stars)
- Conditional show/hide via editor UI (no JSON required)
Next: MVP polish (branding, favicon, mobile QA) or Phase 2 (SaaS conversion).

## Locked Decisions

| Area | Decision | Source |
|---|---|---|
| Frontend | Next.js 15 + React 19 + TS strict | SRS §5 |
| Database (local) | Native PostgreSQL | Playbook §8 |
| Database (free prod) | Supabase Postgres | SRS §5 |
| Database (paid/scale) | Managed Postgres on AWS/GCP/Azure | Playbook §8 |
| ORM | Prisma (schema-only) + `postgres` driver (runtime) | SRS §5 |
| Auth | Custom JWT (vendor-independent) | SRS §11 |
| Storage | Cloudflare R2 (prod), local FS (dev) | SRS §5 |
| Cache + rate-limit | Upstash Redis (prod), memory (dev) | SRS §5 |
| Email | Resend (prod), console (dev) | SRS §5 |
| Payments | Razorpay (Phase 4+) | SRS §5 |
| AI | Gemini primary, OpenAI fallback | SRS §5 |
| Logging | pino with PII redaction | SRS §5 |
| Testing | Vitest unit + integration | SRS §5 |
| UI tokens | Material 3 expressive-inspired | SRS §23.3 |
| Hosting | Vercel | SRS §5 |
| Package manager | pnpm | SRS §5 |

## Phase 0 Checklist

- [x] Folder structure scaffolded
- [x] `.gitignore` (excludes master files + docs/ + env)
- [x] `package.json` with deps
- [x] `tsconfig.json` strict mode + path aliases
- [x] `next.config.ts` with security headers
- [x] `tailwind.config.ts` with design tokens
- [x] `.eslintrc.json` baseline rules
- [x] `.env.example` with all required vars
- [x] `lib/env.ts` Zod fail-fast validator + production guard
- [x] `lib/db.ts` postgres driver client
- [x] `lib/logger.ts` pino with PII redaction
- [x] 5 adapter interfaces (ai, storage, rate-limit, email, payments)
- [x] `prisma/schema.prisma` with 5 base tables (Industry, Plan, Business, BusinessUser, PlatformUser)
- [x] App skeleton: layout, page, error, not-found, loading
- [x] `/api/v1/health` endpoint (GET + HEAD)
- [x] `middleware.ts` subdomain resolution skeleton
- [x] `README.md` clean-machine quick-start
- [x] `PROGRESS.md` (this file)
- [x] `docs/ADR/0001-tech-stack.md`
- [x] `pnpm install` executed (456 packages)
- [x] `dotenv-cli` added for Prisma env loading
- [x] Local Postgres reviewfly database created
- [x] First migration applied (20260601072441_init)
- [x] `pnpm typecheck` green
- [x] `pnpm lint` green
- [x] `pnpm test` green (1 smoke test)
- [x] `pnpm dev` boots cleanly
- [x] Health endpoint returns 200 `{"status":"ok","db":"up"}`
- [ ] Git first commit (awaiting human confirmation)

## Phase 0 — Verified

End-to-end smoke test passed on 2026-06-01:
- DB connection works through `lib/db.ts` postgres driver
- Env validator catches missing/invalid vars at startup
- Next.js dev server serves health endpoint with status 200
- Five base tables present in `reviewfly` Postgres database

## Pending Decisions (deferred, not blocking)

| Item | Owner | Deadline |
|---|---|---|
| Validation evidence (5 user conversations) | Suresh | Before CVL launch |
| Competitor analysis | Suresh | Before MVP |
| Cost model lock (AI cost per review) | Suresh | Before Phase 4 (billing) |
| Analytics event taxonomy | Suresh | Before MVP |
| Data ownership rules | Suresh | Before SaaS conversion |

## Blockers

None.

## Next Session

1. Decide on git init + first commit (master files + docs/ stay local per `.gitignore`).
2. Begin Phase 1 — Core Value Loop (CVL):
   - Migrations for `flow_steps`, `business_tags`, `business_settings`, `prompt_pools`, `prompt_templates`, `fallback_templates`, `review_events`, `ai_usage`, `audit_logs`.
   - `<DynamicFlowRunner>` reviewer component with 7 step types.
   - Uniqueness engine end-to-end: pools → dimension pick → prompt build → AI call → response.
   - Seed three hypothetical academies with different flows.

## Session Log

| Date | Session goal | Outcome |
|---|---|---|
| 2026-06-01 | Phase 0 scaffold + verify | Done. 22 files, install + migrate + dev + health 200. Two small fixes mid-flight (Prisma shadowDB, env empty-string handling). |
| 2026-06-01 | Phase 1a CVL: engine + reviewer flow | Done. 33 new files. Real OpenAI integration verified — two distinct reviews generated end-to-end for nsg-academy seed tenant. Lint/typecheck/tests all green (11/11). |
| 2026-06-01 | Phase 1b: auth + admin UI | Done. 32 new files. Custom JWT + rotating refresh + admin pages (login, dashboard, settings, tags). Verified login→me + settings GET/PUT + tags CRUD all 200. Tests 14/14. |
| 2026-06-01 | Phase 1c: starter pack on register | Done. 4 new files. packs/academy/starter-pack.json + industry-pack-loader service. /auth/register now auto-applies pack so /r/<slug> works immediately. Tests 18/18. |
| 2026-06-01 | Phase 1d: visual flow builder | Done. 10 new files. /admin/flow page with FlowBuilder + StepCard + StepEditor (slide-in panel) + MobilePreview. 4 new API endpoints (GET/POST/PUT/DELETE/reorder). Tests 24/24. |
| 2026-06-01 | Phase 1d.5: universal flow capability | Done. lib/flow-runner/template.ts (token interpolation), inline option descriptions, rating scale config, condition builder UI. Same capability as polished competitor flows (e.g. review.nsgacademy.in) minus pure cosmetic icons. Tests 33/33. |

## Phase 1a — CVL Deliverables

- Schema: 5 new tables (`business_settings`, `business_tags`, `flow_steps`, `prompt_pools`, `review_events`)
- Repositories: 6 (`businesses`, `business-settings`, `business-tags`, `flow-steps`, `prompt-pools`, `review-events`)
- AI adapters: `openai`, `mock`, factory
- Uniqueness engine: 6 files (seed, dimension-picker, alias-substitution, prompt-builder, fallback-selector, index)
- Flow runner helpers: condition-evaluator, step-registry
- API routes: `/api/v1/review/generate`, `/api/v1/review/event`, `/api/v1/flow/[slug]`
- Reviewer pages: `/r/[slug]`, `/r/[slug]/post`
- Reviewer components: `DynamicFlowRunner`, `ReviewPostPage`, 7 step components, session helper
- Seed script: nsg-academy tenant with 3 courses, 3 staff, 3-step flow, 27 universal pool entries
- Unit tests: dimension-picker (3), alias-substitution (2), condition-evaluator (5), smoke (1) = 11 total

## Live demo

- URL: `http://localhost:3000/r/nsg-academy`
- Generate API verified: 2 sequential calls returned distinct AI-authored reviews via OpenAI gpt-4o-mini.
