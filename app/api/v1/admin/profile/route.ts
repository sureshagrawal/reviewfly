import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as usersRepo from "@/lib/repositories/business-users";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { verifyPassword, validatePasswordStrength, hashPassword } from "@/lib/auth/password";
import { revokeAllByUserId } from "@/lib/auth/refresh-rotation";
import { AdminProfileUpdateSchema } from "@/lib/validators/profile";
import { sha256Hex } from "@/lib/http";
import { logger } from "@/lib/logger";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const dbUser = await usersRepo.findById(user.userId);
  if (!dbUser) {
    return NextResponse.json(
      { error: "user missing", code: "USER_MISSING" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    profile: {
      email: dbUser.email,
      role: dbUser.role,
    },
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  if (user.readOnly) {
    return NextResponse.json(
      { error: "read-only impersonation session", code: "READ_ONLY" },
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

  const parsed = AdminProfileUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const dbUser = await usersRepo.findById(user.userId);
  if (!dbUser) {
    return NextResponse.json(
      { error: "user missing", code: "USER_MISSING" },
      { status: 404 },
    );
  }

  const passwordOk = await verifyPassword(
    parsed.data.current_password,
    dbUser.password_hash,
  );
  if (!passwordOk) {
    return NextResponse.json(
      { error: "invalid current password", code: "INVALID_PASSWORD" },
      { status: 401 },
    );
  }

  try {
    const oldValue: Record<string, unknown> = {
      email: dbUser.email,
    };
    const newValue: Record<string, unknown> = {};

    if (parsed.data.email && parsed.data.email.toLowerCase() !== dbUser.email.toLowerCase()) {
      const existing = await usersRepo.findByEmailInBusiness(
        user.tenantId,
        parsed.data.email,
      );
      if (existing && existing.id !== dbUser.id) {
        return NextResponse.json(
          { error: "email already used in this workspace", code: "EMAIL_TAKEN" },
          { status: 409 },
        );
      }
      await usersRepo.updateEmail(dbUser.id, parsed.data.email);
      newValue["email"] = parsed.data.email.toLowerCase();
    }

    if (parsed.data.new_password) {
      const policyError = validatePasswordStrength(parsed.data.new_password);
      if (policyError) {
        return NextResponse.json(
          { error: policyError, code: "WEAK_PASSWORD" },
          { status: 422 },
        );
      }
      const passwordHash = await hashPassword(parsed.data.new_password);
      await usersRepo.updatePassword(dbUser.id, passwordHash);
      await revokeAllByUserId(dbUser.id);
      newValue["password_changed"] = true;
    }

    const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    void auditRepo.record({
      businessId: user.tenantId,
      actorUserId: user.userId,
      entityType: "business_user",
      entityId: user.userId,
      action: "profile_updated",
      oldValue,
      newValue,
      ipHash: ipHash ? sha256Hex(ipHash) : null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "profile.update: unexpected error");
    return NextResponse.json(
      { error: "internal error", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
