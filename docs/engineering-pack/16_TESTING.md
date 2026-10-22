# 16. SHORTREEL — TESTING

> **Reference:** `docs/architecture/26_TESTING_ARCHITECTURE.md`

## Test Pyramid

Unit (85%+ domain logic) → Integration (75%+ data layer) → API (100% critical endpoints) → E2E (core journeys)

## Tooling

- **Unit/Integration:** Jest + ts-jest
- **Database Integration:** Testcontainers (mysql:8.4 container) — NOT SQLite
- **API Tests:** Supertest with NestJS TestingModule
- **E2E:** Playwright (future) or Supertest full-stack

## Story Engine Invariant Tests (see 07_INTERACTIVE_STORY_ENGINE.md ENG-001..ENG-010)

All 10 engine invariant tests must pass before InteractiveEngineModule is COMPLETE.

## Test Data

Use 'The Missing Phone' story fixture (see 38_TEST_DATA.md):
- Linear graph: EP1 → EP2 → EP3 → CHOICE → (EP4A → EP5A → ENDING_A) | (EP4B → EP5B → ENDING_B)

## Security Tests

- RBAC: verify each role can only access its permitted endpoints
- Ownership: verify users cannot modify other users' data
- Token abuse: replayed refresh token triggers full session revocation

## CI Requirement

Tests must pass in CI before any merge to develop/main.
