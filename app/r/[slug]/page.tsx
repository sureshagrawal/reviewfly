import { notFound } from "next/navigation";
import { headers } from "next/headers";
import * as businessesRepo from "@/lib/repositories/businesses";
import * as businessSettingsRepo from "@/lib/repositories/business-settings";
import * as flowStepsRepo from "@/lib/repositories/flow-steps";
import * as businessTagsRepo from "@/lib/repositories/business-tags";
import { DynamicFlowRunner } from "@/components/reviewer/DynamicFlowRunner";
import type { StepType } from "@/lib/constants/step-types";

export const dynamic = "force-dynamic";

export default async function ReviewerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await businessesRepo.findBySlug(slug);
  if (!business) notFound();

  const [settings, steps, tags] = await Promise.all([
    businessSettingsRepo.findByBusinessId(business.id),
    flowStepsRepo.listByBusiness(business.id),
    businessTagsRepo.listByBusiness(business.id),
  ]);

  if (!settings) notFound();

  // Group tags by category for client-side option resolution.
  const tagsByCategory: Record<string, Array<{ name: string; description: string | null }>> = {};
  for (const t of tags) {
    tagsByCategory[t.category] ??= [];
    tagsByCategory[t.category]!.push({ name: t.name, description: t.description });
  }

  // headers() to mark this as a fully dynamic request (no SSG cache).
  await headers();

  // CSS custom property exposes the per-tenant brand color to ALL descendants
  // via the `bg-brand` / `text-brand` / `border-brand` utilities. This is the
  // single allowed inline style on the reviewer flow — geometry/theming only,
  // never visual properties on individual elements.
  const brandStyle = { ["--brand-color" as string]: settings.brand_color };

  return (
    <main className="min-h-screen bg-gradient-page flex flex-col" style={brandStyle}>
      <header className="bg-neutral-0/85 backdrop-blur border-b border-neutral-200 px-md py-md sticky top-0 z-10">
        <div className="max-w-[640px] mx-auto flex items-center justify-center relative">
          <div className="flex flex-col items-center text-center">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt={settings.display_name}
                className="h-10 w-10 rounded-md object-contain mb-xs"
              />
            ) : (
              <div className="h-10 w-10 rounded-pill bg-brand text-neutral-0 flex items-center justify-center font-semibold mb-xs">
                {settings.display_name.slice(0, 1)}
              </div>
            )}
            <span className="text-h2 font-semibold text-neutral-900 truncate max-w-[20rem]">
              {settings.display_name}
            </span>
            <span className="text-caption text-neutral-700">
              We value your feedback!
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-[640px] w-full mx-auto">
        <DynamicFlowRunner
          businessId={business.id}
          slug={business.slug}
          steps={steps.map((s) => ({
            id: s.id,
            step_order: s.step_order,
            step_key: s.step_key,
            step_type: s.step_type as StepType,
            question_label: s.question_label,
            helper_text: s.helper_text,
            config_json: s.config_json,
            condition_json: s.condition_json,
            is_required: s.is_required,
          }))}
          tagsByCategory={tagsByCategory}
        />
      </div>
    </main>
  );
}
