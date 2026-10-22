# 13. SHORTREEL — ANALYTICS & EVENT STREAM ARCHITECTURE

> **Document ID:** SR-ARCH-13  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. High-Velocity Analytics Principles

A vertical video platform generating millions of episode views and interactive choices produces massive telemetry volume. A single user binging 10 episodes generates 80–120 telemetry events (start, 25%, 50%, 75%, 100%, choices, likes, shares, heartbeats).

**Architectural Law:** High-volume analytics telemetry is **strictly decoupled from transactional MySQL tables**.
- Synchronous direct row inserts into relational tables for raw analytics events are forbidden.
- Telemetry is ingested through a lightweight edge endpoint, buffered in **Redis Streams**, and processed asynchronously.

---

## 2. Event Pipeline Topology

```text
┌───────────────────────┐
│     Client Player     │ (Batches 5–10 events in background)
└───────────┬───────────┘
            │ POST /api/v1/analytics/events
            ▼
┌───────────────────────┐
│   Ingestion Gateway   │ (Stateless NestJS Ingestion Controller)
│  - Payload Validation │
│  - Returns 202 Accepted instantly (<5ms)
└───────────┬───────────┘
            │ XADD stream:analytics
            ▼
┌───────────────────────┐
│     Redis Stream      │ (In-memory buffer with 24h retention)
└───────────┬───────────┘
            │ Consumer Groups (BullMQ / Node workers)
            ▼
┌───────────────────────┐
│  Stream Worker Pool   │
│  - Validates schema   │
│  - Computes rollups   │
└───────────┬───────────┘
            │
      ┌─────┴─────────────────────────────┐
      │ (Aggregated Summaries)            │ (Raw Batches / Parquet)
      ▼                                   ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│  MySQL Operational DB     │   │ Future OLAP Warehouse     │
│  - `business_metrics`     │   │ - ClickHouse / BigQuery   │
│  - `story_signals`        │   │ - Long-term retention     │
│  - Fast dashboard reads   │   │ - Deep machine learning   │
└───────────────────────────┘   └───────────────────────────┘
```

---

## 3. Canonical Event Taxonomy & Schema

Every analytics event conforms to a standardized JSON schema:

```json
{
  "eventId": "01HTXYZ123456789ABCDEFGHJK",
  "eventName": "VIDEO_25_PERCENT",
  "userId": "01HTUSER...",
  "sessionId": "sess-9a8b7c6d-5e4f",
  "timestamp": "2026-09-29T08:35:12.450Z",
  "platform": "PWA_ANDROID",
  "appVersion": "1.4.0",
  "context": {
    "storyId": "01HTSTORY...",
    "seasonNumber": 1,
    "episodeId": "01HTEP...",
    "episodeNumber": 4,
    "nodeId": "01HTNODE...",
    "choiceId": null
  },
  "metrics": {
    "playbackTimeSec": 22.5,
    "totalDurationSec": 90.0,
    "bufferEvents": 0,
    "bitrateKbps": 2400
  },
  "metadata": {
    "referrer": "home_feed",
    "networkType": "5g"
  }
}
```

### 3.1 Standard Platform Event Types

| Event Category | Canonical Event Name | Trigger Condition |
| :--- | :--- | :--- |
| **Video Telemetry** | `VIDEO_STARTED` | First frame renders |
| | `VIDEO_25_PERCENT` | Playback passes 25% duration |
| | `VIDEO_50_PERCENT` | Playback passes 50% duration |
| | `VIDEO_75_PERCENT` | Playback passes 75% duration |
| | `VIDEO_COMPLETED` | Playback reaches end of episode |
| | `VIDEO_STALLED` | Player rebuffering occurs |
| **Interactive** | `CHOICE_OFFERED` | Interactive overlay triggers on screen |
| | `CHOICE_SELECTED` | User commits branch option |
| | `VOTE_CAST` | Community poll vote submitted |
| | `PREDICTION_PLACED`| Prediction bet entered |
| **Engagement** | `STORY_SHARED` | Native or custom share link generated |
| | `EPISODE_LIKED` | Heart button activated |
| | `CHARACTER_FOLLOWED`| Follow button toggled on character |
| **Monetisation** | `PAYWALL_VIEWED` | VIP overlay shown on premium episode |
| | `CHECKOUT_STARTED` | User taps "Unlock with VIP Access" |
| | `SUBSCRIPTION_STARTED`| Successful subscription activation |
| | `SUBSCRIPTION_CANCELLED`| User initiates cancellation |

---

## 4. Operational Aggregate Tables vs. OLAP Seam

1. **MySQL Operational Aggregates:**
   Workers compute 5-minute, hourly, and daily rollups into MySQL summary tables (`business_metrics`, `story_signals`) so admin and creator dashboards render in `<10ms` without scanning billions of raw rows.
2. **Future OLAP Seam:**
   Raw telemetry buffered in Redis Streams is micro-batched into S3/R2 storage in Parquet format every 15 minutes. This provides an immediate plug-and-play connector for **ClickHouse** or **BigQuery** without requiring any architectural rework in the NestJS application.
