/**
 * Weighted random pick across prompt pool entries for one dimension.
 *
 * Pure function: takes an rng (so it's reproducible from a seeded session_id).
 * Higher `weight` = more likely to be picked.
 */

import type { PromptPoolRow } from "@/lib/repositories/prompt-pools";

export function pickWeighted<T extends { weight: number }>(
  entries: T[],
  rng: () => number,
): T | null {
  if (entries.length === 0) return null;
  const total = entries.reduce((s, e) => s + Math.max(1, e.weight), 0);
  let r = rng() * total;
  for (const entry of entries) {
    r -= Math.max(1, entry.weight);
    if (r <= 0) return entry;
  }
  return entries[entries.length - 1] ?? null;
}

/** Convenience: pick one pool row from the given dimension list. */
export function pickPoolValue(
  entries: PromptPoolRow[],
  rng: () => number,
): string | null {
  const picked = pickWeighted(entries, rng);
  return picked?.value ?? null;
}
