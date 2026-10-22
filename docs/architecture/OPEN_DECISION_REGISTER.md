# SHORTREEL — OPEN DECISION REGISTER

> **Document ID:** SR-ARCH-ODR  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** ACTIVE REGISTER (Tracking Technical, Business, and Legal Items)  

---

## 1. Overview & Governance

This register tracks all architectural, business, financial, and legal decisions that require executive sign-off, stakeholder consensus, or regulatory review before or during implementation.

No unresolved technical or financial assumptions may be made silently in code. Every item in this register defines the decision scope, business impact, evaluated alternatives, recommended direction, designated executive owner, and current status.

---

## 2. Master Decision Register

| ID | Decision Title | Why It Matters | Options Evaluated | Recommended Direction | Designated Owner | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ODR-001** | **ORM Framework** | Dictates developer velocity, database performance, migration safety, and compile-time type safety. | **A:** Drizzle ORM<br>**B:** Prisma ORM<br>**C:** TypeORM | **Option A (Drizzle ORM)** with Prisma as documented fallback. Zero execution overhead, native SQL alignment. | Lead Backend Architect | **RATIFIED (TECHNICAL)** |
| **ODR-002** | **Authentication Strategy** | Controls security posture, user onboarding friction, session revocation, and ongoing SaaS operational costs. | **A:** Custom NestJS Auth (Argon2id + RS256 JWT)<br>**B:** Auth0 / Okta<br>**C:** Supabase Auth | **Option A (Custom NestJS Auth)** with Redis refresh token rotation. Eliminates steep per-MAU vendor licensing. | Lead Security Architect | **RATIFIED (TECHNICAL)** |
| **ODR-003** | **Video Infrastructure Platform** | Video delivery is ShortReel's primary operational workload and cost driver. | **A:** Cloudflare Stream<br>**B:** Mux Video<br>**C:** AWS Elemental MediaConvert + CloudFront | **Option A (Cloudflare Stream)**. Native 9:16 vertical encoding, integrated global CDN, predictable pricing. | VP of Engineering | **RATIFIED (TECHNICAL)** |
| **ODR-004** | **Cloud Hosting Provider** | Determines operational resilience, deployment automation, and infrastructure expenditure. | **A:** AWS (ECS Fargate + Aurora MySQL)<br>**B:** Microsoft Azure<br>**C:** Managed Cloud (Render / Fly.io) | **Option A (AWS)**. Standard enterprise reliability, multi-AZ clustering, automated PITR. | Head of DevOps | **RATIFIED (TECHNICAL)** |
| **ODR-005** | **Payment Gateway Integration** | Core monetization revenue capture and creator payout execution. | **A:** Razorpay (India-first)<br>**B:** Stripe (Global)<br>**C:** Multi-Gateway Abstraction | **Option C (Multi-Gateway Abstraction)** via `PaymentGatewayService` interface supporting both Razorpay and Stripe. | VP of Product & Finance | **RATIFIED (TECHNICAL)** |
| **ODR-006** | **Search Engine Technology** | Powers search across stories, creators, and characters. | **A:** MySQL 8.x InnoDB Full-Text Search (FTS)<br>**B:** Meilisearch<br>**C:** OpenSearch / Elastic | **Option A (MySQL FTS)** for V1, swapping to Meilisearch when catalogue exceeds 50,000 records. | Lead Backend Architect | **RATIFIED (TECHNICAL)** |
| **ODR-007** | **Analytics Warehouse Timing** | High-volume viewer interaction data processing vs premature infrastructure cost. | **A:** Immediate ClickHouse / BigQuery cluster<br>**B:** Redis Stream buffer + MySQL rollups | **Option B (Decoupled Redis Stream + MySQL rollups)**. Defer dedicated OLAP until > 10M daily events. | Data Engineering Lead | **RATIFIED (TECHNICAL)** |
| **ODR-008** | **Entity Identifier Strategy** | Impacts B-Tree index fragmentation, query performance, and URL aesthetics. | **A:** Auto-increment BIGINT<br>**B:** Random UUIDv4 (`CHAR(36)`)<br>**C:** ULID / UUIDv7 (`BINARY(16)`) | **Option C (ULID / UUIDv7 as `BINARY(16)`)**. Time-ordered, compact, prevents enumeration attacks. | Lead Database Architect | **RATIFIED (TECHNICAL)** |
| **ODR-009** | **Creator Revenue Attribution Model** | Determines how subscription pool revenue is mathematically divided among creators. | **A:** Watch-time minutes proportional share<br>**B:** Completed episodes count<br>**C:** Fixed licensing fee per season | Base schema records `gross_amount` computed by modular worker. Requires business sign-off. | Chief Content Officer & CFO | **OPEN — BUSINESS RULE REQUIRED** |
| **ODR-010** | **Platform Fee & Rev-Share Percentage** | Contractual revenue split between ShortReel and Creators. | **A:** 70% Creator / 30% Platform<br>**B:** 60% Creator / 40% Platform<br>**C:** Tier-based sliding scale | Standard baseline of 70% Creator / 30% Platform recommended, parameterized in config. | Chief Executive Officer | **OPEN — BUSINESS RULE REQUIRED** |
| **ODR-011** | **Tax Withholding (TDS/GST/VAT)** | Legal taxation deductions at source based on creator residency and jurisdiction. | **A:** Automated domestic withholding<br>**B:** 1099/W-8BEN compliance via third-party tax SaaS (Stripe Tax / Avalara) | Stored in `tax_withheld` column; calculations deferred to finance worker. | Head of Legal & Finance | **OPEN — BUSINESS RULE REQUIRED** |
| **ODR-012** | **Subscription Grace Period & Retry Rules** | Policy for customer access during payment failure and dunning cadence. | **A:** Immediate cutoff<br>**B:** 3-day grace period with daily retry<br>**C:** 7-day grace period with 4 retries | **Option B (3-day grace period)** with exponential webhook retries recommended. | VP of Product | **OPEN — BUSINESS RULE REQUIRED** |
| **ODR-013** | **Watch History & Analytics Retention** | How long granular viewer watch records and audit logs are retained before purging. | **A:** Indefinite retention<br>**B:** 90 days analytics / 180 days watch history / 7 years audit logs | Proposed 90 days raw analytics / 180 days watch history / 7 years audit logs. | Head of Legal & Compliance | **OPEN — PRODUCT / LEGAL DECISION REQUIRED** |
| **ODR-014** | **Disaster Recovery RPO & RTO SLA** | Maximum tolerable data loss window and downtime during catastrophic cloud failure. | **A:** RPO <= 1h, RTO <= 4h<br>**B:** RPO <= 15m, RTO <= 60m<br>**C:** RPO = 0 (Multi-Region active-active) | **Option B (RPO <= 15m, RTO <= 60m)** recommended using Aurora continuous binlog backup. | Chief Technology Officer | **PROPOSED TARGET — EXECUTIVE SIGN-OFF REQUIRED** |
| **ODR-015** | **Content Moderation & Automated Screening** | Preventing upload of illegal, copyright-infringing, or explicit creator media. | **A:** 100% Manual Editorial Review<br>**B:** Automated pre-screening via AI vision/audio API (AWS Rekognition / Hive) | Hybrid: Pre-screening flag on upload; final publication gated by Human Content Admin. | VP of Trust & Safety | **OPEN — PRODUCT / LEGAL DECISION REQUIRED** |

---

## 3. Decision Sign-Off Protocol

When a business or legal stakeholder resolves an open item:
1. Update the status from `OPEN — ...` to `RATIFIED`.
2. Document the agreed specification and date of ratification.
3. Incorporate the formal rule into the corresponding technical document (`16_SUBSCRIPTION_ARCHITECTURE.md`, `17_CREATOR_ECONOMY.md`, etc.).
4. The backend engineering team will implement the verified business logic during the respective phase.
