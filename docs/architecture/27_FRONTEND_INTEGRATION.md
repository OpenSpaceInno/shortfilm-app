# 27. SHORTREEL — FRONTEND INTEGRATION & TRACEABILITY MATRIX

> **Document ID:** SR-ARCH-27  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Integration Strategy

The ShortReel frontend is a responsive Web and Mobile PWA built with React, Vite, TailwindCSS, and Lucide icons (frozen in Phase 2). The frontend interfaces with the NestJS Modular Monolith exclusively via standardized REST APIs (`/api/v1/*`).

> [!IMPORTANT]
> **API Gateway & Contract Alignment**:
> 1. Frontend components interact with backend services through generated TypeScript API client SDKs (derived from backend OpenAPI/Swagger schemas).
> 2. Zero business rules or entitlement verifications reside exclusively on the client; all state transitions are authorized server-side.
> 3. Standard Response and Error Envelopes (`08_API_CONVENTIONS.md`) are decoded consistently across all client queries.

---

## 2. Complete UI ➔ API ➔ Domain ➔ Database Traceability Matrix

This comprehensive matrix maps every screen, modal, and drawer in the frozen Lovable UI to its backing NestJS module, API endpoint, domain service, and primary MySQL tables:

| Frozen UI Screen / Component | User Role | Backend Module | Primary REST Endpoint | Domain Service | Primary MySQL Tables |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Consumer Home Feed** (`/`) | Public / User | `StoriesModule` | `GET /api/v1/stories?filter=featured` | `StoriesService.getFeaturedFeed` | `stories`, `genres`, `story_genres` |
| **Browse / Search Screen** (`/search`) | Public / User | `SearchModule` | `GET /api/v1/search?q={term}` | `SearchService.executeSearch` | `stories`, `creators`, `characters`, `tags` |
| **Story Detail Screen** (`/story/:id`) | Public / User | `StoriesModule` | `GET /api/v1/stories/:id` | `StoriesService.getStoryDetails` | `stories`, `seasons`, `episodes`, `characters` |
| **Vertical Video Player** (`/watch/:id`) | User | `ContentModule` | `GET /api/v1/content/episodes/:id/stream` | `VideosService.getPlaybackToken` | `episodes`, `videos`, `watch_progress` |
| **Watch Progress Tracker** (Ambient) | User | `EngagementModule` | `POST /api/v1/engagement/progress` | `EngagementService.syncProgress` | `watch_progress`, `watch_history` |
| **Interactive Choice Overlay** | User | `InteractiveEngineModule`| `POST /api/v1/interactive/choices` | `InteractiveService.resolveChoice` | `story_nodes`, `choices`, `user_choices`, `xp_ledger` |
| **Live Community Voting** (`/votes`) | User | `InteractiveEngineModule`| `POST /api/v1/interactive/votes` | `InteractiveService.castCommunityVote` | `choices`, `choice_options`, `votes` |
| **Audience Predictions** (`/predictions`) | User | `EngagementModule` | `POST /api/v1/engagement/predictions` | `EngagementService.submitPrediction`| `predictions`, `xp_ledger` |
| **User Gamification & Badges** (`/profile`) | User | `EngagementModule` | `GET /api/v1/engagement/profile` | `EngagementService.getUserGamification` | `xp_ledger`, `user_badges`, `badges` |
| **Notifications Center** (Drawer) | User / Creator| `NotificationsModule` | `GET /api/v1/notifications` | `NotificationsService.getUserInbox` | `notifications` |
| **Subscription Checkout** (`/subscribe`) | User | `SubscriptionsModule` | `POST /api/v1/subscriptions/checkout` | `SubscriptionsService.initiateCheckout`| `subscription_plans`, `subscriptions` |
| **Subscription Management** (`/account`)| User | `SubscriptionsModule` | `GET /api/v1/subscriptions/current` | `SubscriptionsService.getActivePlan` | `subscriptions`, `entitlements` |
| **Creator Studio Dashboard** (`/creator`)| Creator | `CreatorsModule` | `GET /api/v1/creators/me/dashboard` | `CreatorsService.getDashboardMetrics` | `creators`, `stories`, `creator_earnings` |
| **Creator Story Builder** (`/creator/stories/new`) | Creator | `StoriesModule` | `POST /api/v1/stories` | `StoriesService.createDraftStory` | `stories`, `story_versions` |
| **Interactive Node Graph Editor** | Creator | `InteractiveEngineModule`| `POST /api/v1/interactive/nodes` | `InteractiveService.saveGraphNode` | `story_versions`, `story_nodes`, `choices` |
| **Creator AI Story Studio** (`/creator/ai`)| Creator | `AIStudioModule` | `POST /api/v1/ai-studio/concept-expand` | `AiOrchestratorService.generateConcept`| External AI (Claude) / Redis Job Queue |
| **Creator Media Uploader** | Creator | `VideosModule` | `POST /api/v1/videos/direct-upload-url` | `VideosService.createDirectUploadSession`| `videos`, Cloudflare Stream TUS |
| **Creator Submission** (`/creator/submit`)| Creator | `CreatorsModule` | `POST /api/v1/creators/submissions` | `CreatorsService.submitForReview` | `creator_submissions`, `audit_logs` |
| **Admin Editorial CMS** (`/admin/stories`)| Content Admin | `AdminModule` | `GET /api/v1/admin/submissions` | `AdminService.listPendingSubmissions` | `creator_submissions`, `story_versions` |
| **Admin Story Publisher** | Content Admin | `StoriesModule` | `POST /api/v1/stories/:id/publish` | `StoriesService.publishStoryVersion` | `story_versions`, `audit_logs` |
| **Admin Creator Verification** (`/admin/creators`) | Creator Mgr | `CreatorsModule` | `PATCH /api/v1/creators/:id/status` | `CreatorsService.updateVerificationStatus`| `creators`, `creator_verifications` |
| **Story Lab Signals** (`/admin/story-lab`)| Analyst | `StoryLabModule` | `GET /api/v1/story-lab/signals` | `StoryLabService.getSignals` | `story_signals`, `character_signals` |
| **Story Lab Insights & Experiments** | Analyst / Ed | `StoryLabModule` | `GET /api/v1/story-lab/insights` | `StoryLabService.getInsights` | `story_insights`, `story_experiments` |
| **Business Dashboard** (`/admin/business`)| Super Admin | `BusinessModule` | `GET /api/v1/business/metrics` | `BusinessService.getDashboardRollups` | `business_metrics`, `business_reports` |
| **Admin Audit Trail** (`/admin/audit`) | Super Admin | `AdminModule` | `GET /api/v1/admin/audit-logs` | `AdminService.getAuditTrail` | `audit_logs`, `users` |

---

## 3. Data Synchronization & Real-time Patterns

1. **State Revalidation**: Frontend uses React Query / TanStack Query with standard stale-time policies:
   - Story feeds & detail metadata: `staleTime: 5 minutes`
   - User XP & Progress: `staleTime: 30 seconds`
   - Active Live Votes: `staleTime: 5 seconds` (or WebSocket live event stream)
2. **Optimistic Updates**: Applied on choice selection and video likes to provide instant vertical feedback, rolling back if server responds with error.
3. **PWA Offline Resilience**: Basic shell and recent watch progress cached via Service Worker; full interactive choice resolution requires active internet connectivity.
