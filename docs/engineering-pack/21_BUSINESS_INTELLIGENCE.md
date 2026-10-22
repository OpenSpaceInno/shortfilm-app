# 21. SHORTREEL — BUSINESS INTELLIGENCE

## Core Rule

Business metrics are pre-aggregated — never query live transactional tables from the dashboard.

## Metric Storage: business_metrics table

| Field | Description |
| :--- | :--- |
| metric_name | DAU, MAU, MRR, CHURN_RATE, WATCH_HOURS, etc. |
| dimension_key | GLOBAL, STORY, PLAN |
| dimension_value | all, story_01J8..., PREMIUM |
| time_granularity | HOURLY, DAILY, WEEKLY, MONTHLY |
| period_start / period_end | UTC timestamp range |
| numeric_value | DECIMAL(16,4) |

## Key Metrics

- DAU/MAU: COUNT(DISTINCT user_id) in watch_history within window
- MRR: SUM(plan_monthly_price) WHERE subscriptions.status = 'ACTIVE'
- Churn: Cancellations / Active at period start × 100
- Episode Completion Rate: Completed / Started × 100
- Choice Rate: UserChoices / Choice impressions

## Rollup Workers

Hourly BullMQ cron: compute hourly metrics from Redis Stream events
Daily BullMQ cron (midnight UTC): compute daily aggregates from hourly rollups
Monthly cron (1st): compute monthly aggregates, generate business_reports

## API

GET /business/metrics?metric=DAU&period=30d&granularity=DAILY
Response cached in Redis for 5 minutes (read-heavy, low volatility)
