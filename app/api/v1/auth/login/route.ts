import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { LoginSchema } from "@/lib/validators/auth";
import * as usersRepo from "@/lib/repositories/business-users";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { verifyPassword } from "@/lib/auth/password";
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
  void env; // ensure env validates at module load
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body", code: "BAD_JSON" },
      { status: 400 },
    );
  }
  const parsed = LoginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION" },
      { status: 422 },
    );
  }

  const user = await usersRepo.findByEmail(parsed.data.email);
  // Always run verifyPassword (with null hash if user not found) — timing-safe.
  const ok = await verifyPassword(
    parsed.data.password,
    user?.password_hash ?? null,
  );
  if (!user || !ok) {
    // Identical response for wrong-email vs wrong-password (anti-enumeration).
    return NextResponse.json(
      { error: "invalid email or password", code: "INVALID_CREDENTIALS" },
      { status: 401 },
    );
  }

  try {
    const access = await signAccessToken({
      userId: user.id,
      tenantId: user.business_id,
      role: user.role,
    });
    const ipHash = req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    const { rawToken } = await issueNewFamily({
      userId: user.id,
      userAgent: req.headers.get("user-agent"),
      ipHash: ipHash ? sha256Hex(ipHash) : null,
    });

    await setAccessCookie(access);
    await setRefreshCookie(rawToken);
    await setCsrfCookie(crypto.randomUUID());

    void usersRepo.touchLogin(user.id);
    void auditRepo.record({
      businessId: user.business_id,
      actorUserId: user.id,
      entityType: "session",
      action: "login",
      ipHash: ipHash ? sha256Hex(ipHash) : null,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.business_id,
      },
    });
  } catch (err) {
    logger.error({ err }, "login: unexpected error");
    return NextResponse.json(
      { error: "internal error", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
