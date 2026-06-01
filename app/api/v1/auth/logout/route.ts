import { NextResponse, type NextRequest } from "next/server";
import {
  readRefreshCookie,
  clearAuthCookies,
} from "@/lib/auth/cookies";
import { revokeByRawToken } from "@/lib/auth/refresh-rotation";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { sha256Hex } from "@/lib/http";

export async function POST(req: NextRequest) {
  const raw = await readRefreshCookie();
  if (raw) {
    await revokeByRawToken(raw);
  }
  const user = await getCurrentUser();
  if (user) {
    const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    void auditRepo.record({
      businessId: user.tenantId,
      actorUserId: user.userId,
      entityType: "session",
      action: "logout",
      ipHash: ipHash ? sha256Hex(ipHash) : null,
    });
  }
  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
