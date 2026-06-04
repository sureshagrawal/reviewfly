import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as businessesRepo from "@/lib/repositories/businesses";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { findFirstOwnerForBusiness } from "@/lib/repositories/business-users-extras";
import { signAccessToken } from "@/lib/auth/jwt";
import { setAccessCookie, setCsrfCookie } from "@/lib/auth/cookies";
import { sha256Hex } from "@/lib/http";

const ImpersonateSchema = z.object({
  reason: z.string().trim().min(8).max(500),
});

const WRITE_ROLES = new Set(["platform_owner", "super_admin", "support"]);
const IMPERSONATION_TTL_SECONDS = 600;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentPlatformUser();
  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  if (!WRITE_ROLES.has(session.role)) {
    return NextResponse.json(
      { error: "forbidden", code: "FORBIDDEN" },
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

  const parsed = ImpersonateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "reason must be 8-500 chars", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const p = await params;
  const tenant = await businessesRepo.findById(p.id);
  if (!tenant) {
    return NextResponse.json(
      { error: "tenant not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const targetUser = await findFirstOwnerForBusiness(tenant.id);
  if (!targetUser) {
    return NextResponse.json(
      { error: "tenant has no admin user to impersonate", code: "NO_TARGET" },
      { status: 409 },
    );
  }

  const access = await signAccessToken({
    userId: targetUser.id,
    tenantId: tenant.id,
    role: targetUser.role,
    scope: "tenant",
    impersonatedBy: session.userId,
    readOnly: true,
    ttlSeconds: IMPERSONATION_TTL_SECONDS,
  });

  await setAccessCookie(access);
  await setCsrfCookie(crypto.randomUUID());

  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  void auditRepo.record({
    businessId: tenant.id,
    actorUserId: session.userId,
    entityType: "business",
    entityId: tenant.id,
    action: "tenant_impersonated",
    newValue: {
      target_user_id: targetUser.id,
      reason: parsed.data.reason,
      ttl_seconds: IMPERSONATION_TTL_SECONDS,
    },
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });

  return NextResponse.json({
    ok: true,
    redirect: "/admin/dashboard",
    expires_in_seconds: IMPERSONATION_TTL_SECONDS,
  });
}
