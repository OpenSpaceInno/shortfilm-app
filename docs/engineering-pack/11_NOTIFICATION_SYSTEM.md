# 11. SHORTREEL — NOTIFICATION SYSTEM

> **Document:** 11_NOTIFICATION_SYSTEM.md
> **Reference:** docs/architecture/15_NOTIFICATION_ARCHITECTURE.md

## 1. Notification Channels

- **In-App:** Stored in 
otifications table, fetched via API
- **Push:** FCM (Android/Web) + APNs (iOS)
- **Email:** SendGrid / AWS SES
- **Future:** WhatsApp, SMS (abstracted interface)

## 2. Architecture

`
Domain Event (e.g. STORY_PUBLISHED, BADGE_UNLOCKED)
     ↓ NotificationService.dispatch()
     ↓ Resolve notification template
     ↓ Add to notifications-queue (BullMQ)
     ↓ Worker: INSERT notifications table (in-app)
     ↓ Worker: Send push via FCM/APNs
     ↓ Worker: Send email via SendGrid
`

## 3. Notification Table

| Field | Type |
| :--- | :--- |
| id | ULID BINARY(16) |
| user_id | FK → users |
| type | VARCHAR(100) — e.g. STORY_PUBLISHED |
| title | VARCHAR(255) |
| body | TEXT |
| reference_type | VARCHAR(50) — Story, Episode, Badge |
| reference_id | BINARY(16) |
| is_read | BOOLEAN DEFAULT FALSE |
| sent_push | BOOLEAN DEFAULT FALSE |
| sent_email | BOOLEAN DEFAULT FALSE |
| created_at | DATETIME(3) |

## 4. Notification Types

`
STORY_PUBLISHED        EPISODE_PUBLISHED      CHOICE_REMINDER
VOTE_RESULT            PREDICTION_RESOLVED    BADGE_UNLOCKED
XP_MILESTONE           STREAK_REMINDER        SUBSCRIPTION_RENEWED
SUBSCRIPTION_FAILED    CREATOR_APPROVED       SUBMISSION_STATUS_CHANGED
`

## 5. Idempotency

BullMQ job ID: 
otif:{userId}:{type}:{referenceId} — prevents duplicate jobs for same event.

## 6. Provider Abstraction

`	ypescript
interface NotificationProvider {
  sendPush(userId: string, title: string, body: string, data?: any): Promise<void>;
  sendEmail(to: string, template: string, variables: Record<string, any>): Promise<void>;
}
`

## 7. User Preferences

Stored in user_profiles.notification_preferences JSON:
`json
{ "push": true, "email": true, "inApp": true,
  "types": { "STREAK_REMINDER": false } }
`
Worker respects preferences before dispatching.
