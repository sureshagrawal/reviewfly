import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validatePasswordStrength, hashPassword } from "@/lib/auth/password";
import * as usersRepo from "@/lib/repositories/business-users";
import * as resetRepo from "@/lib/repositories/password-reset-tokens";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { revokeAllByUserId } from "@/lib/auth/refresh-rotation";
import { sha256Hex } from "@/lib/http";

const ResetSchema = z.object({
  token: z.string().min(20).max(300),
  new_password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body", code: "BAD_JSON" },
      { status: 400 },
    );
  }

  const parsed = ResetSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION" },
      { status: 422 },
    );
  }

  const policyError = validatePasswordStrength(parsed.data.new_password);
  if (policyError) {
    return NextResponse.json(
      { error: policyError, code: "WEAK_PASSWORD" },
      { status: 422 },
    );
  }

  const userId = await resetRepo.consume(parsed.data.token);
  if (!userId) {
    return NextResponse.json(
      { error: "invalid or expired token", code: "INVALID_TOKEN" },
      { status: 400 },
    );
  }

  const user = await usersRepo.findById(userId);
  if (!user) {
    return NextResponse.json(
      { error: "invalid token", code: "INVALID_TOKEN" },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.new_password);
  await usersRepo.updatePassword(user.id, passwordHash);
  await revokeAllByUserId(user.id);
  await resetRepo.revokeAllForUser(user.id);

  const ipHash = req.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  void auditRepo.record({
    businessId: user.business_id,
    actorUserId: user.id,
    entityType: "session",
    action: "password_reset_completed",
    ipHash: ipHash ? sha256Hex(ipHash) : null,
  });

  return NextResponse.json({ ok: true });
}
