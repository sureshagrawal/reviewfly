import type { BusinessSettingsRow } from "@/lib/repositories/business-settings";
import type { BusinessTagRow } from "@/lib/repositories/business-tags";
import type { FlowStepRow } from "@/lib/repositories/flow-steps";
import { pickAlias, pickContentHint } from "./alias-substitution";

/**
 * Prompt builder — composes the final prompt sent to the AI provider.
 *
 * Inputs:
 *   - business settings (name, display name)
 *   - picked dimension values (opening, tone, structure, etc.)
 *   - reviewer responses + the flow_steps that produced them
 *   - matched business_tags (with alias substitution applied)
 *
 * Output is a single string. Kept deliberately simple in Phase 1a; can be
 * upgraded to a Handlebars-style template later.
 */

export type ResponsesMap = Record<string, string | string[] | number>;

export type DimensionPicks = {
  opening: string | null;
  tone: string | null;
  language: string | null;
  emoji: string | null;
  structure: string | null;
  grammar: string | null;
  staff_mention: string | null;
  length: string | null;
};

export type BuildPromptInput = {
  settings: BusinessSettingsRow;
  steps: FlowStepRow[];
  responses: ResponsesMap;
  matchedTags: BusinessTagRow[];
  picks: DimensionPicks;
  rng: () => number;
};

export function buildPrompt(input: BuildPromptInput): string {
  const { settings, steps, responses, matchedTags, picks, rng } = input;

  const aliasedTagNames = matchedTags.map((t) => pickAlias(t, rng));
  const hints = matchedTags
    .map((t) => pickContentHint(t, rng))
    .filter((h): h is string => Boolean(h));

  const responseLines: string[] = [];
  for (const step of steps) {
    if (!step.inject_into_prompt) continue;
    const value = responses[step.step_key];
    if (value === undefined || value === null) continue;
    const printable = Array.isArray(value) ? value.join(", ") : String(value);
    if (!printable) continue;
    responseLines.push(`- ${step.question_label}: ${printable}`);
  }

  const businessLabel = settings.display_name;

  return [
    `You are writing a single authentic-sounding 5-star Google review for "${businessLabel}".`,
    ``,
    `Constraints:`,
    `- Output the review text only — no quotes, no preface, no markdown.`,
    `- Length: ${picks.length ?? "100 to 250 characters"}.`,
    `- Tone: ${picks.tone ?? "warm and natural"}.`,
    `- Language style: ${picks.language ?? "everyday English"}.`,
    picks.emoji ? `- Emoji policy: ${picks.emoji}.` : `- Emoji policy: none.`,
    picks.structure ? `- Structure: ${picks.structure}.` : ``,
    picks.grammar ? `- Grammar variant: ${picks.grammar}.` : ``,
    picks.opening ? `- Open with: "${picks.opening}".` : ``,
    picks.staff_mention ? `- Staff mention guideline: ${picks.staff_mention}.` : ``,
    ``,
    `Reviewer's responses:`,
    ...(responseLines.length ? responseLines : [`- (no responses provided)`]),
    ``,
    aliasedTagNames.length
      ? `Reference these names exactly as written: ${aliasedTagNames.join(", ")}.`
      : ``,
    hints.length
      ? `Weave in (at most one) of these natural hints if it fits: ${hints.join(" | ")}.`
      : ``,
    ``,
    `Write the review now.`,
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}
