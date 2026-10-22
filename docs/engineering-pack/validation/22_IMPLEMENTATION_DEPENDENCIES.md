# 22. SHORTREEL — IMPLEMENTATION DEPENDENCY GRAPH (VALIDATED)

> **Document:** alidation/22_IMPLEMENTATION_DEPENDENCIES.md

## Revised Module Sequence (with Auth0)

`
M00 Repository Setup
  └── M01 Database Foundation (MySQL + Drizzle + Testcontainers)
        └── M02 Core Config (ConfigModule + Pino + Health + CORS)
              └── M03 Identity Module (users + user_profiles + roles — NO password_hash)
                    └── M04 Auth0 Integration (PassportStrategy + JwtAuthGuard + JIT provisioning)
                          └── M05 RBAC Guards (RolesGuard + PermissionsGuard + ResourceOwnerGuard)
                                ├── M06 Content Module (stories, seasons, episodes)
                                │     └── M07 Video Module (Cloudflare Stream integration)
                                │           └── M08 Search Module (MySQL FTS)
                                ├── M09 Interactive Module (story_versions, story_nodes)
                                │     └── M10 Choice Engine (resolveChoice ACID)
                                │           └── M11 Story Version Lifecycle
                                ├── M12 Engagement Module (watch_progress, xp_ledger)
                                │     ├── M13 Gamification (badges, streaks)
                                │     ├── M14 Social Features (votes, predictions, follows)
                                │     └── M15 Notifications (BullMQ + FCM + email)
                                ├── M16 Creator Module (creators, applications)
                                │     ├── M17 Creator Submissions
                                │     │     └── M18 AI Studio
                                │     └── M19 Creator Earnings [BLOCKED: BR-001/002/003]
                                │           └── M20 Creator Analytics
                                └── M21 Subscription Plans
                                      └── M22 Subscription Checkout [BLOCKED: BR-004/005]
                                            └── M23 Webhook Processing [BLOCKED: LC-004]
`

## Post-Foundation Parallel Work Safe

Once M05 (RBAC) is complete, these modules can be developed in parallel:
- M06, M09, M12, M16, M21 (different domains, no cross-module dependencies)

## Critical Path to Consumer MVP

M00 → M01 → M02 → M03 → M04 → M05 → M06 → M07 → M09 → M10 → M12 → M21 → M22 → M23

Consumer MVP requires: Auth0 login → Browse → Watch → Choose → Subscribe (paywall check)
