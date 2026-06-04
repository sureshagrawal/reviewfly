import { NextResponse, type NextRequest } from "next/server";
import * as usersRepo from "@/lib/repositories/business-users";
import * as platformUsersRepo from "@/lib/repositories/platform-users";
import { signAccessToken } from "@/lib/auth/jwt";
import { rotate } from "@/lib/auth/refresh-rotation";
import {
  readRefreshCookie,
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
} from "@/lib/auth/cookies";
import { sha256Hex } from "@/lib/http";

export async function POST(req: NextRequest) {
  const raw = await readRefreshCookie();
  if (!raw) {
    return NextResponse.json(
      { error: "no refresh token", code: "NO_REFRESH" },
      { status: 401 },
    );
  }
  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const result = await rotate(raw, {
    userAgent: req.headers.get("user-agent"),
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });
  if (!result.ok) {
    if (result.reason === "reuse_detected") {
      await clearAuthCookies();
      return NextResponse.json(
        { error: "session compromised; please log in again", code: "REUSE_DETECTED" },
        { status: 401 },
      );
    }
    await clearAuthCookies();
    return NextResponse.json(
      { error: "session invalid", code: "INVALID_REFRESH" },
      { status: 401 },
    );
  }

  const [tenantUser, platformUser] = await Promise.all([
    usersRepo.findById(result.userId),
    platformUsersRepo.findById(result.userId),
  ]);

  if (!tenantUser && !platformUser) {
    await clearAuthCookies();
    return NextResponse.json(
      { error: "user no longer exists", code: "USER_GONE" },
      { status: 401 },
    );
  }

  const access = tenantUser
    ? await signAccessToken({
        userId: tenantUser.id,
        tenantId: tenantUser.business_id,
        role: tenantUser.role,
        scope: "tenant",
      })
    : await signAccessToken({
        userId: platformUser!.id,
        tenantId: "platform",
        role: platformUser!.role,
        scope: "platform",
      });
  await setAccessCookie(access);
  await setRefreshCookie(result.rawToken);
  return NextResponse.json({ ok: true });
}
