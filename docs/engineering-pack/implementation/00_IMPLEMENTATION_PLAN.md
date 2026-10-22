# 00. IMPLEMENTATION PLAN

> **Document:** `implementation/00_IMPLEMENTATION_PLAN.md`  
> **Status:** READY  
> **Mode:** Execute sequentially. Do NOT skip ahead.  

---

## Pre-Implementation Protocol

Before any module: Read the Pre-Implementation Checklist in `00_ENGINEERING_RULES.md`.  
After any module: Output the MODULE COMPLETION REPORT format from `00_ENGINEERING_RULES.md`.

---

## Module Execution Sequence

### TIER 0 — Repository Foundation

| # | Module | Key Deliverables | Blocking Decisions |
| :--- | :--- | :--- | :--- |
| M00 | **Repository Setup** | NestJS project scaffold, TypeScript config, Docker Compose, CI baseline | None |
| M01 | **Database Foundation** | Drizzle ORM setup, migration runner, MySQL test container, global conventions | None |
| M02 | **Core Config** | ConfigModule + validation schema, logging (Pino), correlation IDs, health checks | None |

### TIER 1 — Identity & Auth

| # | Module | Key Deliverables | Blocking Decisions |
| :--- | :--- | :--- | :--- |
| M03 | **Identity Module** | users, user_profiles, roles, permissions, user_roles tables + migrations | None |
| M04 | **Auth Module** | Register, Login (Argon2id), RS256 JWT, Refresh Token rotation, Rate limiting | SD-001 (lockout) |
| M05 | **RBAC Guards** | JwtAuthGuard, RolesGuard, PermissionsGuard, ResourceOwnerGuard | None |

### TIER 2 — Content

| # | Module | Key Deliverables | Blocking Decisions |
| :--- | :--- | :--- | :--- |
| M06 | **Content Module** | stories, seasons, episodes, genres, characters, tags tables + CRUD APIs | None |
| M07 | **Video Module** | videos table, Cloudflare Stream integration, direct upload flow, webhook handler | None |
| M08 | **Search Module** | MySQL FTS on stories/creators/characters, SearchService abstraction | None |

### TIER 3 — Interactive Engine

| # | Module | Key Deliverables | Blocking Decisions |
| :--- | :--- | :--- | :--- |
| M09 | **Interactive Module** | story_versions, story_nodes, choices, choice_options tables + DAG APIs | None |
| M10 | **Choice Engine** | resolveChoice() ACID transaction, graph validation, all ENG-001..ENG-010 invariant tests | BR-006 (voting window default) |
| M11 | **Story Version Lifecycle** | DRAFT→IN_REVIEW→APPROVED→PUBLISHED→ARCHIVED state machine | None |

### TIER 4 — Engagement

| # | Module | Key Deliverables | Blocking Decisions |
| :--- | :--- | :--- | :--- |
| M12 | **Engagement Module** | watch_progress, watch_history, xp_ledger, user_choices | None |
| M13 | **Gamification** | badges, user_badges, streak tracking, badge evaluation worker | BR-008 (streak milestones) |
| M14 | **Social Features** | votes, predictions, follows, shares APIs | PD-004 (votes binding?) |
| M15 | **Notifications** | notifications table, BullMQ worker, in-app + FCM + email dispatch | None |

### TIER 5 — Creator Platform

| # | Module | Key Deliverables | Blocking Decisions |
| :--- | :--- | :--- | :--- |
| M16 | **Creator Module** | creators table, application lifecycle, creator profile APIs | None |
| M17 | **Creator Submissions** | creator_submissions, submission review APIs, admin queue | None |
| M18 | **AI Studio** | AiOrchestratorService, Claude integration, 5 AI endpoints, async job flow | None |
| M19 | **Creator Earnings** | creator_earnings, monthly settlement worker (pending BR-001, BR-002, BR-003) | BR-001/002/003 |
| M20 | **Creator Analytics** | creator-scoped metrics from engagement data | None |

### TIER 6 — Monetisation

| # | Module | Key Deliverables | Blocking Decisions |
| :--- | :--- | :--- | :--- |
| M21 | **Subscription Plans** | subscription_plans API, plan catalog | None |
| M22 | **Subscription Checkout** | Razorpay integration, checkout session, entitlement creation | BR-004 (trial), BR-005 (grace) |
| M23 | **Webhook Processing** | razorpay + stripe webhook handlers (idempotent), subscription state machine | LC-004 (refunds) |

### TIER 7 — Analytics & Intelligence

| # | Module | Key Deliverables | Blocking Decisions |
| :--- | :--- | :--- | :--- |
| M24 | **Analytics Ingest** | Event schema, Redis Stream ingestion, batch endpoint | None |
| M25 | **Analytics Rollup** | BullMQ hourly/daily aggregation workers, business_metrics table | None |
| M26 | **Business Dashboard** | Pre-computed KPI APIs, Redis caching of metric responses | None |
| M27 | **Story Lab** | Signal computation worker, insight generation, Story Lab APIs | None |

### TIER 8 — Admin CMS

| # | Module | Key Deliverables | Blocking Decisions |
| :--- | :--- | :--- | :--- |
| M28 | **Admin Module** | Admin-scoped APIs, submission queue, content archive, user management | None |
| M29 | **Audit Module** | audit_logs table, AuditService, all admin actions logged | None |

### TIER 9 — Polish & Hardening

| # | Module | Key Deliverables | Blocking Decisions |
| :--- | :--- | :--- | :--- |
| M30 | **Observability** | Prometheus metrics endpoint, OpenTelemetry traces, Pino PII redaction | None |
| M31 | **Performance** | Index audit, query plan review, Redis cache hit rate validation | None |
| M32 | **Security Hardening** | CORS, CSP, rate limit audit, dependency scan, penetration test checklist | None |

---

## Module Dependencies (Critical Path)

```
M00 → M01 → M02
M02 → M03 → M04 → M05
M05 → M06 → M07 → M08
M05 → M09 → M10 → M11
M06 + M11 → M12 → M13 → M14 → M15
M05 → M16 → M17 → M18 → M19 → M20
M05 → M21 → M22 → M23
M12 + M23 → M24 → M25 → M26 → M27
M17 + M27 → M28 → M29
M25 + M28 → M30 → M31 → M32
```

---

## STOP CONDITION

Implementation is complete when:
- All 33 modules (M00–M32) are marked COMPLETE in `05_PROGRESS_TRACKER.md`.
- All module tests pass.
- All 10 story engine invariant tests (ENG-001..ENG-010) pass.
- Production deployment checklist in `15_DEPLOYMENT.md` is validated in staging.
- All OPEN decisions affecting V1 scope are DECIDED.
