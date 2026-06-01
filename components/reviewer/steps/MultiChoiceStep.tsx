"use client";

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

export function MultiChoiceStep(props: {
  config: Record<string, unknown>;
  tagsByCategory: Record<string, Array<{ name: string; description: string | null }>>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const options = resolveOptions(props.config, props.tagsByCategory);
  const maxPicks = Math.max(1, (props.config.max_picks as number | undefined) ?? 5);

  const toggle = (name: string) => {
    // Immutable update; functional updater style passed up to parent.
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
        return (
          <button
            key={opt.name}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => toggle(opt.name)}
            className={`min-h-touch-lg w-full text-left px-md py-sm rounded-md border transition ${
              selected
                ? "bg-primary-soft border-primary"
                : "bg-neutral-0 border-neutral-200 hover:border-neutral-700"
            }`}
          >
            <span className="text-body text-neutral-900">
              {selected ? "✓ " : ""}
              {opt.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
