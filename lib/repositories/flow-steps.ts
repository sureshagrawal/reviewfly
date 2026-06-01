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
  options: { activeOnly?: boolean } = {},
): Promise<FlowStepRow[]> {
  const activeOnly = options.activeOnly ?? true;
  if (activeOnly) {
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
  return sql<FlowStepRow[]>`
    SELECT id, business_id, step_order, step_key, step_type, question_label,
           helper_text, config_json, condition_json, is_required,
           inject_into_prompt, is_active
    FROM flow_steps
    WHERE business_id = ${businessId}
    ORDER BY step_order ASC
  `;
}

export async function findById(
  businessId: string,
  stepId: string,
): Promise<FlowStepRow | null> {
  const rows = await sql<FlowStepRow[]>`
    SELECT id, business_id, step_order, step_key, step_type, question_label,
           helper_text, config_json, condition_json, is_required,
           inject_into_prompt, is_active
    FROM flow_steps
    WHERE id = ${stepId} AND business_id = ${businessId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function existsByKey(
  businessId: string,
  stepKey: string,
  excludingId?: string,
): Promise<boolean> {
  // Soft-deleted (is_active=false) rows don't block re-use of the key.
  if (excludingId) {
    const rows = await sql<Array<{ id: string }>>`
      SELECT id FROM flow_steps
      WHERE business_id = ${businessId}
        AND step_key = ${stepKey}
        AND is_active = true
        AND id <> ${excludingId}
      LIMIT 1
    `;
    return rows.length > 0;
  }
  const rows = await sql<Array<{ id: string }>>`
    SELECT id FROM flow_steps
    WHERE business_id = ${businessId}
      AND step_key = ${stepKey}
      AND is_active = true
    LIMIT 1
  `;
  return rows.length > 0;
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

export async function createOne(
  businessId: string,
  input: FlowStepInput,
): Promise<string> {
  const rows = await sql<Array<{ id: string }>>`
    INSERT INTO flow_steps (
      id, business_id, step_order, step_key, step_type, question_label,
      helper_text, config_json, condition_json, is_required, inject_into_prompt
    ) VALUES (
      gen_random_uuid(),
      ${businessId},
      ${input.step_order},
      ${input.step_key},
      ${input.step_type},
      ${input.question_label},
      ${input.helper_text},
      ${sql.json(input.config_json as never)},
      ${input.condition_json ? sql.json(input.condition_json as never) : null},
      ${input.is_required},
      ${input.inject_into_prompt}
    )
    RETURNING id
  `;
  return rows[0]!.id;
}

export async function createMany(
  businessId: string,
  steps: FlowStepInput[],
): Promise<void> {
  if (steps.length === 0) return;
  for (const s of steps) {
    await createOne(businessId, s);
  }
}

export type FlowStepUpdate = Partial<Omit<FlowStepInput, "step_order">> & {
  is_active?: boolean;
};

export async function update(
  businessId: string,
  stepId: string,
  patch: FlowStepUpdate,
): Promise<void> {
  const existing = await findById(businessId, stepId);
  if (!existing) return;
  const merged = {
    step_key: patch.step_key ?? existing.step_key,
    step_type: patch.step_type ?? existing.step_type,
    question_label: patch.question_label ?? existing.question_label,
    helper_text:
      patch.helper_text !== undefined ? patch.helper_text : existing.helper_text,
    config_json: patch.config_json ?? existing.config_json,
    condition_json:
      patch.condition_json !== undefined
        ? patch.condition_json
        : existing.condition_json,
    is_required: patch.is_required ?? existing.is_required,
    inject_into_prompt:
      patch.inject_into_prompt ?? existing.inject_into_prompt,
    is_active: patch.is_active ?? existing.is_active,
  };
  await sql`
    UPDATE flow_steps SET
      step_key = ${merged.step_key},
      step_type = ${merged.step_type},
      question_label = ${merged.question_label},
      helper_text = ${merged.helper_text},
      config_json = ${sql.json(merged.config_json as never)},
      condition_json = ${
        merged.condition_json ? sql.json(merged.condition_json as never) : null
      },
      is_required = ${merged.is_required},
      inject_into_prompt = ${merged.inject_into_prompt},
      is_active = ${merged.is_active},
      updated_at = NOW()
    WHERE id = ${stepId} AND business_id = ${businessId}
  `;
}

export async function softDelete(
  businessId: string,
  stepId: string,
): Promise<void> {
  // Rename the step_key on delete so the same key can be re-used by a fresh
  // step right away (avoids "a step with this key already exists" UX trap).
  // We append a short suffix so audit trails remain meaningful.
  await sql`
    UPDATE flow_steps
       SET is_active = false,
           step_key = LEFT(step_key, 30) || '__del_' || EXTRACT(EPOCH FROM NOW())::bigint::text,
           updated_at = NOW()
     WHERE id = ${stepId} AND business_id = ${businessId}
  `;
}

/**
 * Atomically rewrite step_order to match the given ordered list.
 * Uses a transaction so partial application can't leave the flow inconsistent.
 */
export async function reorder(
  businessId: string,
  orderedIds: string[],
): Promise<void> {
  if (orderedIds.length === 0) return;
  await sql.begin(async (tx) => {
    // First pass: bump everything to negative numbers to avoid unique-conflict
    // collisions if we ever add a UNIQUE(business_id, step_order) constraint.
    for (let i = 0; i < orderedIds.length; i++) {
      await tx`
        UPDATE flow_steps SET step_order = ${-(i + 1)}
        WHERE id = ${orderedIds[i]!} AND business_id = ${businessId}
      `;
    }
    // Second pass: set the real values.
    for (let i = 0; i < orderedIds.length; i++) {
      await tx`
        UPDATE flow_steps SET step_order = ${i}, updated_at = NOW()
        WHERE id = ${orderedIds[i]!} AND business_id = ${businessId}
      `;
    }
  });
}
