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

export function SingleChoiceStep(props: {
  config: Record<string, unknown>;
  tagsByCategory: Record<string, Array<{ name: string; description: string | null }>>;
  value: string;
  onChange: (v: string) => void;
}) {
  const options = resolveOptions(props.config, props.tagsByCategory);
  return (
    <div className="flex flex-col gap-sm" role="radiogroup">
      {options.map((opt) => {
        const selected = props.value === opt.name;
        return (
          <button
            key={opt.name}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => props.onChange(opt.name)}
            className={`min-h-touch-lg w-full text-left px-md py-sm rounded-md border transition ${
              selected
                ? "bg-primary-soft border-primary"
                : "bg-neutral-0 border-neutral-200 hover:border-neutral-700"
            }`}
          >
            <span className="text-body text-neutral-900">{opt.name}</span>
            {opt.description && (
              <span className="block text-caption text-neutral-700 mt-xs">
                {opt.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
