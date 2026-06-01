import { NextResponse, type NextRequest } from "next/server";
import * as usersRepo from "@/lib/repositories/business-users";
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

  const user = await usersRepo.findById(result.userId);
  if (!user) {
    await clearAuthCookies();
    return NextResponse.json(
      { error: "user no longer exists", code: "USER_GONE" },
      { status: 401 },
    );
  }
  const access = await signAccessToken({
    userId: user.id,
    tenantId: user.business_id,
    role: user.role,
  });
  await setAccessCookie(access);
  await setRefreshCookie(result.rawToken);
  return NextResponse.json({ ok: true });
}
