# 07. SHORTREEL — REST API ARCHITECTURE

> **Document ID:** SR-ARCH-07  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. RESTful Design Principles

1. **Resource-Centric URIs:** Endpoints represent nouns (`/stories`, `/episodes`, `/creators`), not verbs. Actions are mapped to standard HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`).
2. **Explicit API Versioning:** All endpoints are versioned in the URI path as `/api/v1/*`. Breaking contract changes require bumping the version to `/api/v2/*` with a documented deprecation window.
3. **Stateless Request Flow:** The server retains zero client session state in memory. Authentication state is validated per request via signed JWT or Redis session lookup.
4. **OpenAPI 3.1 Documentation:** Generated automatically via NestJS `@nestjs/swagger` decorators with strict DTO typing, example payloads, and error status code documentation.

---

## 2. API Surface Catalog

### 2.1 Consumer Platform APIs
- **Authentication:**
  - `POST /api/v1/auth/register` — Create new consumer account
  - `POST /api/v1/auth/login` — Authenticate and receive JWT + Refresh Token
  - `POST /api/v1/auth/refresh` — Rotate refresh token and issue fresh JWT
  - `POST /api/v1/auth/logout` — Revoke active refresh token in Redis
  - `GET /api/v1/auth/me` — Retrieve active authenticated user profile & roles
- **Content Browsing:**
  - `GET /api/v1/stories` — Browse stories (filters: `genre`, `trending`, `language`, `search`)
  - `GET /api/v1/stories/:slug` — Full story detail, seasons, episodes, characters
  - `GET /api/v1/stories/:slug/episodes/:episodeNumber` — Episode metadata & streaming manifest
- **Interactive Narrative Playback:**
  - `GET /api/v1/interactive/stories/:slug/node/:nodeId` — Retrieve specific story branch node
  - `POST /api/v1/interactive/choices` — Submit user decision at choice point
  - `GET /api/v1/interactive/stories/:slug/map` — Viewer's current story tree progression
- **Engagement & Community:**
  - `POST /api/v1/watch/progress` — High-frequency playback position update
  - `GET /api/v1/watch/continue` — User's continue-watching queue
  - `POST /api/v1/engagement/votes` — Submit community poll vote
  - `POST /api/v1/engagement/predictions` — Place narrative prediction
  - `POST /api/v1/engagement/follows` — Toggle follow (Creator, Story, Character)
  - `GET /api/v1/engagement/profile/gamification` — User XP, level, streak, and unlocked badges
- **Monetisation & Subscriptions:**
  - `GET /api/v1/plans` — Public VIP pricing tiers and benefits
  - `POST /api/v1/subscriptions/checkout` — Initiate subscription session with payment provider
  - `GET /api/v1/subscriptions/status` — Active VIP membership details and entitlements
  - `POST /api/v1/subscriptions/cancel` — Cancel active recurring subscription

### 2.2 Creator Studio APIs
- `GET /api/v1/creators/me` — Creator profile, verification status, and tier
- `POST /api/v1/creators/applications` — Apply for creator verification
- `GET /api/v1/creators/stories` — Creator's authored stories (drafts & published)
- `POST /api/v1/creators/stories` — Create new story draft
- `POST /api/v1/creators/submissions` — Submit story version for editorial review
- `GET /api/v1/creators/earnings` — Monthly gross, net, fee breakdown and payout history
- `POST /api/v1/creators/ai/generate-story` — Request AI co-pilot narrative ideas / cliffhangers

### 2.3 Admin & Governance APIs
- `GET /api/v1/admin/creators/applications` — Review pending creator verifications
- `PATCH /api/v1/admin/creators/:id/status` — Approve or reject creator tier
- `GET /api/v1/admin/submissions` — Editorial submission queue
- `PATCH /api/v1/admin/submissions/:id/review` — Approve, request revisions, or publish story version
- `GET /api/v1/admin/story-lab/signals` — View detected audience drop-offs and branch dominance
- `GET /api/v1/admin/story-lab/opportunities` — Review AI-assisted content opportunity proposals
- `POST /api/v1/admin/story-lab/experiments` — Configure A/B story test
- `GET /api/v1/admin/business/metrics` — Core executive business KPIs
- `GET /api/v1/admin/audit-logs` — Tamper-evident administrative action log
