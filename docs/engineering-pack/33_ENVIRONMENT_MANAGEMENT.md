# 33. SHORTREEL — ENVIRONMENT MANAGEMENT

## Environment Files

| File | Used In | Git Tracked |
| :--- | :--- | :--- |
| .env | Local dev (from .env.example) | NO (in .gitignore) |
| .env.example | Template with empty values | YES |
| .env.test | Test environment | NO |
| AWS Parameter Store | DEV/STAGING/PROD | N/A |

## Golden Rule

NEVER commit real secrets to Git. Use .env.example with placeholder values.

## Local Development

Docker Compose provides: mysql:8.4, redis:7.2-alpine
Developer copies .env.example to .env and fills in local values.
Command: docker-compose up -d && npm run start:dev

## Environment Promotion

LOCAL → DEV (auto-deploy on merge to develop)
DEV → STAGING (manual promotion via CI workflow)
STAGING → PROD (manual promotion + sign-off required)

## Feature Flags (Phase 2)

v1: Feature flags via environment variables
v2: Firebase Remote Config or LaunchDarkly integration
