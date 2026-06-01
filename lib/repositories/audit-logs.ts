import { sql } from "@/lib/db";
import type { AuditAction } from "@/lib/constants/auth";

export async function record(input: {
  businessId?: string | null;
  actorUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: AuditAction;
  oldValue?: unknown;
  newValue?: unknown;
  ipHash?: string | null;
}): Promise<void> {
  const oldVal = (input.oldValue ?? null) as never;
  const newVal = (input.newValue ?? null) as never;
  await sql`
    INSERT INTO audit_logs (
      business_id, actor_user_id, entity_type, entity_id, action,
      old_value_json, new_value_json, ip_hash
    ) VALUES (
      ${input.businessId ?? null},
      ${input.actorUserId ?? null},
      ${input.entityType},
      ${input.entityId ?? null},
      ${input.action},
      ${input.oldValue !== undefined ? sql.json(oldVal) : null},
      ${input.newValue !== undefined ? sql.json(newVal) : null},
      ${input.ipHash ?? null}
    )
  `;
}
