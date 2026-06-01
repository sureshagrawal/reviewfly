import { sql } from "@/lib/db";
import type { StepType } from "@/lib/constants/step-types";

export type FlowStepRow = {
  id: string;
  business_id: string;
  step_order: number;
  step_key: string;
  step_type: StepType;
  question_label: string;
  helper_text: string | null;
  config_json: Record<string, unknown>;
  condition_json: Record<string, unknown> | null;
  is_required: boolean;
  inject_into_prompt: boolean;
  is_active: boolean;
};

export async function listByBusiness(
  businessId: string,
): Promise<FlowStepRow[]> {
  return sql<FlowStepRow[]>`
    SELECT id, business_id, step_order, step_key, step_type, question_label,
           helper_text, config_json, condition_json, is_required,
           inject_into_prompt, is_active
    FROM flow_steps
    WHERE business_id = ${businessId}
      AND is_active = true
    ORDER BY step_order ASC
  `;
}
