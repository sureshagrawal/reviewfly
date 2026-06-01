import { sql } from "@/lib/db";

export type BusinessTagRow = {
  id: string;
  business_id: string;
  category: string;
  name: string;
  description: string | null;
  tag_type: string;
  aliases: string[];
  content_hints: string[];
  metadata_json: Record<string, unknown>;
  display_order: number;
  is_active: boolean;
};

export async function listByBusiness(
  businessId: string,
  options: { category?: string; activeOnly?: boolean } = {},
): Promise<BusinessTagRow[]> {
  const activeOnly = options.activeOnly ?? true;
  if (options.category) {
    return sql<BusinessTagRow[]>`
      SELECT id, business_id, category, name, description, tag_type,
             aliases, content_hints, metadata_json, display_order, is_active
      FROM business_tags
      WHERE business_id = ${businessId}
        AND category = ${options.category}
        AND deleted_at IS NULL
        ${activeOnly ? sql`AND is_active = true` : sql``}
      ORDER BY display_order ASC, name ASC
    `;
  }
  return sql<BusinessTagRow[]>`
    SELECT id, business_id, category, name, description, tag_type,
           aliases, content_hints, metadata_json, display_order, is_active
    FROM business_tags
    WHERE business_id = ${businessId}
      AND deleted_at IS NULL
      ${activeOnly ? sql`AND is_active = true` : sql``}
    ORDER BY category ASC, display_order ASC, name ASC
  `;
}

export async function findByNames(
  businessId: string,
  names: string[],
): Promise<BusinessTagRow[]> {
  if (names.length === 0) return [];
  return sql<BusinessTagRow[]>`
    SELECT id, business_id, category, name, description, tag_type,
           aliases, content_hints, metadata_json, display_order, is_active
    FROM business_tags
    WHERE business_id = ${businessId}
      AND name = ANY(${names})
      AND deleted_at IS NULL
      AND is_active = true
  `;
}
