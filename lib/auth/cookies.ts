import { cookies } from "next/headers";
import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  AUTH_COOKIE_CSRF,
} from "@/lib/constants/auth";
import { env } from "@/lib/env";

/**
 * Cookie helpers — central place to set/clear auth cookies with correct flags.
 *
 * All cookies are:
 *   - HttpOnly (where applicable)
 *   - Secure   (in production; controlled by COOKIE_SECURE env)
 *   - SameSite=Lax (acceptable default for cross-domain GET safety)
 *   - Domain   (optional; from COOKIE_DOMAIN env)
 *
 * Per repeat-mistake rule #11: all three flags always set.
 */

const baseOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax" as const,
  path: "/",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
});

export async function setAccessCookie(token: string) {
  const jar = await cookies();
  jar.set(AUTH_COOKIE_ACCESS, token, {
    ...baseOptions(),
    maxAge: env.JWT_ACCESS_TTL_SECONDS,
  });
}

export async function setRefreshCookie(token: string) {
  const jar = await cookies();
  jar.set(AUTH_COOKIE_REFRESH, token, {
    ...baseOptions(),
    maxAge: env.JWT_REFRESH_TTL_SECONDS,
  });
}

/** CSRF token cookie — readable from client JS (httpOnly: false). */
export async function setCsrfCookie(token: string) {
  const jar = await cookies();
  jar.set(AUTH_COOKIE_CSRF, token, {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: env.JWT_REFRESH_TTL_SECONDS,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE_ACCESS);
  jar.delete(AUTH_COOKIE_REFRESH);
  jar.delete(AUTH_COOKIE_CSRF);
}

export async function readAccessCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE_ACCESS)?.value;
}

export async function readRefreshCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE_REFRESH)?.value;
}
