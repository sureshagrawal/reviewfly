import { z } from "zod";

export const AdminProfileUpdateSchema = z
  .object({
    email: z
      .preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().email().max(255))
      .optional(),
    current_password: z
      .preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1).max(200)),
    new_password: z
      .preprocess((v) => {
        if (typeof v !== "string") return v;
        const t = v.trim();
        return t.length === 0 ? undefined : t;
      }, z.string().min(8).max(200).optional()),
  })
  .refine((v) => Boolean(v.email || v.new_password), {
    message: "at least one of email or new_password is required",
    path: ["email"],
  });

export type AdminProfileUpdateInput = z.infer<typeof AdminProfileUpdateSchema>;
