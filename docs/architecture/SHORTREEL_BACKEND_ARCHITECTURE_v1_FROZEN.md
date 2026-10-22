# SHORTREEL BACKEND ARCHITECTURE v1 — FROZEN

> **Document ID:** SR-ARCH-MASTER-v1  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN (Technical Contract for Phase 5)  
> **Date:** September 2026  
> **Authors:** Antigravity Architecture & DeepMind Engineering Team  

---

## EXECUTIVE SIGN-OFF & DESIGN FREEZE

This master architecture specification formally freezes the **ShortReel Production Backend Architecture v1**. It directly operationalizes the frozen Lovable UI (Phase 2) and Domain Model v1 (Phase 3) into an enterprise-grade, high-performance, and resilient system architecture blueprint.

> [!IMPORTANT]
> **Engineering Contract & Boundary**:
> 1. This document, together with the 30 detailed architectural specifications in `docs/architecture/`, represents the **binding technical contract** for engineering implementation.
> 2. **NO PRODUCTION CODE OR DATABASE MIGRATIONS** have been generated in Phase 4.
> 3. The subsequent engineering milestone is **Phase 5 — Database Implementation** (MySQL schemas, Drizzle migrations, foreign key constraints, indexes, and seed datasets).
> 4. Engineering implementation must not commence until formal stakeholder sign-off is recorded.

---

## 1. Product Architecture & Positioning

ShortReel is the next-generation interactive vertical short-series entertainment platform.
- **Brand Positioning:** *"Watch it. Choose it. Shape it."*
- **Content Format:** High-production-value, vertical (9:16) episodic short dramas (1–3 minutes per node) featuring viewer-driven interactive narrative choice points, real-time community voting, audience predictions, and gamified XP progression.
- **Client Topology:**
  - **Consumer Experience:** Highly responsive Web & Mobile PWA (touch-first vertical reel player with seamless branching overlays).
  - **Creator Studio:** Professional authoring portal for narrative node graphing, script beat ideation, and direct media ingestion.
  - **AI Story Studio:** Multi-model assistive creative workbench for plot expansion, character forging, and cliffhanger design.
  - **Admin / CMS Console:** Platform governance, editorial review, creator verification, Story Lab intelligence, and financial reconciliation.

---

## 2. Core Technology Stack (Ratified Baseline)

| Layer | Ratified Technology | Key Architecture Specifications |
| :--- | :--- | :--- |
| **Backend Framework** | **NestJS 10.x + TypeScript 5.x** | Modular Monolith, Strict Dependency Injection, DTO validation via `class-validator`, OpenAPI v3. |
| **Relational Database** | **MySQL 8.x (InnoDB)** | Multi-AZ clustering, strict foreign keys, UTC timestamps, `DECIMAL(12,2)` for currency, `utf8mb4_0900_ai_ci`. *Strictly zero PostgreSQL*. |
| **Data Access Layer / ORM**| **Drizzle ORM** (Prisma as documented secondary fallback) | Zero runtime overhead query builder, compile-time type safety, transparent SQL migrations via `drizzle-kit`. |
| **Entity Identifier Strategy**| **ULID / UUIDv7 (`BINARY(16)`)** | 128-bit time-ordered binary IDs in MySQL; represented as 26-character Base32 strings in API DTOs. Prevents B-Tree page fragmentation and ID enumeration attacks. |
| **Caching & Distributed State**| **Redis 7.x (Cluster)** | Ephemeral cache, token rotation tracking, sliding-window rate limiting, and Redlock distributed mutual exclusion. |
| **Asynchronous Job Queues**| **BullMQ 5.x** | Isolated Redis-backed queues (`video`, `analytics`, `notifications`, `ai`, `billing`) with exponential backoff and DLQs. |
| **Video Platform & Transcoding**| **Cloudflare Stream** | Direct client TUS uploads, vertical 9:16 multi-bitrate HLS/DASH encoding, global edge CDN, RS256 signed playback tokens. Zero video storage in MySQL. |
| **Object & Asset Storage** | **Cloudflare R2 / AWS S3** | S3-compatible zero-egress bucket storage for posters, thumbnails, avatars, documents, and script packs. |
| **Authentication & AuthZ** | **Custom NestJS Auth (Argon2id + RS256 JWT)** | 15-minute access tokens, 30-day single-use Redis refresh token rotation, 8 RBAC roles, fine-grained permission guards. |
| **Search Engine (V1)** | **MySQL 8.x InnoDB Full-Text Search (FTS)** | Boolean mode full-text search with Redis query caching; future Meilisearch seam when catalogue > 50,000 items. |
| **Cloud Hosting Platform** | **AWS (ECS Fargate) + Cloudflare Edge** | Containerized serverless Docker deployments with multi-AZ Aurora MySQL and global Cloudflare WAF/CDN. |

---

## 3. Domain Boundaries & Clean Architecture

The platform enforces clean, unidirectional architectural flow across four distinct tiers:

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                1. PRESENTATION TIER (Clients)               │
 │   - Consumer Mobile PWA   - Creator Studio   - Admin CMS    │
 └──────────────────────────────┬──────────────────────────────┘
                                │ HTTPS / REST / JWT
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                     2. API GATEWAY TIER                     │
 │   - Cloudflare WAF        - Helmet Security Headers         │
 │   - Rate Limiting         - Global ValidationPipe           │
 │   - Standard Response & Error Envelopes                     │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │            3. APPLICATION & DOMAIN SERVICE TIER             │
 │   - 13 Encapsulated NestJS Modules                          │
 │   - Rich Domain Services (No business logic in controllers) │
 │   - Inter-module contracts via exported service interfaces  │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  4. INFRASTRUCTURE TIER                     │
 │   - Drizzle ORM Repositories (MySQL 8.x)                    │
 │   - Redis Cache & BullMQ Queue Workers                      │
 │   - Cloudflare Stream (Video) / Cloudflare R2 (Assets)      │
 │   - External Providers (Claude, Stripe/Razorpay, SendGrid)  │
 └─────────────────────────────────────────────────────────────┘
```

---

## 4. NestJS Modular Monolith Architecture

The backend codebase is organized into 13 high-cohesion, low-coupling modules:

1. **`AuthModule`**: User registration, login, Argon2id verification, RS256 JWT signing, refresh token rotation, logout.
2. **`UsersModule` & `RolesModule`**: User profiles, 8 RBAC roles (`SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR`, `CREATOR_MANAGER`, `ANALYST`, `FINANCE`, `CREATOR`, `USER`), and 18 granular permissions.
3. **`ContentModule` (`Stories`, `Seasons`, `Episodes`, `Videos`, `Characters`)**: Core media catalog management, metadata tagging, and video streaming manifest resolution.
4. **`InteractiveEngineModule`**: Direct Acyclic Graph (DAG) narrative traversal, choice validation, atomic branch persistence, and voting window management.
5. **`EngagementModule` (`WatchHistory`, `WatchProgress`, `Votes`, `Predictions`, `Gamification`)**: Playback tracking, XP ledgering, streak accounting, and achievement badge unlocks.
6. **`MonetisationModule` (`Subscriptions`, `Entitlements`)**: Subscription plans, payment webhook idempotency, content entitlement gating, and dunning workflows.
7. **`CreatorsModule`**: Creator applications, verification tiers, profile management, and monthly revenue settlement state machine.
8. **`NotificationsModule`**: Asynchronous dispatch of in-app, push (FCM/APNs), and transactional email notifications.
9. **`StoryLabModule`**: Algorithmic signal extraction, narrative insight generation, opportunity discovery, and human-gated A/B story experiments.
10. **`BusinessModule`**: Executive KPI aggregation (DAU, MAU, retention, churn, MRR) and pre-aggregated reporting snapshots.
11. **`AnalyticsModule`**: High-volume telemetry stream ingestion via Redis Streams, decoupled from MySQL.
12. **`AIStudioModule`**: Multi-provider AI orchestration (Anthropic Claude default, OpenAI fallback), structured Zod schema validation, and assistive creator workflows.
13. **`AdminModule` & `AuditModule`**: System-wide governance, editorial review pipelines, and immutable audit logging.

---

## 5. MySQL Database Architecture & ER Model

- **Engine:** InnoDB exclusively across all tables.
- **Character Set & Collation:** `utf8mb4` with `utf8mb4_0900_ai_ci`.
- **Constraint Discipline:** Every parent-child relationship enforces strict foreign keys with `ON DELETE RESTRICT` or `ON DELETE CASCADE`.
- **Temporal Standard:** All timestamps stored in UTC (`DATETIME(3)` or `TIMESTAMP`).
- **Money & Balances:** All financial quantities stored as `DECIMAL(12,2)`. Floating-point types are strictly forbidden.
- **Core Relationships:**
  - `User` 1:1 `Profile`
  - `User` 1:1 `Creator`
  - `Creator` 1:N `Story`
  - `Story` 1:N `StoryVersion` (Immutable versioning)
  - `StoryVersion` 1:N `StoryNode`
  - `StoryNode` 1:N `Choice` 1:N `ChoiceOption` (Points to destination `StoryNode`)
  - `User` 1:1 `WatchProgress` (per Episode)
  - `User` 1:N `WatchHistory` (append-only log)
  - `User` 1:N `UserChoice` (unique compound key: `user_id + choice_id`)
  - `User` 1:1 `Subscription` 1:N `Entitlement`

---

## 6. Interactive Story Engine & Versioning Rules

- **Deterministic Graph Traversal:** Narrative nodes form a Directed Acyclic Graph (DAG). Cycles are rejected at publish time.
- **Atomic Choice Resolution Transaction:** Validates choice window -> verifies option -> writes `UserChoice` -> awards XP -> returns destination `StoryNode` video playback token in a single ACID transaction.
- **Published Version Immutability:** Once a `StoryVersion` transitions to `PUBLISHED`, database triggers and application guards prohibit any update or deletion.
- **Viewer Historical Continuity:** Viewer journeys and choices are permanently anchored to the specific `story_version_id` active when they watched. Editorial revisions create a new `DRAFT` version (`vNext`), preserving historical playback integrity.

---

## 7. Engagement & High-Volume Telemetry Architecture

- **Progress vs. History Separation:** `watch_progress` maintains the mutable, single-row-per-episode resume pointer; `watch_history` captures the append-only audit trail.
- **Telemetry Decoupling:** High-frequency playback events (`VIDEO_STARTED`, `VIDEO_25_PERCENT`, `VIDEO_COMPLETED`) bypass direct MySQL writes, streaming into Redis Streams.
- **Rollup Aggregation:** BullMQ background workers process streams in micro-batches, writing hourly operational metrics to `business_metrics`.
- **Future OLAP Seam:** Built-in adapter interfaces allow seamless rerouting of raw telemetry to ClickHouse, BigQuery, or Snowflake when volume exceeds 10M daily events without touching core transactional code.

---

## 8. Video Platform & Media Delivery Architecture

- **Zero Binaries in MySQL:** Video files are never proxied through or stored inside MySQL.
- **Direct Creator Upload:** Creator Studio requests a signed TUS upload URL from the NestJS API; the browser uploads video binaries directly to Cloudflare Stream.
- **Transcoding Pipeline:** Cloudflare Stream automatically encodes source uploads into vertical 9:16 multi-bitrate HLS/DASH profiles (1080p, 720p, 480p, 360p).
- **Secure Playback:** Video playback URLs require time-limited, RS256-signed JWT tokens validating consumer entitlements before manifest delivery.

---

## 9. Security, Governance & Observability

- **Defense-in-Depth:** Cloudflare WAF + TLS 1.3 Strict + Helmet security headers + SameSite=Strict cookies + Argon2id password hashing + RS256 JWTs.
- **Data Protection:** Zero secrets or sensitive PII (passwords, bank accounts, tokens) exposed in API responses or logs. Application-level AES-256-GCM encryption for stored banking/tax identifiers.
- **Immutable Audit Logging:** Every privileged administrative, financial, and editorial action is committed to `audit_logs`.
- **Pillars of Observability:**
  - **Logging:** Structured JSON logs via Pino with automatic PII redaction and `X-Correlation-ID` tracing.
  - **Metrics:** Prometheus endpoint (`/metrics`) monitoring HTTP latency, choice resolution speed, DB connection pool depth, and BullMQ queue lag.
  - **Health Probes:** Distinct `/health/liveness` (event loop check) and `/health/readiness` (MySQL, Redis, and disk connectivity checks).

---

## 10. Master Architecture Document Directory (30 Specifications)

All 30 architectural facets are comprehensively documented in the `docs/architecture/` repository:

| Document ID | File Path | Focus Area |
| :--- | :--- | :--- |
| **SR-ARCH-01** | `01_SYSTEM_ARCHITECTURE.md` | 4-Tier Logical Architecture, Modular Monolith Principles |
| **SR-ARCH-02** | `02_TECHNOLOGY_STACK.md` | Drizzle ORM, ULID `BINARY(16)`, Cloudflare Stream, Custom Auth |
| **SR-ARCH-03** | `03_NESTJS_MODULE_ARCHITECTURE.md` | 13 NestJS Modules, Owned Entities, APIs, Domain Events |
| **SR-ARCH-04** | `04_MYSQL_DATABASE_ARCHITECTURE.md` | Physical Schemas, Types, Foreign Keys, Engine Specifications |
| **SR-ARCH-05** | `05_ER_DIAGRAM.md` | Mermaid Entity Relationship Diagrams & Interactive DAG Submodel |
| **SR-ARCH-06** | `06_DATABASE_INDEXING_STRATEGY.md` | B-Tree Indexes, Read Hotspot Optimization, Full-Text Search |
| **SR-ARCH-07** | `07_API_ARCHITECTURE.md` | Complete REST Endpoint Catalog across Consumer, Creator, Admin |
| **SR-ARCH-08** | `08_API_CONVENTIONS.md` | Response Envelopes, Standardized Error Codes, Idempotency |
| **SR-ARCH-09** | `09_AUTH_RBAC_ARCHITECTURE.md` | Argon2id, RS256 JWT, Refresh Rotation, 8 Roles, 18 Permissions |
| **SR-ARCH-10** | `10_INTERACTIVE_STORY_ENGINE.md` | DAG Traversal, Node Resolution, Choice ACID Transaction, Voting |
| **SR-ARCH-11** | `11_STORY_VERSIONING.md` | Version State Machine, Immutability, Snapshotting, Historical Continuity |
| **SR-ARCH-12** | `12_ENGAGEMENT_ENGINE.md` | Watch Progress vs History, XP Ledgering, Badges, Streaks |
| **SR-ARCH-13** | `13_ANALYTICS_ARCHITECTURE.md` | Redis Streams, BullMQ Aggregation, MySQL Rollups, OLAP Seam |
| **SR-ARCH-14** | `14_VIDEO_ARCHITECTURE.md` | Cloudflare Stream, Direct TUS Upload, 9:16 Profiles, Signed Tokens |
| **SR-ARCH-15** | `15_NOTIFICATION_ARCHITECTURE.md` | In-App, Push (FCM/APNs), Email (SendGrid/SES), BullMQ Workers |
| **SR-ARCH-16** | `16_SUBSCRIPTION_ARCHITECTURE.md` | Subscription Lifecycle, 3-Day Grace Period, Payment Gateway Interface |
| **SR-ARCH-17** | `17_CREATOR_ECONOMY.md` | Creator Tiers, Monthly Earnings State Machine, Payout Lifecycle |
| **SR-ARCH-18** | `18_STORY_LAB_ARCHITECTURE.md` | Signal -> Insight -> Opportunity Pipeline, Human Review, A/B Testing |
| **SR-ARCH-19** | `19_BUSINESS_INTELLIGENCE.md` | Operational vs Derived Data, `business_metrics`, Pre-aggregated Rollups |
| **SR-ARCH-20** | `20_AI_ARCHITECTURE.md` | Multi-Provider Orchestrator (Claude / GPT-4o), Structured Zod Outputs |
| **SR-ARCH-21** | `21_REDIS_QUEUE_ARCHITECTURE.md` | Key Namespaces, TTLs, Redlock Mutex, BullMQ Queue Concurrency |
| **SR-ARCH-22** | `22_SEARCH_ARCHITECTURE.md` | MySQL 8.x InnoDB Full-Text Search, Future Meilisearch Seam |
| **SR-ARCH-23** | `23_SECURITY_ARCHITECTURE.md` | OWASP Mitigations, Data Redaction, AES-256-GCM, Audit Logging |
| **SR-ARCH-24** | `24_OBSERVABILITY.md` | Pino JSON Logging, Prometheus Metrics, Tracing, Health Probes |
| **SR-ARCH-25** | `25_DEPLOYMENT_ARCHITECTURE.md` | AWS ECS Fargate, Multi-AZ Aurora MySQL, Docker Multi-Stage Image |
| **SR-ARCH-26** | `26_TESTING_ARCHITECTURE.md` | Test Pyramid, Interactive Engine Invariant Tests, E2E Journeys |
| **SR-ARCH-27** | `27_FRONTEND_INTEGRATION.md` | Complete UI -> API -> Domain -> Database Traceability Matrix |
| **SR-ARCH-28** | `28_DATA_RETENTION.md` | Retention Schedules, Chunked Purging, Open Legal Register |
| **SR-ARCH-29** | `29_BACKUP_DISASTER_RECOVERY.md` | Continuous Binlog PITR, Cross-Region Snapshots, RPO/RTO Targets |
| **SR-ARCH-30** | `30_ARCHITECTURE_DECISIONS.md` | Complete ADR Register (ADR-001 through ADR-012) |
| **SR-ARCH-ODR**| `OPEN_DECISION_REGISTER.md` | Master Tracking Register for Technical, Business, and Legal Decisions |

---

## 11. Transition to Phase 5: Database Implementation

Phase 4 concludes with the formal ratification and freezing of this architectural blueprint.

The project is now primed for:

```text
                             PHASE 5 — DATABASE IMPLEMENTATION
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │ 1. Initialize Drizzle ORM Schema Definitions           │
                 │    (TypeScript schemas for all tables in docs/04)      │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │ 2. Generate Initial SQL Migrations via drizzle-kit     │
                 │    (Strict InnoDB, foreign keys, indexes, collations)  │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │ 3. Execute Migrations on Development MySQL 8.x         │
                 │    (Validate constraint integrity and B-tree indexes)  │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │ 4. Build Seed Data Fixtures                            │
                 │    (Seed roles, permissions, genres, and sample story) │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                                             ▼
                 ┌────────────────────────────────────────────────────────┐
                 │ 5. Automated Database Integrity Validation Suite       │
                 │    (Execute graph traversal and FK constraint checks)  │
                 └────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> **STOP CRITERIA**:
> In accordance with user directives, **Phase 4 is complete and frozen**. Do NOT execute database migrations, write backend production code, or create database tables until Phase 5 is explicitly initiated by the user.
