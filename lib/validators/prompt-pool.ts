import { z } from "zod";
import { ENGINE_DIMENSIONS } from "@/lib/constants/step-types";

const trimmedStr = (max: number) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1).max(max));

const optionalIndustry = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v;
    const t = v.trim();
    return t.length === 0 ? null : t;
  },
  z.union([z.null(), z.string().min(2).max(50)]),
);

export const UniversalPoolCreateSchema = z.object({
  dimension: z.enum(ENGINE_DIMENSIONS),
  value: trimmedStr(500),
  weight: z.coerce.number().int().min(1).max(1000).default(10),
  applies_to_industry: optionalIndustry.default(null),
});

export const UniversalPoolUpdateSchema = z.object({
  value: trimmedStr(500).optional(),
  weight: z.coerce.number().int().min(1).max(1000).optional(),
  applies_to_industry: optionalIndustry.optional(),
  is_active: z.boolean().optional(),
});

export type UniversalPoolCreateInput = z.infer<typeof UniversalPoolCreateSchema>;
export type UniversalPoolUpdateInput = z.infer<typeof UniversalPoolUpdateSchema>;

/**
 * Vertical-leak lint per SRS §16.4: universal entries (no industry scope)
 * must not contain vertical-specific tokens.
 */
const VERTICAL_TOKENS = [
  "academy",
  "tuition",
  "coaching",
  "restaurant",
  "dining",
  "salon",
  "clinic",
  "hospital",
  "hotel",
  "gym",
  "retail",
];

export function isVerticalLeaking(value: string, industry: string | null): string | null {
  if (industry) return null;
  const lower = value.toLowerCase();
  for (const token of VERTICAL_TOKENS) {
    if (lower.includes(token)) {
      return `universal entry must avoid vertical-specific token: ${token}`;
    }
  }
  return null;
}
