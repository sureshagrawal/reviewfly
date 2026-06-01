import { z } from "zod";
import { BUSINESS_USER_ROLES } from "@/lib/constants/auth";

export const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export const RegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(200),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric or hyphens"),
  display_name: z.string().min(2).max(200),
  industry_code: z.string().min(2).max(50).default("academy"),
  role: z.enum(BUSINESS_USER_ROLES).default("owner"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
