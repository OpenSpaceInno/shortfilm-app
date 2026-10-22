# 25. SHORTREEL — DEPLOYMENT & CLOUD ARCHITECTURE

> **Document ID:** SR-ARCH-25  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Cloud Provider Evaluation & Production Recommendation

To avoid cloud vendor lock-in while maintaining high availability, low latency, and cost-efficiency:

### Cloud Infrastructure Options Evaluated

| Evaluation Criteria | Option A: AWS (Amazon Web Services) | Option B: Microsoft Azure | Option C: Modern Managed Cloud (GCP / Render / Fly.io) |
| :--- | :--- | :--- | :--- |
| **Container Orchestration** | AWS ECS (Fargate) — mature, serverless containers, excellent VPC integration. | Azure Container Apps / AKS — enterprise-ready, higher complexity. | Cloud Run / Fly.io — fast developer deployment, potential VPC networking hurdles with managed DBs. |
| **Managed Relational DB** | AWS Aurora MySQL 8.x / RDS MySQL — multi-AZ failover, read replicas, automated PITR. | Azure Database for MySQL Flexible Server — reliable, good SLA. | Cloud SQL for MySQL — robust, slightly higher egress fees. |
| **Managed In-Memory Cache**| AWS ElastiCache for Redis (Cluster mode) — managed backups, zero-downtime scaling. | Azure Cache for Redis — solid performance. | GCP Memorystore / Redis Cloud — capable. |
| **Object Storage & Egress**| S3 + CloudFront (or Cloudflare R2 for zero egress fee). | Azure Blob Storage. | Google Cloud Storage. |

### Architectural Recommendation
- **Primary Cloud Infrastructure: AWS (ECS Fargate + RDS Aurora MySQL 8.x + ElastiCache Redis)**.
  - Reason: Industry-standard reliability, seamless autoscaling with serverless containers (no EC2 OS patching), point-in-time recovery, and multi-AZ database clustering.
- **Edge Layer: Cloudflare (WAF, CDN, DNS, Stream, and R2 Object Storage)**.
  - Reason: Cloudflare handles DDoS, global CDN caching for API and static assets, video transcoding via Cloudflare Stream, and zero-egress asset storage via Cloudflare R2.
- **Portability Guardrail**: The entire NestJS application is packaged into standard OCI Docker containers, allowing deployment to Azure, GCP, or bare-metal Kubernetes with zero application code changes.

---

## 2. Target Production Topology

```text
                               ┌───────────────────────────┐
                               │     INTERNET CLIENTS      │
                               │ (Mobile PWA, Web, Studio) │
                               └─────────────┬─────────────┘
                                             │ HTTPS / TLS 1.3
                                             ▼
                               ┌───────────────────────────┐
                               │  CLOUDFLARE EDGE NETWORK  │
                               │  - WAF & DDoS Shield      │
                               │  - Global CDN Caching     │
                               │  - DNS / SSL Termination  │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │  AWS APPLICATION LOAD     │
                               │  BALANCER (ALB)           │
                               └─────────────┬─────────────┘
                                             │
                ┌────────────────────────────┴────────────────────────────┐
                ▼                                                         ▼
   ┌──────────────────────────┐                              ┌──────────────────────────┐
   │ AWS ECS Fargate Task 1   │                              │ AWS ECS Fargate Task 2   │
   │ (NestJS API Instance)    │                              │ (NestJS API Instance)    │
   └────────────┬─────────────┘                              └────────────┬─────────────┘
                │                                                         │
                └────────────────────────────┬────────────────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
    ┌───────────────────────┐   ┌────────────────────────┐    ┌─────────────────────────┐
    │ Amazon Aurora MySQL   │   │ Amazon ElastiCache     │    │ BullMQ Dedicated Worker │
    │ 8.x (Multi-AZ Primary │   │ for Redis (7.x Cluster)│    │ ECS Tasks (Background   │
    │ + Read Replica)       │   │                        │    │ Jobs & Transcoding sync)│
    └───────────────────────┘   └────────────────────────┘    └─────────────────────────┘
               │                                                           │
               ▼                                                           ▼
    ┌───────────────────────┐                                 ┌─────────────────────────┐
    │ Cloudflare R2 Bucket  │                                 │ External SaaS Services  │
    │ (Posters, Thumbnails, │                                 │ - Cloudflare Stream     │
    │  Creator Assets)      │                                 │ - Anthropic / OpenAI    │
    └───────────────────────┘                                 │ - Razorpay / Stripe     │
                                                              │ - SendGrid / FCM        │
                                                              └─────────────────────────┘
```

---

## 3. Environment Segregation Matrix

Strict physical separation guarantees that development and testing activities never touch production customer data:

| Environment | Purpose | Database Host | Redis Host | Domain & URL | Secrets Provider |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Local** | Local developer testing | Local Docker (`mysql:8.4`, `redis:7.2`) | Localhost (`6379`) | `http://localhost:3000` | `.env.local` (Git ignored) |
| **Development** | Feature branch integration | AWS RDS Dev Instance (db.t4g.small) | Dev Redis (cache.t4g.micro) | `https://api-dev.shortreel.io` | AWS Secrets Manager (`/dev/*`) |
| **Staging** | Pre-production parity testing | AWS Aurora Staging (db.t4g.medium) | Staging Redis Cluster | `https://api-staging.shortreel.io` | AWS Secrets Manager (`/staging/*`) |
| **Production** | Live consumer traffic | AWS Aurora Multi-AZ (db.r6g.large) | Production Redis Multi-AZ | `https://api.shortreel.io` | AWS Secrets Manager (`/prod/*`) |

---

## 4. Multi-Stage Dockerfile Specification

```dockerfile
# ----------------------------------------------------
# Stage 1: Build & Dependencies
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .

# Build production bundle
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ----------------------------------------------------
# Stage 2: Minimal Production Image
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Run as non-privileged user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

USER nestjs

EXPOSE 3000

ENV PORT=3000 \
    NODE_ENV=production

CMD ["node", "dist/main.js"]
```

---

## 5. Continuous Deployment & Zero-Downtime Rollout

- **Rolling Deployment**: AWS ECS replaces tasks incrementally (`minimumHealthyPercent: 100`, `maximumPercent: 200`). ALB automatically redirects traffic to healthy new instances only after passing `/health/readiness`.
- **Database Migration Safety**: Migrations run as a standalone pre-deploy ECS task before container traffic cutover. Backward-incompatible column drops must follow a two-step release cycle.
