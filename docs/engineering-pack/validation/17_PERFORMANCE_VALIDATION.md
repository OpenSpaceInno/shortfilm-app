# 17. SHORTREEL — PERFORMANCE VALIDATION

> **Validation Status:** ✅ READY

## Latency Targets Validation

| Endpoint | Target P95 | Caching | Status |
| :--- | :--- | :--- | :--- |
| GET /stories (home feed) | < 80ms | Redis (TTL 5min) | ✅ |
| GET /stories/:id | < 50ms | Redis (TTL 1min) | ✅ |
| POST /interactive/choices | < 60ms | No cache (write) | ✅ |
| POST /engagement/progress | < 40ms | No cache (write) | ✅ |
| GET /business/metrics | < 100ms | Redis (TTL 1hr) | ✅ |
| GET /search | < 200ms | No cache | ✅ |

## Index Coverage

High-read query patterns mapped to indexes:
- stories by status + published_at → ✅
- episodes by story_id + season_number → ✅
- watch_progress by user_id + episode_id (UNIQUE) → ✅
- user_choices by user_id + choice_id (UNIQUE) → ✅
- xp_ledger by user_id (SUM aggregate) → P2: covering index recommended

## Redis Cache Strategy

User session (roles/permissions): TTL 5min. ✅
Story feed: TTL 5min. ✅
Published story graph: TTL 60min (changes only on publish). ✅
Business metrics: TTL 1hr. ✅

## P2 Issues

**P2-PERF-001:** xp_ledger SUM query (for user's total XP) will grow with user activity. Add Redis counter user:xp:{userId} updated on every INSERT to xp_ledger. Avoid full table scan.

**P2-PERF-002:** watch_history table partition by month (per P2-DB-001) will become necessary beyond 6 months of data.

## Validation Status: ✅ READY
