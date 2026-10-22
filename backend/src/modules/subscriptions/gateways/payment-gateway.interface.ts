import { SubscriptionPlan, BillingInterval, PaymentProvider } from '../../../database/schema';

export interface CheckoutSessionParams {
  userId: string;
  userEmail?: string;
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  amount: number;
  currency: string;
  returnUrl?: string;
  idempotencyKey?: string;
}

export interface CheckoutSessionResult {
  provider: PaymentProvider;
  sessionId: string;
  checkoutUrl: string;
  externalOrderId?: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentVerificationParams {
  orderId?: string;
  paymentId?: string;
  signature?: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
}

export interface PaymentGatewayService {
  readonly provider: PaymentProvider;

  /**
   * Generates a new hosted checkout session or order with the external payment gateway
   */
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>;

  /**
   * Verifies payment authenticity (HMAC signature or gateway session check)
   */
  verifyPayment(params: PaymentVerificationParams): Promise<boolean>;

  /**
   * Cryptographically verifies webhook callback signature against raw payload
   */
  verifyWebhookSignature?(rawBody: string, signature: string): boolean;

  /**
   * Cancels recurring billing on the external payment gateway
   */
  cancelSubscription(externalSubId: string): Promise<void>;
}
