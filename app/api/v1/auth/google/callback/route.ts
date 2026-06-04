import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_COOKIE_OAUTH_NEXT,
  AUTH_COOKIE_OAUTH_STATE,
} from "@/lib/constants/auth";
import { exchangeCodeAndGetIdentity } from "@/lib/auth/google-oauth";
import {
  setAccessCookie,
  setCsrfCookie,
  setRefreshCookie,
} from "@/lib/auth/cookies";
import { signAccessToken } from "@/lib/auth/jwt";
import { issueNewFamily } from "@/lib/auth/refresh-rotation";
import * as usersRepo from "@/lib/repositories/business-users";
import * as platformUsersRepo from "@/lib/repositories/platform-users";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { sha256Hex } from "@/lib/http";

function redirectWithError(req: NextRequest, code: string): NextResponse {
  const url = new URL("/admin/login", req.url);
  url.searchParams.set("oauth_error", code);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state");
  const code = req.nextUrl.searchParams.get("code");
  if (!state || !code) return redirectWithError(req, "missing_state_or_code");

  const jar = await cookies();
  const storedState = jar.get(AUTH_COOKIE_OAUTH_STATE)?.value;
  const storedNext = jar.get(AUTH_COOKIE_OAUTH_NEXT)?.value ?? "/admin/dashboard";
  const nextPath = storedNext.startsWith("/") ? storedNext : "/admin/dashboard";

  // Single-use state cookies.
  jar.delete(AUTH_COOKIE_OAUTH_STATE);
  jar.delete(AUTH_COOKIE_OAUTH_NEXT);

  if (!storedState || storedState !== state) {
    return redirectWithError(req, "invalid_state");
  }

  try {
    const profile = await exchangeCodeAndGetIdentity(code);
    const isOwnerSurface = nextPath.startsWith("/owner/");

    if (isOwnerSurface) {
      const pUser = await platformUsersRepo.findByEmail(profile.email);
      if (!pUser || !pUser.is_active) {
        const url = new URL("/owner/login", req.url);
        url.searchParams.set("oauth_error", "no_account");
        url.searchParams.set("email", profile.email);
        return NextResponse.redirect(url);
      }

      const access = await signAccessToken({
        userId: pUser.id,
        tenantId: "platform",
        role: pUser.role,
        scope: "platform",
      });
      const ipHash = req.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim();

      const { rawToken } = await issueNewFamily({
        userId: pUser.id,
        userAgent: req.headers.get("user-agent"),
        ipHash: ipHash ? sha256Hex(ipHash) : null,
      });

      await setAccessCookie(access);
      await setRefreshCookie(rawToken);
      await setCsrfCookie(crypto.randomUUID());

      void platformUsersRepo.touchLogin(pUser.id);
      void auditRepo.record({
        businessId: null,
        actorUserId: pUser.id,
        entityType: "session",
        action: "login_google",
        ipHash: ipHash ? sha256Hex(ipHash) : null,
      });

      const redirectUrl = new URL(nextPath, req.url);
      return NextResponse.redirect(redirectUrl);
    }

    const user = await usersRepo.findByEmail(profile.email);
    if (!user) {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("oauth_error", "no_account");
      url.searchParams.set("email", profile.email);
      return NextResponse.redirect(url);
    }

    const access = await signAccessToken({
      userId: user.id,
      tenantId: user.business_id,
      role: user.role,
      scope: "tenant",
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
      action: "login_google",
      ipHash: ipHash ? sha256Hex(ipHash) : null,
    });

    const redirectUrl = new URL(nextPath, req.url);
    return NextResponse.redirect(redirectUrl);
  } catch {
    return redirectWithError(req, "oauth_failed");
  }
}
