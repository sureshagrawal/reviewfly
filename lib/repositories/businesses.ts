import { sql } from "@/lib/db";

/**
 * Business repository — tenant resolution.
 * Slug lookups are public (reviewer flow); all others require auth context.
 */

export type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  industry_code: string;
  plan_tier: string;
  status: string;
};

export async function findBySlug(slug: string): Promise<BusinessRow | null> {
  const rows = await sql<BusinessRow[]>`
    SELECT id, slug, name, industry_code, plan_tier, status
    FROM businesses
    WHERE slug = ${slug}
      AND deleted_at IS NULL
      AND status IN ('trial', 'active')
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findById(id: string): Promise<BusinessRow | null> {
  const rows = await sql<BusinessRow[]>`
    SELECT id, slug, name, industry_code, plan_tier, status
    FROM businesses
    WHERE id = ${id} AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function create(input: {
  slug: string;
  name: string;
  industryCode: string;
  planTier?: string;
}): Promise<string> {
  const rows = await sql<Array<{ id: string }>>`
    INSERT INTO businesses (
      id, slug, name, industry_code, plan_tier, status
    ) VALUES (
      gen_random_uuid(),
      ${input.slug},
      ${input.name},
      ${input.industryCode},
      ${input.planTier ?? "trial"},
      'trial'
    )
    RETURNING id
  `;
  return rows[0]!.id;
}

export async function existsBySlug(slug: string): Promise<boolean> {
  const rows = await sql<Array<{ id: string }>>`
    SELECT id FROM businesses WHERE slug = ${slug} LIMIT 1
  `;
  return rows.length > 0;
}
