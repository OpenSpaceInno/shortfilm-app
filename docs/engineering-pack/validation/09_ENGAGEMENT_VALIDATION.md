# 09. SHORTREEL — ENGAGEMENT VALIDATION

> **Validation Status:** ✅ READY

## Entity Separation Validation

| Pair | Correctly Separated? | Validation |
| :--- | :--- | :--- |
| WatchHistory vs WatchProgress | ✅ YES | History=append-only log. Progress=mutable resume pointer. |
| UserChoice vs Vote | ✅ YES | UserChoice=branch selection. Vote=community opinion. |
| Prediction vs Gambling | ✅ YES | No monetary outcome from predictions. Engagement-only. |
| Subscription vs User Status | ✅ YES | Subscription is a billing entity; User.status is account status. |

## XP Engine

XP Ledger: append-only. Each event creates a new row.
Running total computed via SUM(xp_ledger.amount WHERE user_id=X).
Redis cache: user:xp:{userId} invalidated on new ledger entry.
Validated: ✅

## Gamification

Badge unlock is event-driven (XpAwarded or ChoiceSelected domain events trigger badge evaluation worker).
user_badges.unlocked_at is non-nullable — badge cannot be 'locked' after award.
Streak tracking: requires daily cron (or on-demand calculation from watch_history).
Open: BR-008 (streak milestone definitions).

## Notification System

Channel support: IN_APP, PUSH (FCM), EMAIL.
user_notification_preferences (JSON) controls opt-in per channel.
BullMQ notification worker handles dispatch with retry.
Idempotency: notification_id (ULID) prevents duplicate dispatch.
Validated: ✅

## Share Entity

'Share' is tracked for analytics (share_count denormalized on stories).
Not a stored entity — only the counter is incremented.
Confirmed: shares are not stored as rows; only share_count is incremented.
P2: consider a shares event for analytics to track platform + share context.

## Validation Status: ✅ READY
