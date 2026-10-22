# 36. SHORTREEL — IDEMPOTENCY

## Why Idempotency Matters

The same operation may arrive multiple times due to:
- Network retries from client
- Payment provider duplicate webhook deliveries
- Cloudflare Stream duplicate status callbacks
- BullMQ job retries after failure

## Idempotency Implementations

| Operation | Mechanism | Storage |
| :--- | :--- | :--- |
| User choice submission | UNIQUE KEY (user_id, choice_id) | MySQL |
| Payment webhook processing | webhook_events (provider, event_id) UNIQUE | MySQL |
| Video status callback | webhook_events (provider, event_id) UNIQUE | MySQL |
| Notification dispatch | BullMQ jobId = notif:{userId}:{type}:{refId} | BullMQ deduplication |
| Analytics event ingest | Redis Stream dedupe by eventId | Redis (24h window) |
| AI generation job | BullMQ jobId = ai:{userId}:{requestHash} | BullMQ deduplication |
| Watch progress sync | UPSERT on (user_id, episode_id) | MySQL |

## Client Idempotency Key

Clients may send Idempotency-Key: {ulid} header on POST requests.
NestJS caches response in Redis for 24h under key idem:{key}.
Duplicate requests within 24h return the cached response.
