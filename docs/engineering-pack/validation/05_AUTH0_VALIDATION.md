# 05. SHORTREEL — AUTH0 INTEGRATION VALIDATION

> **Document:** `validation/05_AUTH0_VALIDATION.md`  
> **Validation Status:** ❌ BLOCKED (P0 found in Engineering Pack)  
> **Authority:** This document supersedes `06_AUTH_RBAC.md` Section 1 on the topic of authentication.  

---

## 1. P0 Finding: Engineering Pack Uses Custom Auth

The Engineering Pack was authored with a custom NestJS authentication strategy:
- Argon2id password hashing
- Self-issued RS256 JWTs
- MySQL `refresh_tokens` table
- Custom `/auth/login`, `/auth/register`, `/auth/refresh` endpoints
- Custom account lockout in Redis

**This entire authentication layer is invalidated by the Auth0 mandate.**

Auth0 is the authorised Identity Provider. NestJS must become a **resource server**, not an authorization server.

---

## 2. Authorised Architecture

```
┌───────────────────────────────┐
│       SHORTREEL CLIENTS       │
│  Web (React) / Mobile / Admin │
└───────────────┬───────────────┘
                │ Authorization Code Flow + PKCE
                ▼
        ┌───────────────┐
        │     Auth0     │
        │               │
        │ - Login/Signup│
        │ - MFA         │
        │ - Social Login│
        │ - Sessions    │
        │ - Token issue │
        │ - JWKS        │
        └───────┬───────┘
                │ RS256 JWT Access Token
                │ (iss: https://{AUTH0_DOMAIN}/)
                │ (aud: {AUTH0_AUDIENCE})
                ▼
        ┌─────────────────┐
        │   NestJS API    │
        │                 │
        │ JWT Validation  │← validates via Auth0 JWKS endpoint
        │ User Resolution │← finds ShortReel User by sub claim
        │ Authorization   │← RBAC + Permissions + Ownership
        │ Business Logic  │
        └────────┬────────┘
                 │
                 ▼
              MySQL
```

---

## 3. Auth0 Responsibilities (confirmed)

Auth0 owns and controls:
- ✅ User authentication (password, social, MFA)
- ✅ Token lifecycle (issue, refresh, rotate, revoke)
- ✅ Session management per client
- ✅ Password reset and email verification flows
- ✅ Social login (Google, Apple, etc.) — if enabled
- ✅ JWKS key publishing (`https://{AUTH0_DOMAIN}/.well-known/jwks.json`)
- ✅ Signup/Registration flow (Auth0 Universal Login or embedded)

---

## 4. NestJS Responsibilities (authorised)

NestJS owns and controls:
- ✅ JWT signature validation (using Auth0 JWKS endpoint)
- ✅ Standard claim validation (`iss`, `aud`, `exp`, `sub`)
- ✅ ShortReel User resolution from `sub` claim
- ✅ JIT user provisioning (create ShortReel User on first validated token)
- ✅ RBAC / Permission enforcement
- ✅ Resource ownership enforcement
- ✅ All business logic
- ✅ All ShortReel data

NestJS does NOT own:
- ❌ Password hashing or storage
- ❌ Token issuance
- ❌ Refresh token management
- ❌ Login or registration HTTP endpoints
- ❌ Email verification flows
- ❌ Password reset flows

---

## 5. Database Schema Changes Required (P0)

### Remove from `users` table:
- `password_hash VARCHAR(255) NOT NULL` → **DELETE**

### Add to `users` table:
```sql
external_auth_provider  VARCHAR(20)  NOT NULL DEFAULT 'AUTH0',
external_subject_id     VARCHAR(255) NOT NULL,
-- UNIQUE KEY uq_users_subject (external_subject_id)
```

### Remove entire table:
- `refresh_tokens` table → **DELETE** (Auth0 manages sessions)

### No change to:
- `roles`, `permissions`, `user_roles`, `role_permissions` — ShortReel owns RBAC
- All other tables

---

## 6. Configuration Variables Required

Replace custom JWT config with:
```
AUTH0_DOMAIN          = shortreel.{region}.auth0.com
AUTH0_AUDIENCE        = https://api.shortreel.io
AUTH0_ISSUER          = https://shortreel.{region}.auth0.com/
```

Add for Management API access (server-side only):
```
AUTH0_MGMT_CLIENT_ID      = [machine-to-machine client ID]
AUTH0_MGMT_CLIENT_SECRET  = [machine-to-machine client secret]
```

Remove:
```
JWT_PRIVATE_KEY      → DELETE
JWT_PUBLIC_KEY       → DELETE
REFRESH_TOKEN_TTL_DAYS → DELETE
```

---

## 7. NestJS JWT Validation Implementation (Pattern)

```typescript
// PassportStrategy extending passportjs + jwks-rsa
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get('AUTH0_AUDIENCE'),
      issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: Auth0JwtPayload): ShortReelUser {
    // payload.sub = Auth0 subject, e.g. "auth0|6507..."
    // Resolve or JIT-create ShortReel user
    return this.usersService.resolveFromAuth0(payload.sub);
  }
}
```

---

## 8. JWT Token Validation Checklist

| Claim | Validated By | Required Value |
| :--- | :--- | :--- |
| `alg` | jwks-rsa library | `RS256` only |
| `iss` | Passport JWT | `https://{AUTH0_DOMAIN}/` |
| `aud` | Passport JWT | `{AUTH0_AUDIENCE}` |
| `exp` | Passport JWT | Must be in future |
| `sub` | NestJS validate() | Must exist and be non-empty |
| `iat` | Library | Must be valid |

**Do NOT accept:**
- `HS256` signed tokens (symmetric — insecure for external auth)
- Tokens from unknown issuers
- Tokens issued for a different audience
- Expired tokens
- ID tokens (only validate access tokens on API)

---

## 9. Auth0 Application Registrations Required

| Application | Type | Flow | Notes |
| :--- | :--- | :--- | :--- |
| **ShortReel Web** | Single-Page Application | Authorization Code + PKCE | Consumer + Creator |
| **ShortReel Admin** | Single-Page Application | Authorization Code + PKCE | Admin console (separate SPA or same app with role-gated routes) |
| **ShortReel API** (Resource Server) | API | — | `AUTH0_AUDIENCE` value |
| **ShortReel M2M** | Machine-to-Machine | Client Credentials | For server-side Auth0 Management API calls only |

**OPEN DECISION — ADR-007:**  
> Should Consumer Web and Admin be the same Auth0 Application with role-based routing, or separate applications?  
> Impact: redirect URIs, logout behavior, token audience, UI complexity.  
> Options: A) Single App, B) Separate Apps.  

---

## 10. Auth0 Environment Strategy (ADR-006)

| Environment | Auth0 Tenant | Status |
| :--- | :--- | :--- |
| LOCAL | `shortreel-dev.auth0.com` | OPEN — confirm whether dev tenant = local tenant |
| DEVELOPMENT | `shortreel-dev.auth0.com` | OPEN |
| STAGING | `shortreel-staging.auth0.com` | OPEN |
| PRODUCTION | `shortreel.auth0.com` | OPEN |

**Recommended:** Separate production tenant. Dev and staging may share a non-production tenant with environment-specific client configurations.

**Rule:** Never use production Auth0 credentials in local development.

---

## 11. Auth0 Roles vs ShortReel Roles (ADR-002)

**Finding:** The Engineering Pack does not address this distinction.

### Option A — Auth0 owns roles
- Roles stored and managed in Auth0
- Custom claims action embeds roles in token: `{ "https://shortreel.io/roles": ["CREATOR"] }`
- NestJS reads roles from token claim
- **Pro:** Roles available in token without DB lookup
- **Con:** Role changes require new token, Auth0 management complexity

### Option B — ShortReel owns roles (MySQL)
- Auth0 provides identity only (`sub` claim)
- NestJS resolves user from `sub`, loads roles from MySQL `user_roles`
- **Pro:** Roles always up-to-date, full control, no Auth0 custom claim sync
- **Con:** DB lookup on every authenticated request (mitigated by Redis cache)

### Option C — Hybrid
- Admin/platform roles (SUPER_ADMIN, CONTENT_ADMIN, etc.) managed in Auth0 via custom claim
- Business roles (CREATOR, USER) managed in ShortReel MySQL
- **Pro:** Admin access available without DB round-trip
- **Con:** Two sources of truth for roles — synchronization complexity

**Recommendation:** **Option B (ShortReel owns roles)** — aligned with the "Auth0 answers WHO, ShortReel answers WHAT" principle. Mitigate DB lookup latency with Redis user session cache (TTL 5 minutes).

**Decision Required From:** Architecture team.

---

## 12. User Provisioning Model (ADR-003)

**Question:** How does a ShortReel User record get created when a new Auth0 user authenticates?

### Option A — Just-In-Time (JIT)
- On first validated JWT request, NestJS checks if `users.external_subject_id = payload.sub` exists
- If not found → INSERT new user row (name/email from token claims)
- **Pro:** No Auth0 webhook dependency, simple
- **Con:** Race condition on burst first requests (use upsert + DB-level UNIQUE constraint)

### Option B — Auth0 Post-Registration Action
- Auth0 Action fires on user registration → calls NestJS internal provisioning endpoint
- **Pro:** User record created before first API call
- **Con:** Requires Auth0 Action → internal endpoint → network dependency

### Option C — Hybrid
- Auth0 Post-Registration Action (preferred)
- JIT fallback in NestJS in case Action fails or for migrated users

**Recommendation:** **Option C (Hybrid)** — Auth0 Action for new registrations + JIT upsert as safety net.

**Decision Required From:** Architecture + Product.

---

## 13. API Endpoints to Remove from Engineering Pack

The following endpoints in `05_API_SPECIFICATION.md` **do not exist on NestJS** under Auth0:

```
DELETE:
  POST /auth/register       → Auth0 Universal Login / Signup
  POST /auth/login          → Auth0 Universal Login
  POST /auth/refresh        → Auth0 SDK (silent refresh)
  POST /auth/logout         → Auth0 /v2/logout endpoint
  POST /auth/verify-email   → Auth0 handles
  POST /auth/forgot-password → Auth0 handles
  POST /auth/reset-password  → Auth0 handles
```

**Replace with a single NestJS endpoint:**
```
POST /users/me/provision    → Internal — called by Auth0 Action OR JIT trigger
                              Not a public API endpoint
```

---

## 14. Auth0 Security Checklist

| Item | Status | Notes |
| :--- | :--- | :--- |
| Access token (not ID token) validated on API | ✅ Required | ID token is for client identity only |
| `iss` validated against Auth0 domain | ✅ Required | Hard-coded in PassportStrategy config |
| `aud` validated against ShortReel audience | ✅ Required | Hard-coded |
| `alg` restricted to RS256 | ✅ Required | Reject HS256 |
| Token expiration enforced | ✅ Required | Library enforces |
| Auth0 JWKS cached with rotation detection | ✅ Required | `jwks-rsa` library handles |
| No Auth0 secrets in Git | ✅ Required | All via env / secrets manager |
| Separate Auth0 tenants per environment | ⚠️ OPEN ADR-006 | Confirm |
| Redirect URIs restricted in Auth0 dashboard | ✅ Required | Must be configured |
| Logout redirect URI restricted | ✅ Required | Must be configured |
| Management API client secret rotated | ✅ Required | On any suspected exposure |

---

## 15. Auth0 Validation Status

| Check | Status |
| :--- | :--- |
| Auth0 replaces custom auth | ✅ CONFIRMED — mandate clear |
| Engineering Pack docs must be revised | ❌ NOT YET DONE — P0 |
| Database schema changes defined | ✅ Defined in this document (Section 5) |
| JWT validation pattern defined | ✅ Defined in Section 7 |
| Configuration variables defined | ✅ Defined in Section 6 |
| Auth0 applications defined | ⚠️ Partial — ADR-007 (single vs separate SPA) open |
| Auth0 tenant strategy defined | ⚠️ OPEN ADR-006 |
| Auth0 role strategy decided | ⚠️ OPEN ADR-002 — Recommendation: Option B |
| User provisioning model decided | ⚠️ OPEN ADR-003 — Recommendation: Option C |
| Auth API endpoints removed from NestJS | ❌ NOT YET DONE — must update 05_API_SPECIFICATION.md |

**Validation Status: BLOCKED on P0 until Engineering Pack documents are revised.**
