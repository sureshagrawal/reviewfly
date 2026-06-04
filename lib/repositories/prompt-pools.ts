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

export type UniversalPoolRow = PromptPoolRow & {
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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

export async function listUniversal(options: {
  dimension?: EngineDimension;
  industry?: string;
  limit?: number;
} = {}): Promise<UniversalPoolRow[]> {
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500);
  return sql<UniversalPoolRow[]>`
    SELECT id, business_id, dimension, value, weight, applies_to_industry,
           is_active, created_at, updated_at
    FROM prompt_pools
    WHERE business_id IS NULL
      ${options.dimension ? sql`AND dimension = ${options.dimension}` : sql``}
      ${options.industry ? sql`AND (applies_to_industry IS NULL OR applies_to_industry = ${options.industry})` : sql``}
    ORDER BY dimension ASC, value ASC
    LIMIT ${limit}
  `;
}

export async function findUniversalById(id: string): Promise<UniversalPoolRow | null> {
  const rows = await sql<UniversalPoolRow[]>`
    SELECT id, business_id, dimension, value, weight, applies_to_industry,
           is_active, created_at, updated_at
    FROM prompt_pools
    WHERE id = ${id} AND business_id IS NULL
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createUniversal(input: {
  dimension: EngineDimension;
  value: string;
  weight: number;
  appliesToIndustry: string | null;
}): Promise<string> {
  const rows = await sql<Array<{ id: string }>>`
    INSERT INTO prompt_pools (
      id, business_id, dimension, value, weight, applies_to_industry, is_active
    ) VALUES (
      gen_random_uuid(),
      NULL,
      ${input.dimension},
      ${input.value},
      ${input.weight},
      ${input.appliesToIndustry},
      true
    )
    RETURNING id
  `;
  return rows[0]!.id;
}

export async function updateUniversal(
  id: string,
  patch: {
    value?: string;
    weight?: number;
    appliesToIndustry?: string | null;
    isActive?: boolean;
  },
): Promise<void> {
  const existing = await findUniversalById(id);
  if (!existing) return;
  const merged = {
    value: patch.value ?? existing.value,
    weight: patch.weight ?? existing.weight,
    appliesToIndustry:
      patch.appliesToIndustry !== undefined
        ? patch.appliesToIndustry
        : existing.applies_to_industry,
    isActive: patch.isActive ?? existing.is_active,
  };
  await sql`
    UPDATE prompt_pools SET
      value = ${merged.value},
      weight = ${merged.weight},
      applies_to_industry = ${merged.appliesToIndustry},
      is_active = ${merged.isActive},
      updated_at = NOW()
    WHERE id = ${id} AND business_id IS NULL
  `;
}

export async function deleteUniversal(id: string): Promise<void> {
  await sql`DELETE FROM prompt_pools WHERE id = ${id} AND business_id IS NULL`;
}
