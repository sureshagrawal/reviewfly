import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  if (env.EMAIL_BACKEND === "console") {
    // Local/dev visibility: reset URL is logged for manual testing.
    if (env.NODE_ENV !== "production") {
      logger.info(
        {
          to: input.to,
          reset_url: input.resetUrl,
        },
        "auth-email: password reset link (console backend)",
      );
    } else {
      logger.warn(
        {
          to: input.to,
        },
        "auth-email: console backend active in production; password reset email not delivered",
      );
    }
    return;
  }

  if (!env.RESEND_API_KEY) {
    logger.error("auth-email: RESEND_API_KEY missing; cannot send reset email");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: "Reset your ReviewFly password",
      html: `<p>Click the link below to reset your password:</p><p><a href=\"${input.resetUrl}\">Reset password</a></p><p>This link expires in 30 minutes.</p>`,
      text: `Reset your password using this link: ${input.resetUrl} (expires in 30 minutes).`,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    logger.error({ status: res.status, details }, "auth-email: resend send failed");
  }
}
