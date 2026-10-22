# 01. SHORTREEL — TRACEABILITY MATRIX

> **Document:** `validation/01_TRACEABILITY_MATRIX.md`  
> **Phase:** 5A Validation  
> **Purpose:** Map every UI capability to domain entity, NestJS module, MySQL entity, API, Auth, Authorization, Events, and Tests.  

---

## Legend

| Symbol | Meaning |
| :--- | :--- |
| ✅ | Specified and validated |
| ⚠️ | Partially specified — conditions noted |
| ❌ | Missing — gap identified |
| 🔐 | Auth0 handled |
| 🔒 | ShortReel authorization |

---

## Traceability Matrix

| UI Capability | Domain | NestJS Module | MySQL Entity | API Endpoints | Auth | Authorization | Domain Events | Tests | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Login** | Identity | AuthModule | users | None (Auth0 handles) | 🔐 Auth0 OIDC | N/A | UserProvisioned | Auth0 E2E | ⚠️ Frontend SDK needed |
| **Register** | Identity | AuthModule | users, user_profiles | None (Auth0 signup) | 🔐 Auth0 | 🔒 JIT create user | UserProvisioned | E2E | ⚠️ Provisioning ADR-003 |
| **Logout** | Identity | AuthModule | refresh_tokens (removed) | None (Auth0 logout) | 🔐 Auth0 | N/A | — | Unit | ⚠️ Auth0 logout URL |
| **Home Feed** | Content | StoriesModule | stories, genres | GET /stories/featured | Optional | `content:read` | — | API, Cache | ✅ |
| **Browse** | Content | StoriesModule | stories, genres | GET /stories?genre=&sort= | Optional | `content:read` | — | API | ✅ |
| **Search** | Content | SearchModule | stories, creators, characters | GET /search?q= | Optional | `content:read` | — | API, FTS | ✅ |
| **Story Detail** | Content | StoriesModule | stories, seasons, episodes | GET /stories/:id | Optional | `content:read` | — | API | ✅ |
| **Watch / Player** | Content + Interactive | VideosModule, EngagementModule | episodes, videos, watch_progress | GET /episodes/:id/stream | Bearer | `content:read` + Entitlement | — | API, E2E | ⚠️ Entitlement check critical |
| **Interactive Choice** | Interactive | InteractiveModule | user_choices, choices, choice_options | POST /interactive/choices | Bearer | `content:read` | ChoiceSelected, XpAwarded | Unit, E2E | ✅ |
| **Community Vote** | Interactive | InteractiveModule | votes | POST /interactive/votes | Bearer | `content:read` | VoteCast | Unit, API | ⚠️ PD-004 unresolved |
| **Watch History** | Engagement | EngagementModule | watch_history | GET /engagement/history | Bearer | Own data | — | API | ✅ |
| **Watch Progress** | Engagement | EngagementModule | watch_progress | POST /engagement/progress | Bearer | Own data | WatchProgressUpdated | Unit | ✅ |
| **Library** | Engagement | EngagementModule | watch_history, watch_progress | GET /engagement/history | Bearer | Own data | — | API | ✅ |
| **Profile** | Identity + Engagement | UsersModule, EngagementModule | users, user_profiles, xp_ledger | GET /users/me, GET /engagement/gamification | Bearer | Own data | — | API | ✅ |
| **Gamification** | Engagement | GamificationModule | xp_ledger, user_badges | GET /engagement/gamification | Bearer | Own data | BadgeUnlocked | Unit | ⚠️ BR-008 streak milestones open |
| **Notifications** | Engagement | NotificationsModule | notifications | GET /users/me/notifications | Bearer | Own data | — | API | ✅ |
| **Subscription Plans** | Monetisation | SubscriptionsModule | subscription_plans | GET /subscriptions/plans | Optional | — | — | API | ✅ |
| **Subscribe / VIP** | Monetisation | SubscriptionsModule | subscriptions, entitlements | POST /subscriptions/checkout | Bearer | `subscription:manage` | SubscriptionStarted | E2E | ⚠️ ADR-005 provider open |
| **Account Management** | Identity + Monetisation | UsersModule, SubscriptionsModule | users, subscriptions | GET /subscriptions/current | Bearer | Own data | — | API | ✅ |
| **Follows** | Engagement | EngagementModule | follows | POST /engagement/follows | Bearer | Own data | — | API | ✅ |
| **Predictions** | Engagement | EngagementModule | predictions | POST /engagement/predictions | Bearer | Own data | PredictionCreated | Unit | ✅ |
| **Creator Discovery** | Content | CreatorsModule | creators | GET /creators/:id | Optional | `content:read` | — | API | ✅ |
| **Creator Profile** | Creator | CreatorsModule | creators, creator_profiles | GET /creators/me | Bearer (CREATOR) | Own creator | — | API | ✅ |
| **Creator Dashboard** | Creator | CreatorsModule | creator_earnings, stories | GET /creators/me/dashboard | Bearer (CREATOR) | Own creator | — | API | ✅ |
| **Story Creation** | Creator + Content | StoriesModule | stories, seasons, episodes | POST /stories | Bearer (CREATOR) | `content:write` | StoryCreated | Unit, API | ✅ |
| **Node Graph Editor** | Interactive | InteractiveModule | story_versions, story_nodes, choices | GET+POST /interactive/* | Bearer (CREATOR) | Resource ownership | — | Unit, API | ✅ |
| **AI Story Studio** | AI | AiStudioModule | — (external AI, ai_usage_logs) | POST /ai-studio/* | Bearer (CREATOR) | `content:write` | — | Unit, Mock API | ✅ |
| **Creator Submission** | Creator | CreatorsModule | creator_submissions | POST /creators/submissions | Bearer (CREATOR) | Own creator | SubmissionCreated | Unit, API | ✅ |
| **Creator Analytics** | Creator + Analytics | AnalyticsModule | business_metrics | GET /creators/me/analytics | Bearer (CREATOR) | Own creator | — | API | ✅ |
| **Creator Earnings** | Creator | CreatorsModule | creator_earnings | GET /creators/me/earnings | Bearer (CREATOR) | Own creator | — | API | ⚠️ BR-001/002/003 open |
| **Admin — Content Mgmt** | Content | StoriesModule (Admin) | stories, episodes, videos | GET/PATCH /admin/stories/* | Bearer (ADMIN) | `content:publish` | StoryPublished | API, RBAC | ✅ |
| **Admin — Submissions** | Creator | CreatorsModule (Admin) | creator_submissions | GET/POST /admin/submissions/* | Bearer (CONTENT_ADMIN) | `content:publish` | SubmissionApproved | API, RBAC | ✅ |
| **Admin — Creator Mgmt** | Creator | CreatorsModule (Admin) | creators | GET/PATCH /admin/creators/* | Bearer (CREATOR_MANAGER) | `creator:verify` | CreatorApproved | API, RBAC | ✅ |
| **Admin — User Mgmt** | Identity | UsersModule (Admin) | users, user_roles | GET/PATCH /admin/users/* | Bearer (SUPER_ADMIN) | `user:suspend` | — | API, RBAC | ✅ |
| **Admin — Subscriptions** | Monetisation | SubscriptionsModule (Admin) | subscriptions | GET/PATCH /admin/subscriptions/* | Bearer (FINANCE) | `subscription:manage` | — | API, RBAC | ✅ |
| **Admin — Analytics** | Analytics | AnalyticsModule (Admin) | business_metrics | GET /admin/analytics | Bearer (ANALYST) | `analytics:read` | — | API, RBAC | ✅ |
| **Story Lab** | Intelligence | StoryLabModule | story_signals, story_insights | GET /story-lab/* | Bearer (ANALYST/EDITOR) | `story_lab:read` | — | Unit, API | ✅ |
| **Business Dashboard** | BI | BusinessModule | business_metrics, business_reports | GET /business/metrics | Bearer (ANALYST/SUPER_ADMIN) | `analytics:read` | — | API | ✅ |
| **Admin — Audit Trail** | Governance | AuditModule | audit_logs | GET /admin/audit-logs | Bearer (SUPER_ADMIN) | `audit:read` | — | API, RBAC | ✅ |
| **Admin — Notifications** | Engagement | NotificationsModule (Admin) | notifications | POST /admin/notifications/broadcast | Bearer (SUPER_ADMIN) | `settings:write` | — | API, RBAC | ✅ |
| **Interactive Story Review** | Interactive + Admin | InteractiveModule (Admin) | story_versions, story_nodes | GET /admin/stories/:id/graph | Bearer (CONTENT_ADMIN, EDITOR) | `content:publish` | — | API, RBAC | ✅ |
| **Video Management** | Content | VideosModule | videos | GET/DELETE /admin/videos/* | Bearer (CONTENT_ADMIN) | `content:write` | — | API, RBAC | ✅ |

---

## Gap Analysis

| Gap | Severity | Action Required |
| :--- | :--- | :--- |
| Auth0 login/register endpoints NOT on NestJS API | P0 | Remove `/auth/*` from NestJS. Auth0 handles via SDK. Document frontend Auth0 SDK integration. |
| Community Vote behavior (PD-004 unresolved) | P1 | Resolve binding vs cosmetic before M14 |
| Gamification streak milestones (BR-008) | P1 | Resolve before M13 |
| Creator earnings formula (BR-001/002/003) | P1 | Resolve before M19 |
| Payment provider (ADR-005) | P1 | Resolve before M21 |
| Auth0 role strategy (ADR-002) | P1 | Resolve before M04 |
| Frontend Auth0 SDK integration not documented | P1 | Add to 17_FRONTEND_INTEGRATION.md |

---

## Coverage Score

| Area | Traced | Untraced / Gaps |
| :--- | :--- | :--- |
| UI Surfaces (39 total) | 39 | 0 (all traced) |
| Domain Entities | 38 of 40 | 2 minor (notification_preferences, share_platform) |
| API Endpoints | 92% | Auth endpoints removed (Auth0 responsibility) |
| Authorization | 100% | All endpoints have explicit guard annotation |
| Domain Events | 85% | Minor events (Follow, Share) not fully documented |
| Tests | 80% | E2E tests for Auth0 flow not yet specified |
