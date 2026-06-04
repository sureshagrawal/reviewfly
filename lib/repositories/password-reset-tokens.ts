import { createHash, randomBytes } from "node:crypto";
import { sql } from "@/lib/db";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function issueForUser(
  userId: string,
  ttlMinutes = 30,
): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await sql`
    INSERT INTO password_reset_tokens (
      id, user_id, token_hash, expires_at
    ) VALUES (
      gen_random_uuid(),
      ${userId},
      ${hashToken(rawToken)},
      ${expiresAt}
    )
  `;

  return rawToken;
}

export async function consume(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const rows = await sql<Array<{
    id: string;
    user_id: string;
    used_at: Date | null;
    expires_at: Date;
  }>>`
    SELECT id, user_id, used_at, expires_at
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  if (row.used_at) return null;
  if (row.expires_at.getTime() < Date.now()) return null;

  await sql`
    UPDATE password_reset_tokens
       SET used_at = NOW()
     WHERE id = ${row.id}
  `;

  return row.user_id;
}

export async function revokeAllForUser(userId: string): Promise<void> {
  await sql`
    UPDATE password_reset_tokens
       SET used_at = NOW()
     WHERE user_id = ${userId} AND used_at IS NULL
  `;
}
