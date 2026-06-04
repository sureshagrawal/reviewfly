import { sql } from "@/lib/db";

export type PlatformUserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
};

export async function findByEmail(
  email: string,
): Promise<PlatformUserRow | null> {
  const rows = await sql<PlatformUserRow[]>`
    SELECT id, email, password_hash, role, is_active
    FROM platform_users
    WHERE LOWER(email) = LOWER(${email})
      AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findById(
  id: string,
): Promise<PlatformUserRow | null> {
  const rows = await sql<PlatformUserRow[]>`
    SELECT id, email, password_hash, role, is_active
    FROM platform_users
    WHERE id = ${id}
      AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function touchLogin(id: string): Promise<void> {
  await sql`UPDATE platform_users SET last_login_at = NOW() WHERE id = ${id}`;
}
