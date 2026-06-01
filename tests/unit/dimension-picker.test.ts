import { describe, it, expect } from "vitest";
import { pickWeighted } from "@/lib/uniqueness-engine/dimension-picker";
import { hashStringToSeed, mulberry32 } from "@/lib/uniqueness-engine/seed";

describe("dimension-picker", () => {
  it("returns null for empty array", () => {
    expect(pickWeighted([], () => 0.5)).toBeNull();
  });

  it("picks consistently with same seed", () => {
    const entries = [
      { value: "a", weight: 1 },
      { value: "b", weight: 1 },
      { value: "c", weight: 1 },
    ];
    const rng1 = mulberry32(hashStringToSeed("session-abc"));
    const rng2 = mulberry32(hashStringToSeed("session-abc"));
    const seq1 = Array.from({ length: 5 }, () => pickWeighted(entries, rng1));
    const seq2 = Array.from({ length: 5 }, () => pickWeighted(entries, rng2));
    expect(seq1).toEqual(seq2);
  });

  it("respects weights statistically", () => {
    const entries = [
      { value: "rare", weight: 1 },
      { value: "common", weight: 99 },
    ];
    const rng = mulberry32(hashStringToSeed("statistical-test"));
    let common = 0;
    for (let i = 0; i < 1000; i++) {
      const p = pickWeighted(entries, rng);
      if (p?.value === "common") common++;
    }
    expect(common).toBeGreaterThan(900);
  });
});
