import { sql } from "@/lib/db";
import type { ReviewEventType } from "@/lib/constants/step-types";

export async function record(input: {
  businessId: string;
  sessionId: string;
  eventType: ReviewEventType;
  payload?: Record<string, unknown>;
  ipHash?: string;
  uaCategory?: "mobile" | "tablet" | "desktop";
}): Promise<void> {
  // postgres driver's sql.json expects a strict JSONValue shape; cast at the edge.
  const payload = (input.payload ?? {}) as never;
  await sql`
    INSERT INTO review_events (
      business_id, session_id, event_type, payload_json, ip_hash, ua_category
    ) VALUES (
      ${input.businessId},
      ${input.sessionId},
      ${input.eventType},
      ${sql.json(payload)},
      ${input.ipHash ?? null},
      ${input.uaCategory ?? null}
    )
  `;
}
