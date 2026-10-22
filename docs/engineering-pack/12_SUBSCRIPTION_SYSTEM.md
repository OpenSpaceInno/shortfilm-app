# 12. SHORTREEL — SUBSCRIPTION SYSTEM

> **Document:** 12_SUBSCRIPTION_SYSTEM.md
> **Reference:** docs/architecture/16_SUBSCRIPTION_ARCHITECTURE.md

## 1. Plan → Subscription → Entitlement Flow

`
SubscriptionPlan (catalog)
     ↓ User selects plan
     ↓ POST /subscriptions/checkout → creates Subscription (TRIAL or ACTIVE)
     ↓ Payment provider confirms → webhook → activate Entitlement
     ↓ Entitlement checked on every episode stream request
`

## 2. Subscription State Machine

`
TRIAL ──> ACTIVE ──> PAST_DUE ──> CANCELLED
                           └──> EXPIRED (grace period ends)
`

- TRIAL: No payment required. Duration: OPEN — PRODUCT DECISION REQUIRED
- ACTIVE: Payment confirmed, current_period_end is in the future
- PAST_DUE: Payment failed, grace_period_end = payment_failure + 3 days
- CANCELLED: User cancelled — access until current_period_end
- EXPIRED: Grace period elapsed, access revoked

## 3. Entitlement Check Logic

`	ypescript
async function canAccessEpisode(userId: string, episode: Episode): boolean {
  if (episode.is_free) return true;
  const subscription = await getActiveSubscription(userId);
  if (!subscription) return false;
  if (subscription.status === 'ACTIVE') return true;
  if (subscription.status === 'PAST_DUE' && subscription.grace_period_end > now()) return true;
  if (subscription.status === 'CANCELLED' && subscription.current_period_end > now()) return true;
  return false;
}
`

## 4. Payment Provider Abstraction

`	ypescript
interface PaymentGatewayService {
  createCheckoutSession(plan: SubscriptionPlan, userId: string): Promise<CheckoutSession>;
  verifyWebhookSignature(payload: Buffer, signature: string): boolean;
  parseWebhookEvent(payload: Buffer): PaymentEvent;
}

class RazorpayGateway implements PaymentGatewayService { ... }
class StripeGateway implements PaymentGatewayService { ... }
`

## 5. Webhook Processing (Idempotent)

`
POST /subscriptions/webhooks/razorpay
  1. Verify HMAC-SHA256 signature
  2. Check webhook_events table for duplicate event_id
  3. If duplicate → return 200 (already processed)
  4. INSERT webhook_events
  5. Dispatch to subscription-billing-queue (BullMQ)
  6. Worker: update subscription status, create/extend entitlement
`

## 6. Open Decisions

- Trial duration: OPEN — PRODUCT DECISION REQUIRED
- Grace period length (recommended 3 days): OPEN — BUSINESS RULE REQUIRED
- Refund policy: OPEN — LEGAL DECISION REQUIRED
