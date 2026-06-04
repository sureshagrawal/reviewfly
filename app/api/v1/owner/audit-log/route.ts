import { NextResponse, type NextRequest } from "next/server";
import { getCurrentPlatformUser } from "@/lib/auth/getCurrentPlatformUser";
import * as auditPlatformRepo from "@/lib/repositories/audit-logs-platform";

export async function GET(req: NextRequest) {
  const session = await getCurrentPlatformUser();
  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitParam) ? limitParam : 100;
  const entityType = url.searchParams.get("entity_type") ?? undefined;

  const logs = await auditPlatformRepo.listPlatformWide({ limit, entityType });
  return NextResponse.json({ logs });
}
