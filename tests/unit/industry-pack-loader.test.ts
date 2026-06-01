import { describe, it, expect } from "vitest";
import { loadPack } from "@/lib/services/industry-pack-loader";

describe("industry-pack-loader", () => {
  it("loads the academy pack with required shape", () => {
    const pack = loadPack("academy");
    expect(pack.industry).toBe("academy");
    expect(Array.isArray(pack.flow_steps)).toBe(true);
    expect(pack.flow_steps.length).toBeGreaterThan(0);
    expect(Array.isArray(pack.tags)).toBe(true);
  });

  it("every flow_step has required fields", () => {
    const pack = loadPack("academy");
    for (const s of pack.flow_steps) {
      expect(typeof s.step_order).toBe("number");
      expect(typeof s.step_key).toBe("string");
      expect(typeof s.step_type).toBe("string");
      expect(typeof s.question_label).toBe("string");
    }
  });

  it("loads the restaurant pack stub", () => {
    const pack = loadPack("restaurant");
    expect(pack.industry).toBe("restaurant");
    expect(pack.flow_steps.length).toBeGreaterThan(0);
  });

  it("caches packs (second load returns same reference)", () => {
    const a = loadPack("academy");
    const b = loadPack("academy");
    expect(a).toBe(b);
  });
});
