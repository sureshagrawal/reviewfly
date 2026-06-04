import { NextResponse, type NextRequest } from "next/server";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as poolsRepo from "@/lib/repositories/prompt-pools";
import * as auditRepo from "@/lib/repositories/audit-logs";
import {
  UniversalPoolCreateSchema,
  isVerticalLeaking,
} from "@/lib/validators/prompt-pool";
import { sha256Hex } from "@/lib/http";
import { ENGINE_DIMENSIONS, type EngineDimension } from "@/lib/constants/step-types";

const WRITE_ROLES = new Set(["platform_owner", "super_admin"]);

function parseDimension(value: string | null): EngineDimension | undefined {
  if (!value) return undefined;
  return (ENGINE_DIMENSIONS as readonly string[]).includes(value)
    ? (value as EngineDimension)
    : undefined;
}

export async function GET(req: NextRequest) {
  const session = await getCurrentPlatformUser();
  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const dimension = parseDimension(url.searchParams.get("dimension"));
  const industry = url.searchParams.get("industry") ?? undefined;
  const limitParam = Number(url.searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(limitParam) ? limitParam : 200;

  const pools = await poolsRepo.listUniversal({
    dimension,
    industry,
    limit,
  });

  return NextResponse.json({ pools });
}

export async function POST(req: NextRequest) {
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

  const parsed = UniversalPoolCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const leakError = isVerticalLeaking(parsed.data.value, parsed.data.applies_to_industry);
  if (leakError) {
    return NextResponse.json(
      { error: leakError, code: "VERTICAL_LEAK" },
      { status: 422 },
    );
  }

  const id = await poolsRepo.createUniversal({
    dimension: parsed.data.dimension,
    value: parsed.data.value,
    weight: parsed.data.weight,
    appliesToIndustry: parsed.data.applies_to_industry,
  });

  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  void auditRepo.record({
    businessId: null,
    actorUserId: session.userId,
    entityType: "prompt_pool",
    entityId: id,
    action: "pool_created",
    newValue: parsed.data,
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });

  return NextResponse.json({ ok: true, id });
}
