/**
 * Payments adapter interface.
 *
 * - Razorpay for INR (Phase 4+).
 * - Stripe can be added later via the same interface.
 *
 * Phase 0: interface only.
 */

export type Plan = "basic" | "pro" | "max";

export type CreateSubscriptionInput = {
  customerEmail: string;
  customerName: string;
  plan: Plan;
  metadata?: Record<string, string>;
};

export type CreateSubscriptionResult = {
  subscriptionId: string;
  customerId: string;
  checkoutUrl: string;
};

export type WebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  receivedAt: Date;
};

export interface PaymentsAdapter {
  readonly name: string;
  createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  parseWebhook(rawBody: string): WebhookEvent;
}
