import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import * as settingsRepo from "@/lib/repositories/business-settings";
import * as auditRepo from "@/lib/repositories/audit-logs";
import { SettingsUpdateSchema } from "@/lib/validators/settings";
import { sha256Hex } from "@/lib/http";
import { logger } from "@/lib/logger";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  const s = await settingsRepo.findByBusinessId(user.tenantId);
  if (!s) {
    return NextResponse.json(
      { error: "settings missing", code: "NO_SETTINGS" },
      { status: 404 },
    );
  }
  return NextResponse.json({ settings: s });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthenticated", code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  if (user.role === "viewer") {
    return NextResponse.json(
      { error: "viewer role cannot update settings", code: "FORBIDDEN" },
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
  const parsed = SettingsUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const previous = await settingsRepo.findByBusinessId(user.tenantId);
    await settingsRepo.update(user.tenantId, {
      display_name: parsed.data.display_name,
      brand_color: parsed.data.brand_color,
      google_review_url: parsed.data.google_review_url ?? null,
      whatsapp_number: parsed.data.whatsapp_number ?? null,
      poster_tagline: parsed.data.poster_tagline ?? null,
      ai_enabled: parsed.data.ai_enabled,
      sentiment_gate_threshold: parsed.data.sentiment_gate_threshold,
      hard_fallback: parsed.data.hard_fallback,
    });
    const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    void auditRepo.record({
      businessId: user.tenantId,
      actorUserId: user.userId,
      entityType: "business_settings",
      entityId: user.tenantId,
      action: "settings_updated",
      oldValue: previous,
      newValue: parsed.data,
      ipHash: ipHash ? sha256Hex(ipHash) : null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "settings.update: unexpected error");
    return NextResponse.json(
      { error: "internal error", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
