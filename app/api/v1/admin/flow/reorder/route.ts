import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as flowStepsRepo from "@/lib/repositories/flow-steps";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { FlowStepReorderSchema } from "@/lib/validators/flow-step";
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

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body", code: "BAD_JSON" },
      { status: 400 },
    );
  }
  const parsed = FlowStepReorderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  // Verify every id belongs to this tenant (IDOR closure)
  const current = await flowStepsRepo.listByBusiness(user.tenantId, {
    activeOnly: false,
  });
  const ownedIds = new Set(current.map((s) => s.id));
  for (const id of parsed.data.ordered_ids) {
    if (!ownedIds.has(id)) {
      return NextResponse.json(
        { error: "one or more steps not found in this workspace", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
  }

  await flowStepsRepo.reorder(user.tenantId, parsed.data.ordered_ids);

  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  void auditRepo.record({
    businessId: user.tenantId,
    actorUserId: user.userId,
    entityType: "flow",
    action: "settings_updated", // reuse existing enum
    newValue: { ordered_ids: parsed.data.ordered_ids },
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });

  return NextResponse.json({ ok: true });
}
