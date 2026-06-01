/**
 * StarRow — accessible star-rating control.
 *
 * Colors come from CSS via `[data-star="on" | "off"]` attribute selector.
 * NEVER use inline style on stars; this primitive is the single source of truth.
 */
"use client";

export type StarRowProps = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  /** When provided, renders interactive buttons. Omit for read-only display. */
  onChange?: (value: number) => void;
  /** Visible label for screen readers. */
  ariaLabel?: string;
};

const SIZE_CLASSES: Record<NonNullable<StarRowProps["size"]>, string> = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
};

export function StarRow(props: StarRowProps) {
  const max = Math.max(2, Math.min(10, props.max ?? 5));
  const size = props.size ?? "lg";
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const interactive = typeof props.onChange === "function";
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className="flex justify-center items-center gap-sm flex-wrap"
      role={interactive ? "radiogroup" : "img"}
      aria-label={props.ariaLabel ?? `Rated ${props.value} of ${max} stars`}
    >
      {stars.map((n) => {
        const on = n <= props.value ? "on" : "off";
        if (!interactive) {
          return (
            <span
              key={n}
              data-star={on}
              className={`${sizeClass} leading-none select-none`}
              aria-hidden="true"
            >
              ★
            </span>
          );
        }
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === props.value}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            data-star={on}
            onClick={() => props.onChange?.(n)}
            className={`${sizeClass} leading-none min-h-touch min-w-touch p-xs cursor-pointer`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
