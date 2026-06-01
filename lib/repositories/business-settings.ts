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

export async function createDefault(input: {
  businessId: string;
  displayName: string;
}): Promise<void> {
  await sql`
    INSERT INTO business_settings (business_id, display_name)
    VALUES (${input.businessId}, ${input.displayName})
    ON CONFLICT (business_id) DO NOTHING
  `;
}

export type SettingsUpdate = {
  display_name: string;
  brand_color: string;
  google_review_url: string | null;
  whatsapp_number: string | null;
  poster_tagline: string | null;
  ai_enabled: boolean;
  sentiment_gate_threshold: number;
  hard_fallback: string;
};

export async function update(
  businessId: string,
  patch: SettingsUpdate,
): Promise<void> {
  await sql`
    UPDATE business_settings SET
      display_name = ${patch.display_name},
      brand_color = ${patch.brand_color},
      google_review_url = ${patch.google_review_url},
      whatsapp_number = ${patch.whatsapp_number},
      poster_tagline = ${patch.poster_tagline},
      ai_enabled = ${patch.ai_enabled},
      sentiment_gate_threshold = ${patch.sentiment_gate_threshold},
      hard_fallback = ${patch.hard_fallback},
      updated_at = NOW()
    WHERE business_id = ${businessId}
  `;
}
