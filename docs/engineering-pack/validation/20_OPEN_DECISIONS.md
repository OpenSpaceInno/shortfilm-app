# 20. SHORTREEL — OPEN DECISIONS REGISTER (VALIDATION UPDATE)

> **Document:** `validation/20_OPEN_DECISIONS.md`  
> **Phase:** 5A — Engineering Pack Validation  
> **Authority:** This document supersedes `43_OPEN_DECISIONS.md` by expanding every unresolved architecture, product, business, and legal decision with full impact assessments, options, and ownership.

---

## 1. Architecture Decisions (ADRs)

---

### ADR-001: Database ORM Selection
* **Decision ID:** ADR-001
* **Question:** Which ORM or database access layer should be used with NestJS and MySQL 8.0: Drizzle ORM, Prisma, or TypeORM?
* **Why it matters:** The ORM dictates schema definition patterns, type safety across repository and service layers, database migration generation/execution, connection pooling behavior with MySQL, and query performance under high concurrency (interactive story traversal and high-volume watch progress writes).
* **Current specification:** The Engineering Pack (`04_DATABASE_SCHEMA.md` and `20_NESTJS_ARCHITECTURE.md`) references Drizzle ORM syntax and conventions, but mentions Prisma in alternatives without a finalized ADR.
* **Options:**
  * **Option A: Drizzle ORM (Recommended)** — Lightweight, SQL-like query builder, zero runtime bloat, TypeScript-first, fast startup, fine-grained control over MySQL raw SQL and binary UUID types (`BINARY(16)`).
  * **Option B: Prisma** — Developer-friendly schema DSL and auto-generated client, but introduces a Rust query engine binary with higher cold-start overhead, connection pooling nuances, and complex handling of MySQL binary UUIDs.
  * **Option C: TypeORM** — Established NestJS default, Active Record / Data Mapper patterns, decorators, but known performance bottlenecks, long-standing unaddressed GitHub issues, and brittle migration tooling.
* **Recommended investigation:** Validate Drizzle ORM with MySQL 2 (`mysql2/promise`) driver for binary UUID handling and migration rollback capabilities.
* **Impact:** Affects all persistence code across Modules M00 through M30.
* **Blocking / Non-blocking:** **BLOCKING** for Module M01 (Database Foundation) and all database implementation.
* **Decision owner:** Principal Backend Architect.

---

### ADR-002: Auth0 Role & Permission Strategy
* **Decision ID:** ADR-002
* **Question:** Where should roles and fine-grained permissions be stored and evaluated: inside Auth0 (Actions + Custom JWT Claims), purely inside ShortReel MySQL (`roles`, `permissions`, `user_roles`), or via a Hybrid model?
* **Why it matters:** Auth0 is strictly the Identity Provider ("WHO the user is"). Storing application-level roles or granular domain permissions (e.g., `episode:publish`, `creator:payout`) inside Auth0 can cause token bloat, requires Auth0 Management API synchronization for internal state changes, and delays role revocation until token expiry.
* **Current specification:** `06_AUTH_RBAC.md` defined a complete relational RBAC model in MySQL (`roles`, `permissions`, `user_roles`, `role_permissions`) under the legacy custom auth model, but did not define how Auth0 JWT claims integrate with this model.
* **Options:**
  * **Option A: Auth0 Owns All Roles** — Auth0 RBAC enabled; roles embedded into JWT access token claims. NestJS evaluates roles directly from token without DB lookup. Con: Role updates require re-authentication; token bloat; tightly couples domain roles to external IdP.
  * **Option B: ShortReel Owns Roles in MySQL (Recommended)** — Auth0 handles identity only (`sub` claim). On request validation, NestJS resolves `user_id` from `sub` and retrieves roles/permissions from ShortReel MySQL, cached in Redis with a 5-minute TTL. Pro: Instant role assignment/revocation, zero Auth0 dependency for RBAC, clean separation of concerns.
  * **Option C: Hybrid** — High-level platform roles (`ADMIN`, `USER`) placed in Auth0 JWT custom claim; granular domain permissions and creator statuses stored in ShortReel MySQL. Con: Dual source of truth.
* **Recommended investigation:** Verify Redis session cache latency overhead for Option B (< 1.5ms per request).
* **Impact:** Affects M03 (Identity), M04 (Auth Guard), and M05 (RBAC Guard).
* **Blocking / Non-blocking:** **BLOCKING** for M03, M04, M05.
* **Decision owner:** Security Architect & Backend Lead.

---

### ADR-003: User Provisioning Model (Auth0 → ShortReel User)
* **Decision ID:** ADR-003
* **Question:** How and when should a ShortReel `users` database record be created when a user signs up or logs in through Auth0 Universal Login?
* **Why it matters:** If user provisioning relies solely on frontend calls, a user might access protected resources or trigger database foreign key errors if the user record does not exist in MySQL.
* **Current specification:** In the custom auth spec, user creation occurred synchronously inside `/auth/register`. Under Auth0, registration occurs on Auth0's hosted Universal Login page.
* **Options:**
  * **Option A: Pure Just-In-Time (JIT) Provisioning** — When any valid Auth0 JWT hits the NestJS API, the authentication guard checks if `users.external_subject_id = payload.sub` exists. If not, it executes an `INSERT ... ON DUPLICATE KEY UPDATE` to provision the user row from token claims (`email`, `name`).
  * **Option B: Auth0 Post-User-Registration Action Webhook** — An Auth0 Post-User-Registration Action triggers a secure mTLS/HMAC webhook to an internal NestJS provisioning endpoint (`POST /internal/auth0/user-created`) immediately upon signup.
  * **Option C: Hybrid (Action + JIT Fallback) (Recommended)** — Auth0 Post-Registration Action triggers immediate backend provisioning. If a user authenticates before the webhook completes (or if the webhook failed), the NestJS auth guard executes idempotent JIT provisioning as a safety net.
* **Recommended investigation:** Author Auth0 Post-Registration Action script and test idempotency under concurrent token presentation.
* **Impact:** Affects M03 (Identity) and M04 (Authentication).
* **Blocking / Non-blocking:** **BLOCKING** for M03, M04.
* **Decision owner:** Technical Lead.

---

### ADR-004: Video Transcoding & Delivery Infrastructure
* **Decision ID:** ADR-004
* **Question:** Which third-party video infrastructure should ShortReel adopt for vertical short-series video transcoding, packaging (HLS), and global CDN delivery: Cloudflare Stream, Mux Video, or AWS MediaConvert + CloudFront?
* **Why it matters:** ShortReel's core value proposition is instantaneous, bufferless vertical playback with interactive choice branching. Video costs, player SDK latency, signed URL generation speed, and webhook processing reliability directly impact UX and unit economics.
* **Current specification:** Engineering Pack specs assume Cloudflare Stream API patterns (tus protocol uploads, webhook notifications for ready state, signed HLS URLs), but Mux is listed as a potential alternative.
* **Options:**
  * **Option A: Cloudflare Stream (Recommended)** — Flat-rate per-minute pricing, built-in global CDN, fast tus direct uploads, signed URL key rotation, automatic HLS generation, simple REST API.
  * **Option B: Mux Video** — Best-in-class developer experience, instant thumbnail generation, detailed video quality metrics, but higher per-minute streaming cost.
  * **Option C: AWS Elemental MediaConvert + S3 + CloudFront** — Lowest raw infrastructure cost at massive scale, but requires high engineering maintenance (custom transcode pipelines, manual HLS master playlist generation, bespoke CDN token signing).
* **Recommended investigation:** Benchmark Cloudflare Stream signed token generation latency in NestJS and player initial buffering time on mobile.
* **Impact:** Affects M07 (Video Management Module) and creator upload workflows.
* **Blocking / Non-blocking:** **BLOCKING** for M07.
* **Decision owner:** Principal Architect & Infrastructure Lead.

---

### ADR-005: Payment Gateway Architecture
* **Decision ID:** ADR-005
* **Question:** Should ShortReel implement a single payment processor or a dual-gateway routing architecture (Razorpay for India/South Asia + Stripe for Global/International)?
* **Why it matters:** Subscription checkout conversion is critically dependent on local payment methods (UPI, Netbanking, local cards in India; Apple Pay, Google Pay, international credit cards globally). Recurring mandates (e-mandates) in India require RBI-compliant recurring billing engines.
* **Current specification:** `10_SUBSCRIPTIONS.md` describes a provider-agnostic `payments` and `subscriptions` schema, but assumes both Stripe and Razorpay webhook processors exist in M23.
* **Options:**
  * **Option A: Stripe Only** — Simplifies implementation to a single SDK and webhook handler. Con: Poor conversion and high friction for Indian domestic cards and UPI recurring mandates.
  * **Option B: Razorpay Only** — Optimal for India launch, but lacks global multi-currency scaling and frictionless global payment methods.
  * **Option C: Multi-Gateway Adapter Pattern (Recommended)** — Define an internal `PaymentProvider` interface in NestJS. Implement `StripePaymentProvider` and `RazorpayPaymentProvider`. Select gateway dynamically based on user IP/currency.
* **Recommended investigation:** Verify Stripe Billing vs Razorpay Subscriptions recurring webhook payload normalization.
* **Impact:** Affects M21 (Plans), M22 (Checkout), M23 (Webhooks).
* **Blocking / Non-blocking:** **BLOCKING** for M21, M22, M23.
* **Decision owner:** Product Architect & Business Operations.

---

### ADR-006: Auth0 Tenant & Environment Isolation Strategy
* **Decision ID:** ADR-006
* **Question:** What Auth0 tenant topology should be established across Local, Development, Staging, and Production environments?
* **Why it matters:** Reusing Auth0 tenants across production and development introduces catastrophic risks: accidental customer user deletion during staging tests, mixed user directories, shared client secrets, and unstable redirect URIs.
* **Current specification:** The Engineering Pack assumed self-contained local JWT issuing without any external tenant requirement.
* **Options:**
  * **Option A: Single Shared Tenant for All Environments** — Insecure, high blast radius. **REJECTED.**
  * **Option B: Two Tenants (Non-Production + Production) (Recommended)** — One tenant `shortreel-nonprod.auth0.com` serving local development and staging (separated by distinct Client Applications and callback URLs), and one isolated tenant `shortreel.auth0.com` strictly for production.
  * **Option C: Three Dedicated Tenants (Dev, Staging, Prod)** — Highest isolation, requires enterprise Auth0 licensing for multiple custom domains and management overhead.
* **Recommended investigation:** Confirm Auth0 subscription tier allows at least 2 tenants (1 prod + 1 non-prod).
* **Impact:** Affects local dev configuration, CI/CD pipeline, and staging/prod deployments.
* **Blocking / Non-blocking:** **BLOCKING** for M04 and local dev environment setup.
* **Decision owner:** DevOps & Security Lead.

---

### ADR-007: Auth0 Client Application Topology (Consumer vs Admin)
* **Decision ID:** ADR-007
* **Question:** Should the Consumer/Creator Web Application and the Internal Admin Console be registered as a single Auth0 SPA Application or as two separate Auth0 SPAs?
* **Why it matters:** The Admin Console requires strict access controls, shorter session timeouts, mandatory MFA, and restricted login methods, whereas the Consumer app requires frictionless login, social login, and longer session life.
* **Current specification:** Unspecified in v1.
* **Options:**
  * **Option A: Single Unified SPA Application** — One Client ID. Admin access is gated solely by frontend routes checking `roles.includes('ADMIN')`. Con: Compromise of consumer client ID exposes admin authentication surface; cannot enforce admin-only MFA at the Auth0 level.
  * **Option B: Separate SPAs (Consumer App & Admin Console) (Recommended)** — Two distinct Auth0 SPA Client IDs. Consumer App (`ShortReel Web`) configured for frictionless login + social providers. Admin Console (`ShortReel Admin`) configured with strict email/password, mandatory Step-up MFA, IP allowlisting, and distinct session timeout policies.
* **Recommended investigation:** Configure Auth0 Rule/Action to block non-admin logins on the Admin Client ID.
* **Impact:** Affects frontend Auth0 provider setup, redirect URIs, and admin security posture.
* **Blocking / Non-blocking:** Non-blocking for M01; **BLOCKING** before Admin UI integration.
* **Decision owner:** Security Architect.

---

## 2. Business Rules (BRs)

---

### BR-001: Creator Platform Revenue Share %
* **Decision ID:** BR-001
* **Question:** What is the exact default gross revenue share percentage paid to verified creators on premium watch time and pay-per-series transactions?
* **Why it matters:** Creator earnings calculation jobs (Module M19) cannot execute financial ledger computations without an immutable revenue split percentage.
* **Current specification:** `11_CREATOR_PLATFORM.md` specifies a configurable platform fee parameter but leaves the default numerical value placeholder (`e.g., 60% creator / 40% platform` vs `70% / 30%`).
* **Options:**
  * Option A: 70% Creator / 30% Platform (Industry standard digital content split).
  * Option B: 55% Creator / 45% Platform (YouTube Partner Model).
  * Option C: Tiered model based on monthly watch-hour tiers.
* **Recommended investigation:** Financial modeling on gross margin after CDN streaming costs and payment processing fees.
* **Impact:** Affects M19 (Creator Earnings Ledger) and `creator_earnings` table schema defaults.
* **Blocking / Non-blocking:** **BLOCKING** for M19.
* **Decision owner:** Business Operations / CEO.

---

### BR-002: Minimum Creator Payout Threshold
* **Decision ID:** BR-002
* **Question:** What is the minimum accumulated balance required before a creator payout batch transfer is generated?
* **Why it matters:** Automated payouts below transaction processing fee costs result in financial loss per disbursement.
* **Current specification:** Draft mentions "minimum payout threshold" without an exact numeric threshold or multi-currency mapping.
* **Options:**
  * Option A: INR ₹1,000 (Domestic India) / USD $50 (International).
  * Option B: INR ₹2,500 / USD $100.
* **Recommended investigation:** Benchmark payout processing fees via Razorpay Payouts and Stripe Connect.
* **Impact:** Payout batch cron job filters (`balance >= threshold`). Affects M19.
* **Blocking / Non-blocking:** **BLOCKING** for M19 payout cron execution.
* **Decision owner:** Finance & Operations.

---

### BR-003: Creator Earnings Attribution Formula
* **Decision ID:** BR-003
* **Question:** What is the formula for attributing subscription pool revenue to creators: Pure Completed Watch-Time (seconds), Unique Viewer Ratio, or Branch Engagement Weighting?
* **Why it matters:** Interactive stories have varying branch depths. If earnings are strictly per-second, creators might pad video length without interactive depth; if based on completions, branching paths may penalize longer alternate storylines.
* **Current specification:** Concept outlined in domain model, but exact mathematical equation missing.
* **Options:**
  * Option A: Pro-rata Watch Time (`(Creator_Total_Watch_Sec / Platform_Total_Watch_Sec) * Creator_Pool`).
  * Option B: Hybrid Completion + Choice Engagement (`0.7 * Watch_Sec_Ratio + 0.3 * Choice_Interactions_Ratio`).
* **Recommended investigation:** Simulate payouts on synthetic sample data for 10 creators.
* **Impact:** Affects M19 aggregation query logic.
* **Blocking / Non-blocking:** **BLOCKING** for M19.
* **Decision owner:** Head of Product & Finance.

---

### BR-004: Free Trial Duration and Eligibility Rules
* **Decision ID:** BR-004
* **Question:** Does ShortReel offer a free trial on paid subscription tiers, and if so, what is the duration (e.g., 7 days) and credit-card upfront requirement?
* **Why it matters:** Determines whether subscription creation initializes state as `TRIALING` vs `ACTIVE`, and whether payment webhooks must handle trial conversion events.
* **Current specification:** `subscriptions.status` enum includes `TRIALING`, but trial rules are undefined.
* **Options:**
  * Option A: No free trial — Rely on free teaser episodes (Ep 1 & 2 free for all stories).
  * Option B: 7-day free trial requiring upfront payment mandate setup.
* **Recommended investigation:** Evaluate payment gateway e-mandate support for ₹0 / $0 trial authorization.
* **Impact:** Affects M21 and M22 subscription state machine.
* **Blocking / Non-blocking:** Non-blocking for M01; **BLOCKING** for M22.
* **Decision owner:** Growth & Marketing Lead.

---

### BR-005: Subscription Dunning & Grace Period Length
* **Decision ID:** BR-005
* **Question:** How many days of grace period and retry attempts are granted when a subscription renewal payment fails before access is revoked?
* **Why it matters:** Dictates subscription status transition: `PAST_DUE` vs immediate `CANCELED`, and controls entitlement evaluation logic in the video playback authorizer.
* **Current specification:** Enum contains `PAST_DUE`, duration unspecified.
* **Options:**
  * Option A: 3-day grace period with daily retry (Soft dunning).
  * Option B: 7-day grace period with 3 retries (Standard SaaS).
* **Recommended investigation:** Align with Stripe/Razorpay automated smart retry schedule.
* **Impact:** Affects M22 dunning webhook handlers.
* **Blocking / Non-blocking:** Non-blocking for M01; **BLOCKING** for M23.
* **Decision owner:** Business Operations.

---

### BR-006: Default Interactive Choice Voting Window Duration
* **Decision ID:** BR-006
* **Question:** For community-voted choice nodes (where next episodes are unlocked by audience consensus), what is the default voting duration if creator does not configure a specific cutoff?
* **Why it matters:** Node choice engine must know when a community voting window transitions from `OPEN` to `CLOSED` to trigger automated branch tallying.
* **Current specification:** `choices.voting_ends_at` is nullable timestamp; fallback behavior when NULL is unspecified.
* **Options:**
  * Option A: 48 hours from node release.
  * Option B: Indefinite (Only closed when creator/admin manually publishes the winning branch).
* **Recommended investigation:** Align with creator release schedules and audience engagement patterns.
* **Impact:** Affects M10 (Choice Engine) and M14 (Community Features).
* **Blocking / Non-blocking:** Non-blocking for M01; **BLOCKING** for M10.
* **Decision owner:** Content Product Lead.

---

### BR-007: Free Consumer Tier Access Limits
* **Decision ID:** BR-007
* **Question:** What is the platform-wide content access policy for unauthenticated and free authenticated consumers?
* **Why it matters:** The API gateway and video signed-url generator must enforce strict access boundaries prior to generating playback credentials.
* **Current specification:** Episodes have `is_premium` boolean. Free users can watch `is_premium = false`.
* **Options:**
  * Option A: Episode 1 & 2 of every series free; all subsequent choice branches require active subscription.
  * Option B: Entire first series run free; subsequent alternate branches premium.
* **Recommended investigation:** Standardize on Option A (`is_premium = false` for root and early standard nodes, `true` for all deep branches).
* **Impact:** Affects M06 and M12 playback entitlement checks.
* **Blocking / Non-blocking:** Non-blocking for M01; **BLOCKING** for M06.
* **Decision owner:** Product Architect.

---

### BR-008: Gamification XP & Streak Milestone Rewards
* **Decision ID:** BR-008
* **Question:** What tangible or cosmetic benefits are granted when users achieve streak milestones (e.g., 7-day, 30-day streak) or level up via XP?
* **Why it matters:** Determines whether XP ledger is purely cosmetic telemetry or grants platform entitlements (e.g., free premium episode unlocks, special creator badges).
* **Current specification:** `xp_ledger` table tracks XP; streak counters track daily engagement. Reward unlock hooks are undefined.
* **Options:**
  * Option A: Purely cosmetic (Badges, leaderboard ranking, profile flair).
  * Option B: Functional rewards (Unlock 1 premium choice branch per 500 XP).
* **Recommended investigation:** Keep Option A for V1 to minimize entitlement complexity.
* **Impact:** Affects M13 (Gamification Engine).
* **Blocking / Non-blocking:** Non-blocking for V1 core streaming.
* **Decision owner:** Product Gamification Lead.

---

## 3. Legal, Tax & Compliance Decisions (LCs)

---

### LC-001: Creator Tax Withholding & KYC Compliance
* **Decision ID:** LC-001
* **Question:** What automated tax withholding (TDS under Indian Income Tax Act 194B/194J, or US IRS W-8BEN/W-9) must be deducted from creator payouts before net disbursement?
* **Why it matters:** Payouts without statutory tax deductions expose the business to severe regulatory penalties.
* **Current specification:** Mentioned as a compliance note; no deduction logic in ledger specs.
* **Options:**
  * Option A: Platform deducts flat TDS % for domestic Indian creators based on PAN verification; international creators deferred to Phase 2.
  * Option B: External merchant of record / payout partner handles withholding at source.
* **Recommended investigation:** Consult corporate tax counsel regarding marketplace withholding obligations.
* **Impact:** Affects M19 payout calculation and creator onboarding fields.
* **Blocking / Non-blocking:** **BLOCKING** before any live monetary disbursement in M19.
* **Decision owner:** Legal Counsel & CFO.

---

### LC-002: GDPR & DPDP Right to be Forgotten SLA
* **Decision ID:** LC-002
* **Question:** When a user requests account deletion, how are interactive choices, analytics events, and XP ledgers purged vs pseudonymized?
* **Why it matters:** Deleting a user must not corrupt aggregate choice counts on published story graphs (which would break branching consensus), yet must comply with privacy erasure mandates within 30 days.
* **Current specification:** `audit_logs` and user soft-delete specified; cascading purge mechanics unspecified.
* **Options:**
  * Option A: Hard delete user record and cascade delete choices. (Breaks historical branch statistics). **REJECTED.**
  * Option B: Anonymize user record: Nullify email, name, IP; set `status = DELETED`; retain immutable choice records linked to anonymous UUID with `user_id = NULL` or synthetic deleted-user ID. (Recommended).
* **Recommended investigation:** Verify DPDP Act 2023 compliance for retention of financial transaction logs.
* **Impact:** Affects M03 (Identity), M29 (Audit & Compliance).
* **Blocking / Non-blocking:** Non-blocking for V1 start; **BLOCKING** before public launch.
* **Decision owner:** Legal & Data Protection Officer.

---

### LC-003: PII Anonymization in Telemetry & Analytics Pipeline
* **Decision ID:** LC-003
* **Question:** Are raw IP addresses and client user agents stored in `analytics_events` or hashed/anonymized at ingestion?
* **Why it matters:** Storing raw IPs in general analytics tables transforms standard telemetry into personal data under GDPR/DPDP.
* **Current specification:** `analytics_events` schema contains `device_type`, `client_ip`, and `user_agent`.
* **Options:**
  * Option A: Store raw IP. **REJECTED.**
  * Option B: Truncate / hash IP (`SHA256(ip + daily_salt)`) and extract Geo-IP (Country/Region) at ingestion; do not persist raw IP. (Recommended).
* **Recommended investigation:** Add GeoIP lookup middleware prior to analytics queue insertion.
* **Impact:** Affects M24 (Analytics Ingestion).
* **Blocking / Non-blocking:** Non-blocking for M01; **BLOCKING** for M24.
* **Decision owner:** Privacy Officer & Security Lead.

---

### LC-004: Subscription Cancellation and Pro-Rata Refund Policy
* **Decision ID:** LC-004
* **Question:** What is the legal policy on subscription cancellations: immediate access revocation with pro-rata refund, or access maintained until the end of the current paid billing cycle with no refunds?
* **Why it matters:** Directs webhook handling for cancellation and subscription state machine logic.
* **Current specification:** Unspecified.
* **Options:**
  * Option A: Access maintained until `current_period_ends_at`; no refunds for partial cycles. (Industry standard for streaming OTT).
  * Option B: Pro-rata refund issuance.
* **Recommended investigation:** Adopt Option A as standard OTT terms of service.
* **Impact:** Affects M22 and M23 subscription status management.
* **Blocking / Non-blocking:** Non-blocking for M01; **BLOCKING** for M22.
* **Decision owner:** Legal & Product Operations.

---

### LC-005: COPPA & Age Gating Compliance
* **Decision ID:** LC-005
* **Question:** Is ShortReel restricted to users aged 13+ (or 18+ for interactive horror/thriller themes), and how is age verified?
* **Why it matters:** Serving personalized video content and tracking interactive analytics for minors under 13 triggers stringent COPPA / DPDP child consent requirements.
* **Current specification:** No age gate in signup flow.
* **Options:**
  * Option A: Self-declaration checkbox on Auth0 Universal Login ("I confirm I am at least 16 years old").
  * Option B: Explicit date-of-birth collection and content rating restriction filter.
* **Recommended investigation:** Implement self-declaration checkbox in Auth0 registration schema.
* **Impact:** Affects Auth0 signup field configuration and user terms.
* **Blocking / Non-blocking:** Non-blocking for M01; **BLOCKING** before launch.
* **Decision owner:** Legal Counsel.

---

## 4. Product & Feature Decisions (PDs)

---

### PD-001: Mandatory Email Verification Prior to Streaming
* **Decision ID:** PD-001
* **Question:** Must a consumer verify their email address before being permitted to stream episodes and submit choices, or is email verification required only for premium checkout and creator applications?
* **Why it matters:** Requiring email verification upfront creates massive onboarding drop-off; delaying it invites bot spam and unverified account generation.
* **Current specification:** Auth0 manages email verification; backend enforcement policy unspecified.
* **Options:**
  * Option A: Immediate block on all streaming until email verified.
  * Option B: Unverified users can watch free episodes; verification strictly required for subscription checkout, creator application, and commenting. (Recommended).
* **Recommended investigation:** Configure Auth0 token claim `email_verified` inspection in NestJS payment/creator guards.
* **Impact:** Affects M04 (Auth Guard) and M22 (Checkout).
* **Blocking / Non-blocking:** Non-blocking for M01; **BLOCKING** for M04.
* **Decision owner:** Growth Product Manager.

---

### PD-002: Multi-Language Subtitles & Audio Scope for V1
* **Decision ID:** PD-002
* **Question:** What is the technical scope for multi-language support (English, Hindi, Tamil, Telugu) in V1: single audio with WebVTT subtitles, or multi-track HLS audio streaming?
* **Why it matters:** Multi-track HLS audio requires complex transcode packaging and multiple video source assets per episode; WebVTT subtitles require only text track storage and standard HLS playlist references.
* **Current specification:** Domain model mentions languages; storage schema lacks explicit `subtitles` table.
* **Options:**
  * Option A: V1 supports original audio + WebVTT subtitle tracks (English + regional).
  * Option B: Full multi-track alternate audio dubbing in HLS.
* **Recommended investigation:** Standardize on Option A for V1; add `subtitles` table DDL.
* **Impact:** Affects M06 (Content), M07 (Video).
* **Blocking / Non-blocking:** Non-blocking for M01.
* **Decision owner:** Head of Content.

---

### PD-003: Consumer-to-Creator Role Upgrades Within Active Session
* **Decision ID:** PD-003
* **Question:** When an approved consumer transitions to creator status, can their active session immediately access creator studio endpoints without logging out and logging back in?
* **Why it matters:** If roles are baked into the Auth0 JWT token, the user must perform a token refresh or re-authenticate to receive updated claims. If roles are fetched from ShortReel MySQL (ADR-002 Option B), invalidating the user's Redis cache key (`user:session:{userId}`) instantly elevates their permissions.
* **Current specification:** Aligns with ADR-002 Option B.
* **Options:**
  * Option A: Invalidate Redis user session cache on role change; role recognized on immediate subsequent request. (Recommended).
  * Option B: Force frontend silent token renewal via Auth0 SDK.
* **Recommended investigation:** Validate cache eviction hook inside Creator Approval service.
* **Impact:** Affects M16 (Creator Application Workflow).
* **Blocking / Non-blocking:** Non-blocking for M01.
* **Decision owner:** Backend Lead.

---

### PD-004: Community Choice Node Voting: Binding vs Cosmetic
* **Decision ID:** PD-004
* **Question:** For community choice episodes, does the tally calculation automatically publish the winning episode branch via the Story Engine, or is it an advisory recommendation for the creator to approve?
* **Why it matters:** Fully automated branch unlocking requires scheduled cron evaluation, state transitions, and push notification triggers; advisory voting leaves publishing under human creator control.
* **Current specification:** `choices.is_community_choice` flag exists; transition trigger unspecified.
* **Options:**
  * Option A: Creator-in-the-loop (Creator reviews tally and clicks "Release Winning Branch"). (Recommended for V1).
  * Option B: Fully automated branch release cron job.
* **Recommended investigation:** Implement Option A for V1 stability and creator artistic autonomy.
* **Impact:** Affects M10 (Choice Engine) and M14 (Community Features).
* **Blocking / Non-blocking:** Non-blocking for M01; **BLOCKING** for M10.
* **Decision owner:** Product Architect.

---

### PD-005: Episode Comments & Moderation Scope for V1
* **Decision ID:** PD-005
* **Question:** Are user comments on episodes in scope for V1 launch, and what moderation tooling (automated toxicity filtering, admin queue) is required?
* **Why it matters:** User-generated comments introduce severe moderation overhead, toxic content liabilities, and database write pressure.
* **Current specification:** Domain model mentions comments; database schema lacks `comments` DDL.
* **Options:**
  * Option A: Defer comments to V1.1; focus V1 social layer purely on interactive choices, reactions (likes), and community branch votes. (Recommended).
  * Option B: Implement comments with AWS Comprehend / OpenAI toxicity filtering.
* **Recommended investigation:** Confirm V1 launch scope with Product leadership.
* **Impact:** Affects M14 (Social Features) and database schema.
* **Blocking / Non-blocking:** Non-blocking for M01.
* **Decision owner:** Head of Product.

---

### PD-006: Semantic / Vector Search in V1 vs MySQL Full-Text Search
* **Decision ID:** PD-006
* **Question:** Should story search in V1 use native MySQL Full-Text indexing over titles, tags, and synopses, or require OpenSearch / pgvector / Pinecone for semantic natural language discovery?
* **Why it matters:** An external search cluster increases operational complexity and infrastructure cost; MySQL full-text search is zero-infrastructure for the initial catalog of <1,000 stories.
* **Current specification:** `08_SEARCH_DISCOVERY.md` specifies MySQL `FULLTEXT` indexes as primary for V1, with semantic search flagged for V2.
* **Options:**
  * Option A: MySQL 8.0 Full-Text Search on `stories(title, synopsis, tags)` (Recommended for V1).
  * Option B: Managed vector database integration.
* **Recommended investigation:** Validate MySQL full-text search latency with ngram parser for regional languages.
* **Impact:** Affects M08 (Search Module).
* **Blocking / Non-blocking:** Non-blocking for M01; confirms M08 scope.
* **Decision owner:** Backend Architect.

---

## 5. Decision Resolution Protocol

1. When a decision is approved by its **Decision Owner**, change its status from `OPEN` to `DECIDED`.
2. Document the selected option and rationale in this register.
3. Update the corresponding technical specification document in `docs/engineering-pack/`.
4. Update `implementation/05_PROGRESS_TRACKER.md` to unblock dependent implementation modules.
