# 10. SHORTREEL — SUBSCRIPTION VALIDATION

> **Validation Status:** ⚠️ READY WITH CONDITIONS

## Status Machine Validation

TRIAL → ACTIVE → PAST_DUE → CANCELLED / EXPIRED

Additional: CANCELLED → (retry) → ACTIVE (resubscribe, not same row)

| Transition | Valid? | Notes |
| :--- | :--- | :--- |
| TRIAL → ACTIVE | ✅ | On first successful charge |
| ACTIVE → PAST_DUE | ✅ | On payment failure |
| PAST_DUE → ACTIVE | ✅ | On payment retry success |
| PAST_DUE → CANCELLED | ✅ | After grace period |
| ACTIVE → CANCELLED | ✅ | User cancels at period end |
| CANCELLED → EXPIRED | ✅ | At period end |

## Entitlement Model

Entitlement derives from Subscription.status:
- TRIAL or ACTIVE → access granted
- PAST_DUE → access granted during grace period (BR-005 open)
- CANCELLED → access until period_end
- EXPIRED → no access

P1: Explicit entitlements table recommended (see P1-DB-001).
Currently: entitlement is a runtime check on subscription.status + period_end. Works but not auditable.

## Webhook Idempotency

webhook_events table: UNIQUE(provider, event_id) ensures duplicate delivery is safe.
Status: RECEIVED → PROCESSING → PROCESSED / FAILED
Validated: ✅

## Payment Provider

ADR-005: Payment provider (Razorpay + Stripe) not locked. Engineering Pack assumes Razorpay as primary, Stripe as international fallback.
Must confirm before M21.

## Open Decisions

BR-004: Free trial duration — blocks M22
BR-005: Grace period length — blocks M22
LC-004: Refund policy — blocks M23
ADR-005: Payment provider — blocks M21

## Validation Status: ⚠️ READY WITH CONDITIONS
