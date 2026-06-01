import type { AIProvider, GenerateOptions, GenerateResult } from "@/lib/adapters/ai";
import { AIProviderError } from "@/lib/adapters/ai";
import { env } from "@/lib/env";

/**
 * OpenAI provider using REST API (no SDK — keeps vendor surface minimal).
 * Compatible with gpt-4o-mini, gpt-4o, gpt-4-turbo, etc.
 */

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    if (!env.OPENAI_API_KEY) {
      throw new AIProviderError(this.name, "OPENAI_API_KEY not configured");
    }

    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? env.AI_REQUEST_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.AI_MODEL,
          messages: [{ role: "user", content: options.prompt }],
          max_tokens: options.maxTokens ?? env.AI_MAX_OUTPUT_TOKENS,
          temperature: options.temperature ?? 0.95,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new AIProviderError(
          this.name,
          `HTTP ${res.status}: ${errText.slice(0, 200)}`,
        );
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new AIProviderError(this.name, "empty response from model");
      }

      return {
        text,
        provider: this.name,
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        latencyMs: Date.now() - startedAt,
      };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new AIProviderError(this.name, `timeout after ${timeoutMs}ms`);
      }
      throw new AIProviderError(this.name, "unexpected error", err);
    } finally {
      clearTimeout(timer);
    }
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(env.OPENAI_API_KEY);
  }
}
