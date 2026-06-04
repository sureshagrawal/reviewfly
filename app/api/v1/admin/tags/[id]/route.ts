import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as tagsRepo from "@/lib/repositories/business-tags";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { TagUpdateSchema } from "@/lib/validators/tag";
import { sha256Hex } from "@/lib/http";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  if (user.role === "viewer") {
    return NextResponse.json(
      { error: "viewer role cannot update tags", code: "FORBIDDEN" },
      { status: 403 },
    );
  }
  if (user.readOnly) {
    return NextResponse.json(
      { error: "read-only impersonation session", code: "READ_ONLY" },
      { status: 403 },
    );
  }
  const { id } = await params;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body", code: "BAD_JSON" },
      { status: 400 },
    );
  }
  const parsed = TagUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const existing = await tagsRepo.findById(user.tenantId, id);
  if (!existing) {
    // IDOR guard: returns 404 not 403 so we don't reveal cross-tenant existence
    return NextResponse.json(
      { error: "tag not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  await tagsRepo.update(user.tenantId, id, parsed.data);
  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  void auditRepo.record({
    businessId: user.tenantId,
    actorUserId: user.userId,
    entityType: "business_tag",
    entityId: id,
    action: "tag_updated",
    oldValue: existing,
    newValue: parsed.data,
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  if (user.role === "viewer") {
    return NextResponse.json(
      { error: "viewer role cannot delete tags", code: "FORBIDDEN" },
      { status: 403 },
    );
  }
  if (user.readOnly) {
    return NextResponse.json(
      { error: "read-only impersonation session", code: "READ_ONLY" },
      { status: 403 },
    );
  }
  const { id } = await params;
  const existing = await tagsRepo.findById(user.tenantId, id);
  if (!existing) {
    return NextResponse.json(
      { error: "tag not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  await tagsRepo.softDelete(user.tenantId, id);
  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  void auditRepo.record({
    businessId: user.tenantId,
    actorUserId: user.userId,
    entityType: "business_tag",
    entityId: id,
    action: "tag_deleted",
    oldValue: existing,
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });
  return NextResponse.json({ ok: true });
}
