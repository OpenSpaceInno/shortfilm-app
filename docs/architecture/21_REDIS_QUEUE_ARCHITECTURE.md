# 21. SHORTREEL — REDIS & BACKGROUND QUEUE ARCHITECTURE

> **Document ID:** SR-ARCH-21  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Architectural Role of Redis

Redis 7.x serves as the platform's distributed high-throughput, in-memory caching and queuing layer.

> [!IMPORTANT]
> **Ephemeral Data Rule**:
> Redis is **NOT a permanent system of record**. All critical business entities (users, stories, choices, payments) must be committed durably to MySQL. Redis stores volatile caches, transient locks, token states, high-speed counters, and asynchronous job queues.

```text
                                  ┌───────────────────────────────┐
                                  │      NestJS Application       │
                                  └──────────────┬────────────────┘
                                                 │
                   ┌─────────────────────────────┼────────────────────────────┐
                   ▼                             ▼                            ▼
        ┌─────────────────────┐       ┌─────────────────────┐      ┌────────────────────┐
        │   Cache & State     │       │  Distributed Locks  │      │  BullMQ Job Queue  │
        │ - Story Graphs      │       │ - Redlock mutex     │      │ - Video processing │
        │ - Hot Feed Caches   │       │ - Concurrent Choice │      │ - Analytics rollup │
        │ - Auth Token State  │       │   resolution        │      │ - Notifications    │
        │ - Rate Limit Windows│       │ - Webhook processing│      │ - AI Studio batch  │
        └─────────────────────┘       └─────────────────────┘      └────────────────────┘
```

---

## 2. Redis Key Namespace & TTL Strategy

To prevent key collisions and memory bloat, all keys adhere to strict prefix formatting and TTLs:

| Key Pattern | Purpose | Data Structure | TTL | Eviction / Invalidation Policy |
| :--- | :--- | :--- | :--- | :--- |
| `auth:refresh:{userId}:{tokenId}` | Active refresh token rotation pointer | String (hash) | 30 Days | Explicit deletion on logout / rotation. |
| `auth:revoked:{jti}` | Blacklisted JWT access token | String (`1`) | Expiry of JWT (~15 min) | Automatic expiration. |
| `ratelimit:{ip/userId}:{route}` | Sliding window rate limit tracker | Sorted Set / String counter | 60 Seconds | Automatic expiration. |
| `cache:story:published:{storyId}` | Complete published StoryVersion graph | String (Compressed JSON) | 6 Hours | Explicit cache purge on version publish/archive. |
| `cache:feed:trending:{language}` | Home feed trending carousel data | String (JSON Array) | 10 Minutes | Background cron refresh. |
| `vote:buffer:{choiceId}:{optionId}`| Ephemeral vote counter before DB sync | HyperLogLog / Counter | 1 Hour | Flushed to MySQL via scheduled worker. |
| `lock:{resourceName}:{id}` | Distributed mutual exclusion lock | String (token) with NX/PX | 5–30 Seconds | Released by worker on completion. |

---

## 3. Distributed Locking (Redlock / Mutex)

Distributed locks prevent race conditions across horizontal NestJS application instances:
- **Use Case 1: Subscription Webhook Processing**  
  Key: `lock:webhook:payment:{orderId}` (TTL: 10s). Guarantees payment webhooks for the same order are processed strictly once even during concurrent delivery.
- **Use Case 2: Story Version Publishing**  
  Key: `lock:story:publish:{storyId}` (TTL: 30s). Prevents simultaneous concurrent publish actions on the same story.
- **Implementation**: Utilizes `ioredis` with Lua script atomic release (`if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`).

---

## 4. BullMQ Queue Architecture & Worker Specifications

Background processing is separated into isolated queues with tailored concurrency and retry policies.

```text
 ┌──────────────────────┐   enqueue()   ┌─────────────────────────────────────────┐
 │ NestJS Producer      │ ────────────> │ Redis List / Sorted Set (BullMQ Queues) │
 └──────────────────────┘               └────────────────────┬────────────────────┘
                                                             │
                                   ┌─────────────────────────┼─────────────────────────┐
                                   ▼                         ▼                         ▼
                        ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
                        │ video-processing    │   │ analytics-rollup    │   │ notification-queue  │
                        │ (Transcode / Media) │   │ (Hourly Aggregation)│   │ (Push / Email / SMS)│
                        └─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

### 4.1 Production Queue Definitions

| Queue Identifier | Responsibility | Concurrency | Backoff & Retry Strategy | Dead-Letter Queue (DLQ) |
| :--- | :--- | :--- | :--- | :--- |
| `video-processing-queue` | Monitor Cloudflare Stream encoding, generate sprite sheets, update MySQL `videos`. | 5 workers | 5 attempts, Exponential (`initial: 10s`, `factor: 2`) | `video-processing-dlq` |
| `analytics-rollup-queue` | Aggregate raw Redis stream telemetry into hourly/daily `business_metrics`. | 2 workers | 3 attempts, Linear (`30s`) | `analytics-rollup-dlq` |
| `notifications-queue` | Dispatch push (FCM/APNs) and transactional emails (SendGrid/SES). | 20 workers | 3 attempts, Exponential (`initial: 5s`) | `notifications-dlq` |
| `story-lab-queue` | Compute behavioral signals, detect anomalies, generate story insights. | 2 workers | 2 attempts, Fixed (`60s`) | `story-lab-dlq` |
| `ai-studio-queue` | Asynchronous multi-beat script generation, production pack compilation. | 4 workers | 2 attempts, Fixed (`15s`) | `ai-studio-dlq` |
| `subscription-billing-queue` | Process renewal webhooks, compute grace period expirations, verify receipts. | 10 workers | 5 attempts, Exponential (`initial: 30s`) | `subscription-billing-dlq` |

### 4.2 Idempotency & Failure Handling
1. **Job Deduplication**: All jobs specify a deterministic `jobId`:
   ```typescript
   await notificationQueue.add('send_push', payload, {
     jobId: `push:${userId}:${notificationType}:${referenceId}`,
     removeOnComplete: true,
     attempts: 3,
     backoff: { type: 'exponential', delay: 5000 }
   });
   ```
2. **Dead-Letter Queue (DLQ) Inspection**: Jobs exceeding maximum retries fail over to corresponding DLQs with complete failure stack traces, alerting engineering teams via PagerDuty/Sentry.
