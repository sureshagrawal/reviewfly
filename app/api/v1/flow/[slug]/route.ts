import { NextResponse } from "next/server";
import * as businessesRepo from "@/lib/repositories/businesses";
import * as businessSettingsRepo from "@/lib/repositories/business-settings";
import * as flowStepsRepo from "@/lib/repositories/flow-steps";
import * as businessTagsRepo from "@/lib/repositories/business-tags";

/**
 * Public reviewer-flow endpoint.
 * Returns: tenant identity, settings, ordered flow steps, and all active tags
 * grouped by category. Reviewer page server-fetches this on first paint.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const business = await businessesRepo.findBySlug(slug);
  if (!business) {
    return NextResponse.json(
      { error: "business not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const [settings, steps, tags] = await Promise.all([
    businessSettingsRepo.findByBusinessId(business.id),
    flowStepsRepo.listByBusiness(business.id),
    businessTagsRepo.listByBusiness(business.id),
  ]);

  if (!settings) {
    return NextResponse.json(
      { error: "tenant misconfigured", code: "NO_SETTINGS" },
      { status: 500 },
    );
  }

  // Group tags by category for option-source lookups.
  const tagsByCategory: Record<string, Array<{ name: string; description: string | null }>> = {};
  for (const t of tags) {
    tagsByCategory[t.category] ??= [];
    tagsByCategory[t.category]!.push({ name: t.name, description: t.description });
  }

  return NextResponse.json({
    business: {
      id: business.id,
      slug: business.slug,
      name: business.name,
    },
    settings: {
      display_name: settings.display_name,
      logo_url: settings.logo_url,
      brand_color: settings.brand_color,
      google_review_url: settings.google_review_url,
      whatsapp_number: settings.whatsapp_number,
    },
    steps: steps.map((s) => ({
      id: s.id,
      step_order: s.step_order,
      step_key: s.step_key,
      step_type: s.step_type,
      question_label: s.question_label,
      helper_text: s.helper_text,
      config_json: s.config_json,
      condition_json: s.condition_json,
      is_required: s.is_required,
    })),
    tags_by_category: tagsByCategory,
  });
}
