import { readAccessCookie } from "./cookies";
import { verifyAccessToken, type AccessClaims } from "./jwt";

export type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
  impersonatedBy?: string;
  readOnly?: boolean;
};

/**
 * Server-side helper. Returns the current authenticated user or null.
 * Use in admin API routes and admin pages.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await readAccessCookie();
  if (!token) return null;
  const claims = await verifyAccessToken(token);
  if (!claims) return null;
  if (claims.scope === "platform") return null;
  return {
    userId: claims.sub,
    tenantId: claims.tenant,
    role: claims.role,
    impersonatedBy: claims.impersonated_by,
    readOnly: claims.read_only,
  };
}

/** Strict variant — throws if not authenticated. */
export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}

export type _AccessClaims = AccessClaims;
