# 11. SHORTREEL — ANALYTICS VALIDATION

> **Validation Status:** ✅ READY

## Pipeline Validation

Transactional Data → Analytics Events → Redis Stream → BullMQ Aggregation Worker → business_metrics → Story Lab / Business Dashboard

Separation confirmed: MySQL is transactional truth. analytics_events is the raw event store. business_metrics is pre-aggregated.

## Event Schema Validation

Key events defined:
- video_play_started, video_play_completed, video_play_progress
- choice_selected, vote_cast, prediction_created
- subscription_started, subscription_cancelled
- story_shared, creator_profile_viewed

Each event: { eventType, userId (nullable for anon), storyId, episodeId, sessionId, metadata JSON, timestamp }
Validated: ✅

## Aggregation Validation

Hourly: DAU, watch minutes, choice events
Daily: MAU, revenue, completion rates, choice distribution
Monthly: creator earnings input, business reports

BullMQ cron jobs validated for schedule correctness.

## Signal Separation

Story Lab signals are computed from analytics events — they are DERIVED, not transactional.
Business metrics are DERIVED from transactional data.
Transactional MySQL ≠ analytics events ≠ derived metrics.
Correctly separated: ✅

## P2 Issues

**P2-ANL-001:** analytics_events table will be very high write volume. Consider Redis Streams as primary event buffer rather than direct MySQL inserts for V1 scale (already partially addressed in 23_REDIS_QUEUE_ARCHITECTURE.md). Confirm batch flush strategy.

**P2-ANL-002:** PII in analytics events (user_id) — requires anonymization for GDPR compliance (LC-002). Add anonymization flag or use pseudonymous user_id in events.

## Validation Status: ✅ READY
