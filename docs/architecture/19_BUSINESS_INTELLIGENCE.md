# 19. SHORTREEL — BUSINESS INTELLIGENCE ARCHITECTURE

> **Document ID:** SR-ARCH-19  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Architectural Philosophy: Operational vs. Derived Data

A core failure mode in high-scale entertainment platforms is running ad-hoc analytical aggregate queries (`SUM()`, `COUNT(DISTINCT)`, `AVG()`) directly against live transactional tables (`users`, `user_choices`, `watch_history`, `subscriptions`).

> [!IMPORTANT]
> **Cardinal BI Rule**:
> Operational transactional tables serve **live client reads and writes**.
> Business Dashboard metrics are **derived pre-aggregated rollups** computed asynchronously and stored in dedicated operational reporting tables. Real-time customer experience is strictly isolated from executive analytics load.

```text
┌─────────────────────────────────────────────────────────────┐
│                 LIVE TRANSACTIONAL LAYER                    │
│   (users, subscriptions, user_choices, watch_history)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 ┌───────────────────────┐             ┌─────────────────────┐
 │ Near-Real-Time Rollup │             │ Daily Settlement    │
 │ (Hourly BullMQ Cron)  │             │ (Midnight UTC Cron) │
 └──────────┬────────────┘             └──────────┬──────────┘
            │                                     │
            ▼                                     ▼
 ┌────────────────────────────────────────────────────────────┐
 │               OPERATIONAL REPORTING SCHEMA                 │
 │   - business_metrics (Time-series dimensional aggregates)  │
 │   - business_signals (Executive alerts & trajectory shifts)│
 │   - business_reports (Frozen immutable financial snapshots)│
 └─────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
 ┌────────────────────────────────────────────────────────────┐
 │             EXECUTIVE BUSINESS DASHBOARD API               │
 │           (Sub-50ms cache-backed JSON responses)           │
 └────────────────────────────────────────────────────────────┘
```

---

## 2. Core Metric Taxonomy & Calculation Specifications

### 2.1 Audience & Cohort Health

| Metric Name | Granularity | Calculation Logic | Storage Target |
| :--- | :--- | :--- | :--- |
| **DAU** | Daily | `COUNT(DISTINCT user_id)` with `watch_history` or `user_choices` in last 24h. | `business_metrics (metric='DAU')` |
| **MAU** | Monthly (Rolling 30d) | `COUNT(DISTINCT user_id)` active in the rolling 30-day window. | `business_metrics (metric='MAU')` |
| **D1 / D7 / D30 Retention** | Cohort-based | `% of new registrations in Cohort Date who returned on Day N`. | `business_metrics (metric='RETENTION_DN')` |
| **Stickiness Ratio** | Daily | `DAU / MAU` (Indicator of recurring daily consumption habits). | `business_metrics (metric='STICKINESS')` |

### 2.2 Engagement & Interactive Consumption

| Metric Name | Granularity | Calculation Logic | Storage Target |
| :--- | :--- | :--- | :--- |
| **Total Watch Time (Hours)**| Hourly & Daily | `SUM(progress_seconds) / 3600` across all watched nodes. | `business_metrics (metric='WATCH_HOURS')` |
| **Episode Completion Rate**| Daily per Story | `(Completed watch records) / (Started watch records) * 100`. | `business_metrics (dimension='story_id')`|
| **Interactive Choice Rate** | Daily per Story | `(Total UserChoices made) / (Total Choice prompts rendered)`. | `business_metrics (metric='CHOICE_RATE')`|
| **Viral Coefficient (Shares)**| Daily | `Total story_shares / Total Unique Active Viewers`. | `business_metrics (metric='SHARE_RATE')` |

### 2.3 Subscription & Financial Metrics

| Metric Name | Granularity | Calculation Logic | Storage Target |
| :--- | :--- | :--- | :--- |
| **Active Paid Subscribers** | Snapshot / Daily | `COUNT(id) FROM subscriptions WHERE status = 'ACTIVE'`. | `business_metrics (metric='ACTIVE_SUBS')`|
| **MRR (Monthly Recurring Rev)**| Daily Snapshot | `SUM(plan_monthly_price) FROM subscriptions WHERE status = 'ACTIVE'`. | `business_metrics (metric='MRR')` |
| **Gross Churn Rate** | Monthly | `(Cancellations in period) / (Active Subs at start of period) * 100`. | `business_metrics (metric='CHURN_RATE')` |
| **Net Subscriber Addition** | Daily | `(New Activations + Reactivations) - (Cancellations + Expirations)`. | `business_metrics (metric='NET_SUBS')` |
| **Gross Platform Revenue** | Daily & Monthly | `SUM(amount) FROM subscription_events WHERE event_type = 'RENEWED'`. | `business_reports` |
| **Creator Payout Liability** | Monthly | `SUM(net_payout) FROM creator_earnings WHERE status = 'PENDING_PAYOUT'`. | `business_reports` |

---

## 3. Storage Architecture: Operational MySQL vs. Future Analytics Warehouse

### 3.1 Initial Architecture (MySQL 8.x Operational Rollups)
To avoid premature infrastructure overhead, Phase 4 utilizes 3 lean, indexed MySQL tables:

1. **`business_metrics`**:
   - `id`: ULID `BINARY(16)`
   - `metric_name`: `VARCHAR(64)` (e.g. `DAU`, `WATCH_HOURS`, `MRR`)
   - `dimension_key`: `VARCHAR(64)` (e.g. `GLOBAL`, `STORY`, `TIER`)
   - `dimension_value`: `VARCHAR(128)` (e.g. `ALL`, `story_01J8...`, `PREMIUM`)
   - `time_granularity`: `ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY')`
   - `period_start`: `DATETIME` (UTC)
   - `period_end`: `DATETIME` (UTC)
   - `numeric_value`: `DECIMAL(16,4)`
   - `metadata`: `JSON`
   - *Index*: `idx_bm_lookup (metric_name, dimension_key, period_start, time_granularity)`

2. **`business_signals`**:
   - Alerts generated when metrics violate standard bounds (e.g., `CHURN_SPIKE`, `REVENUE_ANOMALY`).

3. **`business_reports`**:
   - Immutable financial end-of-month reconciliation reports approved by Finance.

### 3.2 Future Analytics Warehouse Migration Seam
When platform activity exceeds ~10,000,000 daily events:
- Rollup workers migrate from MySQL queries to **ClickHouse / Google BigQuery / Snowflake**.
- The `BusinessModule` API contract (`/api/v1/business/*`) remains **100% identical and unchanged**, querying an analytics connector adapter instead of MySQL read tables.
