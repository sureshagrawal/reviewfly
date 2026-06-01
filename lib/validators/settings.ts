import { z } from "zod";

export const SettingsUpdateSchema = z.object({
  display_name: z.string().min(2).max(200),
  brand_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "brand_color must be hex like #1a73e8"),
  google_review_url: z.string().url().max(500).nullish(),
  whatsapp_number: z
    .string()
    .max(20)
    .regex(/^\+?[0-9 ]{0,20}$/, "whatsapp_number digits or + only")
    .nullish(),
  poster_tagline: z.string().max(200).nullish(),
  ai_enabled: z.boolean(),
  sentiment_gate_threshold: z.number().min(0).max(1),
  hard_fallback: z.string().min(10).max(500),
});

export type SettingsUpdateInput = z.infer<typeof SettingsUpdateSchema>;
