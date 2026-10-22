# 07. SHORTREEL — IMPLEMENTATION BASELINE

> **Document:** `implementation/07_IMPLEMENTATION_BASELINE.md`  
> **Phase:** 5B — Master Engineering Baseline  
> **Date:** September 2026  
> **Status:** RATIFIED BASELINE  
> **Authority:** Pre-Implementation Baseline against Phase 5A Validated Specifications

---

## 1. Executive Baseline Summary

This document establishes the official engineering baseline across all 8 architectural dimensions of the ShortReel platform immediately prior to initializing Module M00 (Backend Foundation).

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   SHORTREEL PLATFORM IMPLEMENTATION BASELINE                │
│                                                             │
│   1. Backend Status:         NOT STARTED (Greenfield)       │
│   2. Database Status:        SPECIFIED (Ready for M01)      │
│   3. Auth0 Status:           ARCHITECTED (Pending M04)      │
│   4. Frontend Status:        FROZEN & OPERATIONAL (UI v1)   │
│   5. API Status:             SPECIFIED (Contracts defined)  │
│   6. Testing Status:         FRAMEWORK DESIGNED (Pending)   │
│   7. Infrastructure Status:  CONTAINER CONFIG PENDING       │
│   8. Documentation Status:   APPROVED & AUDITED (24 docs)   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Dimension Baseline Assessments

### 1. Backend Status
* **Current State:** **NOT STARTED**
* **Framework:** NestJS 10.x with TypeScript 5.x on Node.js 20+ LTS.
* **Architecture:** Modular Monolith with strict boundary encapsulation.
* **Physical Location:** `/backend` sub-tree in repository.
* **Immediate Milestone:** Module M00 (Repository Setup & NestJS Bootstrap) + Module M02 (Core Configuration & Health).
* **Blockers:** None. Greenfield setup unblocked.

### 2. Database Status
* **Current State:** **SPECIFIED & VALIDATED**
* **Engine:** MySQL 8.0 (InnoDB) with binary UUIDs (`BINARY(16)`), utf8mb4 collation, and strict ACID transaction boundaries.
* **ORM:** Drizzle ORM (TypeScript-first schema, zero runtime bloat, raw SQL precision for binary ULID keys).
* **Schema Readiness:** 32 core relational tables defined in `04_DATABASE_SCHEMA.md` + 4 missing DDLs drafted in `03_DATABASE_VALIDATION.md` (`entitlements`, `creator_submissions`, `votes` + `predictions`, `story_experiments`).
* **Immediate Milestone:** Module M01 (Database Foundation: Drizzle schema, migration runner, connection pooling).
* **Blockers:** None.

### 3. Auth0 Status
* **Current State:** **ARCHITECTED (P0 Resolution Path Defined)**
* **Architecture:** Auth0 is the single external Identity Provider (WHO the user is). NestJS is an OAuth 2.0 Resource Server validating incoming RS256 JWT access tokens against the Auth0 JWKS endpoint (`/.well-known/jwks.json`).
* **ShortReel Role:** ShortReel owns application authorization (WHAT the user can do) via MySQL `roles`, `permissions`, and `user_roles` with Redis session caching (ADR-002 Option B).
* **User Mapping:** Stable external identity linkage via `users.external_subject_id = auth0|...`.
* **Immediate Milestone:** Module M03 (Identity Schema) → Module M04 (Auth0 JwtAuthGuard & JIT Provisioning) → Module M05 (RBAC & Ownership Guards).
* **Blockers:** None for M00–M02; ADR-002 and ADR-003 ratified in principle for M03–M05.

### 4. Frontend Status
* **Current State:** **FROZEN & OPERATIONAL**
* **Framework:** React 19, TanStack Start / Router, Tailwind CSS v4, Lucide React, Radix UI.
* **Scope:** 65 routes covering Consumer Experience, Creator Studio, and Admin CMS.
* **Data Layer:** Functional client-side state stores backed by comprehensive mock datasets in `src/lib/`.
* **Policy:** FROZEN per UI Freeze v1. No UI redesigns or unapproved route modifications.
* **Future Transition:** Gradual binding of React Query hooks to `/api/v1` backend endpoints in Phase 6E after backend vertical slice is complete.

### 5. API Status
* **Current State:** **SPECIFIED (REST v1)**
* **Standards:** OpenAPI 3.0 / Swagger documentation, URI versioning (`/api/v1`), standard response envelopes (`{ success: true, data: { ... } }`) and error envelopes (`{ success: false, error: { code, message, requestId } }`).
* **DTO Validation:** Strict boundary validation using `class-validator` and `class-transformer` with `whitelist: true, forbidNonWhitelisted: true`.
* **Immediate Milestone:** Scaffolding global validation pipe, exception filter, and OpenAPI Swagger documentation in Module M00/M02.

### 6. Testing Status
* **Current State:** **TEST STRATEGY RATIFIED**
* **Tooling:** Jest for unit tests, Supertest for HTTP integration tests, Testcontainers for MySQL containerized testing.
* **Critical Test Assets:** 10 Interactive Story Engine graph invariant test cases (ENG-001 through ENG-010) and the end-to-end "The Missing Phone" execution trace.
* **Target Coverage:** Minimum 85% branch coverage on domain and choice engine services.

### 7. Infrastructure Status
* **Current State:** **PENDING DOCKER SCAFFOLD**
* **Local Development:** Multi-container Docker Compose providing:
  * `shortreel-mysql`: MySQL 8.0 on port 3306 (database: `shortreel_dev`).
  * `shortreel-redis`: Redis 7.0 on port 6379 (caching and BullMQ).
* **Third-Party Services:**
  * Video: Cloudflare Stream (tus direct chunked upload + signed HLS URLs).
  * Payments: Dual Gateway Adapter (Razorpay for India, Stripe for Global).
* **Immediate Milestone:** Author root `docker-compose.yml` in Module M00.

### 8. Documentation Status
* **Current State:** **AUDITED & PRODUCTION-READY**
* **Inventory:**
  * 51 core specification documents in `docs/engineering-pack/`.
  * 24 formal validation documents in `docs/engineering-pack/validation/`.
  * 7 implementation tracking and planning documents in `docs/engineering-pack/implementation/`.
* **Traceability:** Complete end-to-end requirement-to-schema traceability established in `01_TRACEABILITY_MATRIX.md`.

---

## 3. Transition to Execution

With the repository audit and implementation baseline ratified, the engineering workflow proceeds sequentially into:
1. **Module M00:** Repository Setup (NestJS bootstrap, TypeScript configs, Docker Compose, baseline tooling).
2. **Module M01:** Database Foundation (Drizzle ORM configuration, MySQL pool, migration runner).
3. **Module M02:** Core Configuration (Type-safe ConfigModule, Pino logger, health checks).
4. **Module M03–M05:** Auth0 Identity, User Provisioning, and RBAC Guards.
5. **Module M06–M12:** MVP Vertical Slice ("The Missing Phone").
