import { describe, it, expect } from "vitest";
import {
  FlowStepCreateSchema,
  FlowStepReorderSchema,
} from "@/lib/validators/flow-step";

describe("FlowStepCreateSchema", () => {
  it("accepts a minimal valid step", () => {
    const r = FlowStepCreateSchema.safeParse({
      step_key: "rating",
      step_type: "rating",
      question_label: "How was it?",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid step_type", () => {
    const r = FlowStepCreateSchema.safeParse({
      step_key: "x",
      step_type: "nope",
      question_label: "?",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a bad step_key", () => {
    const r = FlowStepCreateSchema.safeParse({
      step_key: "1bad",
      step_type: "rating",
      question_label: "?",
    });
    expect(r.success).toBe(false);
  });

  it("defaults is_required and inject_into_prompt to true", () => {
    const r = FlowStepCreateSchema.parse({
      step_key: "x",
      step_type: "rating",
      question_label: "?",
    });
    expect(r.is_required).toBe(true);
    expect(r.inject_into_prompt).toBe(true);
  });
});

describe("FlowStepReorderSchema", () => {
  it("requires at least one id", () => {
    expect(FlowStepReorderSchema.safeParse({ ordered_ids: [] }).success).toBe(false);
  });
  it("accepts a list of UUIDs", () => {
    const r = FlowStepReorderSchema.safeParse({
      ordered_ids: [
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
      ],
    });
    expect(r.success).toBe(true);
  });
});
