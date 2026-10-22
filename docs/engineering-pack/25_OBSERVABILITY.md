# 25. SHORTREEL — OBSERVABILITY

> **Reference:** `docs/architecture/24_OBSERVABILITY.md`

## 1. Structured JSON Logging (Pino)

All logs in JSON format. Fields:
- timestamp, level, correlationId, userId, service, module, action, context, durationMs, http{}

Pino serializers redact: authorization, password, refreshToken, payoutAccountDetails, cardNumber

## 2. Correlation IDs

Every request gets X-Correlation-ID (from Cloudflare CF-Ray or generated ULID).
Stored in AsyncLocalStorage. Included in all logs, DB queries, outbound HTTP calls.

## 3. Prometheus Metrics (/metrics endpoint)

| Metric | Type | Alert |
| :--- | :--- | :--- |
| http_request_duration_seconds | Histogram | p95 > 250ms for 5min |
| http_requests_total | Counter | 5xx rate > 1.5% |
| interactive_choice_resolution_ms | Histogram | p95 > 60ms |
| bullmq_queue_waiting_jobs | Gauge | video-queue > 50 |
| db_pool_active_connections | Gauge | > 85% of pool |

## 4. Health Checks

GET /health/liveness → 200 if Node.js event loop alive (used by ECS for restart)
GET /health/readiness → 200 if MySQL + Redis reachable (used by ALB for routing)

## 5. Tracing

OpenTelemetry SDK traces span HTTP controllers, DB queries, Redis calls, external HTTP.
Exported to Jaeger (dev) / Datadog (production).
