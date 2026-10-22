# 31. SHORTREEL — PERFORMANCE TARGETS

## API SLA Targets (P95, measured at ALB)

| Endpoint | P95 SLA |
| :--- | :--- |
| GET /stories (feed) | < 80ms (Redis cached) |
| GET /episodes/:id/stream | < 120ms (entitlement check + Cloudflare sign) |
| POST /interactive/choices | < 60ms (transaction commit) |
| POST /engagement/progress | < 40ms (upsert) |
| GET /business/metrics | < 200ms (Redis cached) |
| POST /auth/login | < 500ms (Argon2id hash verification) |

## Database Query Targets

- All indexed lookups: < 5ms
- Analytics aggregation: < 100ms (pre-computed)
- No unbounded table scans in production
- Every EXPLAIN must show index usage (no type=ALL on tables > 10k rows)

## Caching Strategy

- Redis L1: Story feeds, search, business metrics, story graphs (10-60 min TTL)
- CDN: Public story thumbnails, posters, creator avatars (Cloudflare CDN, long TTL + versioned URLs)
- No server-side caching of authentication tokens (security boundary)

## Load Targets (initial)

- 10,000 concurrent active viewers
- 500 concurrent subscribers
- 100,000 analytics events/hour
- 50 concurrent AI generation jobs
