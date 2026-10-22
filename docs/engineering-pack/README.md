# SHORTREEL ENGINEERING PACK v1

> **Status:** FROZEN — Ready for Phase 6 Claude Implementation  
> **Version:** 1.0  
> **Date:** September 2026  
> **Preceding Phases:** UI Freeze v1 + Domain Model v1 + Backend Architecture v1  

---

## What This Is

This Engineering Pack is the **complete, implementation-ready specification** for the ShortReel production backend.

It converts the frozen product, UI, domain model, and backend architecture into a structured package that Claude can execute **module by module** with validation after each step.

```
UI FREEZE v1
     +
DOMAIN MODEL v1
     +
BACKEND ARCHITECTURE v1
          ↓
   ENGINEERING PACK v1
          ↓
        CLAUDE
          ↓
CONTROLLED MODULE IMPLEMENTATION
```

---

## Critical Instructions for Claude

**READ `00_ENGINEERING_RULES.md` FIRST BEFORE ANY OTHER ACTION.**

Then read:
1. `01_PRODUCT_OVERVIEW.md` — understand what we are building
2. `03_DOMAIN_MODEL.md` — understand the entities
3. `04_DATABASE_SCHEMA.md` — understand the data contract
4. `05_API_SPECIFICATION.md` — understand the API contract
5. `implementation/00_IMPLEMENTATION_PLAN.md` — understand the sequence

**DO NOT implement modules out of order.**  
**DO NOT invent business rules.**  
**DO NOT replace MySQL.**  
**DO NOT introduce microservices.**

---

## Technology Baseline (FROZEN)

| Concern | Technology | Notes |
| :--- | :--- | :--- |
| **Backend** | NestJS 10.x + TypeScript 5.x | Modular Monolith |
| **Database** | MySQL 8.x (InnoDB) | STRICT. No PostgreSQL. |
| **ORM** | Drizzle ORM | Prisma as documented fallback |
| **Identifiers** | ULID → `BINARY(16)` | Base32 in API responses |
| **Cache** | Redis 7.x | Cluster mode in production |
| **Queues** | BullMQ 5.x | Backed by Redis |
| **Auth** | Custom NestJS — Argon2id + RS256 JWT | 8 roles, 18 permissions |
| **Video** | Cloudflare Stream | Never store binaries in MySQL |
| **Storage** | Cloudflare R2 / AWS S3 | S3-compatible |
| **Search** | MySQL FTS (V1) | Meilisearch seam for V2 |
| **AI** | Anthropic Claude (primary) + OpenAI (fallback) | Assistive only |
| **Deployment** | AWS ECS Fargate + Cloudflare Edge | Docker containers |
| **API** | REST + OpenAPI v3 | `/api/v1/...` |

---

## Document Index

### Core Specifications (01–17)

| # | Document | Purpose |
| :--- | :--- | :--- |
| 00 | `00_ENGINEERING_RULES.md` | **Claude's operating law** |
| 01 | `01_PRODUCT_OVERVIEW.md` | What ShortReel is |
| 02 | `02_UI_FREEZE.md` | Frozen frontend reference |
| 03 | `03_DOMAIN_MODEL.md` | Business domain entities |
| 04 | `04_DATABASE_SCHEMA.md` | MySQL schema contracts |
| 05 | `05_API_SPECIFICATION.md` | REST endpoints |
| 06 | `06_AUTH_RBAC.md` | Auth & permissions |
| 07 | `07_INTERACTIVE_STORY_ENGINE.md` | Branching engine |
| 08 | `08_ENGAGEMENT_ENGINE.md` | XP, progress, history |
| 09 | `09_ANALYTICS.md` | Event pipeline |
| 10 | `10_VIDEO_ARCHITECTURE.md` | Upload, encode, stream |
| 11 | `11_NOTIFICATION_SYSTEM.md` | Push, email, in-app |
| 12 | `12_SUBSCRIPTION_SYSTEM.md` | Billing & entitlements |
| 13 | `13_AI_ARCHITECTURE.md` | AI orchestration |
| 14 | `14_SECURITY.md` | Security controls |
| 15 | `15_DEPLOYMENT.md` | Docker & cloud |
| 16 | `16_TESTING.md` | Test strategy |
| 17 | `17_FRONTEND_INTEGRATION.md` | UI-to-API mapping |

### Extended Specifications (18–43)

| # | Document | Purpose |
| :--- | :--- | :--- |
| 18 | `18_CREATOR_PLATFORM.md` | Creator lifecycle |
| 19 | `19_ADMIN_CMS.md` | Admin operations |
| 20 | `20_STORY_LAB.md` | Intelligence & experiments |
| 21 | `21_BUSINESS_INTELLIGENCE.md` | Metrics & reporting |
| 22 | `22_SEARCH.md` | Discovery engine |
| 23 | `23_REDIS_QUEUE_ARCHITECTURE.md` | Queues & caching |
| 24 | `24_AUDIT_LOGGING.md` | Governance log |
| 25 | `25_OBSERVABILITY.md` | Logs, metrics, traces |
| 26 | `26_DATA_RETENTION.md` | Retention schedules |
| 27 | `27_BACKUP_DISASTER_RECOVERY.md` | RPO/RTO |
| 28 | `28_FILE_MEDIA_STORAGE.md` | Object storage |
| 29 | `29_ERROR_HANDLING.md` | Error codes & envelopes |
| 30 | `30_API_VERSIONING.md` | Versioning strategy |
| 31 | `31_PERFORMANCE.md` | Performance targets |
| 32 | `32_CONFIGURATION.md` | App config |
| 33 | `33_ENVIRONMENT_MANAGEMENT.md` | Env segregation |
| 34 | `34_MIGRATION_STRATEGY.md` | Schema evolution |
| 35 | `35_DOMAIN_EVENTS.md` | Internal events |
| 36 | `36_IDEMPOTENCY.md` | Safe retries |
| 37 | `37_DATA_SEEDING.md` | Dev seed data |
| 38 | `38_TEST_DATA.md` | Test fixtures |
| 39 | `39_CI_CD.md` | Pipeline |
| 40 | `40_CODE_STANDARDS.md` | TypeScript standards |
| 41 | `41_GIT_WORKFLOW.md` | Branch strategy |
| 42 | `42_ARCHITECTURE_DECISIONS.md` | ADR register |
| 43 | `43_OPEN_DECISIONS.md` | Unresolved items |

### Implementation Tracking

| File | Purpose |
| :--- | :--- |
| `implementation/00_IMPLEMENTATION_PLAN.md` | Full sequence |
| `implementation/01_PHASES.md` | Phase breakdown |
| `implementation/02_DEPENDENCY_GRAPH.md` | Module dependencies |
| `implementation/03_MODULE_CHECKLIST.md` | Progress per module |
| `implementation/04_ACCEPTANCE_CRITERIA.md` | Definition of done |
| `implementation/05_PROGRESS_TRACKER.md` | Live status table |

---

## Frozen Input References

| Artifact | Location |
| :--- | :--- |
| **UI Freeze Audit** | `docs/architecture/` (Phase 2) |
| **Domain Model v1** | `docs/architecture/` (Phase 3) |
| **Backend Architecture v1** | `docs/architecture/` (Phase 4 — 32 documents) |
| **Master Architecture** | `docs/architecture/SHORTREEL_BACKEND_ARCHITECTURE_v1_FROZEN.md` |
| **Open Decision Register** | `docs/architecture/OPEN_DECISION_REGISTER.md` |
