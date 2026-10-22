# 16. SHORTREEL — SUBSCRIPTION & MONETISATION ARCHITECTURE

> **Document ID:** SR-ARCH-16  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Monetisation Model & Entity Flow

ShortReel employs a hybrid freemium model:
- **Free Tier:** Episodes 1–3 (or free count per season) are accessible to all registered users.
- **VIP Subscription:** Grants unlimited, ad-free, 1080p access to all premium episodes, early story branch releases, and bonus creator content.

```text
┌───────────────────────┐
│   SubscriptionPlan    │ (Monthly ₹149, Annual ₹999, Lifetime ₹2,499)
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│     Subscription      │ (Tracks billing cycle, payment provider ID)
└───────────┬───────────┘
            │ Grants
            ▼
┌───────────────────────┐
│      Entitlement      │ (Cached in Redis for <1ms access verification)
└───────────┬───────────┘
            │ Authorizes
            ▼
┌───────────────────────┐
│ Content Access Check  │ (Authorizes 1080p signed playback tokens)
└───────────────────────┘
```

---

## 2. Subscription Lifecycle State Machine

```text
       Checkout Initiated
               │
               ▼
        ┌──────────────┐       Payment Failed        ┌──────────────┐
        │    ACTIVE    │ ──────────────────────────> │   PAST_DUE   │
        └──────┬───────┘                             └──────┬───────┘
               │                                            │
               │ User Cancels                               │ Grace Period Expires (3 Days)
               ▼                                            ▼
        ┌──────────────┐                             ┌──────────────┐
        │  CANCELLED   │ ──────────────────────────> │   EXPIRED    │
        │(Active until │   Period Ends               │ (Entitlement │
        │ period end)  │                             │   Revoked)   │
        └──────────────┘                             └──────────────┘
```

### 2.1 State Rules & Grace Period
- **`ACTIVE`:** Full VIP entitlement active. Cached in Redis key `entitlement:vip:<userId> = 1`.
- **`PAST_DUE`:** Payment failed upon renewal. A **3-day grace period** is granted. The user retains VIP access while billing retry notifications are dispatched.
- **`CANCELLED`:** User turned off auto-renew. Subscription remains valid until `current_period_end`.
- **`EXPIRED`:** Grace period elapsed or subscription term finished. Entitlement record `is_active` set to 0; Redis key deleted.

---

## 3. Payment Gateway Abstraction Layer

The application core does not directly couple to Stripe, Razorpay, or Apple/Google In-App Purchases. All billing operations run through an abstract service contract:

```typescript
export interface PaymentGatewayService {
  createCheckoutSession(userId: string, planCode: string, returnUrl: string): Promise<{ checkoutUrl: string; sessionId: string }>;
  cancelSubscription(externalSubId: string): Promise<void>;
  parseWebhookEvent(rawBody: Buffer, signature: string): WebhookEvent;
}
```

---

## 4. Webhook Ingestion & Idempotency Pipeline

Payment webhooks (`invoice.payment_succeeded`, `customer.subscription.deleted`, etc.) can be received multiple times due to provider retries.

```sql
-- Idempotency Guard in MySQL
INSERT INTO payment_transactions (
  id,
  idempotency_key,
  external_event_id,
  event_type,
  payload_json,
  status,
  created_at
) VALUES (
  :ulid,
  :idempotencyKey,
  :externalEventId,
  :eventType,
  :payloadJson,
  'PROCESSED',
  NOW(3)
);
```

- If `external_event_id` violates a unique index, the transaction fails immediately, and the controller returns HTTP `200 OK` to the payment provider without re-processing.
- **Atomic State Update:** Inside the same transaction, `subscriptions` and `entitlements` are synchronized, and domain event `SUBSCRIPTION_ACTIVATED` or `ENTITLEMENT_REVOKED` is emitted.
