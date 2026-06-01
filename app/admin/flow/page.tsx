import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as flowStepsRepo from "@/lib/repositories/flow-steps";
import * as businessTagsRepo from "@/lib/repositories/business-tags";
import { FlowBuilder } from "@/components/admin/FlowBuilder";

export const dynamic = "force-dynamic";

export default async function FlowBuilderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const [steps, tags] = await Promise.all([
    flowStepsRepo.listByBusiness(user.tenantId, { activeOnly: true }),
    businessTagsRepo.listByBusiness(user.tenantId),
  ]);
  const tagsByCategory: Record<string, Array<{ name: string; description: string | null }>> = {};
  for (const t of tags) {
    tagsByCategory[t.category] ??= [];
    tagsByCategory[t.category]!.push({ name: t.name, description: t.description });
  }

  return (
    <div className="p-lg max-w-[72rem]">
      <header className="mb-lg">
        <h1 className="text-h1 text-neutral-900">Flow Builder</h1>
        <p className="text-caption text-neutral-700">
          Design the questions reviewers answer before AI generates their review
        </p>
      </header>
      <FlowBuilder
        initialSteps={steps.map((s) => ({
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
        }))}
        tagsByCategory={tagsByCategory}
        categories={Object.keys(tagsByCategory).sort()}
      />
    </div>
  );
}
