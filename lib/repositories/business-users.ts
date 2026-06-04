import { sql } from "@/lib/db";

export type BusinessUserRow = {
  id: string;
  business_id: string;
  email: string;
  password_hash: string;
  role: string;
};

export async function findByEmail(
  email: string,
): Promise<BusinessUserRow | null> {
  const rows = await sql<BusinessUserRow[]>`
    SELECT id, business_id, email, password_hash, role
    FROM business_users
    WHERE LOWER(email) = LOWER(${email})
      AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findById(
  id: string,
): Promise<BusinessUserRow | null> {
  const rows = await sql<BusinessUserRow[]>`
    SELECT id, business_id, email, password_hash, role
    FROM business_users
    WHERE id = ${id} AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findByEmailInBusiness(
  businessId: string,
  email: string,
): Promise<BusinessUserRow | null> {
  const rows = await sql<BusinessUserRow[]>`
    SELECT id, business_id, email, password_hash, role
    FROM business_users
    WHERE business_id = ${businessId}
      AND LOWER(email) = LOWER(${email})
      AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function touchLogin(id: string): Promise<void> {
  await sql`UPDATE business_users SET last_login_at = NOW() WHERE id = ${id}`;
}

export async function create(input: {
  businessId: string;
  email: string;
  passwordHash: string;
  role: string;
}): Promise<string> {
  const rows = await sql<Array<{ id: string }>>`
    INSERT INTO business_users (
      id, business_id, email, password_hash, role
    ) VALUES (
      gen_random_uuid(),
      ${input.businessId},
      ${input.email.toLowerCase()},
      ${input.passwordHash},
      ${input.role}
    )
    RETURNING id
  `;
  return rows[0]!.id;
}

export async function updatePassword(
  userId: string,
  passwordHash: string,
): Promise<void> {
  await sql`
    UPDATE business_users
       SET password_hash = ${passwordHash}, updated_at = NOW()
     WHERE id = ${userId} AND deleted_at IS NULL
  `;
}

export async function updateEmail(
  userId: string,
  email: string,
): Promise<void> {
  await sql`
    UPDATE business_users
       SET email = ${email.toLowerCase()}, updated_at = NOW()
     WHERE id = ${userId} AND deleted_at IS NULL
  `;
}
