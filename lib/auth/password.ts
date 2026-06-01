import bcrypt from "bcryptjs";
import { env } from "@/lib/env";

/**
 * Password hashing helpers. Always go through these — never call bcrypt directly.
 *
 * - Hashing: bcrypt cost from env (>= 10 enforced by schema).
 * - Login-enumeration defense: verify() against a stored hash, OR a dummy hash
 *   when user doesn't exist — both paths take similar time.
 */

const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuvwxyz012345/67890abcdefghijk.";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_COST);
}

export async function verifyPassword(
  plain: string,
  hash: string | null,
): Promise<boolean> {
  if (!hash) {
    // Run against dummy hash to equalise timing (anti-enumeration).
    await bcrypt.compare(plain, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(plain, hash);
}

/** Minimum password policy. */
export function validatePasswordStrength(p: string): string | null {
  if (p.length < 12) return "password must be at least 12 characters";
  if (!/[a-z]/.test(p)) return "password must contain a lowercase letter";
  if (!/[A-Z]/.test(p)) return "password must contain an uppercase letter";
  if (!/[0-9]/.test(p)) return "password must contain a digit";
  return null;
}
