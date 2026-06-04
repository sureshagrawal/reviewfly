import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import * as usersRepo from "@/lib/repositories/business-users";
import * as resetRepo from "@/lib/repositories/password-reset-tokens";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { sha256Hex } from "@/lib/http";
import { sendPasswordResetEmail } from "@/lib/services/auth-email";

const ForgotSchema = z.object({
  email: z.string().email().max(255),
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

  const parsed = ForgotSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION" },
      { status: 422 },
    );
  }

  const user = await usersRepo.findByEmail(parsed.data.email);
  if (user) {
    const token = await resetRepo.issueForUser(user.id, 30);
    const resetUrl = `${env.APP_URL.replace(/\/$/, "")}/admin/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    const ipHash = req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

    void auditRepo.record({
      businessId: user.business_id,
      actorUserId: user.id,
      entityType: "session",
      action: "password_reset_requested",
      ipHash: ipHash ? sha256Hex(ipHash) : null,
    });
  }

  // Always 200 to prevent account enumeration.
  return NextResponse.json({ ok: true });
}
