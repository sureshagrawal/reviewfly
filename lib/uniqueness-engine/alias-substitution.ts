import type { BusinessTagRow } from "@/lib/repositories/business-tags";

/**
 * Pick a random display alias for each tag. If a tag has no aliases, returns
 * the canonical name. This is the second-strongest uniqueness lever after
 * dimension picks: same course mentioned 10 times will surface 10 different
 * alias variants.
 */
export function pickAlias(tag: BusinessTagRow, rng: () => number): string {
  if (!tag.aliases || tag.aliases.length === 0) return tag.name;
  // Coin flip: 50% canonical, 50% random alias — keeps canonical visible
  // often enough that the brand keyword density stays meaningful for SEO.
  if (rng() < 0.5) return tag.name;
  const idx = Math.floor(rng() * tag.aliases.length);
  return tag.aliases[idx] ?? tag.name;
}

export function pickContentHint(tag: BusinessTagRow, rng: () => number): string | null {
  if (!tag.content_hints || tag.content_hints.length === 0) return null;
  const idx = Math.floor(rng() * tag.content_hints.length);
  return tag.content_hints[idx] ?? null;
}
