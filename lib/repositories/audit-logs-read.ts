import { sql } from "@/lib/db";

export type AuditLogReadRow = {
  id: string;
  business_id: string | null;
  actor_user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_value_json: unknown;
  new_value_json: unknown;
  ip_hash: string | null;
  created_at: Date;
};

export async function listByBusiness(
  businessId: string,
  options: { limit?: number; entityType?: string } = {},
): Promise<AuditLogReadRow[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  if (options.entityType) {
    const rows = await sql<AuditLogReadRow[]>`
      SELECT id::text AS id, business_id, actor_user_id, entity_type, entity_id,
             action, old_value_json, new_value_json, ip_hash, created_at
      FROM audit_logs
      WHERE business_id = ${businessId}
        AND entity_type = ${options.entityType}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows;
  }
  const rows = await sql<AuditLogReadRow[]>`
    SELECT id::text AS id, business_id, actor_user_id, entity_type, entity_id,
           action, old_value_json, new_value_json, ip_hash, created_at
    FROM audit_logs
    WHERE business_id = ${businessId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows;
}
