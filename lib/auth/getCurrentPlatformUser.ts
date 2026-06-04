import { readAccessCookie } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/jwt";

export type CurrentPlatformUser = {
  userId: string;
  role: string;
};

export async function getCurrentPlatformUser(): Promise<CurrentPlatformUser | null> {
  const token = await readAccessCookie();
  if (!token) return null;
  const claims = await verifyAccessToken(token);
  if (!claims) return null;
  if (claims.scope !== "platform") return null;
  return {
    userId: claims.sub,
    role: claims.role,
  };
}
