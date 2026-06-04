import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_COOKIE_OAUTH_NEXT,
  AUTH_COOKIE_OAUTH_STATE,
} from "@/lib/constants/auth";
import { env } from "@/lib/env";
import { buildGoogleAuthUrl } from "@/lib/auth/google-oauth";

export async function GET(req: NextRequest) {
  if (
    !env.GOOGLE_OAUTH_CLIENT_ID ||
    !env.GOOGLE_OAUTH_CLIENT_SECRET ||
    !env.GOOGLE_OAUTH_REDIRECT_URI
  ) {
    return NextResponse.json(
      { error: "google oauth not configured", code: "OAUTH_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const requestedNext = req.nextUrl.searchParams.get("next") ?? "/admin/dashboard";
  const nextPath = requestedNext.startsWith("/") ? requestedNext : "/admin/dashboard";
  const state = randomUUID();
  const jar = await cookies();

  jar.set(AUTH_COOKIE_OAUTH_STATE, state, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });

  jar.set(AUTH_COOKIE_OAUTH_NEXT, nextPath, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });

  const authUrl = buildGoogleAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
