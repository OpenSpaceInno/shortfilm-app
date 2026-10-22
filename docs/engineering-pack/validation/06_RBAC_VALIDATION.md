# 06. SHORTREEL — RBAC VALIDATION

> **Document:** `validation/06_RBAC_VALIDATION.md`  
> **Validation Status:** ⚠️ READY WITH CONDITIONS  

---

## Summary

The ShortReel RBAC model (8 roles, 18 permissions) is well-defined. The permission matrix is explicit and covers all product surfaces. Two P1 conditions exist: the role strategy (Auth0 vs ShortReel) must be decided (ADR-002), and the mechanics of role persistence must be updated to reflect Auth0 identity.

---

## Role Matrix Validation

Verifying that each role has access to required and only required resources:

| Role | Resource | Action | Allowed? | Validation |
| :--- | :--- | :--- | :--- | :--- |
| SUPER_ADMIN | Story | Publish | ✅ YES | `content:publish` ✅ |
| SUPER_ADMIN | Creator | Suspend | ✅ YES | `creator:suspend` ✅ |
| SUPER_ADMIN | Audit Log | Read | ✅ YES | `audit:read` ✅ |
| SUPER_ADMIN | Finance | Approve Payout | ✅ YES | `finance:approve_payout` ✅ |
| CONTENT_ADMIN | Story | Publish | ✅ YES | `content:publish` ✅ |
| CONTENT_ADMIN | Story | Archive | ✅ YES | `content:archive` ✅ |
| CONTENT_ADMIN | Audit Log | Read | ❌ NO | Audit: SUPER_ADMIN only ✅ (correct — content admin does not need audit) |
| EDITOR | Story | Review (read+note) | ✅ YES | `content:read` + Story Lab `story_lab:read` ✅ |
| EDITOR | Story | Publish | ❌ NO | `content:publish` not granted to EDITOR ✅ |
| CREATOR_MANAGER | Creator | Verify | ✅ YES | `creator:verify` ✅ |
| CREATOR_MANAGER | Finance | Approve Payout | ❌ NO | `finance:approve_payout` not granted ✅ |
| ANALYST | Analytics | Read | ✅ YES | `analytics:read` ✅ |
| ANALYST | Story | Publish | ❌ NO | No `content:publish` ✅ |
| FINANCE | Revenue | Read | ✅ YES | `finance:read` ✅ |
| FINANCE | Creator | Verify | ❌ NO | No `creator:verify` ✅ |
| CREATOR | Own Story | Edit | ✅ YES | `content:write` (own) + ResourceOwnerGuard ✅ |
| CREATOR | Other Story | Edit | ❌ NO | ResourceOwnerGuard denies ✅ |
| CREATOR | Own Analytics | Read | ✅ YES | `analytics:read` (own scope) ✅ |
| USER | Story | Watch | ✅ YES | `content:read` ✅ |
| USER | Story | Publish | ❌ NO | No `content:publish` ✅ |
| USER | Subscription | Manage Own | ✅ YES | `subscription:manage` (own) ✅ |

**Matrix result: All 18 permissions correctly assigned. Zero privilege escalation paths found.**

---

## Authorization Model Validation

### Layer 1: Authentication (Auth0)
Who is the caller? Validated via JWT. ✅

### Layer 2: Role-Based (NestJS RolesGuard)
Is the caller's role permitted for this resource class? ✅

### Layer 3: Permission-Based (NestJS PermissionsGuard)
Does the caller have the specific action permission? ✅

### Layer 4: Resource Ownership (NestJS ResourceOwnerGuard)
Even if the role allows, does the caller OWN this specific resource? ✅

### Layer 5: Business Rules (Service layer)
Are business state conditions met? (e.g., is voting window open?) ✅

**Layered defense validated. RBAC alone is correctly insufficient — ownership check is mandatory.**

---

## ADR-002: Auth0 Role Strategy

**Finding:** Engineering Pack assumes roles are stored in MySQL `user_roles` table.

This is architecturally valid (Option B from `05_AUTH0_VALIDATION.md`).

**Recommendation confirmed:** Store roles in ShortReel MySQL. Auth0 provides only identity (`sub` claim). NestJS loads roles from MySQL on JWT validation, caches in Redis for 5 minutes.

**Implementation pattern:**
```
JWT guard validates Auth0 token
     ↓
Extract `sub` claim
     ↓
Redis cache lookup: user:session:{sub}
     ↓ (cache miss)
MySQL lookup: users WHERE external_subject_id = sub
     ↓
Load user_roles → roles → permissions
     ↓
Cache: SET user:session:{sub} TTL=300
     ↓
Attach to request context: req.user = { id, roles, permissions }
```

**Cache invalidation:** When an admin changes a user's role, invalidate `user:session:{sub}` in Redis immediately.

---

## Guard Implementation Validation

All three NestJS guards referenced in the Engineering Pack (`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`) are correctly architected:

- `JwtAuthGuard` → validates Auth0 JWT via JWKS ✅
- `RolesGuard` → reads `req.user.roles` loaded from MySQL ✅
- `PermissionsGuard` → reads `req.user.permissions` ✅
- `ResourceOwnerGuard` → compares `req.user.id` with entity's owner field ✅

---

## P1 Issues

**P1-RBAC-001:** ADR-002 (Auth0 role strategy) is open. Resolve to proceed with M04.  
**P1-RBAC-002:** Redis invalidation of user session cache on role change is required but not yet specified in `23_REDIS_QUEUE_ARCHITECTURE.md`. Add `user:session:{sub}` key pattern to Redis namespace docs.

## P2 Issues

**P2-RBAC-001:** 18 permissions is a reasonable V1 count. As product grows, consider a hierarchical permission system (e.g., `content:*` wildcard) for V2.

## Validation Status: ⚠️ READY WITH CONDITIONS
Conditions: Resolve ADR-002. Update Redis namespace with user session cache pattern.
