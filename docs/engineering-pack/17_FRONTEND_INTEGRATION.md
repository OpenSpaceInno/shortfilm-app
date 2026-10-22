# 17. SHORTREEL — FRONTEND INTEGRATION

> **Reference:** `docs/architecture/27_FRONTEND_INTEGRATION.md`

## API Client

Generate TypeScript API client from OpenAPI schema (Swagger):
- Use openapi-typescript-codegen or orval
- All API types are derived from server DTOs — never manually maintained on the frontend

## Authentication Handling

- Access token stored in memory (React context/Zustand store) — NEVER localStorage
- Refresh token in HttpOnly cookie — browser sends automatically
- On 401 response: auto-call POST /auth/refresh, retry original request once
- On refresh failure: redirect to /login, clear auth state

## Standard Request Pattern

`	ypescript
// All API calls use shared axios instance with interceptors:
// - Inject Authorization: Bearer {accessToken}
// - On 401 → refresh flow
// - On network error → show toast
`

## Pagination

- List endpoints use cursor-based pagination
- Frontend uses next cursor from meta.cursor for infinite scroll
- Admin views use page/offset for total count display

## Video Playback Integration

1. Fetch signed HLS URL from GET /episodes/:id/stream
2. Load into HLS.js or Video.js player
3. Track progress locally, sync to POST /engagement/progress every 30s
4. On 85% completion: check hasChoice flag from stream response
5. If hasChoice=true: fetch GET /episodes/:id/choices, display overlay
6. On choice select: POST /interactive/choices, update player with destination URL

## Real-time Notifications

Phase 1: Poll GET /notifications/unread-count every 60 seconds
Phase 2: WebSocket connection for real-time badge/notification updates (future)

## Optimistic Updates

Applied for: choice selection, likes, follows, predictions
If server returns error: roll back optimistic state and show error toast

## Error Handling

All error responses use standard envelope { success: false, error: { code, message, requestId } }
Frontend maps error.code to user-friendly messages.
