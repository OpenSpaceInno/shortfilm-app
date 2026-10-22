# 06. SHORTREEL — AUTH & RBAC

> **Document:** `06_AUTH_RBAC.md`  
> **Status:** FROZEN  
> **Reference:** `docs/architecture/09_AUTH_RBAC_ARCHITECTURE.md`  

---

## 1. Authentication Strategy

### Mechanism: Custom NestJS Auth
- **Password Hashing:** Argon2id (`m=65536, t=3, p=4`)
- **Access Token:** RS256 JWT (15-minute TTL)
- **Refresh Token:** Single-use opaque token stored as a hashed value in MySQL `refresh_tokens` table, also cached in Redis (`auth:refresh:{userId}:{tokenId}`)
- **Refresh TTL:** 30 days
- **Token Rotation:** On every refresh, the old token is revoked and a new one issued
- **Reuse Detection:** If a revoked refresh token is replayed, all sessions for that user are revoked (assume token theft)
- **Cookie:** Refresh token delivered via `HttpOnly; Secure; SameSite=Strict` cookie
- **Access Token:** Delivered in response body, stored in memory (never localStorage)

### JWT Payload
```json
{
  "sub": "usr_01J8...",
  "jti": "tok_01J8...",
  "roles": ["USER"],
  "permissions": ["content:read"],
  "iat": 1724000000,
  "exp": 1724000900
}
```

---

## 2. Roles

| Role | Scope | Description |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | Platform | Full system access including user management, billing, audit |
| `CONTENT_ADMIN` | Content | Publish, archive, reject stories; manage content catalog |
| `EDITOR` | Content | Review submissions, suggest changes, view Story Lab |
| `CREATOR_MANAGER` | Creators | Verify creators, manage applications, send notes |
| `ANALYST` | Analytics | Read-only access to all analytics, Story Lab, Business Dashboard |
| `FINANCE` | Finance | Access payout records, approve payment batches, view billing |
| `CREATOR` | Own content | Create stories, use AI Studio, view own analytics and earnings |
| `USER` | Own data | Watch content, make choices, manage subscription, view profile |

A user can hold multiple roles (e.g., a CREATOR can also be a USER).

---

## 3. Permission Matrix (18 Permissions)

| Permission | SUPER_ADMIN | CONTENT_ADMIN | EDITOR | CREATOR_MGR | ANALYST | FINANCE | CREATOR | USER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `content:read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `content:write` | ✓ | ✓ | - | - | - | - | ✓(own) | - |
| `content:publish` | ✓ | ✓ | - | - | - | - | - | - |
| `content:archive` | ✓ | ✓ | - | - | - | - | - | - |
| `creator:apply` | - | - | - | - | - | - | - | ✓ |
| `creator:read` | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓(own) | - |
| `creator:verify` | ✓ | - | - | ✓ | - | - | - | - |
| `creator:suspend` | ✓ | - | - | ✓ | - | - | - | - |
| `analytics:read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓(own) | - |
| `finance:read` | ✓ | - | - | - | - | ✓ | ✓(own) | - |
| `finance:approve_payout` | ✓ | - | - | - | - | ✓ | - | - |
| `user:read` | ✓ | ✓ | - | ✓ | ✓ | - | - | ✓(own) |
| `user:suspend` | ✓ | - | - | - | - | - | - | - |
| `story_lab:read` | ✓ | ✓ | ✓ | - | ✓ | - | - | - |
| `story_lab:write` | ✓ | ✓ | - | - | - | - | - | - |
| `subscription:manage` | ✓ | - | - | - | - | ✓ | - | ✓(own) |
| `audit:read` | ✓ | - | - | - | - | - | - | - |
| `settings:write` | ✓ | - | - | - | - | - | - | - |

---

## 4. NestJS Guard Implementation

### JwtAuthGuard
Applied globally. Validates RS256 JWT from `Authorization: Bearer` header.

### RolesGuard
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CONTENT_ADMIN', 'EDITOR')
@Get('/admin/submissions')
```

### PermissionsGuard
For fine-grained permission checks:
```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('content:publish')
@Post('/stories/:id/publish')
```

### ResourceOwnerGuard
For creator/user resource ownership:
```typescript
// Verifies request.user.creatorId === story.creator_id
// OR user has SUPER_ADMIN / CONTENT_ADMIN role
@UseGuards(JwtAuthGuard, ResourceOwnerGuard)
@Patch('/stories/:id')
```

---

## 5. Route Protection Summary

| Route Pattern | Required Guard |
| :--- | :--- |
| `GET /stories` | Optional (public) |
| `POST /interactive/choices` | JwtAuthGuard |
| `POST /creators/apply` | JwtAuthGuard |
| `PATCH /stories/:id` | JwtAuthGuard + ResourceOwnerGuard |
| `POST /stories/:id/publish` | JwtAuthGuard + PermissionsGuard (content:publish) |
| `GET /admin/*` | JwtAuthGuard + RolesGuard (admin roles) |
| `PATCH /admin/creators/:id/status` | JwtAuthGuard + PermissionsGuard (creator:verify) |
| `GET /business/metrics` | JwtAuthGuard + PermissionsGuard (analytics:read) |
| `POST /subscriptions/webhooks/*` | Webhook signature validation ONLY (no JWT) |

---

## 6. Security Rules

1. **Never trust client-supplied role or permission data.**
2. **All sensitive user fields** (`password_hash`, `refresh_tokens`) are excluded from all DTOs using `@Exclude()`.
3. **Rate limiting:** `/auth/login` max 10 attempts / 15 minutes per IP. `/auth/refresh` max 30 / minute per user.
4. **Account lockout:** 10 consecutive failed logins triggers a temporary 30-minute lockout (stored in Redis).
5. **Audit log:** Every role grant/revoke is recorded in `audit_logs`.
