/**
 * Edge middleware.
 *
 * - Identifies the subdomain (mostly unused in local dev).
 * - Protects `/admin/*` routes: redirects unauthenticated requests
 *   (no access cookie) to `/admin/login`.
 *
 * Token verification is intentionally skipped here (edge runtime can't run
 * `jose` HS256 verification cheaply). Pages re-verify via `getCurrentUser()`.
 * This middleware is the "cookie-present" gate; pages are the strict gate.
 */

import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_ACCESS } from "@/lib/constants/auth";

export const config = {
  // Skip _next, static assets, favicon.
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};

const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/register",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/owner/login",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const rootDomain = process.env.APP_ROOT_DOMAIN ?? "localhost";
  const ownerSubdomain = process.env.OWNER_SUBDOMAIN ?? "owner";

  // Admin auth gate (page-level only; API routes do their own check)
  if (pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.has(pathname)) {
    const hasCookie = req.cookies.has(AUTH_COOKIE_ACCESS);
    if (!hasCookie) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/owner") && !PUBLIC_ADMIN_PATHS.has(pathname)) {
    const hasCookie = req.cookies.has(AUTH_COOKIE_ACCESS);
    if (!hasCookie) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/owner/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // Subdomain hint (informational; minimal logic in local dev)
  let subdomain: string | null = null;
  if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.slice(0, -1 * (rootDomain.length + 1));
  }

  const res = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(req.headers),
        "x-pathname": pathname,
      }),
    },
  });

  if (subdomain) {
    res.headers.set("x-subdomain", subdomain);
    if (subdomain === ownerSubdomain) {
      res.headers.set("x-surface", "owner");
    } else {
      res.headers.set("x-tenant-slug", subdomain);
      res.headers.set("x-surface", "tenant");
    }
  } else {
    res.headers.set("x-surface", "marketing");
  }

  return res;
}
