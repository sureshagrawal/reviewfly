/**
 * Token interpolation for question labels, helper text, and info-panel bodies.
 *
 * Syntax: {step_key}
 *   - Replaces with the latest response for that step_key.
 *   - Arrays render as comma-separated list.
 *   - Numbers render via String(n).
 *   - Missing/empty values cause graceful collapse: surrounding whitespace
 *     trimmed so "...for {course}" becomes "...for" (NOT "...for {course}").
 *
 * Escape: literal `{` `}` not currently supported (rare in review-collection
 * forms). Add later if a tenant complains.
 */

type Responses = Record<string, unknown>;

const TOKEN = /\{([a-z_][a-z0-9_]*)\}/gi;

function valueToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== null && v !== undefined && v !== "")
      .map((v) => String(v))
      .join(", ");
  }
  return String(value);
}

export function interpolate(input: string, responses: Responses): string {
  if (!input) return input;
  if (!input.includes("{")) return input;
  // First pass: substitute (empty for missing).
  const subbed = input.replace(TOKEN, (_, key: string) => {
    return valueToText(responses[key]);
  });
  // Collapse double-spaces left by empty substitutions; trim phrase remnants.
  return subbed
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

/**
 * List of step keys referenced inside a template string (for UI helper hints).
 */
export function listTokens(input: string): string[] {
  if (!input) return [];
  const out = new Set<string>();
  for (const match of input.matchAll(TOKEN)) {
    if (match[1]) out.add(match[1]);
  }
  return [...out];
}
