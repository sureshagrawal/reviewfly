/**
 * Email adapter interface.
 *
 * - Console backend in dev (prints emails to log).
 * - Resend/SES/etc. in production.
 *
 * Phase 0: interface only.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type EmailResult = {
  id: string;
  provider: string;
};

export interface EmailAdapter {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailResult>;
}
