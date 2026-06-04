# ReviewFly — Progress Tracker

Updated at the end of every working session. Anti-hallucination rule: when memory and this file conflict, **this file wins**.

---

## Current Phase

**Phase 2 IN PROGRESS — auth completion + owner surface + impersonation + universal pool curation + platform audit log** as of 2026-06-04.

Delivered this session (commits `7b7b0ba`, `fbaeb0f`, `6339d10`, `beda032`):
- Phase 2 auth completion:
  - Forgot/reset password endpoints + UI pages; hashed single-use tokens (30-min TTL); reset revokes all refresh tokens; new `password_reset_tokens` table + migration `20260604121000_phase2_auth_recovery_google`.
  - Google Sign-In: `/api/v1/auth/google/start` + `/callback` with signed httpOnly state cookie, Google JWKS id_token verification, internal-only `next` redirect sanitization, surface-aware routing (`/owner/*` uses `platform_users`, `/admin/*` uses `business_users`).
  - Account-security form for tenant admin (email + password self-update) with current-password verification, tenant-level email uniqueness, and refresh-token revocation on password change.
  - Password policy minimum lowered from 12 → 8 chars (still requires upper, lower, digit); test updated.
- Platform-owner surface (foundation for SRS Phase 5):
  - JWT `scope` claim (`tenant` | `platform`) + optional `impersonated_by` / `read_only` claims; `getCurrentUser` rejects platform tokens; new `getCurrentPlatformUser` helper.
  - `/owner/login` (password + Google), `/owner/dashboard`, `/owner/tenants`, `/owner/audit-log`, `/owner/pools` pages with dedicated sidebar layout + logout.
  - Owner APIs: tenants list, suspend/restore (audit-logged), read-only impersonation with mandatory reason (10-min TTL; `tenant_impersonated` audit), universal prompt pools CRUD with vertical-leak guard (SRS §16.4), platform-wide audit log read.
- Tenant impersonation safety: read-only flag blocks ALL tenant mutation routes (settings, profile, tags, flow steps, flow reorder) with `READ_ONLY` 403; admin shell shows banner.
- Tenant audit log surface: `/api/v1/admin/audit-log` + `/admin/audit-log` page + sidebar link.
- CI: tenant-scope SQL guard (`scripts/check-tenant-scope.mjs`) wired into new GitHub Actions workflow (`.github/workflows/ci.yml`) running lint → tenant-scope → typecheck → tests → build.
- Bootstrap script: `scripts/bootstrap-owner-admin.ts` to seed an owner email across selected tenants + platform.

Gates at session end: lint ✅, typecheck ✅, tests 33/33 ✅.

**Next**: Phase 2 closeout (2-account IDOR integration suite, same-email multi-tenant deterministic resolution / tenant picker), then SRS Phase 4 (billing skeleton) or Phase 6 hardening (CSRF double-submit, refresh-reuse alerts, file-upload sniffing, Lighthouse targets).

## Locked Decisions

| Area | Decision | Source |
|---|---|---|
| Frontend | Next.js 16 (Turbopack) + React 19.2 + TS strict | SRS §5 + ADR-0002 |
| Database (local) | Native PostgreSQL | Playbook §8 |
| Database (free prod) | Supabase Postgres | SRS §5 |
| Database (paid/scale) | Managed Postgres on AWS/GCP/Azure | Playbook §8 |
| ORM | Prisma 7 (schema-only) + `@prisma/adapter-pg` + `postgres` (runtime) | SRS §5 + ADR-0002 |
| Auth | Custom JWT (jose) + bcryptjs | SRS §11 |
| Storage | Cloudflare R2 (prod), local FS (dev) | SRS §5 |
| Cache + rate-limit | Upstash Redis (prod), memory (dev) | SRS §5 |
| Email | Resend (prod), console (dev) | SRS §5 |
| Payments | Razorpay (Phase 4+) | SRS §5 |
| AI | Gemini primary, OpenAI fallback | SRS §5 |
| Logging | pino with PII redaction (synchronous custom writer) | SRS §5 |
| Testing | Vitest unit + integration | SRS §5 |
| UI tokens | Tailwind 4 `@theme` CSS-only config; Material-3-inspired | SRS §23.3 + ADR-0003 |
| UI primitives | `StarRow`, `ChoiceCard`, `ProgressBar`, `Card`, `Button`, `Input` | ADR-0003 |
| Per-tenant theme | `--brand-color` CSS var consumed by `bg-brand`/`text-brand`/`border-brand` utilities | ADR-0003 |
| Inline-style policy | Allowed ONLY for dynamic CSS-variable injection; never for visual properties | ADR-0003 |
| Hosting | Vercel | SRS §5 |
| Package manager | pnpm | SRS §5 |
| ESLint config | Flat config (`eslint.config.mjs`) | ADR-0002 |

## Phase 0 Checklist

- [x] Folder structure scaffolded
- [x] `.gitignore` (excludes master files + docs/ + env)
- [x] `package.json` with deps
- [x] `tsconfig.json` strict mode + path aliases
- [x] `next.config.ts` with security headers
- [x] Tailwind config (now CSS-only `@theme` in `app/globals.css`)
- [x] ESLint flat config (`eslint.config.mjs`)
- [x] `.env.example` with all required vars
- [x] `lib/env.ts` Zod fail-fast validator + production guard
- [x] `lib/db.ts` postgres driver client
- [x] `lib/logger.ts` synchronous custom writer with PII redaction
- [x] 5 adapter interfaces (ai, storage, rate-limit, email, payments)
- [x] `prisma/schema.prisma` with base tables
- [x] `prisma.config.ts` (Prisma 7 datasource location)
- [x] App skeleton: layout, page, error, not-found, loading
- [x] `/api/v1/health` endpoint (GET + HEAD)
- [x] `middleware.ts` subdomain resolution + `x-pathname` header
- [x] `README.md` clean-machine quick-start
- [x] `PROGRESS.md` (this file)
- [x] `docs/ADR/0001-tech-stack.md`
- [x] `docs/ADR/0002-stack-upgrade-next16-tailwind4-prisma7.md`
- [x] `docs/ADR/0003-ui-design-system.md`
- [x] `TECHNICAL_DEBT.md`
- [x] `pnpm install` executed
- [x] `dotenv-cli` added for Prisma env loading
- [x] Local Postgres reviewfly database created
- [x] First migration applied (20260601072441_init)
- [x] `pnpm typecheck` green
- [x] `pnpm lint` green
- [x] `pnpm test` green (33/33)
- [x] `pnpm dev` boots cleanly (~1.2s cold compile with Turbopack)
- [x] Health endpoint returns 200 `{"status":"ok","db":"up"}`
- [x] Git first commit (Phase 0 — `3783801`)

## Completed Phases

- [x] **Phase 0** — Bootstrap (`3783801`)
- [x] **Phase 1a** — CVL: uniqueness engine + reviewer flow + OpenAI (`e6079c9`)
- [x] **Phase 1b** — Custom JWT auth + admin UI (`fe1f508`)
- [x] **Phase 1c** — Starter pack on register (`94761a4`)
- [x] **Phase 1d** — Visual flow builder + Phase 1d.5 universal capability + stack upgrade (`0ae3592`)
- [x] **UI overhaul** — NSG-grade design system + zero-inline-style rule (`71b3ced`)
- [~] **Phase 2 (in progress)** — Auth completion + owner surface + impersonation + Phase 3 pool curation + Phase 5 platform audit log (`7b7b0ba`, `fbaeb0f`, `6339d10`, `beda032`)

## Pending Decisions (deferred, not blocking)

| Item | Owner | Deadline |
|---|---|---|
| Validation evidence (5 user conversations) | Suresh | Before MVP launch |
| Competitor analysis (formal write-up) | Suresh | Before MVP |
| Cost model lock (AI cost per review) | Suresh | Before Phase 4 (billing) |
| Analytics event taxonomy lock | Suresh | Before MVP |
| Data ownership rules | Suresh | Before SaaS conversion |
| Logo + brand kit + favicon | Suresh | Before MVP |
| Backup + recovery plan | Suresh | Before paid tier |
| SLA / SLO targets | Suresh | Before paid tier |
| Privacy Policy + ToS + Cookie policy | Suresh | Before public launch |

## Blockers

None.

## Open Risks

See `TECHNICAL_DEBT.md` for tracked workarounds. Top-of-mind risks:

1. **AI cost per tenant unknown** — Phase 2/4 must close before billing tier launches.
2. **In-memory rate limiter still in dev path** (TD-003) — production wiring (Upstash) deferred until first paying tenant.
3. **No analytics event taxonomy yet** (TD-004) — `review_events` writes ad-hoc event_type strings.
4. **Soft-deleted flow_steps accumulate** (TD-001) — cleanup job pending.
5. **No formal integration test suite** (TD-005) — only smoke + unit today.
6. **No backup tested** — Supabase free-tier auto-backup only; restore drill not yet rehearsed.

## Next Session

Resume options (pick one before starting):

1. **Phase 2 closeout** — 2-account IDOR integration test suite across every admin/owner endpoint; same-email multi-tenant deterministic login resolution (tenant picker / subdomain-based).
2. **Phase 4 billing skeleton** — plans/limits editor, Razorpay subscription create flow stub + webhook with HMAC + idempotency.
3. **Phase 6 hardening** — CSRF double-submit cookie, refresh-token reuse alerts wired to Sentry, file-upload magic-byte sniffing, Lighthouse targets.
4. **Analytics taxonomy (TD-004)** — lock `event_type` vocabulary, add CSV export.

## Session Log

| Date | Session goal | Outcome |
|---|---|---|
| 2026-06-01 | Phase 0 scaffold + verify | Done. 22 files, install + migrate + dev + health 200. Two small fixes mid-flight (Prisma shadowDB, env empty-string handling). |
| 2026-06-01 | Phase 1a CVL: engine + reviewer flow | Done. 33 new files. Real OpenAI integration verified — two distinct reviews generated end-to-end for nsg-academy seed tenant. Tests 11/11. |
| 2026-06-01 | Phase 1b: auth + admin UI | Done. 32 new files. Custom JWT + rotating refresh + admin pages (login, dashboard, settings, tags). Tests 14/14. |
| 2026-06-01 | Phase 1c: starter pack on register | Done. 4 new files. `packs/academy/starter-pack.json` + `industry-pack-loader` service. Tests 18/18. |
| 2026-06-01 | Phase 1d: visual flow builder | Done. 10 new files. `/admin/flow` + FlowBuilder + StepCard + StepEditor (slide-in) + MobilePreview. 4 new API endpoints. Tests 24/24. |
| 2026-06-01 | Phase 1d.5: universal flow capability | Done. `lib/flow-runner/template.ts` (token interpolation), inline option descriptions, rating scale config, condition builder UI. Tests 33/33. |
| 2026-06-01 | Stack upgrade (Next 16 / React 19.2 / Tailwind 4 / Prisma 7) | Done. Cold compile dropped from 22-26s (Next 15 + Webpack) to ~1.2s (Next 16 + Turbopack). Tailwind 4 `--spacing-*` token collision discovered (see ADR-0003); all `max-w-*` callsites switched to arbitrary values. Tests 33/33. |
| 2026-06-01 | UI overhaul to NSG-grade | Done. Design tokens, `<StarRow>`/`<ChoiceCard>`/`<ProgressBar>` primitives, sticky branded reviewer header, gradient progress bar, per-tenant `--brand-color` CSS var, inline Tag edit form, admin sidebar polish. Zero visual inline styles. Tests 33/33. |
| 2026-06-04 | Phase 2 auth completion + owner surface + impersonation + Phase 3 pools + Phase 5 platform audit log | Done. 4 commits (`7b7b0ba`, `fbaeb0f`, `6339d10`, `beda032`). Forgot/reset, Google Sign-In, account-security form, password policy min 8, JWT scope + impersonation claims, owner pages + APIs, read-only mutation guards across tenant routes, tenant + platform audit log read, universal pools CRUD with vertical-leak guard, CI workflow + tenant-scope SQL guard. Lint/typecheck/tests 33/33 green. |

## Quality Gate Status

All gates green at end of every committed phase:

- [x] Lint passes
- [x] Type-check passes
- [x] Unit tests pass (33/33)
- [x] Build passes
- [x] Migration + seed sanity pass
- [x] No secrets in code or git history
- [ ] Integration tests on critical APIs (only smoke level today — formal suite due before MVP, see TD-005)
- [ ] Security scan (deferred to hardening phase)

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
