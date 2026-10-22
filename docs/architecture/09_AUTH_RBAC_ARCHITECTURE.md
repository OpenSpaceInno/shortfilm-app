# 09. SHORTREEL — AUTHENTICATION & RBAC ARCHITECTURE

> **Document ID:** SR-ARCH-09  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Authentication Strategy

ShortReel implements a secure, stateless JWT authentication architecture paired with stateful, revocable refresh tokens backed by Redis.

```text
┌──────────────┐                 ┌─────────────┐                 ┌─────────────┐
│    Client    │                 │   NestJS    │                 │    Redis    │
└──────┬───────┘                 └──────┬──────┘                 └──────┬──────┘
       │                                │                               │
       │ 1. POST /api/v1/auth/login     │                               │
       ├───────────────────────────────>│                               │
       │                                │ 2. Verify Argon2id Hash       │
       │                                │    Generate Access JWT (15m)  │
       │                                │    Generate Refresh Token (30d│
       │                                │ 3. Store Refresh Token Hash   │
       │                                ├──────────────────────────────>│
       │ 4. Set HttpOnly Cookies        │                               │
       │<───────────────────────────────┤                               │
       │                                │                               │
       │ 5. API Request (Bearer Token)  │                               │
       ├───────────────────────────────>│                               │
       │                                │ 6. Verify JWT Signature       │
       │                                │    Enforce RBAC Guards        │
       │ 7. Protected Response          │                               │
       │<───────────────────────────────┤                               │
```

### 1.1 Token Configuration
- **Access Token:**
  - Standard JWT signed via **RS256** (Asymmetric key pair).
  - Lifespan: **15 minutes**.
  - Payload: `{ sub: userId, email: string, roles: string[], permissions: string[], isVip: boolean }`.
  - Delivered via `Authorization: Bearer <token>` or secure cookie.
- **Refresh Token:**
  - 64-byte cryptographically secure random string (hex encoded).
  - Stored hashed (`SHA-256`) in **Redis** under `refresh_token:<userId>:<tokenId>` with a **30-day sliding TTL**.
  - Delivered strictly in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie.
- **Refresh Token Rotation & Reuse Detection:**
  - Each refresh cycle issues a new access token AND a new refresh token, invalidating the previous one.
  - If an invalidated refresh token is ever presented again, the system treats it as token theft and **immediately revokes all active sessions for that user family in Redis**.

---

## 2. Role-Based Access Control (RBAC) Model

The RBAC system maps users to roles, and roles to granular permissions:

```text
User ──(1:N)──> UserRole ──(N:1)──> Role ──(1:N)──> RolePermission ──(N:1)──> Permission (Resource:Action)
```

### 2.1 Standard Roles Definition

| Role Code | Description | Target User Base |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | Full root access to all system resources, settings, and roles | Core engineering & founders |
| `CONTENT_ADMIN` | Publish, archive, and manage all stories, seasons, and episodes | Head of Content / Programming |
| `EDITOR` | Review story submissions, approve story versions, curate tags | Content editorial staff |
| `CREATOR_MANAGER`| Review creator applications, verify creators, manage creator notes | Creator relations team |
| `ANALYST` | View all platform analytics, Story Lab signals, and audience reports | Data & BI analysts |
| `FINANCE` | Review revenue, manage creator earnings, authorize payouts | Finance operations team |
| `CREATOR` | Author stories, manage drafts, view own earnings & audience stats | Verified content creators |
| `USER` | Stream content, make choices, cast votes, purchase subscriptions | General consumer audience |

---

## 3. Comprehensive Role-Permission Matrix

| Permission Code | SUPER_ADMIN | CONTENT_ADMIN | EDITOR | CREATOR_MGR | ANALYST | FINANCE | CREATOR | USER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `STORY:CREATE_OWN` | ✓ | ✓ | - | - | - | - | ✓ | - |
| `STORY:EDIT_OWN` | ✓ | ✓ | - | - | - | - | ✓ | - |
| `STORY:SUBMIT` | ✓ | ✓ | - | - | - | - | ✓ | - |
| `STORY:REVIEW` | ✓ | ✓ | ✓ | - | - | - | - | - |
| `STORY:PUBLISH` | ✓ | ✓ | - | - | - | - | - | - |
| `STORY:DELETE` | ✓ | ✓ | - | - | - | - | - | - |
| `CREATOR:APPLY` | - | - | - | - | - | - | - | ✓ |
| `CREATOR:VERIFY` | ✓ | - | - | ✓ | - | - | - | - |
| `CREATOR:VIEW_OWN_EARN`| - | - | - | - | - | - | ✓ | - |
| `FINANCE:VIEW_REVENUE` | ✓ | - | - | - | ✓ | ✓ | - | - |
| `FINANCE:PAYOUT_MANAGE`| ✓ | - | - | - | - | ✓ | - | - |
| `STORY_LAB:VIEW_SIGNALS`| ✓ | ✓ | ✓ | ✓ | ✓ | - | - | - |
| `STORY_LAB:EXPERIMENT` | ✓ | ✓ | - | - | ✓ | - | - | - |
| `CONTENT:STREAM_FREE` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `CONTENT:STREAM_VIP` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | (if sub) | (if sub)|
| `CHOICE:SUBMIT` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ADMIN:MANAGE_USERS` | ✓ | - | - | - | - | - | - | - |
| `ADMIN:VIEW_AUDIT_LOGS`| ✓ | - | - | - | - | - | - | - |

---

## 4. Server-Side Enforcement in NestJS

Authorization is strictly verified server-side. Frontend route guards only control UI display; every API request must pass NestJS guards:

```typescript
// Example: Controller Endpoint Protection
@Controller('admin/stories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminStoriesController {
  
  @Patch(':id/publish')
  @RequirePermissions('STORY:PUBLISH')
  async publishStory(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.contentService.publishStory(id, user.id);
  }
}
```

1. **`JwtAuthGuard`**: Decodes and verifies token signature and expiration against public key.
2. **`PermissionsGuard`**: Evaluates the user's role and permission array against `@RequirePermissions()`. If lacking, rejects with HTTP `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).
3. **`VipEntitlementGuard`**: For premium episode streams, checks `user.isVip` or queries the active Redis entitlement cache before granting access tokens to video playback URLs.
