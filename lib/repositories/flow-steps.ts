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

export type FlowStepInput = {
  step_order: number;
  step_key: string;
  step_type: string;
  question_label: string;
  helper_text: string | null;
  config_json: Record<string, unknown>;
  condition_json: Record<string, unknown> | null;
  is_required: boolean;
  inject_into_prompt: boolean;
};

export async function countByBusiness(businessId: string): Promise<number> {
  const rows = await sql<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM flow_steps
    WHERE business_id = ${businessId}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function createMany(
  businessId: string,
  steps: FlowStepInput[],
): Promise<void> {
  if (steps.length === 0) return;
  for (const s of steps) {
    await sql`
      INSERT INTO flow_steps (
        id, business_id, step_order, step_key, step_type, question_label,
        helper_text, config_json, condition_json, is_required, inject_into_prompt
      ) VALUES (
        gen_random_uuid(),
        ${businessId},
        ${s.step_order},
        ${s.step_key},
        ${s.step_type},
        ${s.question_label},
        ${s.helper_text},
        ${sql.json(s.config_json as never)},
        ${s.condition_json ? sql.json(s.condition_json as never) : null},
        ${s.is_required},
        ${s.inject_into_prompt}
      )
    `;
  }
}
