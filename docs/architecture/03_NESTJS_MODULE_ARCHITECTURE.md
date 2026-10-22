# 03. SHORTREEL — NESTJS MODULE ARCHITECTURE

> **Document ID:** SR-ARCH-03  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Modular Monolith Architecture Principles

To ensure high architectural cohesion and low coupling across the application:
1. **Module Autonomy:** Each NestJS module encapsulates a distinct bounded domain context. Modules communicate with each other exclusively through exported service contracts or asynchronous domain events.
2. **Encapsulated Data Access:** Repositories and database access code are strictly internal to their owning module. External modules are never permitted to import or query another module's repository directly.
3. **Event-Driven Side Effects:** When an operation in one domain impacts another domain (e.g. choice selection triggers XP rewards and analytics logging), the primary module completes its transaction, commits to MySQL, and emits a strongly typed in-memory domain event (`@nestjs/event-emitter` backed by `EventEmitter2`).
4. **No Circular Dependencies:** Dependencies strictly flow downwards or outwards. Cyclic imports are disallowed and enforced via ESLint rules.

---

## 2. Global Module Dependency Graph

```text
                               ┌─────────────┐
                               │  AppModule  │
                               └──────┬──────┘
                                      │
     ┌──────────────────────┬─────────┴──────────┬──────────────────────┐
     ▼                      ▼                    ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ CoreModule  │      │ AuthModule  │      │ UsersModule │      │AdminModule  │
│ (DB, Redis) │      │ (JWT, Pass) │      │ (Profile)   │      │(Audit, RBAC)│
└─────────────┘      └──────┬──────┘      └─────────────┘      └─────────────┘
                            │
     ┌──────────────────────┼────────────────────┬──────────────────────┐
     ▼                      ▼                    ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ContentModule│      │Interactive  │      │ Engagement  │      │Monetisation │
│(Stories, Eps│      │Engine Module│      │   Module    │      │(Sub, Plans, │
│ Characters) │      │(Nodes, Graph│      │(Watch, XP)  │      │Entitlements)│
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
                            │
     ┌──────────────────────┼────────────────────┬──────────────────────┐
     ▼                      ▼                    ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│CreatorModule│      │StoryLabMod. │      │AnalyticsMod.│      │Notification │
│(Submissions,│      │(Signals,    │      │(Event Queue,│      │   Module    │
│ Payouts)    │      │ Experiments)│      │ Ingestion)  │      │(Push, Email)│
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

---

## 3. Detailed Module Specifications

### 3.1 AuthModule
- **Responsibility:** User authentication, password hashing (Argon2id), JWT issuance, refresh token lifecycle, OAuth2 social login, session revocation.
- **Owned Entities:** `auth_sessions`, `refresh_tokens`.
- **Public APIs:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- **Internal Dependencies:** `UsersModule`, `RedisModule`.
- **External Dependencies:** OAuth2 identity providers (Google/Apple).
- **Events Emitted:** `USER_LOGGED_IN`, `PASSWORD_RESET_REQUESTED`.
- **Events Consumed:** `USER_SUSPENDED` (revokes active session tokens).

### 3.2 UsersModule & RolesModule
- **Responsibility:** User entity management, user profile data, RBAC roles, permission assignments.
- **Owned Entities:** `users`, `profiles`, `roles`, `permissions`, `user_roles`.
- **Public APIs:** `GET /api/v1/users/profile`, `PATCH /api/v1/users/profile`, `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id/role`.
- **Internal Dependencies:** `DatabaseModule`.
- **External Dependencies:** Object Storage (avatar uploads).
- **Events Emitted:** `USER_REGISTERED`, `USER_ROLE_UPDATED`, `USER_PROFILE_UPDATED`.
- **Events Consumed:** None.

### 3.3 ContentModule (Stories, Seasons, Episodes, Videos, Characters)
- **Responsibility:** Canonical media catalog, linear episode management, character profiles, genres, tags, video stream metadata.
- **Owned Entities:** `stories`, `seasons`, `episodes`, `videos`, `characters`, `genres`, `tags`, `story_characters`, `story_genres`.
- **Public APIs:** `GET /api/v1/stories`, `GET /api/v1/stories/:slug`, `GET /api/v1/episodes/:id/stream`, `GET /api/v1/characters/:id`, `POST /api/v1/admin/stories`, `PATCH /api/v1/admin/stories/:id`.
- **Internal Dependencies:** `DatabaseModule`, `RedisModule`, `VideoService`.
- **External Dependencies:** Cloudflare Stream (video signed token generation, webhook ingestion).
- **Events Emitted:** `STORY_PUBLISHED`, `EPISODE_PUBLISHED`, `VIDEO_TRANSCODED`.
- **Events Consumed:** `STORY_VERSION_PUBLISHED` (updates active published version pointer).

### 3.4 InteractiveEngineModule (StoryVersions, StoryNodes, Choices)
- **Responsibility:** Graph-based interactive branching engine, node resolution, choice validation, voting windows, path continuity.
- **Owned Entities:** `story_versions`, `story_nodes`, `choices`, `choice_options`, `story_branches`.
- **Public APIs:** `GET /api/v1/interactive/stories/:slug/node/:nodeId`, `GET /api/v1/interactive/stories/:slug/versions`, `POST /api/v1/admin/interactive/versions`, `POST /api/v1/admin/interactive/nodes`.
- **Internal Dependencies:** `ContentModule`, `DatabaseModule`, `RedisModule`.
- **External Dependencies:** None.
- **Events Emitted:** `CHOICE_OFFERED`, `STORY_VERSION_PUBLISHED`, `BRANCH_REACHED`.
- **Events Consumed:** `USER_CHOICE_COMMITTED` (updates node aggregation counters).

### 3.5 EngagementModule (WatchHistory, WatchProgress, Choices, Votes, Predictions, Gamification)
- **Responsibility:** Consumer viewing progress, playback position syncing, user choice selections, community polls, narrative predictions, character follows, XP and badges.
- **Owned Entities:** `watch_history`, `watch_progress`, `user_choices`, `votes`, `predictions`, `prediction_options`, `user_predictions`, `follows`, `xp_ledger`, `badges`, `user_badges`.
- **Public APIs:** `POST /api/v1/watch/progress`, `POST /api/v1/interactive/choices`, `POST /api/v1/engagement/votes`, `POST /api/v1/engagement/predictions`, `POST /api/v1/engagement/follow`, `GET /api/v1/engagement/gamification`.
- **Internal Dependencies:** `InteractiveEngineModule`, `ContentModule`, `DatabaseModule`, `RedisModule`.
- **External Dependencies:** None.
- **Events Emitted:** `WATCH_STARTED`, `WATCH_PROGRESS_UPDATED`, `EPISODE_COMPLETED`, `USER_CHOICE_COMMITTED`, `VOTE_CAST`, `PREDICTION_PLACED`, `XP_AWARDED`, `BADGE_UNLOCKED`.
- **Events Consumed:** None.

### 3.6 MonetisationModule (Subscriptions, Plans, Entitlements)
- **Responsibility:** Subscription billing plans, VIP subscriber status, content entitlements, payment webhook idempotency, renewal processing.
- **Owned Entities:** `subscription_plans`, `subscriptions`, `entitlements`, `subscription_events`, `payment_transactions`.
- **Public APIs:** `GET /api/v1/plans`, `POST /api/v1/subscriptions/checkout`, `POST /api/v1/subscriptions/cancel`, `POST /api/v1/webhooks/payment`.
- **Internal Dependencies:** `UsersModule`, `DatabaseModule`.
- **External Dependencies:** Stripe / Razorpay (Payment Gateway).
- **Events Emitted:** `SUBSCRIPTION_ACTIVATED`, `SUBSCRIPTION_CANCELLED`, `ENTITLEMENT_GRANTED`, `ENTITLEMENT_REVOKED`.
- **Events Consumed:** None.

### 3.7 CreatorModule (Profiles, Applications, Submissions, Earnings)
- **Responsibility:** Creator onboarding, verification, story submissions, creator activity log, revenue attribution and payout records.
- **Owned Entities:** `creators`, `creator_profiles`, `creator_applications`, `creator_verifications`, `creator_submissions`, `creator_notes`, `creator_activities`, `creator_earnings`.
- **Public APIs:** `GET /api/v1/creators/me`, `POST /api/v1/creators/submissions`, `GET /api/v1/creators/earnings`, `GET /api/v1/admin/creators/applications`, `POST /api/v1/admin/creators/:id/verify`.
- **Internal Dependencies:** `UsersModule`, `ContentModule`, `DatabaseModule`.
- **External Dependencies:** KYC Verification provider, Payout rails.
- **Events Emitted:** `CREATOR_APPLIED`, `CREATOR_VERIFIED`, `SUBMISSION_CREATED`, `PAYOUT_INITIATED`.
- **Events Consumed:** `STORY_PUBLISHED`, `REVENUE_ATTRIBUTED`.

### 3.8 NotificationsModule
- **Responsibility:** Asynchronous delivery of in-app, push (FCM/APNs), and email notifications.
- **Owned Entities:** `notifications`, `user_notification_settings`, `notification_templates`.
- **Public APIs:** `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/read-all`.
- **Internal Dependencies:** `BullMQModule`, `DatabaseModule`.
- **External Dependencies:** Firebase Cloud Messaging (FCM), Apple Push Notification service (APNs), SendGrid/AWS SES.
- **Events Emitted:** `NOTIFICATION_SENT`, `NOTIFICATION_DELIVERY_FAILED`.
- **Events Consumed:** `EPISODE_PUBLISHED`, `CHOICE_OFFERED`, `VOTE_CLOSING_SOON`, `BADGE_UNLOCKED`, `SUBMISSION_STATUS_CHANGED`.

### 3.9 StoryLabModule (Intelligence & Experiments)
- **Responsibility:** Audience signal aggregation, insight generation, opportunity pipeline, hypothesis validation, A/B story experiments.
- **Owned Entities:** `story_signals`, `story_insights`, `audience_signals`, `character_signals`, `creator_signals`, `interactive_signals`, `content_opportunities`, `story_experiments`, `experiment_variants`, `experiment_metrics`.
- **Public APIs:** `GET /api/v1/story-lab/signals`, `GET /api/v1/story-lab/insights`, `GET /api/v1/story-lab/opportunities`, `POST /api/v1/story-lab/experiments`, `GET /api/v1/story-lab/experiments/:id`.
- **Internal Dependencies:** `AnalyticsModule`, `ContentModule`, `DatabaseModule`.
- **External Dependencies:** None.
- **Events Emitted:** `OPPORTUNITY_IDENTIFIED`, `EXPERIMENT_STARTED`, `EXPERIMENT_CONCLUDED`.
- **Events Consumed:** None (processes aggregated read data asynchronously).

### 3.10 BusinessModule (Business Intelligence)
- **Responsibility:** Platform KPIs, revenue metrics, retention rollups, executive reporting. Consumes pre-aggregated data.
- **Owned Entities:** `business_metrics`, `business_signals`, `business_reports`.
- **Public APIs:** `GET /api/v1/admin/business/overview`, `GET /api/v1/admin/business/revenue`, `GET /api/v1/admin/business/audience`, `POST /api/v1/admin/business/reports/generate`.
- **Internal Dependencies:** `DatabaseModule`.
- **External Dependencies:** None.
- **Events Emitted:** `REPORT_GENERATED`.
- **Events Consumed:** None.

### 3.11 AnalyticsModule
- **Responsibility:** High-volume event ingestion, client heartbeat validation, BullMQ stream buffering, scheduled aggregation into MySQL reporting tables and future warehouse export.
- **Owned Entities:** `analytics_events` (short-term buffer).
- **Public APIs:** `POST /api/v1/analytics/events`.
- **Internal Dependencies:** `BullMQModule`, `RedisModule`.
- **External Dependencies:** Future OLAP Warehouse (ClickHouse / BigQuery).
- **Events Emitted:** `ANALYTICS_BATCH_INGESTED`.
- **Events Consumed:** Subscribes to all critical domain events for audit and stream logging.

### 3.12 AIStudioModule
- **Responsibility:** Creator AI co-pilot, story premise expansion, character generation, cliffhanger brainstorming, production pack generation. Strictly assistive.
- **Owned Entities:** `ai_generation_jobs`, `ai_prompt_templates`.
- **Public APIs:** `POST /api/v1/creator/ai/generate-premise`, `POST /api/v1/creator/ai/generate-character`, `GET /api/v1/creator/ai/jobs/:id`.
- **Internal Dependencies:** `BullMQModule`, `CreatorModule`.
- **External Dependencies:** Anthropic Claude API / OpenAI API.
- **Events Emitted:** `AI_JOB_STARTED`, `AI_JOB_COMPLETED`, `AI_JOB_FAILED`.
- **Events Consumed:** None.

### 3.13 AdminModule & AuditModule
- **Responsibility:** Global administrative governance, content moderation, user management, audit logging of privileged operations.
- **Owned Entities:** `audit_logs`.
- **Public APIs:** `GET /api/v1/admin/audit-logs`, `GET /api/v1/admin/system/health`.
- **Internal Dependencies:** All modules.
- **External Dependencies:** None.
- **Events Emitted:** `AUDIT_LOG_RECORDED`.
- **Events Consumed:** Intercepts all privileged administrative mutations.
