import { z } from "zod";
import { STEP_TYPES } from "@/lib/constants/step-types";

/**
 * Flow-step Zod schemas — shared client + server.
 *
 * Per-step-type config_json is loosely validated (record of unknown) so we
 * can add new step-type fields without breaking the schema. The step type
 * registry in lib/flow-runner/step-registry.ts already constrains runtime
 * shape for response submission.
 */

const StepKeySchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z][a-z0-9_]*$/, "step_key must be lowercase alphanumeric/underscore, starting with a letter");

export const FlowStepCreateSchema = z.object({
  step_key: StepKeySchema,
  step_type: z.enum(STEP_TYPES),
  question_label: z.string().min(1).max(500),
  helper_text: z.string().max(500).nullish(),
  config_json: z.record(z.string(), z.unknown()).default({}),
  condition_json: z.record(z.string(), z.unknown()).nullish(),
  is_required: z.boolean().default(true),
  inject_into_prompt: z.boolean().default(true),
});

export const FlowStepUpdateSchema = FlowStepCreateSchema.partial();

export const FlowStepReorderSchema = z.object({
  ordered_ids: z.array(z.string().uuid()).min(1).max(50),
});

export type FlowStepCreateInput = z.infer<typeof FlowStepCreateSchema>;
export type FlowStepUpdateInput = z.infer<typeof FlowStepUpdateSchema>;
export type FlowStepReorderInput = z.infer<typeof FlowStepReorderSchema>;
