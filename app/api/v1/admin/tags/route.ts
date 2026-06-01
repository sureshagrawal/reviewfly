import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as tagsRepo from "@/lib/repositories/business-tags";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { TagCreateSchema } from "@/lib/validators/tag";
import { sha256Hex } from "@/lib/http";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const tags = await tagsRepo.listByBusiness(user.tenantId, {
    category,
    activeOnly: false,
  });
  return NextResponse.json({ tags });
}

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
      { error: "viewer role cannot create tags", code: "FORBIDDEN" },
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
  const parsed = TagCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const id = await tagsRepo.create(user.tenantId, {
    category: parsed.data.category,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    tag_type: parsed.data.tag_type,
    aliases: parsed.data.aliases,
    content_hints: parsed.data.content_hints,
    display_order: parsed.data.display_order,
  });
  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  void auditRepo.record({
    businessId: user.tenantId,
    actorUserId: user.userId,
    entityType: "business_tag",
    entityId: id,
    action: "tag_created",
    newValue: parsed.data,
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });
  return NextResponse.json({ ok: true, id });
}
