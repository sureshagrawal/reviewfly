"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: "bg-brand text-neutral-0 shadow-card-sm hover:shadow-card-md hover:opacity-95",
  secondary: "bg-neutral-0 text-neutral-900 border border-neutral-200 hover:border-brand hover:shadow-card-sm",
  danger: "bg-danger text-neutral-0 hover:opacity-90",
  ghost: "bg-transparent text-neutral-900 hover:bg-neutral-50",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, children, disabled, ...rest },
  ref,
) {
  const sizeClass =
    size === "lg"
      ? "min-h-touch-lg px-lg text-body"
      : size === "sm"
      ? "min-h-touch px-md text-caption"
      : "min-h-touch px-md text-body";

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass} ${className ?? ""}`}
      {...rest}
    >
      {loading ? "..." : children}
    </button>
  );
});
