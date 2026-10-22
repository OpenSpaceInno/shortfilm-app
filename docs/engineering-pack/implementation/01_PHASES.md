# IMPLEMENTATION PHASES

## Phase 6A — Foundation (M00–M05)
Repository setup, database foundation, auth, RBAC.
Exit criteria: All API auth guards working. Login/Register flow end-to-end.

## Phase 6B — Core Content (M06–M08)
Content CRUD, video upload pipeline, search.
Exit criteria: Creator can upload a video. Consumer can browse and search stories.

## Phase 6C — Interactive Engine (M09–M11)
Story versioning, node graph, choice engine.
Exit criteria: All 10 ENG invariant tests pass. DAG validation rejects cycles.

## Phase 6D — Engagement (M12–M15)
Watch progress, XP, badges, notifications.
Exit criteria: Full episode watch flow works end-to-end. XP awarded on choice. Badge unlocked.

## Phase 6E — Creator Economy (M16–M20)
Creator lifecycle, AI Studio, earnings.
Exit criteria: Creator can apply, be approved, create story, use AI Studio.

## Phase 6F — Monetisation (M21–M23)
Subscription plans, checkout, webhooks.
Exit criteria: User can subscribe via Razorpay. Entitlement blocks free user from paid content.

## Phase 6G — Intelligence & Analytics (M24–M27)
Analytics ingest, rollup, Story Lab.
Exit criteria: Business dashboard shows live DAU, MRR. Story Lab surfaces signals.

## Phase 6H — Admin & Hardening (M28–M32)
Admin CMS, audit trail, observability, security hardening.
Exit criteria: Production readiness checklist in 15_DEPLOYMENT.md validated.
