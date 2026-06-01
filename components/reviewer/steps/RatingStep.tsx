/**
 * RatingStep — delegates to shared StarRow primitive.
 * Star colors come from CSS via `[data-star]` selector — never inline.
 */
"use client";

import { StarRow } from "@/components/ui/StarRow";

export function RatingStep(props: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <StarRow
      value={props.value}
      max={props.max}
      size="lg"
      onChange={props.onChange}
    />
  );
}
