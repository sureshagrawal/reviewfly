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

export type TagCreate = {
  category: string;
  name: string;
  description: string | null;
  tag_type: string;
  aliases: string[];
  content_hints: string[];
  display_order: number;
};

export async function create(
  businessId: string,
  input: TagCreate,
): Promise<string> {
  const rows = await sql<Array<{ id: string }>>`
    INSERT INTO business_tags (
      id, business_id, category, name, description, tag_type,
      aliases, content_hints, display_order
    ) VALUES (
      gen_random_uuid(),
      ${businessId},
      ${input.category},
      ${input.name},
      ${input.description},
      ${input.tag_type},
      ${input.aliases},
      ${input.content_hints},
      ${input.display_order}
    )
    RETURNING id
  `;
  return rows[0]!.id;
}

export type TagUpdate = Partial<TagCreate> & { is_active?: boolean };

export async function update(
  businessId: string,
  tagId: string,
  patch: TagUpdate,
): Promise<void> {
  // Fetch-merge-write is simpler than building a dynamic SET clause.
  const existing = await findById(businessId, tagId);
  if (!existing) return;
  const merged = {
    category: patch.category ?? existing.category,
    name: patch.name ?? existing.name,
    description:
      patch.description !== undefined ? patch.description : existing.description,
    tag_type: patch.tag_type ?? existing.tag_type,
    aliases: patch.aliases ?? existing.aliases,
    content_hints: patch.content_hints ?? existing.content_hints,
    display_order: patch.display_order ?? existing.display_order,
    is_active: patch.is_active ?? existing.is_active,
  };
  await sql`
    UPDATE business_tags SET
      category = ${merged.category},
      name = ${merged.name},
      description = ${merged.description},
      tag_type = ${merged.tag_type},
      aliases = ${merged.aliases},
      content_hints = ${merged.content_hints},
      display_order = ${merged.display_order},
      is_active = ${merged.is_active},
      updated_at = NOW()
    WHERE id = ${tagId} AND business_id = ${businessId} AND deleted_at IS NULL
  `;
}

export async function softDelete(
  businessId: string,
  tagId: string,
): Promise<void> {
  await sql`
    UPDATE business_tags
       SET deleted_at = NOW(), is_active = false, updated_at = NOW()
     WHERE id = ${tagId} AND business_id = ${businessId} AND deleted_at IS NULL
  `;
}

export async function findById(
  businessId: string,
  tagId: string,
): Promise<BusinessTagRow | null> {
  const rows = await sql<BusinessTagRow[]>`
    SELECT id, business_id, category, name, description, tag_type,
           aliases, content_hints, metadata_json, display_order, is_active
    FROM business_tags
    WHERE id = ${tagId} AND business_id = ${businessId} AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ?? null;
}
