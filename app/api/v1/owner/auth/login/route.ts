import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import * as platformUsersRepo from "@/lib/repositories/platform-users";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueNewFamily } from "@/lib/auth/refresh-rotation";
import { setAccessCookie, setCsrfCookie, setRefreshCookie } from "@/lib/auth/cookies";
import { sha256Hex } from "@/lib/http";

const OwnerLoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body", code: "BAD_JSON" }, { status: 400 });
  }

  const parsed = OwnerLoginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request body", code: "VALIDATION" }, { status: 422 });
  }

  const user = await platformUsersRepo.findByEmail(parsed.data.email);
  const ok = await verifyPassword(parsed.data.password, user?.password_hash ?? null);
  if (!user || !ok || !user.is_active) {
    return NextResponse.json(
      { error: "invalid email or password", code: "INVALID_CREDENTIALS" },
      { status: 401 },
    );
  }

  const access = await signAccessToken({
    userId: user.id,
    tenantId: "platform",
    role: user.role,
    scope: "platform",
  });
  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const { rawToken } = await issueNewFamily({
    userId: user.id,
    userAgent: req.headers.get("user-agent"),
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });

  await setAccessCookie(access);
  await setRefreshCookie(rawToken);
  await setCsrfCookie(crypto.randomUUID());

  void platformUsersRepo.touchLogin(user.id);
  void auditRepo.record({
    businessId: null,
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
      scope: "platform",
    },
  });
}
