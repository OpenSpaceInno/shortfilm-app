# 01. SHORTREEL — SYSTEM ARCHITECTURE SPECIFICATION

> **Document ID:** SR-ARCH-01  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  
> **Baseline:** Domain Model v1 + Frozen UI Baseline (Iterations 1–4E)  
> **Architecture Style:** Modular Monolith (NestJS + TypeScript + MySQL 8.x)

---

## 1. High-Level Architectural Vision

ShortReel is an interactive vertical short-series streaming and creator platform. Its core architectural differentiator is the seamless blending of **high-concurrency short-form vertical video streaming** with a **deterministic, graph-based interactive branching narrative engine**, surrounded by real-time audience engagement, creator monetization, and AI-assisted story intelligence.

To maximize velocity, ensure strict transactional integrity, and avoid the operational tax of distributed systems at early-to-mid scale, ShortReel is designed as a **strictly partitioned Modular Monolith**. It runs as a unified NestJS service with clean module boundaries, direct in-memory domain communication via typed events, and strict database ownership boundaries. This architecture provides a seamless path to extract individual high-scale services (e.g., Video Transcoding, Interactive Engine, or Analytics Ingestion) into standalone microservices when traffic scale demands it.

---

## 2. Logical Tier Architecture

The system is strictly structured into four horizontal architectural tiers, enforcing unidirectional dependency flow:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER                               │
│  - Consumer Mobile PWA / Native Shell (Capacitor)                      │
│  - Creator Studio Web Application                                      │
│  - Internal Admin / CMS & Story Lab Console                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WSS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            API TIER                                    │
│  - Reverse Proxy / CDN / Cloudflare Edge (WAF, SSL, Rate Limiting)     │
│  - API Gateway / Routing Layer (/api/v1/...)                           │
│  - Global Middleware: Correlation IDs, Helmet, Compression, CORS       │
│  - Auth Guards (JWT, Refresh Token Rotation, RBAC Permission Matrix)   │
│  - Input Validation Pipes (class-validator, Zod, DTO transformation)   │
│  - Global Response / Error Interceptors (Standard Envelope)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Controller -> Service
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION & DOMAIN TIER                         │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐ │
│  │ Identity & Access     │ │ Content & Stories     │ │ Interactive   │ │
│  │ Module                │ │ Module                │ │ Story Engine  │ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────┘ │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐ │
│  │ Engagement & Watch    │ │ Subscriptions &       │ │ Notifications │ │
│  │ Progress Module       │ │ Monetisation Module   │ │ Module        │ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────┘ │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐ │
│  │ Creator Economy       │ │ Story Lab &           │ │ Business      │ │
│  │ Management Module     │ │ Intelligence Module   │ │ Analytics     │ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────┘ │
│  - In-Memory Typed Event Bus (EventEmitter2)                          │
│  - Domain Services & Strict Business Rules Execution                  │
│  - Transaction Boundary Orchestrators                                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Repositories & Adapters
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE TIER                             │
│  ┌───────────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ MySQL 8.x (InnoDB Relational DB)  │ │ Redis 7.x (Cache & PubSub)  │ │
│  │ - Authoritative Transactional Log │ │ - BullMQ Job Queues         │ │
│  │ - Strict Foreign Key Integrity    │ │ - Playback Session Cache    │ │
│  └───────────────────────────────────┘ └─────────────────────────────┘ │
│  ┌───────────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ Video Platform / CDN (Cloudflare) │ │ Object Storage (S3 / R2)    │ │
│  │ - HLS/DASH 9:16 Adaptive Streams  │ │ - Posters, Thumbnails, PDFs │ │
│  └───────────────────────────────────┘ └─────────────────────────────┘ │
│  ┌───────────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ External AI Providers (Anthropic) │ │ Payment Gateways (Stripe/..)│ │
│  └───────────────────────────────────┘ └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer Separation & Responsibilities

### 3.1 Presentation Tier
- **Consumer Clients:** Mobile-first responsive PWA and Capacitor native shells. Optimized for vertical touch gestures, 9:16 viewport constraints, instant video playback caching, and offline-resilient interaction.
- **Creator Studio:** Desktop/tablet web interface. Provides branch visualization, node editors, asset uploaders, earnings dashboards, and AI story co-pilot.
- **Admin & Story Lab Console:** Secured internal portal for content moderation, creator approvals, audience signal analysis, experiment configuration, and business reporting.

### 3.2 API Tier
- **API Routing:** RESTful versioned endpoints (`/api/v1/*`).
- **Defense in Depth:** Cloudflare WAF + NestJS Throttler guard against abuse, credential stuffing, and bot attacks.
- **Strict DTO Mapping:** Incoming payloads are validated and parsed before entering application services. Controllers contain zero business logic; they simply delegate to application services and map output DTOs.
- **Correlation Tracking:** Every request receives an `X-Correlation-ID` header, propagated through logging, database queries, and async background jobs.

### 3.3 Application & Domain Tier
- **Application Services:** Orchestrate transactional use cases, coordinate repositories, and publish domain events.
- **Domain Entities & Logic:** Pure business rules (e.g., choice eligibility calculation, voting window validation, XP gamification calculations).
- **Decoupled Cross-Module Communication:** Modules never directly write to tables owned by other modules. When cross-domain updates are required (e.g., `UserChoice` awarding XP and advancing `WatchProgress`), the owning module publishes a typed domain event, and subscribing modules process the update within their own boundaries.

### 3.4 Infrastructure Tier
- **Data Persistence:** Authoritative state lives in **MySQL 8.x** with ACID transactions and strict referential constraints.
- **Transient & Queue State:** **Redis 7.x** powers high-speed caching (hot stories, active choices, user session tokens) and **BullMQ** job queues.
- **Media Ingestion & Delivery:** Specialized video infrastructure handles adaptive bitrate vertical video streaming. Object storage retains static assets.

---

## 4. Key Architectural Guarantees

1. **No Circular Module Dependencies:** Enforced via NestJS module encapsulation and architectural linting (`eslint-plugin-import`).
2. **Immutable Published Stories:** Once a `StoryVersion` is set to `PUBLISHED`, its narrative nodes, choices, and video linkages become strictly immutable. Future narrative updates must branch into a new `DRAFT` version.
3. **No Heavy Media in Relational Database:** MySQL stores only URIs, dimensions, durations, and playback tokens. Zero binary media is persisted in tables.
4. **Idempotency Everywhere:** Critical endpoints (payments, subscriptions, creator submissions, choice voting) enforce idempotency keys to eliminate duplicate state mutations under network retries.
5. **Decoupled Analytics:** High-velocity client events (`VIDEO_25_PERCENT`, `SCRUBBED`, etc.) are queued through Redis/BullMQ and do not execute synchronous row inserts in transactional MySQL tables.
