# 18. SHORTREEL — TESTING VALIDATION

> **Validation Status:** ⚠️ READY WITH CONDITIONS

## Test Strategy Coverage

| Layer | Tool | Coverage | Status |
| :--- | :--- | :--- | :--- |
| Unit | Jest | Service methods with business logic (>= 80%) | ✅ |
| Integration | Jest + Testcontainers (MySQL, Redis) | All repository methods | ✅ |
| API | Supertest + Jest | All endpoints (success + auth + validation errors) | ✅ |
| RBAC | Custom RBAC test suite | All 8 roles × 18 permissions | ✅ |
| Interactive Engine | Jest (ENG-001..ENG-010) | 10 invariant tests | ✅ |
| Queue | Jest + BullMQ mock | All workers (retry, DLQ) | ✅ |
| E2E | Jest + Auth0 test credentials | Full consumer flow + admin flow | ⚠️ P1 below |
| Security | OWASP ZAP (pipeline) | Auth bypass, SQLi, XSS | ✅ |
| Performance | k6 | API latency under simulated load | ✅ |

## P1 Issue

**P1-TEST-001:** E2E test strategy for Auth0 not defined. Auth0 test credentials (test tenant, test users) must be configured for CI/CD. Options:
A) Auth0 test tenant with fixed test users + passwords
B) Auth0 Management API to create test users in CI, delete after test
C) Mock Auth0 (not recommended — doesn't test real flow)

Recommended: Option A (fixed test tenant with test users). Document credentials in CI secrets.

## Critical E2E Flow (must pass before production)

`
Auth0 Login (test user credentials)
  ↓ Bearer token
NestJS JWT Validation
  ↓ sub claim
ShortReel User Resolution (JIT or existing)
  ↓ roles loaded
Admin Authorization (CONTENT_ADMIN token)
  ↓
Create Story → Create Nodes → Publish
  ↓
Consumer Authentication (USER token)
  ↓
Watch → Choice (POST /interactive/choices)
  ↓
Verify UserChoice in DB
  ↓
Verify next episode returned
  ↓
Watch Progress updated
  ↓
Analytics event fired
`

## Validation Status: ⚠️ READY WITH CONDITIONS
