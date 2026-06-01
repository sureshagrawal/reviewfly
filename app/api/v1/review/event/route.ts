import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import * as reviewEventsRepo from "@/lib/repositories/review-events";
import { REVIEW_EVENT_TYPES } from "@/lib/constants/step-types";
import { sha256Hex, classifyUA } from "@/lib/http";

const Body = z.object({
  business_id: z.string().uuid(),
  session_id: z.string().min(8).max(64),
  event_type: z.enum(REVIEW_EVENT_TYPES),
  payload: z.record(z.string(), z.unknown()).optional(),
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
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request body", code: "VALIDATION", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  await reviewEventsRepo.record({
    businessId: parsed.data.business_id,
    sessionId: parsed.data.session_id,
    eventType: parsed.data.event_type,
    payload: parsed.data.payload,
    ipHash: ipHash ? sha256Hex(ipHash) : undefined,
    uaCategory: classifyUA(req.headers.get("user-agent")),
  });

  return NextResponse.json({ ok: true });
}
