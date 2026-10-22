# 02. SHORTREEL — TECHNOLOGY STACK & EVALUATIONS

> **Document ID:** SR-ARCH-02  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Core Technology Baseline

| Component | Selected Technology | Version Baseline | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **Framework** | **NestJS** | 10.x / 11.x | Enterprise TypeScript framework; modular architecture enforces domain boundaries; native dependency injection; built-in testing tools; strong ecosystem. |
| **Runtime** | **Node.js LTS** | 20.x or 22.x LTS | High I/O throughput, active long-term support, broad ecosystem compatibility. |
| **Primary Database** | **MySQL** | 8.0.x / 8.4 LTS | Confirmed production relational engine. InnoDB storage, strict ACID transactions, JSON column indexing, spatial/full-text indexing, proven enterprise reliability. |
| **In-Memory Cache / Queue**| **Redis** | 7.x | Sub-millisecond latency for hot session tokens, active story graphs, distributed locks, rate-limiting counters, and BullMQ backing. |
| **Background Processing** | **BullMQ** | 5.x | High-performance Redis-backed task queue with concurrency control, backoff retries, dead-letter queues, and job scheduling. |
| **API Architecture** | **RESTful HTTP/JSON** | OpenAPI 3.1 | Clean resource mapping, universal mobile/web client compatibility, deterministic caching, straightforward DTO validation. |
| **Object Storage** | **S3-Compatible Storage** | Cloudflare R2 / AWS S3 | Flat-rate / low egress cost object storage for thumbnails, posters, audio files, and documents. |

---

## 2. In-Depth Architectural Evaluations & Decisions

### 2.1 ORM Evaluation: Prisma vs. Drizzle ORM vs. TypeORM

| Evaluation Dimension | TypeORM | Prisma | Drizzle ORM |
| :--- | :--- | :--- | :--- |
| **MySQL 8.x Native Support** | Mature, native driver integration. | Mature, uses query engine binary. | Exceptional, lightweight wrapper over `mysql2`. |
| **NestJS Ecosystem Integration**| Official `@nestjs/typeorm` package; deep integration with NestJS DI. | Requires custom service wrappers; well documented. | Requires standard provider injection; easy to integrate with DI. |
| **Type Safety** | Decorator-driven runtime reflection; partial compile-time safety. | Strong schema-generated types; complex queries require `$queryRaw`. | **100% TypeScript-first compile-time type safety**; zero runtime code generation. |
| **Complex Relational / Graph Traversal** | QueryBuilder available; known query generation quirks with joins. | Prisma relations load multiple queries by default unless `$join` used. | **SQL-like relational queries**; precise control over joins, CTEs, and recursive queries. |
| **Transaction Reliability** | QueryRunner transactions; can leak connections if not carefully scoped. | Interactive transactions (`$transaction`) with strict timeout semantics. | Native database transactions directly on the connection pool. |
| **Performance & Cold Starts** | Moderate overhead due to metadata reflection. | Heavy Rust query engine binary; memory overhead; slow cold starts in serverless. | **Near-zero overhead**; fastest execution benchmarks; tiny bundle size. |
| **Migration Tooling** | `typeorm migration:*` is error-prone in team development. | `prisma migrate` is highly mature and reliable. | `drizzle-kit` generates clean, editable native SQL migration files. |

#### Evaluation & Recommendation: **Drizzle ORM** (Recommended) with Prisma as Secondary Fallback
- **Primary Recommendation: Drizzle ORM**
  - **Reasoning:** ShortReel's interactive narrative engine relies heavily on relational graph traversals (`StoryNode` → `Choice` → `ChoiceOption` → `Destination StoryNode`), complex tree structures, and recursive queries. Drizzle executes as pure TypeScript SQL with zero hidden subquery overhead. It directly wraps the battle-tested `mysql2` driver, provides 100% type safety without heavy background binaries, and outputs pristine native SQL migrations that database administrators can review and audit without black-box abstractions.
  - **Alternative Fallback: Prisma**
    - If team familiarity with Prisma's schema DSL is preferred, Prisma 5.x/6.x is acceptable provided interactive transactions and connection pool sizing are configured carefully to prevent connection starvation under high concurrency.

---

### 2.2 Primary Key Identifier Strategy: ULID vs. UUIDv4 vs. BIGINT

| Identifier Strategy | Storage Footprint | Index Locality (B-Tree) | Guessability / Security | Distributed Generation |
| :--- | :--- | :--- | :--- | :--- |
| **BIGINT (Auto-Increment)** | 8 bytes | Best (sequential append) | **Critical Risk:** Sequential enumeration attack allows scraping user counts, revenue, and story drafts. | Requires centralized database coordination. |
| **UUIDv4 (Random)** | 16 or 36 bytes | **Worst:** Completely random insertion causes severe B-Tree page splits and buffer pool churn at scale. | High entropy (unguessable). | Client/app-level generation without DB roundtrip. |
| **ULID / UUIDv7 (Time-Ordered)**| **16 bytes (BINARY(16))** or 26 chars | **Optimal:** Millisecond timestamp prefix guarantees monotonic index ordering; zero random B-Tree page splits. | **High:** 80 bits of cryptographic randomness prevent enumeration. | **Zero DB lock:** Generated instantly anywhere in client, worker, or API. |

#### Recommendation: **ULID / UUIDv7 Stored as BINARY(16) (with Canonical String Representation in DTOs)**
- **Reasoning:** Auto-increment integers leak critical business volume (e.g. competitor scraping `/api/v1/creators/12` vs `/api/v1/creators/13`). Random UUIDv4 severely degrades MySQL InnoDB index performance above 10M rows due to random disk page leaf splits. **ULID / UUIDv7** combines the unguessability of UUIDs with the sequential insert performance of auto-increment integers.
- **Implementation:** In the application layer, IDs are 26-character Crockford Base32 strings (e.g., `01HTXYZ123456789ABCDEFGHJK`). In MySQL, they are stored as `BINARY(16)` via binary conversion utilities for minimal index footprint, with helper virtual generated columns or ORM serialization transforming them into strings in API responses.

---

### 2.3 Video Platform & Streaming Infrastructure

| Architecture Option | Strengths | Weaknesses | ShortReel Suitability |
| :--- | :--- | :--- | :--- |
| **Option A: Custom AWS Pipeline**<br>*(S3 + MediaConvert + CloudFront)* | Full ownership of transcoding profiles; volume discounts at massive scale. | High operational complexity; multi-minute transcoding latency; heavy Devops overhead for HLS packaging. | Poor for initial engineering velocity. Overkill for V1. |
| **Option B: Mux Video** | Superb developer API; native HLS delivery; robust playback analytics. | Expensive bandwidth pricing at scale ($0.005/min encoding + streaming costs); external data transfer. | Excellent API, but high variable unit economics for short video bingeing. |
| **Option C: Cloudflare Stream** | **Native 9:16 vertical support; global edge encoding; unmetered video delivery flat pricing ($1/1000 min viewed); built-in signed playback tokens; direct creator upload URLs.** | Less flexible low-level codec customization compared to raw FFmpeg. | **WINNER:** Optimal match for 60–90 second vertical short videos with predictable, low-cost streaming economics. |

#### Recommendation: **Cloudflare Stream** (Primary) with Object Storage Fallback
- **Reasoning:** ShortReel's business model depends on users binging 10–30 short vertical videos per session. Cloudflare Stream provides:
  1. Direct creator upload URLs (client uploads directly to Cloudflare without proxying heavy video files through the NestJS server).
  2. Automatic adaptive bitrate transcoding (1080p, 720p, 480p, 360p vertical portrait HLS).
  3. Edge token authentication (`JWT-signed tokens`) preventing hotlinking and VIP paywall bypass.
  4. Flat, predictable unit economics designed for high-view platforms.

---

### 2.4 Authentication Strategy

| Option | Pros | Cons | Recommendation Assessment |
| :--- | :--- | :--- | :--- |
| **Auth0 / Okta** | Turnkey enterprise identity; ready-made social connections. | Very high cost per MAU; complex session customization; external dependency for every auth check. | Unnecessary cost overhead for consumer OTT scale. |
| **Supabase Auth** | Built-in Postgres identity; convenient hosted auth. | Architectural mismatch: ShortReel is standardized on **MySQL 8.x**, not Postgres. Introduces dual database maintenance. | Rejected due to database divergence. |
| **Custom NestJS Auth**<br>*(Argon2id + JWT + Redis Refresh Tokens)* | **Zero external licensing costs; 100% control over session lifecycle; native MySQL user storage; seamless RBAC integration; multi-role support (Consumers, Creators, Admins).** | Team must write standard token rotation, password hashing, and OAuth2 handlers. | **RECOMMENDED:** Complete architectural control, optimal performance, unified MySQL data model. |

#### Recommendation: **Custom NestJS Auth**
- **Password Hashing:** `argon2id` (OWASP recommended parameter configuration).
- **Session Tokens:** Short-lived JWTs (15-minute expiration) carried in secure `HttpOnly`, `SameSite=Strict`, `Secure` cookies or `Authorization: Bearer` headers.
- **Refresh Tokens:** Cryptographically random 64-byte tokens stored in Redis with 30-day sliding TTL and automatic reuse detection (token family invalidation).

---

## 3. Technology Stack Matrix Summary

```text
┌────────────────────────────────────────────────────────┐
│                    SHORTREEL STACK                     │
├──────────────────────┬─────────────────────────────────┤
│ Language             │ TypeScript 5.x                  │
│ Framework            │ NestJS 10.x / 11.x              │
│ Relational Database  │ MySQL 8.0.x / 8.4 LTS (InnoDB)  │
│ Primary Key Scheme   │ ULID / UUIDv7 (BINARY(16))      │
│ ORM / Query Layer    │ Drizzle ORM (native mysql2)     │
│ Caching & Queues     │ Redis 7.x + BullMQ 5.x          │
│ Video Streaming      │ Cloudflare Stream (HLS/DASH)    │
│ Static Media Storage │ Cloudflare R2 / AWS S3          │
│ Authentication       │ Custom NestJS (Argon2id + JWT)  │
│ Documentation        │ OpenAPI 3.1 / Swagger           │
│ Test Frameworks      │ Jest, Supertest, Testcontainers │
│ Containerization     │ Docker multi-stage builds       │
└──────────────────────┴─────────────────────────────────┘
```
