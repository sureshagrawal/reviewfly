import { NextResponse, type NextRequest } from "next/server";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as poolsRepo from "@/lib/repositories/prompt-pools";
import * as auditRepo from "@/lib/repositories/audit-logs";
import {
  UniversalPoolUpdateSchema,
  isVerticalLeaking,
} from "@/lib/validators/prompt-pool";
import { sha256Hex } from "@/lib/http";

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

  const parsed = UniversalPoolUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { id } = await params;
  const existing = await poolsRepo.findUniversalById(id);
  if (!existing) {
    return NextResponse.json(
      { error: "pool entry not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const valueForCheck = parsed.data.value ?? existing.value;
  const industryForCheck =
    parsed.data.applies_to_industry !== undefined
      ? parsed.data.applies_to_industry
      : existing.applies_to_industry;

  const leakError = isVerticalLeaking(valueForCheck, industryForCheck);
  if (leakError) {
    return NextResponse.json(
      { error: leakError, code: "VERTICAL_LEAK" },
      { status: 422 },
    );
  }

  await poolsRepo.updateUniversal(id, {
    value: parsed.data.value,
    weight: parsed.data.weight,
    appliesToIndustry: parsed.data.applies_to_industry,
    isActive: parsed.data.is_active,
  });

  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  void auditRepo.record({
    businessId: null,
    actorUserId: session.userId,
    entityType: "prompt_pool",
    entityId: id,
    action: "pool_updated",
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

  const { id } = await params;
  const existing = await poolsRepo.findUniversalById(id);
  if (!existing) {
    return NextResponse.json(
      { error: "pool entry not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  await poolsRepo.deleteUniversal(id);

  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  void auditRepo.record({
    businessId: null,
    actorUserId: session.userId,
    entityType: "prompt_pool",
    entityId: id,
    action: "pool_deleted",
    oldValue: existing,
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });

  return NextResponse.json({ ok: true });
}
