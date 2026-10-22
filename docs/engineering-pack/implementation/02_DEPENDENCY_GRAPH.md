# MODULE DEPENDENCY GRAPH

## Tier Dependencies

`
TIER 0 (Foundation)
  M00 Repository Setup
    └── M01 Database Foundation
          └── M02 Core Config

TIER 1 (Identity)
  M02 ──> M03 Identity
              └── M04 Auth
                    └── M05 RBAC Guards

TIER 2 (Content)
  M05 ──> M06 Content
              └── M07 Video
                    └── M08 Search

TIER 3 (Interactive)
  M05 + M06 ──> M09 Interactive Module
                     └── M10 Choice Engine
                           └── M11 Story Versioning

TIER 4 (Engagement)
  M06 + M11 ──> M12 Engagement
                     └── M13 Gamification
                           └── M14 Social Features
                                 └── M15 Notifications

TIER 5 (Creator)
  M05 + M06 ──> M16 Creator Module
                     └── M17 Submissions
                           └── M18 AI Studio
                                 └── M19 Creator Earnings
                                       └── M20 Creator Analytics

TIER 6 (Monetisation)
  M05 + M06 ──> M21 Subscription Plans
                     └── M22 Subscription Checkout
                           └── M23 Webhook Processing

TIER 7 (Analytics)
  M12 + M23 ──> M24 Analytics Ingest
                     └── M25 Rollup Workers
                           └── M26 Business Dashboard
                                 └── M27 Story Lab

TIER 8 (Admin)
  M17 + M27 ──> M28 Admin Module
                     └── M29 Audit Module

TIER 9 (Hardening)
  M25 + M28 ──> M30 Observability
                     └── M31 Performance
                           └── M32 Security Hardening
`

## Minimum Path to MVP

M00 → M01 → M02 → M03 → M04 → M05 → M06 → M07 → M09 → M10 → M11 → M12 → M21 → M22 → M23

This enables: Register → Subscribe → Watch → Choose → Resume
