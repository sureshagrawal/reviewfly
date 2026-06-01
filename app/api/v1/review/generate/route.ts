import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { generateReview } from "@/lib/uniqueness-engine";
import * as reviewEventsRepo from "@/lib/repositories/review-events";
import { sha256Hex, classifyUA } from "@/lib/http";
import { logger } from "@/lib/logger";

const Body = z.object({
  business_id: z.string().uuid(),
  session_id: z.string().min(8).max(64),
  responses: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.number()])),
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

  try {
    const result = await generateReview({
      businessId: parsed.data.business_id,
      sessionId: parsed.data.session_id,
      responses: parsed.data.responses,
    });

    // Fire-and-forget event log
    const ipHash = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    void reviewEventsRepo.record({
      businessId: parsed.data.business_id,
      sessionId: parsed.data.session_id,
      eventType: result.fallbackUsed ? "fallback_used" : "ai_generated",
      payload: { provider: result.provider, length: result.review.length },
      ipHash: ipHash ? sha256Hex(ipHash) : undefined,
      uaCategory: classifyUA(req.headers.get("user-agent")),
    });

    return NextResponse.json({
      review: result.review,
      provider: result.provider,
      fallback_used: result.fallbackUsed,
    });
  } catch (err) {
    logger.error({ err }, "review.generate: unexpected error");
    return NextResponse.json(
      { error: "internal error", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
