import { sql } from "@/lib/db";
import type { AuditLogReadRow } from "@/lib/repositories/audit-logs-read";

export async function listPlatformWide(
  options: { limit?: number; entityType?: string } = {},
): Promise<AuditLogReadRow[]> {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  if (options.entityType) {
    return sql<AuditLogReadRow[]>`
      SELECT id::text AS id, business_id, actor_user_id, entity_type, entity_id,
             action, old_value_json, new_value_json, ip_hash, created_at
      FROM audit_logs
      WHERE entity_type = ${options.entityType}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  }
  return sql<AuditLogReadRow[]>`
    SELECT id::text AS id, business_id, actor_user_id, entity_type, entity_id,
           action, old_value_json, new_value_json, ip_hash, created_at
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}
