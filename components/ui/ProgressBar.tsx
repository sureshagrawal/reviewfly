/**
 * ProgressBar — gradient-filled progress indicator.
 *
 * Dynamic width is driven by the `--progress-value` CSS custom property
 * (set inline as the ONLY allowed inline style — geometry, not visuals).
 * The fill color comes from a global utility class, never inline.
 *
 * Reference: this CSS-var-inline-style pattern is the React idiomatic way
 * to expose continuous geometry to CSS without hardcoded `style` rules.
 */
import type { CSSProperties } from "react";

export type ProgressBarProps = {
  /** 0..1 fraction (clamped). */
  value: number;
  ariaLabel?: string;
};

export function ProgressBar(props: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, props.value));
  const pct = `${(clamped * 100).toFixed(1)}%`;
  // CSS variable carrying dynamic geometry only.
  const cssVar = { "--progress-value": pct } as CSSProperties;
  return (
    <div
      className="h-1.5 w-full rounded-pill bg-neutral-200 overflow-hidden"
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={props.ariaLabel ?? "Progress"}
    >
      <div
        className="progress-fill h-full rounded-pill bg-gradient-brand"
        style={cssVar}
      />
    </div>
  );
}
