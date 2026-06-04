import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as flowStepsRepo from "@/lib/repositories/flow-steps";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { FlowStepCreateSchema } from "@/lib/validators/flow-step";
import { sha256Hex } from "@/lib/http";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  if (user.role === "viewer") {
    return NextResponse.json(
      { error: "viewer role cannot edit flow", code: "FORBIDDEN" },
      { status: 403 },
    );
  }
  if (user.readOnly) {
    return NextResponse.json(
      { error: "read-only impersonation session", code: "READ_ONLY" },
      { status: 403 },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body", code: "BAD_JSON" },
      { status: 400 },
    );
  }
  const parsed = FlowStepCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  // Unique key check
  const collision = await flowStepsRepo.existsByKey(
    user.tenantId,
    parsed.data.step_key,
  );
  if (collision) {
    return NextResponse.json(
      { error: "a step with this key already exists", code: "STEP_KEY_TAKEN" },
      { status: 409 },
    );
  }

  // Append to the end of the current order
  const currentCount = await flowStepsRepo.countByBusiness(user.tenantId);
  const id = await flowStepsRepo.createOne(user.tenantId, {
    step_order: currentCount,
    step_key: parsed.data.step_key,
    step_type: parsed.data.step_type,
    question_label: parsed.data.question_label,
    helper_text: parsed.data.helper_text ?? null,
    config_json: parsed.data.config_json,
    condition_json: parsed.data.condition_json ?? null,
    is_required: parsed.data.is_required,
    inject_into_prompt: parsed.data.inject_into_prompt,
  });

  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  void auditRepo.record({
    businessId: user.tenantId,
    actorUserId: user.userId,
    entityType: "flow_step",
    entityId: id,
    action: "tag_created", // reuse closest enum; can add flow_step_created later
    newValue: parsed.data,
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });

  return NextResponse.json({ ok: true, id });
}
