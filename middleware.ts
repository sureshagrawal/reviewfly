/**
 * Edge middleware — subdomain resolution skeleton.
 *
 * Phase 0: identifies the subdomain (`<slug>.reviewfly.app`) and attaches it
 * as `x-tenant-slug` header. Actual DB lookup + tenant injection comes in CVL.
 *
 * Path-based routing for owner subdomain (`owner.reviewfly.app`).
 */

import { NextResponse, type NextRequest } from "next/server";

export const config = {
  // Skip _next, static assets, favicon.
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const rootDomain = process.env.APP_ROOT_DOMAIN ?? "localhost";
  const ownerSubdomain = process.env.OWNER_SUBDOMAIN ?? "owner";

  // Strip root domain to find subdomain (if any).
  let subdomain: string | null = null;
  if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.slice(0, -1 * (rootDomain.length + 1));
  } else if (hostname === rootDomain) {
    subdomain = null;
  }

  const res = NextResponse.next();

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
