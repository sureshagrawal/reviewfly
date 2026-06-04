import { sql } from "@/lib/db";

export type FirstOwnerRow = {
  id: string;
  business_id: string;
  email: string;
  role: string;
};

export async function findFirstOwnerForBusiness(
  businessId: string,
): Promise<FirstOwnerRow | null> {
  const rows = await sql<FirstOwnerRow[]>`
    SELECT id, business_id, email, role
    FROM business_users
    WHERE business_id = ${businessId}
      AND deleted_at IS NULL
      AND role IN ('owner', 'admin')
    ORDER BY
      CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
      created_at ASC
    LIMIT 1
  `;
  return rows[0] ?? null;
}
