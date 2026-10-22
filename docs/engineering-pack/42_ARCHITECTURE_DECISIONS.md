# 42. SHORTREEL — ARCHITECTURE DECISIONS (ADR REGISTER)

## ADR-001: MySQL 8.x over PostgreSQL

**Status:** ACCEPTED  
**Date:** September 2026  
**Decision:** Use MySQL 8.x (InnoDB) as the primary relational database.  
**Rationale:** Team familiarity, managed AWS Aurora MySQL Serverless v2 cost efficiency at ShortReel's initial scale, Drizzle ORM excellent MySQL support.  
**Consequence:** No JSONB operators, no native UUID columns (use BINARY(16) + ULID).

---

## ADR-002: Modular Monolith over Microservices

**Status:** ACCEPTED  
**Date:** September 2026  
**Decision:** Single NestJS deployable with logical module boundaries.  
**Rationale:** Team size, initial scale, lower operational overhead. Module isolation maintained so extraction is possible.  
**Consequence:** Must not cross module boundaries via database queries (inter-module service calls only).

---

## ADR-003: Cloudflare Stream for Video

**Status:** ACCEPTED  
**Date:** September 2026  
**Decision:** Cloudflare Stream for video transcoding, storage, and CDN delivery.  
**Rationale:** Integrated TUS upload, automatic 9:16 optimization, global CDN, signed URL playback, competitive pricing.  
**Consequence:** Vendor lock-in mitigated by VideoProvider abstraction interface.

---

## ADR-004: ULID over UUID

**Status:** ACCEPTED  
**Date:** September 2026  
**Decision:** Use ULID (stored as BINARY(16), exposed as Base32 string) for all entity IDs.  
**Rationale:** Monotonic sortability (better InnoDB B-tree insert locality), URL-safe, globally unique.  
**Consequence:** Application generates IDs (not MySQL AUTO_INCREMENT). Requires ULID library.

---

## ADR-005: Drizzle ORM over Prisma

**Status:** ACCEPTED (with Prisma as documented fallback)  
**Date:** September 2026  
**Decision:** Use Drizzle ORM as primary ORM.  
**Rationale:** Type-safe SQL-like API, excellent MySQL 8.x support, lighter than Prisma for queries.  
**Consequence:** Drizzle migration tooling differs from Prisma — must follow 34_MIGRATION_STRATEGY.md.

---

## ADR-006: BullMQ + Redis over Kafka/RabbitMQ

**Status:** ACCEPTED  
**Date:** September 2026  
**Decision:** BullMQ backed by Redis for all async queues.  
**Rationale:** No separate broker infrastructure at V1 scale. Redis already required for caching. BullMQ provides reliable retries, DLQ, observability dashboard.  
**Consequence:** Not suitable for very high-throughput event streaming; migrate analytics to Redis Streams / Kafka when > 1M events/day.

---

## ADR-007: Argon2id for Password Hashing

**Status:** ACCEPTED  
**Date:** September 2026  
**Decision:** Use Argon2id (m=65536, t=3, p=4) over bcrypt or PBKDF2.  
**Rationale:** OWASP recommended, memory-hard (resistant to GPU attacks), configurable.  
**Consequence:** Login latency ~300-500ms acceptable for security boundary.

---

## Future ADRs (to be decided)

- ADR-008: Meilisearch adoption trigger criteria
- ADR-009: ClickHouse/BigQuery analytics migration trigger
- ADR-010: WebSocket vs polling for real-time notifications
