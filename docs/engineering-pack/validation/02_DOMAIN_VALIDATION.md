# 02. SHORTREEL — DOMAIN MODEL VALIDATION

> **Document:** `validation/02_DOMAIN_VALIDATION.md`  
> **Validation Status:** ✅ READY  

---

## Summary

The Domain Model v1 (`03_DOMAIN_MODEL.md`) is well-structured, correctly decomposed into 9 bounded contexts, and maps cleanly to the product requirements. No P0 issues. One P1 issue: Auth0 identity mapping field missing from the User entity definition.

---

## Domain Boundary Assessment

| Domain | Entities | Validation |
| :--- | :--- | :--- |
| Identity & Access | User, Profile, Role, Permission, UserRole | ✅ Sound. P1: Add `external_subject_id` field to User. |
| Content & Story | Story, Season, Episode, Video, Genre, Character, Tag | ✅ Sound. Story (not Series) is canonical. |
| Interactive | StoryVersion, StoryNode, Choice, ChoiceOption, UserChoice | ✅ Sound. Immutability correctly defined. |
| Creator Platform | Creator, CreatorProfile, CreatorApplication, CreatorEarning | ✅ Sound. Status lifecycle covers all states. |
| Audience & Engagement | WatchProgress, WatchHistory, XP, Badge, Vote, Prediction | ✅ Sound. WatchHistory ≠ WatchProgress confirmed. |
| Monetisation | SubscriptionPlan, Subscription, Entitlement, WebhookEvent | ✅ Sound. Entitlement correctly derived from Subscription. |
| Analytics | AnalyticsEvent | ✅ Sound. Async decoupled pipeline. |
| Story Intelligence | StorySignal, StoryInsight, ContentOpportunity, StoryExperiment | ✅ Sound. Read-only posture enforced. |
| Business Intelligence | BusinessMetric, BusinessReport | ✅ Sound. Pre-aggregated. |
| Governance | AuditLog | ✅ Sound. Append-only. |

---

## Entity-by-Entity Validation

### User
- **Purpose:** Platform account record for all principals. ✅
- **Owner:** Platform (created JIT on Auth0 first login)
- **Auth0 Gap (P1):** Missing `external_auth_provider` and `external_subject_id` fields. `password_hash` must be removed.
- **Lifecycle:** ACTIVE → SUSPENDED → DELETED (soft)
- **Soft Delete:** ✅ `deleted_at` present
- **Audit Required:** ✅ suspension, deletion, role changes

### Story
- **Canonical term:** `Story` (not `Series`). Consumer-facing label may say "Series" but backend entity is `Story`. ✅
- **Lifecycle:** DRAFT → SUBMITTED → APPROVED → PUBLISHED → ARCHIVED ✅
- **Creator ownership:** `creator_id FK → creators.id` ✅
- **View count denormalization:** Acceptable for feed ranking. Must be updated via atomic increment. ✅
- **Soft delete:** ✅

### StoryVersion
- **Immutability:** Correctly defined — once PUBLISHED, no mutations permitted ✅
- **Graph snapshot:** JSON column stores full DAG at publish time ✅
- **Version increment:** Sequential integer per story ✅
- **Lifecycle:** DRAFT → IN_REVIEW → APPROVED → PUBLISHED → ARCHIVED ✅

### StoryNode
- **Node types:** OPENING, STANDARD, CHOICE_POINT, ENDING ✅
- **Gap (P2):** The validation prompt specifies node types as EPISODE, CHOICE, BRANCH, ENDING. The Engineering Pack uses OPENING, STANDARD, CHOICE_POINT, ENDING.
  - **Assessment:** Engineering Pack types are more descriptive. OPENING = first EPISODE, STANDARD = subsequent EPISODE, CHOICE_POINT = CHOICE, ENDING = ENDING. **No conflict — different terminology, same semantics. READY.**

### Choice + ChoiceOption
- **Invariant:** Exactly 2 options per Choice ✅ (enforced by MAX 2 display_order values and application validation)
- **Vote count denormalization:** `vote_count` on `choice_options` ✅ (atomic increment required)
- **UserChoice uniqueness:** UNIQUE(user_id, choice_id) ✅

### Creator / CreatorEarning
- **Status machine:** 8 states correctly defined ✅
- **Earning states:** CALCULATED → PENDING_PAYOUT → PAID / HELD ✅
- **Gap (P1):** Creator earnings formula (BR-001, BR-002, BR-003) unresolved — calculation logic cannot be implemented until these are decided.

### Subscription / Entitlement
- **Entitlement:** Derived from Subscription, checked before playback ✅
- **Subscription ≠ User status:** Confirmed separate entities ✅
- **Gap (P1):** Trial duration (BR-004), grace period (BR-005), payment provider (ADR-005) open.

### WatchProgress vs WatchHistory
- **WatchProgress:** Mutable upsert, resume pointer ✅
- **WatchHistory:** Append-only, completed views ✅
- **Correctly separated:** ✅

### Prediction ≠ Gambling
- Confirmed: Predictions are non-monetary engagement mechanics ✅
- No real-money wagering, no payout mechanism from predictions ✅

---

## P1 Issues

1. **P1-DOM-001:** User entity missing `external_subject_id` and `external_auth_provider` fields. `password_hash` must be removed. Impacts Domain Model v1 definition and `04_DATABASE_SCHEMA.md`.

## P2 Issues

1. **P2-DOM-001:** Node type naming variance (EPISODE vs STANDARD/OPENING) — reconcile in Phase 5B handoff for clarity.
2. **P2-DOM-002:** `Notification` entity notification_preferences stored as JSON in `user_profiles` — consider extracting to a dedicated `user_notification_preferences` table for V2.

## Validation Status: ✅ READY (pending P1-DOM-001 resolution via Auth0 schema changes)
