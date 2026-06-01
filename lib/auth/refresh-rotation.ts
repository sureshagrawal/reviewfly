import { createHash, randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Rotating refresh tokens with reuse detection.
 *
 * - Each issued token gets its own row (familyId shared across rotation chain).
 * - On refresh: mark current row used_at + create new row in same family.
 * - On reuse of an already-used token: revoke entire family (compromise signal).
 * - Tokens are stored hashed (sha-256); raw token only sent to the client.
 *
 * Note: in serverless this could be sharded by user — fine for current scale.
 */

export type RefreshIssueResult = {
  rawToken: string;
  familyId: string;
};

function hash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateRaw(): string {
  return randomBytes(48).toString("base64url");
}

export async function issueNewFamily(input: {
  userId: string;
  userAgent?: string | null;
  ipHash?: string | null;
}): Promise<RefreshIssueResult> {
  const rawToken = generateRaw();
  const familyId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000);
  await sql`
    INSERT INTO refresh_tokens (
      id, user_id, family_id, token_hash, user_agent, ip_hash, expires_at
    ) VALUES (
      gen_random_uuid(),
      ${input.userId},
      ${familyId},
      ${hash(rawToken)},
      ${input.userAgent ?? null},
      ${input.ipHash ?? null},
      ${expiresAt}
    )
  `;
  return { rawToken, familyId };
}

export type RotateResult =
  | { ok: true; rawToken: string; userId: string; familyId: string }
  | { ok: false; reason: "not_found" | "expired" | "reuse_detected" };

export async function rotate(
  rawToken: string,
  meta: { userAgent?: string | null; ipHash?: string | null } = {},
): Promise<RotateResult> {
  const tokenHash = hash(rawToken);
  const rows = await sql<
    Array<{
      id: string;
      user_id: string;
      family_id: string;
      used_at: Date | null;
      revoked_at: Date | null;
      expires_at: Date;
    }>
  >`
    SELECT id, user_id, family_id, used_at, revoked_at, expires_at
    FROM refresh_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || row.revoked_at) {
    return { ok: false, reason: "not_found" };
  }
  if (row.expires_at.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (row.used_at) {
    // Reuse detected — revoke the entire family.
    await sql`
      UPDATE refresh_tokens
         SET revoked_at = NOW()
       WHERE family_id = ${row.family_id} AND revoked_at IS NULL
    `;
    return { ok: false, reason: "reuse_detected" };
  }

  // Mark current as used + issue new in same family
  const newRaw = generateRaw();
  const newExpires = new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000);
  await sql.begin(async (tx) => {
    await tx`UPDATE refresh_tokens SET used_at = NOW() WHERE id = ${row.id}`;
    await tx`
      INSERT INTO refresh_tokens (
        id, user_id, family_id, token_hash, user_agent, ip_hash, expires_at
      ) VALUES (
        gen_random_uuid(),
        ${row.user_id},
        ${row.family_id},
        ${hash(newRaw)},
        ${meta.userAgent ?? null},
        ${meta.ipHash ?? null},
        ${newExpires}
      )
    `;
  });
  return { ok: true, rawToken: newRaw, userId: row.user_id, familyId: row.family_id };
}

export async function revokeByRawToken(rawToken: string): Promise<void> {
  const tokenHash = hash(rawToken);
  await sql`
    UPDATE refresh_tokens
       SET revoked_at = NOW()
     WHERE token_hash = ${tokenHash} AND revoked_at IS NULL
  `;
}

export async function revokeFamily(familyId: string): Promise<void> {
  await sql`
    UPDATE refresh_tokens
       SET revoked_at = NOW()
     WHERE family_id = ${familyId} AND revoked_at IS NULL
  `;
}
