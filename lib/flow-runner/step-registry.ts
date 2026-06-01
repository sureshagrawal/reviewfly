import { z } from "zod";

/**
 * Per-step Zod schemas for response validation on the API server.
 * Client also uses these for inline validation (single source of truth).
 */

export const StepResponseSchemas = {
  single_choice: z.string().min(1).max(200),
  multi_choice: z.array(z.string().min(1).max(200)).min(0).max(10),
  text_short: z.string().max(100),
  text_long: z.string().max(500),
  number: z.number().finite(),
  rating: z.number().int().min(1).max(5),
  info_panel: z.literal("").or(z.undefined()).optional(),
} as const;

export type StepResponseValue = string | string[] | number | undefined;
