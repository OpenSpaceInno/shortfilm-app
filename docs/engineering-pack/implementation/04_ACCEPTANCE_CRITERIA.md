# ACCEPTANCE CRITERIA — DEFINITION OF DONE

## System-Level Criteria (must hold at V1 release)

### Correctness
- All 10 Story Engine invariant tests (ENG-001..ENG-010) pass
- No duplicate choices possible (UNIQUE key enforced + tested)
- No cycles in published story graphs (DAG validation + tested)
- Subscription entitlement correctly gates paid content
- Payment webhooks are idempotent (duplicate delivery handled)
- Refresh token reuse detection revokes all sessions

### Performance
- P95 API latency targets met under simulated load (see 31_PERFORMANCE.md)
- Home feed returns in < 80ms (Redis cached path)
- Choice resolution returns in < 60ms

### Security
- All admin endpoints return 403 for non-admin tokens
- All user-scoped endpoints return 403 for other users' data
- No PII in application logs
- No stack traces in API error responses
- JWT tokens rejected after expiry and after revocation

### Observability
- All 500 errors are logged with correlation ID and stack trace (internal)
- Prometheus metrics endpoint returns valid metrics
- /health/readiness returns 503 when DB or Redis is unreachable

### Data Integrity
- No orphaned records (FK constraints enforced)
- All DECIMAL(12,2) used for financial values (no floating point)
- All timestamps stored in UTC
- Creator earnings never lost across payout state transitions

## Module-Level Criteria

See 03_MODULE_CHECKLIST.md for per-module definition of done.
