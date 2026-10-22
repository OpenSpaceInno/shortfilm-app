# 02. SHORTREEL — UI FREEZE

> **Document:** `02_UI_FREEZE.md`  
> **Status:** FROZEN (Phase 2 UI Audit Complete)  
> **Frontend:** Lovable React + Vite + TailwindCSS application  
> **Rule:** DO NOT rebuild or redesign the existing frontend.  

---

## 1. Frontend Application Summary

The ShortReel frontend is a responsive Web PWA built with:
- React 18 + Vite
- TypeScript
- TailwindCSS + shadcn/ui
- Lucide icons
- React Router (client-side routing)

All routes, screens, and navigation flows are frozen. Backend APIs must conform to what the frontend expects.

---

## 2. Route Inventory

### Consumer Routes

| Route | Screen | Auth Required |
| :--- | :--- | :--- |
| `/` | Home Feed | No |
| `/browse` | Browse & Discover | No |
| `/search` | Search | No |
| `/story/:id` | Story Detail | No |
| `/watch/:episodeId` | Video Player | Yes (or preview for free) |
| `/profile` | User Profile + Gamification | Yes |
| `/profile/history` | Watch History | Yes |
| `/notifications` | Notifications | Yes |
| `/subscribe` | Subscription Plans | No |
| `/account` | Account & Subscription Mgmt | Yes |
| `/login` | Login | No |
| `/register` | Register | No |

### Creator Studio Routes

| Route | Screen | Auth Required |
| :--- | :--- | :--- |
| `/creator` | Creator Dashboard | Yes (CREATOR) |
| `/creator/stories` | My Stories List | Yes (CREATOR) |
| `/creator/stories/new` | Create Story | Yes (CREATOR) |
| `/creator/stories/:id` | Edit Story | Yes (CREATOR) |
| `/creator/stories/:id/nodes` | Node Graph Editor | Yes (CREATOR) |
| `/creator/ai` | AI Story Studio | Yes (CREATOR) |
| `/creator/submissions` | My Submissions | Yes (CREATOR) |
| `/creator/analytics` | Creator Analytics | Yes (CREATOR) |
| `/creator/earnings` | Earnings & Payouts | Yes (CREATOR) |

### Admin Console Routes

| Route | Screen | Auth Required |
| :--- | :--- | :--- |
| `/admin` | Admin Dashboard | Yes (ADMIN roles) |
| `/admin/stories` | Story Management | Yes (CONTENT_ADMIN, EDITOR) |
| `/admin/stories/:id` | Story Review | Yes (CONTENT_ADMIN, EDITOR) |
| `/admin/submissions` | Submission Queue | Yes (CONTENT_ADMIN, EDITOR) |
| `/admin/creators` | Creator Management | Yes (CREATOR_MANAGER) |
| `/admin/creators/applications` | Creator Applications | Yes (CREATOR_MANAGER) |
| `/admin/users` | User Management | Yes (SUPER_ADMIN) |
| `/admin/videos` | Video Management | Yes (CONTENT_ADMIN) |
| `/admin/notifications` | Notification Management | Yes (SUPER_ADMIN) |
| `/admin/subscriptions` | Subscription Management | Yes (FINANCE) |
| `/admin/analytics` | Analytics Dashboard | Yes (ANALYST) |
| `/admin/story-lab` | Story Lab | Yes (ANALYST, EDITOR) |
| `/admin/business` | Business Dashboard | Yes (SUPER_ADMIN, ANALYST) |
| `/admin/audit` | Audit Trail | Yes (SUPER_ADMIN) |
| `/admin/settings` | Platform Settings | Yes (SUPER_ADMIN) |

---

## 3. UI-to-Backend Mapping

### Consumer App

```
Home Feed (/)
     ↓ GET /api/v1/stories?filter=featured&lang={lang}
     ↓ StoriesService.getFeaturedFeed()
     ↓ MySQL: stories, genres, story_genres

Browse (/browse)
     ↓ GET /api/v1/stories?genre={id}&sort=trending
     ↓ StoriesService.browse()
     ↓ MySQL: stories, genres

Search (/search)
     ↓ GET /api/v1/search?q={term}
     ↓ SearchService.search()
     ↓ MySQL: Full-Text Search

Story Detail (/story/:id)
     ↓ GET /api/v1/stories/:id
     ↓ StoriesService.getDetail()
     ↓ MySQL: stories, seasons, episodes, characters

Video Player (/watch/:episodeId)
     ↓ GET /api/v1/episodes/:id/stream
     ↓ VideosService.getPlaybackToken()
     ↓ Cloudflare Stream (signed JWT)

Watch Progress (ambient)
     ↓ POST /api/v1/engagement/progress
     ↓ EngagementService.syncProgress()
     ↓ MySQL: watch_progress

Choice Overlay
     ↓ POST /api/v1/interactive/choices
     ↓ InteractiveService.resolveChoice()
     ↓ MySQL: user_choices, xp_ledger (TRANSACTION)

Community Vote
     ↓ POST /api/v1/interactive/votes
     ↓ InteractiveService.castVote()
     ↓ MySQL: votes

Notifications (/notifications)
     ↓ GET /api/v1/notifications
     ↓ NotificationsService.getUserInbox()
     ↓ MySQL: notifications

Subscribe (/subscribe)
     ↓ GET /api/v1/subscriptions/plans
     ↓ POST /api/v1/subscriptions/checkout
     ↓ SubscriptionsService.initiateCheckout()
     ↓ Payment Gateway (Razorpay/Stripe)

Profile (/profile)
     ↓ GET /api/v1/users/me
     ↓ GET /api/v1/engagement/gamification
     ↓ MySQL: users, xp_ledger, user_badges
```

### Creator Studio

```
Creator Dashboard (/creator)
     ↓ GET /api/v1/creators/me/dashboard
     ↓ CreatorsService.getDashboardSummary()
     ↓ MySQL: stories, creator_earnings (aggregated)

AI Story Studio (/creator/ai)
     ↓ POST /api/v1/ai-studio/concept-expand
     ↓ POST /api/v1/ai-studio/character-forge
     ↓ POST /api/v1/ai-studio/branch-dilemma
     ↓ AiOrchestratorService (Claude/GPT-4o)

Node Graph Editor (/creator/stories/:id/nodes)
     ↓ GET /api/v1/interactive/stories/:id/graph
     ↓ POST /api/v1/interactive/nodes
     ↓ POST /api/v1/interactive/choices
     ↓ InteractiveService

Creator Submission
     ↓ POST /api/v1/creators/submissions
     ↓ CreatorsService.submitForReview()
     ↓ MySQL: creator_submissions, audit_logs
```

### Admin Console

```
Submission Queue (/admin/submissions)
     ↓ GET /api/v1/admin/submissions?status=IN_REVIEW
     ↓ AdminService.listSubmissions()

Story Publish
     ↓ POST /api/v1/stories/:id/publish
     ↓ StoriesService.publishVersion() (TRANSACTION)

Creator Verification (/admin/creators)
     ↓ PATCH /api/v1/creators/:id/status
     ↓ CreatorsService.updateVerificationStatus()

Business Dashboard (/admin/business)
     ↓ GET /api/v1/business/metrics?period=30d
     ↓ BusinessService.getDashboardRollups()
     ↓ MySQL: business_metrics (pre-aggregated)

Audit Trail (/admin/audit)
     ↓ GET /api/v1/admin/audit-logs
     ↓ AdminService.getAuditTrail()
     ↓ MySQL: audit_logs
```

---

## 4. Key Frontend Components & Integration Points

| Component | API Dependency | Notes |
| :--- | :--- | :--- |
| Video Player | `/api/v1/episodes/:id/stream` | Receives signed Cloudflare Stream HLS URL |
| Choice Overlay | `/api/v1/interactive/choices` | Must submit within `voting_ends_at` window |
| XP Toast | Side-effect of choice resolution | XP awarded in choice response payload |
| Subscription Gate | `/api/v1/subscriptions/current` | Checks entitlement before full playback |
| Notification Badge | `/api/v1/notifications/unread-count` | Polled every 30s or via WebSocket |
| Creator Upload | `/api/v1/videos/direct-upload-url` | TUS upload URL from Cloudflare Stream |
| AI Studio Response | BullMQ async + polling or WebSocket | Long-form generation is async |

---

## 5. Navigation Flows (Critical for Backend Parity)

### Consumer Playback Flow
1. User selects episode → request playback token.
2. Token validates subscription entitlement server-side.
3. Video plays via Cloudflare Stream HLS.
4. At 85% progress → choice overlay appears (if this node has choices).
5. User selects choice → POST to `/api/v1/interactive/choices`.
6. Server validates: choice window open, user hasn't already chosen, destination node exists.
7. Server returns destination node's playback token.
8. Video transitions to next node automatically.

### Creator Publish Flow
1. Creator submits story version for review.
2. Story version status: `SUBMITTED` → `UNDER_REVIEW`.
3. Admin/Editor reviews DAG for cycles, missing endings.
4. Admin approves: status → `APPROVED`.
5. Creator or Admin triggers publish: status → `PUBLISHED` (IMMUTABLE from this point).
6. Previous published version → `ARCHIVED`.
7. Consumer feed cache invalidated.
