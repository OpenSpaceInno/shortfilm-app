# 23. SHORTREEL — REDIS & QUEUE ARCHITECTURE

> **Reference:** `docs/architecture/21_REDIS_QUEUE_ARCHITECTURE.md`

## Redis Key Namespace

| Key Pattern | Purpose | TTL |
| :--- | :--- | :--- |
| auth:refresh:{userId}:{tokenId} | Refresh token state | 30d |
| auth:revoked:{jti} | Blacklisted JWT | JWT expiry (15m) |
| ratelimit:{ip}:{route} | Rate limit window | 60s |
| cache:story:published:{id} | Published story graph | 6h |
| cache:feed:trending:{lang} | Home feed cache | 10m |
| cache:search:{hash} | Search result cache | 15m |
| vote:buffer:{choiceId}:{optionId} | Vote buffer pre-DB sync | 1h |
| lock:{resource}:{id} | Distributed mutex | 5-30s |

## BullMQ Queues

| Queue | Workers | Retries | Backoff |
| :--- | :--- | :--- | :--- |
| video-processing-queue | 5 | 5 | Exponential 10s×2 |
| analytics-rollup-queue | 2 | 3 | Linear 30s |
| notifications-queue | 20 | 3 | Exponential 5s×2 |
| story-lab-queue | 2 | 2 | Fixed 60s |
| ai-studio-queue | 4 | 2 | Fixed 15s |
| subscription-billing-queue | 10 | 5 | Exponential 30s×2 |

All queues have a corresponding DLQ (Dead-Letter Queue) for failed jobs.

## Distributed Locking

Use Redlock (Lua script atomic release):
- lock:story:publish:{storyId} — TTL 30s — prevent concurrent publish
- lock:webhook:payment:{orderId} — TTL 10s — prevent duplicate webhook processing
- lock:vote:flush:{choiceId} — TTL 5s — prevent concurrent vote buffer flush
