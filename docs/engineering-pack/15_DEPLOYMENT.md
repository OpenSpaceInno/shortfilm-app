# 15. SHORTREEL — DEPLOYMENT

> **Reference:** `docs/architecture/25_DEPLOYMENT_ARCHITECTURE.md`

## Environment Topology

| Env | Purpose | DB | Redis | URL |
| :--- | :--- | :--- | :--- | :--- |
| LOCAL | Developer testing | Docker MySQL 8.4 | Docker Redis 7.2 | localhost:3000 |
| DEV | Feature integration | AWS RDS Dev | ElastiCache Dev | api-dev.shortreel.io |
| STAGING | Pre-prod parity | AWS Aurora Staging | ElastiCache Staging | api-staging.shortreel.io |
| PROD | Live traffic | AWS Aurora Multi-AZ | ElastiCache Multi-AZ | api.shortreel.io |

## Production Topology

`
Consumer → Cloudflare WAF/CDN → AWS ALB → ECS Fargate Tasks (NestJS)
                                                 ├── Aurora MySQL 8.x
                                                 ├── ElastiCache Redis
                                                 ├── Cloudflare Stream (video)
                                                 ├── Cloudflare R2 (assets)
                                                 └── External SaaS (AI, Payments, Email)
`

## Docker (Multi-Stage)

Stage 1: node:20-alpine — install deps, build
Stage 2: node:20-alpine — copy built dist, run as non-root user (nestjs:1001)
EXPOSE 3000, CMD ["node", "dist/main.js"]

## Deployment Process

1. Pre-deploy: run Drizzle migrations as standalone ECS task
2. Rolling deploy: minimumHealthyPercent=100, maximumPercent=200
3. ALB only routes to tasks passing /health/readiness
4. Rollback: deploy previous ECR image tag

## Health Checks

- GET /health/liveness → 200 if process responds (event loop alive)
- GET /health/readiness → 200 if MySQL + Redis reachable; 503 if either is down

## Coolify / Hostinger VPS Deployment

For self-hosted deployment on a Hostinger VPS via Coolify:
- **Reference**: `COOLIFY_HOSTINGER_DEPLOYMENT.md`
- **Deployment Strategy**: Docker Compose (frontend + backend + MySQL + Redis)
- **Auto-SSL**: Traefik Let's Encrypt managed by Coolify
- **Migrations**: Executed automatically on container boot via `backend/docker-entrypoint.sh`
- **Seeding**: Canonical roles, content, and subscription plans seeded via `AUTO_SEED=true`

