# 26. SHORTREEL — TESTING ARCHITECTURE & QUALITY ASSURANCE

> **Document ID:** SR-ARCH-26  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Testing Pyramid & Quality Philosophy

The ShortReel test strategy emphasizes confidence, fast feedback loops, and exhaustive verification of high-risk narrative branching and monetization state machines.

```text
                           ┌───────────────────────────┐
                           │      E2E User Journeys    │  (Playwright / Supertest)
                           │  Consumer, Creator, Admin │
                           └─────────────┬─────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │      Integration & API Tests  │  (Jest + Testcontainers MySQL/Redis)
                         │   REST Contracts, DB, Queues  │
                         └───────────────┬───────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │       Interactive Story Engine Suite          │  (Graph traversal, DAG invariants,
                 │         & Unit Domain Services                │   concurrency, race conditions)
                 └───────────────────────────────────────────────┘
```

---

## 2. Test Pyramid Levels & Coverage Requirements

| Test Level | Scope & Target | Tooling | Isolation & Environment | Target Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **Unit Tests** | Domain models, pricing calculations, graph traversal algorithms, DTO validation. | Jest / Vitest | 100% In-memory, mocked external dependencies. | >= 85% Domain logic |
| **Integration Tests** | Drizzle ORM repositories, MySQL transactions, Redis caching, BullMQ job handlers. | Jest + Testcontainers | Ephemeral Docker containers (`testcontainers/mysql:8.4` & `redis:7.2`). | >= 75% Data layer |
| **API Contract Tests** | Controller validation, status codes, error envelopes, headers, pagination. | Supertest | NestJS TestingModule with test database. | 100% Critical endpoints |
| **E2E Journeys** | Multi-step user journeys (Watch-to-Choice, Creator AI Studio to Publish, Admin Payout). | Playwright / Supertest | Fully wired Staging or Docker Compose suite. | Core user scenarios |

---

## 3. Interactive Story Engine Test Suite (Mission-Critical)

Because interactive narrative branching is ShortReel's primary market differentiator, the story engine undergoes rigorous automated regression testing:

### 3.1 Test Scenarios & Invariant Assertions

| Test ID | Test Scenario | Expected Behavioral Invariant |
| :--- | :--- | :--- |
| **ENG-001** | Valid Branch Traversal | Choice selection records `UserChoice`, increments analytics counter, and resolves exact destination `StoryNode` with valid video playback token. |
| **ENG-002** | Invalid / Non-Existent Destination | System detects missing destination node, logs error, and returns structured `DESTINATION_NODE_INVALID` with safe default fallback node. |
| **ENG-003** | Unpublished / Draft Version Isolation | Consumer requests node in a `DRAFT` or `IN_REVIEW` version -> API returns `403 Forbidden` (`STORY_VERSION_NOT_PUBLISHED`). |
| **ENG-004** | Archived Version Viewing | Consumer requests node in an `ARCHIVED` version with valid historical session -> Engine allows read-only playback but forbids new choice persistence. |
| **ENG-005** | Choice Voting Window Closed | Vote submitted after `voting_ends_at` -> API returns `CHOICE_VOTING_WINDOW_CLOSED` and falls back to majority aggregated path. |
| **ENG-006** | Double Choice Submission (Idempotency) | Viewer double-taps or sends concurrent POST requests for same choice -> Second request returns `200 OK` with existing choice and does NOT duplicate XP or votes. |
| **ENG-007** | Story Graph Cycle & DAG Validation | Publishing an authoring graph with unresolvable cycles or dead ends without an `ENDING` node flag fails with `STORY_GRAPH_CYCLE_DETECTED`. |

---

## 4. End-to-End (E2E) Journey Specifications

### 4.1 Consumer Journey: Discovery to Interactive Branching
```text
1. POST /api/v1/auth/login (Valid credentials) ──> Extract JWT access token
2. GET /api/v1/stories/featured ──> Select top interactive story
3. GET /api/v1/stories/{id}/watch ──> Resolve published StoryVersion + Root StoryNode
4. POST /api/v1/engagement/progress ──> Update playback to 85% (Choice threshold)
5. POST /api/v1/interactive/choices ──> Submit Option B
6. Verify: UserChoice created in DB, 50 XP awarded, Destination StoryNode video returned
7. POST /api/v1/engagement/progress ──> Complete destination node
```

### 4.2 Creator Journey: AI Ideation to Submission
```text
1. POST /api/v1/auth/login (Creator credentials)
2. POST /api/v1/stories ──> Create new Story draft
3. POST /api/v1/ai-studio/concept-expand ──> Generate 5-episode interactive premise beats
4. POST /api/v1/stories/{id}/versions/{v}/nodes ──> Create root node & choice options
5. POST /api/v1/creators/submissions ──> Submit draft for editorial review
6. Verify: StoryVersion status is IN_REVIEW, audit_log record created, notification sent to editor
```

### 4.3 Admin / Editorial Journey: Review, Approval & Publish
```text
1. POST /api/v1/auth/login (CONTENT_ADMIN credentials)
2. GET /api/v1/admin/submissions?status=IN_REVIEW ──> Inspect submitted story version graph
3. POST /api/v1/admin/submissions/{id}/approve ──> Approve story version
4. POST /api/v1/stories/{id}/publish ──> Atomic version lock, publish timestamp recorded
5. Verify: Story visible on consumer feed, previous published version archived, cache purged
```
