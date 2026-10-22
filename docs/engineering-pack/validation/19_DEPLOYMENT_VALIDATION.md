# 19. SHORTREEL — DEPLOYMENT VALIDATION

> **Validation Status:** ⚠️ READY WITH CONDITIONS

## Environment Validation

| Environment | DB | Redis | Auth0 | Status |
| :--- | :--- | :--- | :--- | :--- |
| LOCAL | MySQL via Docker Compose | Redis via Docker | Auth0 dev tenant | ✅ Pattern defined |
| DEVELOPMENT | RDS MySQL dev | ElastiCache dev | Auth0 dev tenant | ✅ |
| STAGING | RDS MySQL staging | ElastiCache staging | Auth0 staging tenant | ⚠️ ADR-006 open |
| PRODUCTION | RDS Aurora MySQL | ElastiCache prod | Auth0 prod tenant | ⚠️ ADR-006 open |

## Deployment Architecture Validated

AWS ECS Fargate + Cloudflare (CDN + DNS) ✅
Docker image build + ECR push ✅
Drizzle migrations via ECS task before deploy ✅
Rolling deploy (no downtime) ✅
Readiness probe: GET /health/readiness ✅
Liveness probe: GET /health/liveness ✅

## P1 Issues

**P1-DEP-001:** Auth0 tenant strategy (ADR-006) must be resolved before staging and production environments can be configured.

**P1-DEP-002:** Auth0 callback URLs, logout URLs, and allowed origins must be configured per environment in Auth0 dashboard. This is a manual step that must be documented in the deployment runbook.

## Rollback Strategy

DB migrations: Drizzle supports migration rollback via down migrations. All migrations must have a down() function. ✅
App rollback: ECS service update with previous image tag. ✅
Auth0 rollback: N/A — Auth0 changes are managed in Auth0 dashboard (not code deploys). Requires Auth0 change documentation.

## P3 Issue

**P3-DEP-001:** Multi-region deployment not in V1 scope. Design for single-region with RDS read replica.

## Validation Status: ⚠️ READY WITH CONDITIONS
