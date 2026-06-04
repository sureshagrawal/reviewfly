import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as businessesRepo from "@/lib/repositories/businesses";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { sha256Hex } from "@/lib/http";

const StatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

const WRITE_ROLES = new Set(["platform_owner", "super_admin"]);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentPlatformUser();
  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  if (!WRITE_ROLES.has(session.role)) {
    return NextResponse.json(
      { error: "forbidden", code: "FORBIDDEN" },
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

  const parsed = StatusSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const p = await params;
  const tenant = await businessesRepo.findById(p.id);
  if (!tenant) {
    return NextResponse.json(
      { error: "tenant not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  await businessesRepo.updateStatus(tenant.id, parsed.data.status);

  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  void auditRepo.record({
    businessId: tenant.id,
    actorUserId: session.userId,
    entityType: "business",
    entityId: tenant.id,
    action: parsed.data.status === "suspended" ? "tenant_suspended" : "tenant_restored",
    oldValue: { status: tenant.status },
    newValue: { status: parsed.data.status },
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });

  return NextResponse.json({ ok: true });
}
