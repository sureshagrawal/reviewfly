import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

/**
 * Access-token JWT (short-lived, HS256).
 *
 * Claims:
 *   sub          → business_users.id
 *   tenant       → business.id
 *   role         → owner | admin | viewer
 *   iat, exp, jti
 */

export type AccessClaims = {
  sub: string;
  tenant: string;
  role: string;
  scope?: "tenant" | "platform";
  impersonated_by?: string;
  read_only?: boolean;
  jti?: string;
  iat?: number;
  exp?: number;
};

const ENC = new TextEncoder();
const SECRET = ENC.encode(env.JWT_ACCESS_SECRET);

export async function signAccessToken(claims: {
  userId: string;
  tenantId: string;
  role: string;
  scope?: "tenant" | "platform";
  impersonatedBy?: string;
  readOnly?: boolean;
  ttlSeconds?: number;
}): Promise<string> {
  return new SignJWT({
    sub: claims.userId,
    tenant: claims.tenantId,
    role: claims.role,
    scope: claims.scope ?? "tenant",
    ...(claims.impersonatedBy ? { impersonated_by: claims.impersonatedBy } : {}),
    ...(claims.readOnly ? { read_only: true } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${claims.ttlSeconds ?? env.JWT_ACCESS_TTL_SECONDS}s`)
    .setJti(crypto.randomUUID())
    .sign(SECRET);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ["HS256"] });
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const tenant = typeof payload.tenant === "string" ? payload.tenant : null;
    const role = typeof payload.role === "string" ? payload.role : null;
    const scope =
      payload.scope === "platform" || payload.scope === "tenant"
        ? payload.scope
        : "tenant";
    if (!sub || !tenant || !role) return null;
    return {
      sub,
      tenant,
      role,
      scope,
      impersonated_by:
        typeof payload["impersonated_by"] === "string"
          ? (payload["impersonated_by"] as string)
          : undefined,
      read_only: payload["read_only"] === true,
      jti: typeof payload.jti === "string" ? payload.jti : undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
