import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { RegisterSchema } from "@/lib/validators/auth";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import * as businessesRepo from "@/lib/repositories/businesses";
import * as businessSettingsRepo from "@/lib/repositories/business-settings";
import * as usersRepo from "@/lib/repositories/business-users";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { applyToTenant } from "@/lib/services/industry-pack-loader";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueNewFamily } from "@/lib/auth/refresh-rotation";
import {
  setAccessCookie,
  setRefreshCookie,
  setCsrfCookie,
} from "@/lib/auth/cookies";
import { sha256Hex } from "@/lib/http";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  if (!env.ENABLE_REGISTER) {
    return NextResponse.json(
      { error: "registration disabled", code: "REGISTRATION_OFF" },
      { status: 403 },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body", code: "BAD_JSON" },
      { status: 400 },
    );
  }
  const parsed = RegisterSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const policyError = validatePasswordStrength(parsed.data.password);
  if (policyError) {
    return NextResponse.json(
      { error: policyError, code: "WEAK_PASSWORD" },
      { status: 422 },
    );
  }

  // Slug + email uniqueness checks (reveal generic error to avoid enumeration)
  const slugTaken = await businessesRepo.existsBySlug(parsed.data.slug);
  if (slugTaken) {
    return NextResponse.json(
      { error: "this workspace slug is already taken", code: "SLUG_TAKEN" },
      { status: 409 },
    );
  }
  const existing = await usersRepo.findByEmail(parsed.data.email);
  if (existing) {
    return NextResponse.json(
      { error: "this email is already registered", code: "EMAIL_TAKEN" },
      { status: 409 },
    );
  }

  try {
    const businessId = await businessesRepo.create({
      slug: parsed.data.slug,
      name: parsed.data.display_name,
      industryCode: parsed.data.industry_code,
    });
    await businessSettingsRepo.createDefault({
      businessId,
      displayName: parsed.data.display_name,
    });
    // Clone the industry starter pack: tags + flow_steps + settings overrides.
    // Idempotent — skips if tenant already has flow_steps.
    await applyToTenant(businessId, parsed.data.industry_code);
    const passwordHash = await hashPassword(parsed.data.password);
    const userId = await usersRepo.create({
      businessId,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    });

    const access = await signAccessToken({
      userId,
      tenantId: businessId,
      role: parsed.data.role,
    });
    const ipHash = req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    const { rawToken } = await issueNewFamily({
      userId,
      userAgent: req.headers.get("user-agent"),
      ipHash: ipHash ? sha256Hex(ipHash) : null,
    });

    await setAccessCookie(access);
    await setRefreshCookie(rawToken);
    await setCsrfCookie(crypto.randomUUID());

    void auditRepo.record({
      businessId,
      actorUserId: userId,
      entityType: "tenant",
      entityId: businessId,
      action: "register",
      newValue: { slug: parsed.data.slug, email: "redacted" },
      ipHash: ipHash ? sha256Hex(ipHash) : null,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email: parsed.data.email,
        role: parsed.data.role,
        tenant_id: businessId,
        slug: parsed.data.slug,
      },
    });
  } catch (err) {
    logger.error({ err }, "register: unexpected error");
    return NextResponse.json(
      { error: "internal error", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
