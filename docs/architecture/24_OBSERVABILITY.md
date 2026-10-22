# 24. SHORTREEL — OBSERVABILITY & MONITORING ARCHITECTURE

> **Document ID:** SR-ARCH-24  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Observability Pillars

To ensure high availability, proactive anomaly detection, and rapid mean time to resolution (MTTR) across video streaming and interactive gameplay, ShortReel integrates the three classic observability pillars: **Structured Logging**, **Prometheus Metrics**, and **Distributed Tracing**.

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                      OBSERVABILITY BUS                      │
 └──────┬──────────────────────┬──────────────────────┬────────┘
        │                      │                      │
        ▼                      ▼                      ▼
 ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
 │  STRUCTURED  │       │  PROMETHEUS  │       │ OPENTELEMETRY│
 │  JSON LOGS   │       │   METRICS    │       │   TRACING    │
 └──────┬───────┘       └──────┬───────┘       └──────┬───────┘
        │                      │                      │
        ▼                      ▼                      ▼
  OpenSearch /           Prometheus /               Jaeger /
  Datadog / Loki           Grafana                  Datadog
```

---

## 2. Structured JSON Logging

Standard `console.log` is strictly forbidden in production. All logs are emitted in JSON format via **Pino** (integrated with NestJS via `nestjs-pino`).

### 2.1 Log Schema Contract
```json
{
  "timestamp": "2026-09-29T14:30:00.123Z",
  "level": "info",
  "correlationId": "req_01J8ABCDEF1234567890",
  "userId": "usr_01J8...",
  "service": "shortreel-api",
  "module": "InteractiveEngineModule",
  "action": "CHOICE_RESOLVED",
  "context": {
    "storyId": "sty_01J8...",
    "nodeId": "nde_01J8...",
    "choiceId": "chc_01J8...",
    "destinationNodeId": "nde_01J8..."
  },
  "durationMs": 14.2,
  "http": {
    "method": "POST",
    "route": "/api/v1/interactive/choices",
    "statusCode": 200,
    "ip": "203.0.113.195",
    "userAgent": "ShortReel-iOS/1.4"
  }
}
```

### 2.2 PII Redaction
Pino serializers automatically redact sensitive fields:
- `authorization` headers
- `password`, `refreshToken`, `token`
- `payoutAccountDetails`, `taxNumber`
- `cardNumber`, `cvv`

---

## 3. System & Application Metrics

Metrics are exposed via the `/metrics` endpoint using standard Prometheus format (`prom-client`).

### 3.1 Golden Signals & Operational Dashboards

| Metric Name | Type | Description & Alert Threshold |
| :--- | :--- | :--- |
| `http_request_duration_seconds` | Histogram | Request latency bucketed by route and status code. Alert if p95 > 250ms for 5 minutes. |
| `http_requests_total` | Counter | Total request throughput segmented by status code (2xx, 4xx, 5xx). Alert if 5xx rate > 1.5%. |
| `interactive_choice_resolution_duration_ms` | Histogram | Latency of graph choice resolution transaction. Alert if p95 > 60ms. |
| `bullmq_queue_waiting_jobs` | Gauge | Number of jobs waiting in BullMQ queues. Alert if `video-processing` backlog > 50. |
| `bullmq_queue_failed_jobs_total` | Counter | Cumulative job failures. Alert if DLQ intake > 0. |
| `db_pool_active_connections` | Gauge | Active MySQL connection pool utilization. Alert if pool usage > 85%. |
| `redis_connected_clients` | Gauge | Active Redis client connections. Alert on connection spikes. |
| `cloudflare_stream_webhook_failures_total` | Counter | Video transcoding failures reported by Cloudflare Stream webhooks. |

---

## 4. Distributed Tracing & Correlation IDs

Every inbound request is assigned a unique `X-Correlation-ID` (or `X-Request-ID`):
1. **Edge Propagation**: Cloudflare passes `CF-Ray` or the client's `X-Correlation-ID`. If missing, NestJS generates a unique ULID request ID.
2. **Context Binding**: Stored in Node.js `AsyncLocalStorage` so all database queries, BullMQ job dispatches, and log statements inherit the correlation ID automatically.
3. **OpenTelemetry Integration**: Traces span across HTTP controllers, Drizzle ORM queries, Redis cache lookups, and external HTTP calls (Cloudflare Stream, Anthropic Claude).

---

## 5. Health Checks & Probes

Health checks are managed via `@nestjs/terminus` exposed under the `/health` prefix:

- **Liveness Probe (`GET /health/liveness`)**:
  - Validates that the Node.js event loop is responding.
  - Returns `200 OK` (`{ status: "ok" }`). Used by container orchestrators (ECS/K8s) to restart dead pods.
- **Readiness Probe (`GET /health/readiness`)**:
  - Checks connectivity to **MySQL** (`SELECT 1`).
  - Checks connectivity to **Redis** (`PING`).
  - Checks available disk storage and memory thresholds.
  - If any critical dependency is unreachable, returns `503 Service Unavailable`, preventing the load balancer from routing customer traffic to this instance.
