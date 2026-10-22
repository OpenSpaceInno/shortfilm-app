# 21. SHORTREEL — RISK REGISTER

> **Document:** alidation/21_RISK_REGISTER.md

| ID | Risk | Likelihood | Impact | Severity | Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| RISK-001 | Auth0 free tier (7,000 MAU) exceeded at launch | HIGH | HIGH | 🔴 CRITICAL | Budget Auth0 Professional (/month) before launch |
| RISK-002 | Auth0 custom claims not available at API time | MEDIUM | HIGH | 🔴 HIGH | Implement Auth0 Post-Login Action; test in staging |
| RISK-003 | JIT user provisioning race condition | MEDIUM | MEDIUM | 🟡 MEDIUM | Use DB UPSERT (INSERT ... ON DUPLICATE KEY UPDATE) |
| RISK-004 | ORM not decided — schema in Drizzle syntax | LOW | HIGH | 🟡 MEDIUM | Resolve ADR-001 before M01 |
| RISK-005 | Video provider not locked (ADR-004) | LOW | HIGH | 🟡 MEDIUM | Resolve before M07; abstraction mitigates switching cost |
| RISK-006 | Creator earnings formula open (BR-001/002/003) | HIGH | HIGH | 🔴 HIGH | Business must decide before M19 begins |
| RISK-007 | Payment provider not locked (ADR-005) | MEDIUM | HIGH | 🔴 HIGH | Resolve before M21 |
| RISK-008 | MySQL write volume at scale (watch_progress, xp_ledger) | MEDIUM | MEDIUM | 🟡 MEDIUM | Partition strategy + read replicas |
| RISK-009 | Interactive engine race on concurrent choice submission | LOW | HIGH | 🟡 MEDIUM | DB UNIQUE constraint + idempotency key; already designed |
| RISK-010 | Auth0 outage = no authentication = total platform down | LOW | HIGH | 🟡 MEDIUM | Auth0 SLA 99.99%; no mitigation other than SLA |
| RISK-011 | Lovable frontend not using Auth0 SDK | HIGH | HIGH | 🔴 CRITICAL | Confirm immediately — frontend must use auth0-react or auth0-spa-js |
| RISK-012 | PII in analytics events (GDPR exposure) | MEDIUM | HIGH | 🔴 HIGH | Pseudonymize user_id in analytics events; resolve LC-002/003 |
| RISK-013 | AI provider rate limits during Story Studio peak usage | MEDIUM | MEDIUM | 🟡 MEDIUM | BullMQ queue + per-user daily limits; fallback provider |

## Action Required Immediately

RISK-001: Auth0 pricing — confirm budget.
RISK-011: Confirm Lovable frontend integrates Auth0 SDK.
