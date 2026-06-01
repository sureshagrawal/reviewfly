/**
 * Industry pack loader — clones a starter pack into a newly-created tenant.
 *
 * Source of truth: `packs/<industry>/starter-pack.json`.
 * Applied during /api/v1/auth/register and during seed scripts.
 *
 * Idempotent: if the tenant already has flow_steps, this is a no-op (safe to
 * call after register, after seed, or via an admin "reset to defaults" button).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as flowStepsRepo from "@/lib/repositories/flow-steps";
import * as businessTagsRepo from "@/lib/repositories/business-tags";
import { sql } from "@/lib/db";
import { logger } from "@/lib/logger";

export type StarterPack = {
  $schema: string;
  industry: string;
  name: string;
  description?: string;
  settings_overrides?: {
    poster_tagline?: string | null;
    hard_fallback?: string | null;
    brand_color?: string | null;
  };
  tags: Array<{
    category: string;
    name: string;
    description?: string | null;
    tag_type?: string;
    aliases?: string[];
    content_hints?: string[];
    display_order?: number;
  }>;
  flow_steps: Array<{
    step_order: number;
    step_key: string;
    step_type: string;
    question_label: string;
    helper_text?: string | null;
    config_json?: Record<string, unknown>;
    condition_json?: Record<string, unknown> | null;
    is_required?: boolean;
    inject_into_prompt?: boolean;
  }>;
};

const PACK_CACHE = new Map<string, StarterPack>();

export function loadPack(industry: string): StarterPack {
  const cached = PACK_CACHE.get(industry);
  if (cached) return cached;
  const path = resolve(process.cwd(), "packs", industry, "starter-pack.json");
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw) as StarterPack;
  PACK_CACHE.set(industry, parsed);
  return parsed;
}

/**
 * Apply a starter pack to a tenant. Idempotent: skips if flow_steps already exist.
 * Returns true if pack was applied; false if skipped.
 */
export async function applyToTenant(
  businessId: string,
  industry: string,
): Promise<boolean> {
  const existingSteps = await flowStepsRepo.countByBusiness(businessId);
  if (existingSteps > 0) {
    logger.info(
      { businessId, industry, existingSteps },
      "industry-pack-loader: tenant already has flow_steps; skipping",
    );
    return false;
  }

  let pack: StarterPack;
  try {
    pack = loadPack(industry);
  } catch (err) {
    logger.warn(
      { err, industry },
      "industry-pack-loader: no pack file for industry; using academy fallback",
    );
    pack = loadPack("academy");
  }

  // Settings overrides (optional)
  if (pack.settings_overrides) {
    const o = pack.settings_overrides;
    await sql`
      UPDATE business_settings SET
        poster_tagline = COALESCE(${o.poster_tagline ?? null}, poster_tagline),
        hard_fallback = COALESCE(${o.hard_fallback ?? null}, hard_fallback),
        brand_color = COALESCE(${o.brand_color ?? null}, brand_color),
        updated_at = NOW()
      WHERE business_id = ${businessId}
    `;
  }

  // Tags
  for (const t of pack.tags) {
    await businessTagsRepo.create(businessId, {
      category: t.category,
      name: t.name,
      description: t.description ?? null,
      tag_type: t.tag_type ?? "generic",
      aliases: t.aliases ?? [],
      content_hints: t.content_hints ?? [],
      display_order: t.display_order ?? 0,
    });
  }

  // Flow steps
  await flowStepsRepo.createMany(
    businessId,
    pack.flow_steps.map((s) => ({
      step_order: s.step_order,
      step_key: s.step_key,
      step_type: s.step_type,
      question_label: s.question_label,
      helper_text: s.helper_text ?? null,
      config_json: s.config_json ?? {},
      condition_json: s.condition_json ?? null,
      is_required: s.is_required ?? true,
      inject_into_prompt: s.inject_into_prompt ?? true,
    })),
  );

  logger.info(
    { businessId, industry, tags: pack.tags.length, steps: pack.flow_steps.length },
    "industry-pack-loader: applied starter pack",
  );
  return true;
}
