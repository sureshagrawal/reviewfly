import { sql } from "@/lib/db";
import type { EngineDimension } from "@/lib/constants/step-types";

export type PromptPoolRow = {
  id: string;
  business_id: string | null;
  dimension: EngineDimension;
  value: string;
  weight: number;
  applies_to_industry: string | null;
};

/**
 * Fetch active pool entries for a given dimension, scoped to:
 *   1. Universal entries (business_id IS NULL)
 *   2. Industry-matched entries (applies_to_industry = business's industry or NULL)
 *   3. Tenant-specific entries (business_id = current tenant)
 *
 * Per-tenant entries are layered on top of universal — both compete in dimension pick.
 */
export async function listForDimension(
  businessId: string,
  industryCode: string,
  dimension: EngineDimension,
): Promise<PromptPoolRow[]> {
  return sql<PromptPoolRow[]>`
    SELECT id, business_id, dimension, value, weight, applies_to_industry
    FROM prompt_pools
    WHERE dimension = ${dimension}
      AND is_active = true
      AND (business_id IS NULL OR business_id = ${businessId})
      AND (applies_to_industry IS NULL OR applies_to_industry = ${industryCode})
  `;
}
