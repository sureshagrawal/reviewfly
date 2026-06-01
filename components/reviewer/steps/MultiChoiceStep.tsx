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
  const inline =
    (config.options as Array<{ name: string; description?: string | null }> | undefined) ?? [];
  return inline.map((o) => ({ name: o.name, description: o.description ?? null }));
}

function initial(s: string): string {
  const t = s.trim();
  return t.length > 0 ? (t[0] ?? "").toUpperCase() : "?";
}

export function MultiChoiceStep(props: {
  config: Record<string, unknown>;
  tagsByCategory: Record<string, Array<{ name: string; description: string | null }>>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const options = resolveOptions(props.config, props.tagsByCategory);
  const maxPicks = Math.max(1, (props.config.max_picks as number | undefined) ?? 5);

  const toggle = (name: string) => {
    if (props.value.includes(name)) {
      props.onChange(props.value.filter((x) => x !== name));
    } else if (props.value.length < maxPicks) {
      props.onChange([...props.value, name]);
    }
  };

  return (
    <div className="flex flex-col gap-sm">
      <p className="text-caption text-neutral-700">
        Pick up to {maxPicks} ({props.value.length} selected)
      </p>
      {options.map((opt) => {
        const selected = props.value.includes(opt.name);
        const capped = !selected && props.value.length >= maxPicks;
        return (
          <ChoiceCard
            key={opt.name}
            role="checkbox"
            title={opt.name}
            description={opt.description}
            icon={selected ? "✓" : initial(opt.name)}
            selected={selected}
            disabled={capped}
            onClick={() => toggle(opt.name)}
          />
        );
      })}
    </div>
  );
}
