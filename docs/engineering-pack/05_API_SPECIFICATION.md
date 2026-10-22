# 05. SHORTREEL — API SPECIFICATION

> **Document:** `05_API_SPECIFICATION.md`  
> **Status:** FROZEN  
> **Base Path:** `/api/v1/`  
> **Auth:** Bearer JWT (RS256, 15-minute TTL)  
> **Reference:** `docs/architecture/07_API_ARCHITECTURE.md`, `08_API_CONVENTIONS.md`  

---

## Standard Response Envelopes

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "cursor": "next_cursor_token"
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "STORY_VERSION_NOT_PUBLISHED",
    "message": "The requested story version is not published.",
    "requestId": "req_01J8...",
    "details": []
  }
}
```

---

## AUTH ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/auth/register` | Register new user | None |
| POST | `/auth/login` | Login with email+password | None |
| POST | `/auth/refresh` | Refresh access token | Refresh token (cookie) |
| POST | `/auth/logout` | Revoke refresh token | Bearer |
| POST | `/auth/verify-email` | Verify email with OTP | None |
| POST | `/auth/forgot-password` | Request password reset | None |
| POST | `/auth/reset-password` | Complete password reset | Token |

### POST `/auth/register`
```
Request:  { email, password, display_name }
Response: { user: UserDto, accessToken, expiresIn }
Side Effects: Sends email verification OTP. Creates default USER role.
```

### POST `/auth/login`
```
Request:  { email, password }
Response: { user: UserDto, accessToken, expiresIn }
Side Effects: Sets HttpOnly refresh token cookie. Updates last_login_at.
```

---

## USER ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/users/me` | Get current user | Bearer |
| PATCH | `/users/me` | Update profile | Bearer |
| DELETE | `/users/me` | Request account deletion | Bearer |
| GET | `/users/me/notifications` | Get notifications | Bearer |
| PATCH | `/users/me/notifications/:id/read` | Mark read | Bearer |
| GET | `/users/:id` | Get public profile | None |

---

## STORY ENDPOINTS (Consumer)

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/stories` | Feed / browse stories | Optional |
| GET | `/stories/featured` | Featured feed | Optional |
| GET | `/stories/:id` | Story detail | Optional |
| GET | `/stories/:id/seasons` | Season list | Optional |
| GET | `/stories/:id/seasons/:sid/episodes` | Episodes | Optional |
| POST | `/stories/:id/follow` | Follow story | Bearer |
| DELETE | `/stories/:id/follow` | Unfollow | Bearer |

### GET `/stories`
```
Query Params: genre, language, sort (trending|newest|rating), limit, cursor
Response: Paginated StoryDto[]
Caching: Redis cache 10 min
```

---

## EPISODE & VIDEO ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/episodes/:id` | Episode detail | Optional |
| GET | `/episodes/:id/stream` | Get signed playback URL | Bearer (or free check) |
| GET | `/episodes/:id/choices` | Get active choice for episode | Bearer |

### GET `/episodes/:id/stream`
```
Auth: Bearer — validates subscription entitlement
Response: { playbackUrl (signed HLS), expiresAt, nodeId, hasChoice }
Side Effects: Records VIDEO_STARTED analytics event
Errors: SUBSCRIPTION_REQUIRED, EPISODE_NOT_FOUND, VIDEO_NOT_READY
```

---

## INTERACTIVE ENGINE ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/interactive/choices` | Submit a branch choice | Bearer |
| POST | `/interactive/votes` | Cast community vote | Bearer |
| GET | `/interactive/stories/:id/graph` | Get story graph (creator/admin) | Bearer (CREATOR/ADMIN) |
| POST | `/interactive/nodes` | Create/update node | Bearer (CREATOR) |
| POST | `/interactive/nodes/:id/choices` | Add choice to node | Bearer (CREATOR) |

### POST `/interactive/choices`
```
Request:  { choiceId, choiceOptionId, storyVersionId }
Response: { userChoice: UserChoiceDto, destinationNode: NodeDto, xpAwarded: 50 }
Validation: 
  - choiceId exists and belongs to an active PUBLISHED version
  - choiceOptionId is valid option for this choice
  - voting window has not closed
  - user has not already chosen for this choiceId
  - destination node exists and has a READY video
Transaction: 
  - INSERT user_choices
  - INSERT xp_ledger
  - UPDATE choice_options.vote_count
  - Emit CHOICE_SELECTED analytics event
Idempotency: UNIQUE KEY (user_id, choice_id) — second request returns existing choice
Errors: CHOICE_NOT_FOUND, CHOICE_ALREADY_MADE, VOTING_WINDOW_CLOSED, DESTINATION_NODE_INVALID
```

---

## ENGAGEMENT ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/engagement/progress` | Sync watch progress | Bearer |
| GET | `/engagement/progress/:episodeId` | Get resume position | Bearer |
| GET | `/engagement/history` | Watch history (paginated) | Bearer |
| GET | `/engagement/gamification` | XP total, badges, streak | Bearer |
| POST | `/engagement/predictions` | Submit prediction | Bearer |
| POST | `/engagement/follows` | Follow creator/character | Bearer |
| DELETE | `/engagement/follows/:id` | Unfollow | Bearer |

### POST `/engagement/progress`
```
Request:  { episodeId, progressSeconds, completed }
Response: { watchProgress: WatchProgressDto }
Note: Upsert operation — idempotent by design
```

---

## CREATOR ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/creators/apply` | Apply to become creator | Bearer |
| GET | `/creators/me` | Get creator profile | Bearer (CREATOR) |
| GET | `/creators/me/dashboard` | Creator dashboard metrics | Bearer (CREATOR) |
| GET | `/creators/me/stories` | Creator's stories | Bearer (CREATOR) |
| GET | `/creators/me/earnings` | Earnings history | Bearer (CREATOR) |
| POST | `/creators/submissions` | Submit story for review | Bearer (CREATOR) |
| GET | `/creators/:id` | Public creator profile | Optional |

---

## STORY MANAGEMENT ENDPOINTS (Creator)

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/stories` | Create story draft | Bearer (CREATOR) |
| PATCH | `/stories/:id` | Update story metadata | Bearer (CREATOR, owns story) |
| DELETE | `/stories/:id` | Soft delete draft | Bearer (CREATOR, owns story) |
| GET | `/stories/:id/versions` | List story versions | Bearer (CREATOR) |
| POST | `/stories/:id/versions` | Create new version | Bearer (CREATOR) |
| POST | `/stories/:id/publish` | Publish approved version | Bearer (CREATOR/CONTENT_ADMIN) |

---

## AI STUDIO ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/ai-studio/concept-expand` | Expand premise to episode beats | Bearer (CREATOR) |
| POST | `/ai-studio/character-forge` | Generate character profile | Bearer (CREATOR) |
| POST | `/ai-studio/branch-dilemma` | Generate choice prompts | Bearer (CREATOR) |
| POST | `/ai-studio/cliffhanger` | Generate episode cliffhanger | Bearer (CREATOR) |
| POST | `/ai-studio/production-pack` | Async full production pack | Bearer (CREATOR) |
| GET | `/ai-studio/jobs/:jobId` | Poll async job status | Bearer (CREATOR) |

### POST `/ai-studio/concept-expand`
```
Request:  { logline, genre, targetEpisodeCount, targetAudience }
Response: { title, premise, themes, coreDilemma, characterProfiles[] }
  OR (for long jobs): { jobId, status: 'QUEUED' }
Side Effect: Tokens billed against creator's monthly AI budget
```

---

## SUBSCRIPTION ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/subscriptions/plans` | List active plans | Optional |
| GET | `/subscriptions/current` | Get user's subscription | Bearer |
| POST | `/subscriptions/checkout` | Initiate checkout | Bearer |
| POST | `/subscriptions/cancel` | Cancel subscription | Bearer |
| POST | `/subscriptions/webhooks/razorpay` | Razorpay webhook | Signature |
| POST | `/subscriptions/webhooks/stripe` | Stripe webhook | Signature |

---

## SEARCH ENDPOINT

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/search` | Unified search | Optional |

```
Query: q (required), type (stories|creators|characters), limit, cursor
Response: { stories[], creators[], characters[], genres[], tags[] }
```

---

## ADMIN ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/admin/submissions` | List creator submissions | CONTENT_ADMIN, EDITOR |
| POST | `/admin/submissions/:id/approve` | Approve submission | CONTENT_ADMIN |
| POST | `/admin/submissions/:id/reject` | Reject submission | CONTENT_ADMIN |
| GET | `/admin/creators` | List creators | CREATOR_MANAGER |
| PATCH | `/admin/creators/:id/status` | Update creator status | CREATOR_MANAGER |
| GET | `/admin/users` | List users | SUPER_ADMIN |
| PATCH | `/admin/users/:id/status` | Suspend/activate user | SUPER_ADMIN |
| GET | `/admin/audit-logs` | Audit trail (paginated) | SUPER_ADMIN |
| GET | `/admin/analytics` | Analytics summary | ANALYST |

---

## BUSINESS INTELLIGENCE ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/business/metrics` | KPI metrics | ANALYST, SUPER_ADMIN |
| GET | `/business/metrics/:name` | Specific metric | ANALYST, SUPER_ADMIN |
| GET | `/business/reports` | Financial reports | FINANCE, SUPER_ADMIN |

---

## STORY LAB ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/story-lab/signals` | Signal list | ANALYST, EDITOR |
| GET | `/story-lab/insights` | Insight list | ANALYST, EDITOR |
| PATCH | `/story-lab/insights/:id/status` | Accept/Dismiss insight | EDITOR, CONTENT_ADMIN |
| GET | `/story-lab/experiments` | Experiment list | ANALYST |
| POST | `/story-lab/experiments` | Create experiment | CONTENT_ADMIN |
| PATCH | `/story-lab/experiments/:id/status` | Start/Pause/Conclude | CONTENT_ADMIN |

---

## VIDEO MANAGEMENT ENDPOINTS

| Method | Path | Purpose | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/videos/direct-upload-url` | Get TUS upload URL | Bearer (CREATOR) |
| GET | `/videos/:id` | Video metadata | Bearer (CREATOR, owns) |
| POST | `/videos/webhooks/cloudflare` | Cloudflare Stream callback | Signature |

---

## Pagination Convention

All list endpoints support:
- `limit` (default 20, max 100)
- `cursor` (opaque Base64 encoded cursor for keyset pagination)
- `page` + `offset` (for admin views where total count is needed)

## Idempotency

State-changing requests can include `Idempotency-Key: {uuid}` header. The server caches the response for 24 hours and returns the same result for duplicate requests.
