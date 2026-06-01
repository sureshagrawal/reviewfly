import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as flowStepsRepo from "@/lib/repositories/flow-steps";
import * as businessTagsRepo from "@/lib/repositories/business-tags";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  const [steps, tags] = await Promise.all([
    flowStepsRepo.listByBusiness(user.tenantId, { activeOnly: true }),
    businessTagsRepo.listByBusiness(user.tenantId),
  ]);
  // Group tags by category for the editor's option-source dropdown.
  const tagsByCategory: Record<string, Array<{ name: string }>> = {};
  for (const t of tags) {
    tagsByCategory[t.category] ??= [];
    tagsByCategory[t.category]!.push({ name: t.name });
  }
  return NextResponse.json({
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
      inject_into_prompt: s.inject_into_prompt,
      is_active: s.is_active,
    })),
    tags_by_category: tagsByCategory,
    categories: Object.keys(tagsByCategory).sort(),
  });
}
