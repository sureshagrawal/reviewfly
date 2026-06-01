import { describe, it, expect } from "vitest";
import { shouldShow } from "@/lib/flow-runner/condition-evaluator";

describe("condition-evaluator", () => {
  it("shows step when condition is null/undefined", () => {
    expect(shouldShow(null, {})).toBe(true);
    expect(shouldShow(undefined, {})).toBe(true);
    expect(shouldShow({}, {})).toBe(true);
  });

  it("equals op", () => {
    const cond = { if: { stepKey: "rating", op: "equals", value: 5 } };
    expect(shouldShow(cond, { rating: 5 })).toBe(true);
    expect(shouldShow(cond, { rating: 4 })).toBe(false);
  });

  it("gte op", () => {
    const cond = { if: { stepKey: "rating", op: "gte", value: 4 } };
    expect(shouldShow(cond, { rating: 5 })).toBe(true);
    expect(shouldShow(cond, { rating: 4 })).toBe(true);
    expect(shouldShow(cond, { rating: 3 })).toBe(false);
  });

  it("in op", () => {
    const cond = { if: { stepKey: "course", op: "in", value: ["JEE", "NEET"] } };
    expect(shouldShow(cond, { course: "JEE" })).toBe(true);
    expect(shouldShow(cond, { course: "CET" })).toBe(false);
  });

  it("contains op (array contains value)", () => {
    const cond = { if: { stepKey: "tags", op: "contains", value: "JEE" } };
    expect(shouldShow(cond, { tags: ["JEE", "NEET"] })).toBe(true);
    expect(shouldShow(cond, { tags: ["CET"] })).toBe(false);
  });
});
