/**
 * ChoiceCard — large card-style option (single/multi choice).
 *
 * Mirrors the NSG Academy "I am a Student / I am a Parent" card pattern:
 * leading icon avatar, bold title, subtle description, hover/active lift.
 *
 * No inline styles. All visuals via design tokens + utility classes.
 */
"use client";

import type { ReactNode } from "react";

export type ChoiceCardProps = {
  title: string;
  description?: string | null;
  /** ReactNode icon, or a single character used as the avatar initial. */
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** Aria role: radio (single_choice), checkbox (multi_choice), or button (link). */
  role?: "radio" | "checkbox" | "button";
};

export function ChoiceCard(props: ChoiceCardProps) {
  const role = props.role ?? "radio";
  const ariaProp =
    role === "radio"
      ? { "aria-checked": Boolean(props.selected) }
      : role === "checkbox"
        ? { "aria-checked": Boolean(props.selected) }
        : {};

  const stateClasses = props.selected
    ? "bg-primary-tint border-brand shadow-card-md"
    : "bg-neutral-0 border-neutral-200 shadow-card-sm hover:border-brand hover:shadow-card-hover";

  return (
    <button
      type="button"
      role={role}
      {...ariaProp}
      disabled={props.disabled}
      onClick={props.onClick}
      className={`w-full text-left rounded-lg border p-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-md ${stateClasses}`}
    >
      {props.icon !== undefined && (
        <span className="h-11 w-11 shrink-0 rounded-pill bg-primary-tint-strong text-brand flex items-center justify-center text-h2 font-semibold">
          {props.icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-body font-semibold text-neutral-900 truncate">
          {props.title}
        </span>
        {props.description && (
          <span className="block text-caption text-neutral-700 mt-xs">
            {props.description}
          </span>
        )}
      </span>
    </button>
  );
}
