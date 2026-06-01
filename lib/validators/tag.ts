import { z } from "zod";

export const TagCreateSchema = z.object({
  category: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(500).nullish(),
  tag_type: z.string().max(50).default("generic"),
  aliases: z.array(z.string().min(1).max(200)).max(10).default([]),
  content_hints: z.array(z.string().min(1).max(500)).max(10).default([]),
  display_order: z.number().int().min(0).max(9999).default(0),
});

export const TagUpdateSchema = TagCreateSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export type TagCreateInput = z.infer<typeof TagCreateSchema>;
export type TagUpdateInput = z.infer<typeof TagUpdateSchema>;
