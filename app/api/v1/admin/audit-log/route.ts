import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as auditReadRepo from "@/lib/repositories/audit-logs-read";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitParam) ? limitParam : 50;
  const entityType = url.searchParams.get("entity_type") ?? undefined;

  const logs = await auditReadRepo.listByBusiness(user.tenantId, {
    limit,
    entityType,
  });

  return NextResponse.json({ logs });
}
