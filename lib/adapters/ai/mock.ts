import type {
  AIProvider,
  GenerateOptions,
  GenerateResult,
} from "@/lib/adapters/ai";

/**
 * Mock AI provider — used when AI_PROVIDER=mock or for local dev without keys.
 * Generates a deterministic-but-varied review by echoing the prompt's intent.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const startedAt = Date.now();
    // tiny artificial latency so dev sees the loading state
    await new Promise((r) => setTimeout(r, 250));

    const seed = options.prompt.length;
    const sentences = [
      "Loved my experience here — staff were attentive and the quality really stood out.",
      "Honestly exceeded expectations. The little details made the whole visit feel personal.",
      "If you're considering this place, just go. Reliable, professional, and genuinely good.",
      "Came in unsure and left a fan. Highly recommend to friends and family.",
      "The team here knows what they're doing. Smooth from start to finish.",
    ];
    const picked = sentences[seed % sentences.length] ?? sentences[0]!;
    return {
      text: `${picked} (mock #${seed})`,
      provider: this.name,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startedAt,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
