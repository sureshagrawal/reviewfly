/**
 * SingleChoiceStep — large card-style picker, NSG-grade UI.
 *
 * Options come from inline list (with optional descriptions) or from
 * business_tags. Each option renders via the shared ChoiceCard primitive.
 */
"use client";

import { ChoiceCard } from "@/components/ui/ChoiceCard";

type Option = { name: string; description: string | null };

function resolveOptions(
  config: Record<string, unknown>,
  tagsByCategory: Record<string, Array<{ name: string; description: string | null }>>,
): Option[] {
  const src = (config.options_source as string | undefined) ?? "inline";
  if (src === "business_tags") {
    const cat = (config.category as string | undefined) ?? "";
    return tagsByCategory[cat] ?? [];
  }
  const inline = (config.options as Array<{ name: string; description?: string }> | undefined) ?? [];
  return inline.map((o) => ({ name: o.name, description: o.description ?? null }));
}

function initial(s: string): string {
  const t = s.trim();
  return t.length > 0 ? (t[0] ?? "").toUpperCase() : "?";
}

export function SingleChoiceStep(props: {
  config: Record<string, unknown>;
  tagsByCategory: Record<string, Array<{ name: string; description: string | null }>>;
  value: string;
  onChange: (v: string) => void;
}) {
  const options = resolveOptions(props.config, props.tagsByCategory);
  return (
    <div className="flex flex-col gap-sm" role="radiogroup">
      {options.map((opt) => (
        <ChoiceCard
          key={opt.name}
          role="radio"
          title={opt.name}
          description={opt.description}
          icon={initial(opt.name)}
          selected={props.value === opt.name}
          onClick={() => props.onChange(opt.name)}
        />
      ))}
    </div>
  );
}
