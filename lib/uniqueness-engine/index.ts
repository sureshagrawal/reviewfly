/**
 * Uniqueness engine — entry point.
 *
 * Pipeline:
 *   1. Load business + settings + steps + matched tags.
 *   2. Seed PRNG from session_id (reproducible).
 *   3. For each dimension, fetch pool entries + weighted-pick a value.
 *   4. Build prompt (skeleton + picks + responses + aliased tag names).
 *   5. Call AI provider with timeout.
 *   6. If AI fails or ai_enabled=false, return weighted-decay fallback.
 *
 * Output: { review, provider, fallback_used }
 */

import { ENGINE_DIMENSIONS, type EngineDimension } from "@/lib/constants/step-types";
import * as businessSettingsRepo from "@/lib/repositories/business-settings";
import * as businessTagsRepo from "@/lib/repositories/business-tags";
import * as flowStepsRepo from "@/lib/repositories/flow-steps";
import * as promptPoolsRepo from "@/lib/repositories/prompt-pools";
import * as businessesRepo from "@/lib/repositories/businesses";
import { getAIProvider } from "@/lib/adapters/ai/factory";
import { AIProviderError } from "@/lib/adapters/ai";
import { logger } from "@/lib/logger";
import { hashStringToSeed, mulberry32 } from "./seed";
import { pickPoolValue } from "./dimension-picker";
import { selectFallback } from "./fallback-selector";
import {
  buildPrompt,
  type DimensionPicks,
  type ResponsesMap,
} from "./prompt-builder";

export type GenerateReviewInput = {
  businessId: string;
  sessionId: string;
  responses: ResponsesMap;
};

export type GenerateReviewResult = {
  review: string;
  provider: string;
  fallbackUsed: boolean;
};

export async function generateReview(
  input: GenerateReviewInput,
): Promise<GenerateReviewResult> {
  const { businessId, sessionId, responses } = input;

  const [business, settings, steps] = await Promise.all([
    businessesRepo.findById(businessId),
    businessSettingsRepo.findByBusinessId(businessId),
    flowStepsRepo.listByBusiness(businessId),
  ]);

  if (!business) throw new Error("business not found");
  if (!settings) throw new Error("business settings not found");

  // Extract tag names mentioned in responses (multi_choice / single_choice).
  const tagNames = new Set<string>();
  for (const step of steps) {
    if (!step.inject_into_prompt) continue;
    const v = responses[step.step_key];
    if (Array.isArray(v)) v.forEach((x) => tagNames.add(String(x)));
    else if (typeof v === "string") tagNames.add(v);
  }
  const matchedTags = await businessTagsRepo.findByNames(
    businessId,
    [...tagNames],
  );

  // Seed PRNG from session_id (deterministic per session).
  const rng = mulberry32(hashStringToSeed(sessionId));

  // Sample each dimension.
  const picks = {} as Record<EngineDimension, string | null>;
  for (const dim of ENGINE_DIMENSIONS) {
    const entries = await promptPoolsRepo.listForDimension(
      businessId,
      business.industry_code,
      dim,
    );
    picks[dim] = pickPoolValue(entries, rng);
  }
  const dimensionPicks = picks as DimensionPicks;

  // Fallback path: AI disabled.
  if (!settings.ai_enabled) {
    return {
      review: selectFallback(settings),
      provider: "fallback:ai-disabled",
      fallbackUsed: true,
    };
  }

  const prompt = buildPrompt({
    settings,
    steps,
    responses,
    matchedTags,
    picks: dimensionPicks,
    rng,
  });

  try {
    const provider = getAIProvider();
    const result = await provider.generate({ prompt });
    return {
      review: result.text,
      provider: result.provider,
      fallbackUsed: false,
    };
  } catch (err) {
    const providerName =
      err instanceof AIProviderError ? err.provider : "unknown";
    logger.warn({ err, providerName }, "AI provider failed — using fallback");
    return {
      review: selectFallback(settings),
      provider: `fallback:${providerName}`,
      fallbackUsed: true,
    };
  }
}
