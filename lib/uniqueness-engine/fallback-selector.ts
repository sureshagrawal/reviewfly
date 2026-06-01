import type { BusinessSettingsRow } from "@/lib/repositories/business-settings";

/**
 * Weighted-decay fallback selector.
 *
 * Used when the AI provider fails. Returns a static review with light
 * placeholder substitution. Phase 1a: single hardcoded fallback from
 * business_settings.hard_fallback (fallback_templates table comes in 1b).
 */
export function selectFallback(
  settings: Pick<BusinessSettingsRow, "hard_fallback" | "display_name">,
): string {
  return settings.hard_fallback.replace("{business}", settings.display_name);
}
