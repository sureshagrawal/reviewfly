import { describe, it, expect } from "vitest";
import { pickAlias } from "@/lib/uniqueness-engine/alias-substitution";
import { mulberry32, hashStringToSeed } from "@/lib/uniqueness-engine/seed";
import type { BusinessTagRow } from "@/lib/repositories/business-tags";

function tag(name: string, aliases: string[]): BusinessTagRow {
  return {
    id: "x",
    business_id: "x",
    category: "courses",
    name,
    description: null,
    tag_type: "course",
    aliases,
    content_hints: [],
    metadata_json: {},
    display_order: 0,
    is_active: true,
  };
}

describe("alias-substitution", () => {
  it("returns canonical when no aliases", () => {
    const t = tag("JEE Main", []);
    expect(pickAlias(t, () => 0)).toBe("JEE Main");
    expect(pickAlias(t, () => 0.9)).toBe("JEE Main");
  });

  it("uses canonical at least sometimes (50% rule)", () => {
    const t = tag("JEE Main", ["JEE Mains", "Joint Entrance"]);
    const rng = mulberry32(hashStringToSeed("test"));
    const picks = Array.from({ length: 50 }, () => pickAlias(t, rng));
    const canonical = picks.filter((p) => p === "JEE Main").length;
    expect(canonical).toBeGreaterThan(15);
    expect(canonical).toBeLessThan(45);
  });
});
