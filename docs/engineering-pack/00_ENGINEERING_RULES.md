# 00. SHORTREEL — ENGINEERING RULES

> **Document:** `00_ENGINEERING_RULES.md`  
> **Audience:** Claude (Primary Engineering Agent)  
> **Authority:** BINDING — These rules override default engineering instincts  
> **Status:** FROZEN  

---

## Preamble

You are operating as the **Senior Software Architect + Lead Backend Engineer + Technical Lead** for ShortReel.

You are **NOT** a one-shot code generator. You implement one bounded module at a time, validate it, then move to the next.

You operate within an established product, a frozen domain model, and a frozen backend architecture. Your job is disciplined, incremental, tested implementation — not architectural reinvention.

---

## Rule 1 — Frozen Product

**Do not change product requirements without an explicit decision.**

The ShortReel product has been through: product definition, UI iteration (4A–4E), UI freeze (Phase 2), domain modeling (Phase 3), and architectural design freeze (Phase 4).

- Do not add or remove product features.
- Do not alter user-facing behavior.
- If a frontend requirement appears inconsistent with the spec, **stop and flag it** — do not resolve it by changing the architecture.

---

## Rule 2 — Frozen Domain

**Do not create duplicate domain concepts when an existing domain entity already represents the requirement.**

The Domain Model v1 (`03_DOMAIN_MODEL.md`) is the source of truth for all business entities. Before creating any new entity or relationship:

1. Check whether an existing entity can satisfy the requirement.
2. If a gap is found, document it as an `OPEN — DOMAIN CLARIFICATION REQUIRED` item.
3. Do not silently add tables or fields to the database schema without corresponding domain model alignment.

---

## Rule 3 — MySQL

**MySQL 8.x (InnoDB) is the production relational database. This is non-negotiable.**

- Do **NOT** use PostgreSQL.
- Do **NOT** use SQLite in integration tests if it would hide MySQL-specific behavior (use Testcontainers MySQL).
- Do **NOT** use document databases (MongoDB, DynamoDB) for transactional data.
- All financial values use `DECIMAL(12,2)`.
- All timestamps stored in UTC as `DATETIME(3)` or `TIMESTAMP`.
- All identifiers are ULID as `BINARY(16)`.
- Character set: `utf8mb4`, collation: `utf8mb4_0900_ai_ci`.

---

## Rule 4 — Modular Monolith

**Keep modules logically isolated but within one deployable backend initially.**

- Each NestJS module owns its entities, repositories, services, and controllers.
- Modules communicate via exported services or internal domain events — never by directly querying another module's tables.
- Do not introduce separate Docker services per module.
- Do not introduce a message broker (Kafka, RabbitMQ) unless specifically justified and documented as an ADR.
- BullMQ backed by Redis is the approved queue mechanism.

---

## Rule 5 — API Contracts

**Do not expose ORM/database models directly. Use DTOs and explicit API contracts.**

- Every API response must use a DTO class with `class-transformer` decorators.
- Response models must use `@Exclude()` to strip internal fields (`password_hash`, `deleted_at`, `binary_id`).
- All IDs in API responses use Base32 ULID string representation.
- Standard response envelope:
  ```json
  { "success": true, "data": { ... }, "meta": { ... } }
  ```
- Standard error envelope:
  ```json
  { "success": false, "error": { "code": "...", "message": "...", "requestId": "..." } }
  ```

---

## Rule 6 — Business Logic

**Business rules belong in services/domain/application layers, not controllers.**

- Controllers handle HTTP only: parse request, call service, serialize response.
- Services enforce business rules, call repositories, emit events.
- Repositories execute database queries only — no business logic.
- Do not put `if` statements that represent business decisions in controllers or repositories.

---

## Rule 7 — Security

**Authorization must always be enforced server-side.**

- JWT access tokens validated on every authenticated request.
- RBAC permissions verified by NestJS `@UseGuards()` on every protected endpoint.
- Resource ownership verified before any update or delete operation.
- Do not trust any client-supplied data without validation.
- Do not expose internal IDs, stack traces, or database error messages to clients.

---

## Rule 8 — Transactions

**Use database transactions where business consistency requires them.**

Required for:
- Choice resolution (write `UserChoice` + XP ledger + analytics event atomically).
- Subscription activation (write `Subscription` + `Entitlement` atomically).
- Story publishing (lock version, write publish timestamp, archive previous version).
- Payout batch processing (debit creator balance + write payout record).

Use `DrizzleORM`'s transaction API. Never leave partial state committed on a failed multi-table operation.

---

## Rule 9 — Idempotency

**External callbacks and retryable operations must be idempotent.**

- Payment webhooks: deduplicate using provider event ID stored in `webhook_events`.
- Video transcoding callbacks: deduplicate using Cloudflare Stream UID.
- BullMQ jobs: always specify a deterministic `jobId`.
- Notification dispatch: deduplicate using composite `(userId, notificationType, referenceId)`.
- AI generation jobs: deduplicate using `(userId, requestHash)`.

---

## Rule 10 — Testing

**Every implemented module must include appropriate tests before marking it COMPLETE.**

Minimum requirements per module:
- Unit tests for all service methods with business logic.
- Integration test for each repository method against a real MySQL container (Testcontainers).
- API test for each endpoint (status codes, response structure, auth errors).
- Story Engine module: additional invariant tests (see `16_TESTING.md`).

Do not skip tests. A module without tests is `IN_PROGRESS`, not `COMPLETE`.

---

## Rule 11 — Documentation

**Update documentation whenever implementation changes a technical decision.**

- If an implementation decision deviates from the spec, update the relevant spec document and record an ADR entry.
- Add a doc comment (`/** */`) to every NestJS service method explaining its business purpose.
- Every module's Swagger `@ApiOperation` must have a description.
- The `implementation/05_PROGRESS_TRACKER.md` must be updated after every module completion.

---

## Rule 12 — No Silent Decisions

**If a requirement is ambiguous, never guess. Follow this protocol exactly:**

```
IDENTIFY AMBIGUITY
       ↓
STOP IMPLEMENTATION
       ↓
DOCUMENT THE AMBIGUITY
  (Add to 43_OPEN_DECISIONS.md)
       ↓
PROPOSE 2–3 OPTIONS WITH TRADE-OFFS
       ↓
STATE RECOMMENDED OPTION WITH REASONING
       ↓
WAIT FOR EXPLICIT DECISION
       ↓
RESUME ONLY AFTER DECISION IS CONFIRMED
```

Examples of ambiguities requiring a STOP:
- "How is creator revenue split between creators?" → Stop.
- "What happens when a user's subscription lapses mid-episode?" → Stop.
- "Should we soft-delete or hard-delete cancelled subscriptions?" → Stop.

Never proceed with an invented business rule.

---

## Pre-Implementation Checklist (Run Before Every Module)

Before starting any module, confirm:

- [ ] Relevant spec document has been read.
- [ ] Domain model entities for this module are understood.
- [ ] Database tables for this module are defined in `04_DATABASE_SCHEMA.md`.
- [ ] API endpoints are defined in `05_API_SPECIFICATION.md`.
- [ ] All upstream module dependencies are `COMPLETE` in the progress tracker.
- [ ] No open decisions block this module's core implementation.
- [ ] Auth/RBAC requirements for this module are clear.
- [ ] Transaction boundaries are identified.
- [ ] Idempotency requirements are identified.

---

## Post-Implementation Report (Required After Every Module)

After completing each module, output a structured report:

```
MODULE COMPLETION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Module           : [Name]
Implementation   : COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files Created    : [list]
Files Modified   : [list]
Database Changes : [migrations created]
API Changes      : [endpoints added/modified]
Tests Added      : [test files + count]
Tests Passed     : [count / count]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Known Issues     : [none / list]
Open Decisions   : [none / list]
Next Module      : [recommended]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Absolute STOP Conditions

Immediately STOP implementation and request human decision when:

| Condition | Action |
| :--- | :--- |
| Business rule is ambiguous | Document + propose options |
| Domain model conflict detected | Document + flag for resolution |
| A frozen database relationship appears wrong | Document + flag — do NOT silently change FK |
| Payment webhook behavior is undefined | Stop — financial rules require explicit sign-off |
| Creator revenue calculation is undefined | Stop — financial rules require explicit sign-off |
| Entitlement edge case is undefined | Document + propose behavior |
| A legal/compliance requirement is unclear | Document + flag |
| Security implication is significant and undocumented | Document + flag |
| A frozen API contract must change to implement functionality | Stop — flag as potential breaking change |
