/**
 * AI provider factory — single entry point used by the engine.
 *
 * Selection rules:
 *   1. AI_PROVIDER=openai → OpenAIProvider (requires OPENAI_API_KEY)
 *   2. AI_PROVIDER=gemini → (TBD; add in Phase 1b)
 *   3. AI_PROVIDER=mock   → MockAIProvider (dev/test default)
 *
 * Phase 1a: no failover loop. Add when 2+ providers are live.
 */

import type { AIProvider } from "./index";
import { env } from "@/lib/env";
import { OpenAIProvider } from "./openai";
import { MockAIProvider } from "./mock";

let cached: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  switch (env.AI_PROVIDER) {
    case "openai":
      cached = new OpenAIProvider();
      break;
    case "gemini":
      // Phase 1b — fall through to mock with warning for now
      cached = new MockAIProvider();
      break;
    case "mock":
    default:
      cached = new MockAIProvider();
      break;
  }
  return cached;
}
