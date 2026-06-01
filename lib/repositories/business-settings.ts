import { sql } from "@/lib/db";

export type BusinessSettingsRow = {
  business_id: string;
  display_name: string;
  aliases: string[];
  logo_url: string | null;
  brand_color: string;
  poster_tagline: string | null;
  google_review_url: string | null;
  whatsapp_number: string | null;
  ai_enabled: boolean;
  sentiment_gate_threshold: number;
  display_timezone: string;
  hard_fallback: string;
};

export async function findByBusinessId(
  businessId: string,
): Promise<BusinessSettingsRow | null> {
  const rows = await sql<BusinessSettingsRow[]>`
    SELECT business_id, display_name, aliases, logo_url, brand_color,
           poster_tagline, google_review_url, whatsapp_number,
           ai_enabled, sentiment_gate_threshold, display_timezone, hard_fallback
    FROM business_settings
    WHERE business_id = ${businessId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}
