/**
 * AI provider adapter interface.
 *
 * - Hides which model is called (Gemini, OpenAI, Anthropic, etc.).
 * - Failover loop will iterate providers per `AI_PROVIDERS` env var.
 * - Implementations live in sibling files (gemini.ts, openai.ts).
 *
 * Phase 0: interface only. Implementations come in CVL phase.
 */

export type GenerateOptions = {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
};

export type GenerateResult = {
  text: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
};

export interface AIProvider {
  readonly name: string;
  generate(options: GenerateOptions): Promise<GenerateResult>;
  isAvailable(): Promise<boolean>;
}

export class AIProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(`[${provider}] ${message}`);
    this.name = "AIProviderError";
  }
}
