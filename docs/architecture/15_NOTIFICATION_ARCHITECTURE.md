# 15. SHORTREEL — NOTIFICATION ARCHITECTURE

> **Document ID:** SR-ARCH-15  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Notification Channels & Topology

ShortReel coordinates 3 primary notification delivery channels:
1. **In-App Notifications:** Real-time bell alerts, story updates, and voting notifications stored in MySQL `notifications` and retrieved via REST / WebSocket.
2. **Push Notifications:** Web Push (VAPID for PWA) and Native Mobile Push via Firebase Cloud Messaging (FCM) & Apple Push Notification service (APNs).
3. **Email Notifications:** Transactional receipts, account security alerts, and creator application updates via SendGrid / AWS SES.
4. **Future Channels:** Pre-architected seam for SMS and WhatsApp Business API.

---

## 2. Event-Driven Asynchronous Pipeline

```text
Domain Event (e.g. EPISODE_PUBLISHED, VOTE_CLOSING)
                      │
                      ▼
            Notification Rule Engine
      (Filters preferences, quiet hours, cooldowns)
                      │
                      ▼
         BullMQ Queue: `notifications-queue`
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   In-App Worker Push Worker   Email Worker
        │             │             │
        ▼             ▼             ▼
  MySQL Insert    FCM / APNs    SendGrid / SES
```

### 2.1 Queue Job Schema
```json
{
  "jobId": "notif-01HTXYZ...",
  "userId": "01HTUSER...",
  "channel": "PUSH",
  "category": "EPISODE_DROP",
  "payload": {
    "title": "New Episode Available! 🎬",
    "body": "Floor Nine — Episode 7 is now live! Will Vikram escape?",
    "deepLink": "/watch/floor-nine?ep=7",
    "imageUrl": "https://images.unsplash.com/..."
  },
  "idempotencyKey": "notif:floor-nine:ep7:user102",
  "attempt": 1,
  "maxRetries": 3
}
```

---

## 3. Reliability, Idempotency & Rate Limiting

1. **Idempotency Key:** Computed as `hash(userId + eventType + entityId)`. Stored in Redis with a 48-hour TTL. If an event fires multiple times (e.g. repeated webhook or retry), only a single notification is dispatched to the user.
2. **User Preference & Cooldown Guards:**
   - Evaluates `user_notification_settings` before enqueuing.
   - Frequency capping: Maximum 3 promotional push notifications per user per 24 hours.
3. **Dead-Letter Queue (DLQ):** Failed jobs retry up to 3 times with exponential backoff (`30s`, `2m`, `10m`). Permanently failed deliveries are routed to `notifications-dlq` for operator investigation.
