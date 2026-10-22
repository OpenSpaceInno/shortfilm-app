# 30. SHORTREEL — ARCHITECTURAL DECISION RECORDS (ADRs)

> **Document ID:** SR-ARCH-30  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## Index of Architectural Decisions

- [ADR-001: Modular Monolith Architecture over Microservices](#adr-001-modular-monolith-architecture-over-microservices)
- [ADR-002: NestJS + TypeScript as Core Backend Platform](#adr-002-nestjs--typescript-as-core-backend-platform)
- [ADR-003: MySQL 8.x as Primary Production Relational Database](#adr-003-mysql-8x-as-primary-production-relational-database)
- [ADR-004: Drizzle ORM as Primary Relational Data Access Layer](#adr-004-drizzle-orm-as-primary-relational-data-access-layer)
- [ADR-005: Redis 7.x and BullMQ for Caching, Distributed Locks, and Asynchronous Jobs](#adr-005-redis-7x-and-bullmq-for-caching-distributed-locks-and-asynchronous-jobs)
- [ADR-006: REST API with OpenAPI / Swagger over GraphQL](#adr-006-rest-api-with-openapi--swagger-over-graphql)
- [ADR-007: Cloudflare Stream as Dedicated Video Infrastructure](#adr-007-cloudflare-stream-as-dedicated-video-infrastructure)
- [ADR-008: Custom NestJS Authentication with RS256 JWT and Redis Refresh Token Rotation](#adr-008-custom-nestjs-authentication-with-rs256-jwt-and-redis-refresh-token-rotation)
- [ADR-009: Decoupled Telemetry Pipeline with Delayed Analytics Warehouse](#adr-009-decoupled-telemetry-pipeline-with-delayed-analytics-warehouse)
- [ADR-010: Immutable Published Story Versions with Snapshotting for Historical Continuity](#adr-010-immutable-published-story-versions-with-snapshotting-for-historical-continuity)
- [ADR-011: Multi-Provider AI Orchestrator Service with Non-Autonomous Human Gateway](#adr-011-multi-provider-ai-orchestrator-service-with-non-autonomous-human-gateway)
- [ADR-012: Containerized Cloud Deployment on AWS ECS Fargate with Cloudflare Edge](#adr-012-containerized-cloud-deployment-on-aws-ecs-fargate-with-cloudflare-edge)

---

### ADR-001: Modular Monolith Architecture over Microservices
- **Context:** ShortReel requires fast development velocity, strong relational integrity between stories, nodes, and choices, and manageable operational overhead at initial launch.
- **Options Considered:** 
  1. Distributed Microservices (Auth Service, Story Service, Video Service, Billing Service).
  2. Unstructured Monolith.
  3. Modular Monolith with strict boundary encapsulation.
- **Decision:** Modular Monolith using NestJS modules.
- **Reasoning:** Microservices introduce distributed transactions, network latency, complex observability, and deployment overhead premature for an initial launch. NestJS modules enforce strict internal boundaries, enabling future service extraction if individual domains require independent horizontal scaling.
- **Consequences:** Shared database in V1 requires disciplined cross-module querying (via exported services, never direct cross-boundary table queries).
- **Revisit Conditions:** Single module CPU/memory bottleneck exceeds horizontal scaling efficiency, or engineering team expands beyond 25 backend developers across distinct domains.

---

### ADR-002: NestJS + TypeScript as Core Backend Platform
- **Context:** The backend must provide strict type safety, dependency injection, enterprise architecture patterns, and seamless team alignment with the React/TypeScript frontend.
- **Options Considered:** 
  1. Express.js / Fastify bare runtime.
  2. NestJS + TypeScript.
  3. Go (Golang) / Java Spring Boot.
- **Decision:** NestJS + TypeScript.
- **Reasoning:** NestJS offers out-of-the-box modular architecture, first-class dependency injection, robust OpenAPI integration, comprehensive testing utilities, and complete end-to-end TypeScript type sharing between frontend and backend.
- **Consequences:** Slight architectural boilerplate compared to bare Express.
- **Revisit Conditions:** Unlikely to be revisited; foundational backend runtime.

---

### ADR-003: MySQL 8.x as Primary Production Relational Database
- **Context:** The system requires ACID transactional guarantees, strong foreign key constraints, high concurrency, and proven operational maturity on managed cloud infrastructure. (Prompt explicitly mandates MySQL 8.x; PostgreSQL is forbidden).
- **Options Considered:** 
  1. MySQL 8.x (InnoDB).
  2. PostgreSQL (Explicitly rejected per project mandate).
  3. MongoDB / DynamoDB (Document NoSQL).
- **Decision:** MySQL 8.x with InnoDB engine and `utf8mb4_0900_ai_ci` collation.
- **Reasoning:** MySQL 8.x provides robust JSON support, CTEs, window functions, proven multi-AZ replication, and strict relational integrity essential for interactive branching DAG structures.
- **Consequences:** Strict foreign keys prevent orphan nodes; JSON virtual columns used for high-flexibility metadata.
- **Revisit Conditions:** Relational core confirmed. No revisit permitted.

---

### ADR-004: Drizzle ORM as Primary Relational Data Access Layer
- **Context:** Data access layer must provide compile-time type safety, lightweight execution overhead, full MySQL 8.x feature access, and predictable SQL migrations.
- **Options Considered:** 
  1. Prisma ORM.
  2. Drizzle ORM.
  3. TypeORM.
- **Decision:** Drizzle ORM (with Prisma as secondary documented fallback).
- **Reasoning:** Drizzle operates as a zero-overhead TypeScript query builder that compiles directly to SQL without a separate Rust query engine binary (eliminating Prisma's cold-start latency and connection management overhead in serverless/containerized environments). It provides transparent SQL migrations and superior relation querying.
- **Consequences:** Requires explicit schema definition in TypeScript; smaller community ecosystem than TypeORM/Prisma but rapidly maturing.
- **Revisit Conditions:** Team productivity metrics show impediments in schema migration workflows during Phase 5 database implementation.

---

### ADR-005: Redis 7.x and BullMQ for Caching, Distributed Locks, and Asynchronous Jobs
- **Context:** High-frequency watch progress updates, vote aggregation, video transcoding callbacks, and rate limiting require low-latency in-memory operations and reliable queue workers.
- **Options Considered:** 
  1. AWS SQS + SNS.
  2. RabbitMQ / Kafka.
  3. Redis 7.x + BullMQ.
- **Decision:** Redis 7.x with BullMQ 5.x.
- **Reasoning:** Consolidating caching, rate limiting, distributed locking (Redlock), and job queues into Redis reduces infrastructure complexity and operational surface area. BullMQ provides robust retries, parent-child job flows, rate-limiting, and dead-letter queue (DLQ) support.
- **Consequences:** Redis memory must be actively monitored with eviction alerts.
- **Revisit Conditions:** Event stream throughput exceeds 50,000 events/second (triggering migration of queues to Kafka or AWS SQS).

---

### ADR-006: REST API with OpenAPI / Swagger over GraphQL
- **Context:** Client interfaces require predictable, high-performance, edge-cacheable API contracts with uniform error structures and strong tooling.
- **Options Considered:** 
  1. REST API with OpenAPI/Swagger.
  2. GraphQL.
  3. gRPC (for client-server).
- **Decision:** REST API (JSON) with OpenAPI v3 specification.
- **Reasoning:** REST integrates seamlessly with CDN edge caching (Cloudflare), standard HTTP status codes, and browser network inspectors. GraphQL introduces significant caching complexity at the CDN edge and risks unconstrained nested queries that degrade MySQL performance.
- **Consequences:** Multiple endpoints required for complex dashboard views; mitigated via composite dashboard DTOs.
- **Revisit Conditions:** If mobile clients require deep dynamic field-level selection across multi-nested relational graphs that causes severe payload bloat.

---

### ADR-007: Cloudflare Stream as Dedicated Video Infrastructure
- **Context:** ShortReel is a vertical, video-first platform. MySQL must never store video binaries. The platform needs high-quality HLS/DASH adaptive bitrate streaming, fast global startup times, and direct creator uploads.
- **Options Considered:** 
  1. Self-hosted AWS S3 + AWS Elemental MediaConvert + CloudFront.
  2. Mux Video.
  3. Cloudflare Stream.
- **Decision:** Cloudflare Stream.
- **Reasoning:** Cloudflare Stream combines global edge transcoding, native 9:16 vertical video support, HLS/DASH manifest generation, integrated CDN distribution, signed playback tokens (RS256), and direct creator TUS protocol uploads at predictable, cost-effective pricing without separate egress fees.
- **Consequences:** Vendor dependency on Cloudflare for video delivery; mitigated by storing master metadata and backup assets in object storage (Cloudflare R2).
- **Revisit Conditions:** Specific enterprise contractual or multi-cloud compliance requirements mandate native AWS Elemental pipeline.

---

### ADR-008: Custom NestJS Authentication with RS256 JWT and Redis Refresh Token Rotation
- **Context:** The platform requires secure consumer, creator, and administrative authentication with granular RBAC, session revocation, and multi-device support.
- **Options Considered:** 
  1. Auth0 / Okta (Enterprise SaaS).
  2. Supabase Auth.
  3. Custom NestJS Auth (Argon2id + RS256 JWT + Redis Refresh Token Rotation).
- **Decision:** Custom NestJS Authentication.
- **Reasoning:** Avoids third-party user tier vendor lock-in and steep per-MAU SaaS billing escalations. Gives ShortReel total control over user data privacy, custom RBAC permissions, and seamless credential integration across consumer, creator, and admin portals.
- **Consequences:** ShortReel engineering maintains security compliance, password hashing, and token rotation logic.
- **Revisit Conditions:** Enterprise B2B single sign-on (SAML / OIDC) requirements become a core product mandate.

---

### ADR-009: Decoupled Telemetry Pipeline with Delayed Analytics Warehouse
- **Context:** Interactive entertainment generates millions of video progress pings, choice impressions, and ratings. Direct MySQL writes for raw analytics would saturate the database and degrade customer playback.
- **Options Considered:** 
  1. Synchronous MySQL writes for all telemetry.
  2. Immediate deployment of ClickHouse / BigQuery OLAP cluster.
  3. Decoupled Redis Stream buffer -> BullMQ Rollup -> MySQL operational metrics -> Future OLAP seam.
- **Decision:** Decoupled Redis Stream buffer with scheduled BullMQ rollups to MySQL `business_metrics`.
- **Reasoning:** Protects the transactional MySQL database while avoiding the operational complexity and financial overhead of running a dedicated OLAP warehouse before product-market scale demands it.
- **Consequences:** Raw analytics retained for 90 days in MySQL/Redis; historical reporting past 90 days relies on aggregated hourly/daily rollups.
- **Revisit Conditions:** Platform reaches > 10,000,000 daily events or data science team requires ad-hoc SQL queries on raw multi-year event streams (triggering ClickHouse/BigQuery introduction).

---

### ADR-010: Immutable Published Story Versions with Snapshotting for Historical Continuity
- **Context:** An interactive story's narrative graph must remain stable once published. If a creator modifies a node or choice, existing viewers traversing that branch must not experience broken links or altered history.
- **Options Considered:** 
  1. Mutable Story Graph (in-place updates).
  2. Immutable Published StoryVersions with JSON snapshotting and draft branches (`vNext`).
- **Decision:** Immutable Published StoryVersions with Draft Forking and DAG Snapshotting.
- **Reasoning:** Guarantees 100% deterministic reproducibility of viewer journeys. Once a version status is `PUBLISHED`, database trigger and service guards forbid any mutation. All changes occur on a cloned `DRAFT` version. Viewer progress references a specific `story_version_id`.
- **Consequences:** Database stores multiple version records; publishing requires atomic version activation.
- **Revisit Conditions:** Architectural invariant. Not subject to revisit.

---

### ADR-011: Multi-Provider AI Orchestrator Service with Non-Autonomous Human Gateway
- **Context:** AI powers character generation, script concepts, and Story Lab insights. The system must prevent vendor lock-in, hallucinations, and unapproved narrative changes.
- **Options Considered:** 
  1. Direct hard-coded OpenAI SDK calls.
  2. Autonomous AI story publishing agent.
  3. Abstracted Multi-Provider AI Orchestrator with strict human editorial approval gateway.
- **Decision:** Multi-Provider AI Orchestrator (Claude 3.5 Sonnet default, GPT-4o fallback) with strict human approval gateway.
- **Reasoning:** AI is an assistive creative tool, not an author. Enforcing a strict human-in-the-loop review barrier prevents unvetted content, legal liabilities, or narrative incoherence from reaching consumers.
- **Consequences:** Requires Zod structured output schema validation and background queue management.
- **Revisit Conditions:** Architectural invariant regarding human approval. Provider adapters can be expanded at any time.

---

### ADR-012: Containerized Cloud Deployment on AWS ECS Fargate with Cloudflare Edge
- **Context:** Deployment infrastructure must deliver high availability, automated rolling updates, multi-AZ database clustering, and DDoS protection with minimal infrastructure management overhead.
- **Options Considered:** 
  1. Self-managed Kubernetes (EKS / Bare metal).
  2. Serverless Lambdas for entire backend.
  3. Containerized AWS ECS Fargate + RDS Aurora MySQL + Cloudflare CDN/WAF.
- **Decision:** AWS ECS Fargate with Aurora MySQL Multi-AZ and Cloudflare Edge.
- **Reasoning:** Avoids Kubernetes operational complexity (no control plane patching, complex ingress controllers) while avoiding serverless cold-start latency on database connection pools. Provides reliable autoscaling and zero-downtime rolling deployments.
- **Consequences:** Cloud provider hosting costs on AWS; mitigated by serverless Fargate container pricing.
- **Revisit Conditions:** Infrastructure spend exceeds $20,000/month where self-hosted Kubernetes or bare metal provides superior economics.
