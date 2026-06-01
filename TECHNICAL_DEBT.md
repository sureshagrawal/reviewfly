# Technical Debt Register

Every temporary workaround, exception, shortcut, manual process, or deferred fix is tracked here.

No production workaround may be shipped without an entry.

Fields per playbook §Technical Debt Register:
1. ID
2. Description
3. Reason
4. Risk (low, medium, high)
5. Sunset trigger
6. Deadline (max 90 days unless ADR-approved)
7. Owner
8. Status

---

## TD-001 — Soft-deleted `flow_steps` rows accumulate forever

- **Description**: Deleting a flow step in the admin UI does NOT remove the row. The repository renames `step_key` with a `__del_<timestamp>` suffix and sets `is_active = false`. This is done so the original `step_key` can be reused immediately by the user without a unique-constraint violation.
- **Reason**: Phase 1d ship deadline; periodic cleanup job not yet built.
- **Risk**: Low. Affects DB row count only; no functional impact. At expected scale (10 steps × 50 tenants × 5 edits/year = 2,500 rows/year) growth is negligible for many years.
- **Sunset trigger**: When any single tenant accumulates >100 soft-deleted flow_steps rows, OR before SaaS conversion (Phase 2) goes live.
- **Deadline**: 2026-08-31.
- **Owner**: Suresh.
- **Status**: Open.
- **Resolution sketch**: Nightly cron OR weekly admin-triggered cleanup that deletes rows where `is_active = false AND updated_at < NOW() - INTERVAL '30 days'`.

## TD-002 — Custom synchronous pino formatter instead of `pino-pretty`

- **Description**: `lib/logger.ts` parses pino's JSON output and pretty-prints synchronously in dev. The standard `pino-pretty` worker thread was removed because it emitted `MODULE_NOT_FOUND` errors in our setup.
- **Reason**: Pragmatic dev-only workaround during stack upgrade (ADR-0002).
- **Risk**: Low. Dev only — production uses the raw pino JSON stream untouched.
- **Sunset trigger**: When `pino-pretty` ships a fix for the worker module resolution under Next 16's bundler.
- **Deadline**: 2026-12-31.
- **Owner**: Suresh.
- **Status**: Open.

## TD-003 — In-memory rate limiter wired in dev

- **Description**: The rate-limit adapter has a memory backend for local dev. Production wiring to Upstash Redis is deferred until first paying tenant.
- **Reason**: Free tier of Upstash is configured but env vars not set in `.env.example` for the production deployment yet. Production deploy itself is post-MVP.
- **Risk**: Medium. The risks file §5.2 explicitly calls out in-memory rate limiting on serverless as a recurring failure mode. Must be addressed before going live on Vercel.
- **Sunset trigger**: Before first production deploy on Vercel.
- **Deadline**: Pre-MVP launch (TBD; SRS targets 12-month launch window).
- **Owner**: Suresh.
- **Status**: Open.

## TD-004 — No analytics event taxonomy yet

- **Description**: `review_events` table accepts free-form `event_type` strings. The reviewer flow currently writes `step_started`, `step_completed`, `ai_generated`, `fallback_used`, `review_edited`, `sentiment_scored`, `post_on_google_clicked`, `negative_feedback`, but no enum / Zod schema constrains this.
- **Reason**: Schema not locked yet; awaiting analytics dashboard design.
- **Risk**: Medium. Typos in event names will silently produce un-queryable rows.
- **Sunset trigger**: Before analytics dashboard (`/admin/analytics`) is built.
- **Deadline**: 2026-09-30.
- **Owner**: Suresh.
- **Status**: Open.

## TD-005 — No formal integration test suite

- **Description**: 33 unit tests pass. There is one smoke test for the health endpoint. There is no formal integration suite that exercises auth → tag CRUD → flow CRUD → reviewer-flow generate end-to-end.
- **Reason**: Manual end-to-end verification has been the validation method during phased delivery.
- **Risk**: Medium. As feature surface grows, manual verification will miss regressions.
- **Sunset trigger**: Before MVP launch.
- **Deadline**: 2026-10-31.
- **Owner**: Suresh.
- **Status**: Open.

## TD-006 — Two intentional `style={...}` callsites for CSS variable injection

- **Description**: `components/ui/ProgressBar.tsx` sets `--progress-value` inline; `app/r/[slug]/page.tsx` sets `--brand-color` inline. Both are CSS-variable bindings, both documented in code.
- **Reason**: Dynamic geometry / per-tenant theming must reach CSS somehow; CSS custom properties via inline style is the React-idiomatic pattern (ADR-0003).
- **Risk**: Low. Documented, narrowly scoped, easily searchable.
- **Sunset trigger**: If React adds first-class CSS variable binding without inline style, or if we adopt CSS-in-JS.
- **Deadline**: No fixed deadline. Re-evaluated each release.
- **Owner**: Suresh.
- **Status**: Accepted-permanent (per ADR-0003).
