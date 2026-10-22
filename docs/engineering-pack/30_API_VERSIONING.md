# 30. SHORTREEL — API VERSIONING

## Strategy: URI Path Versioning

All API endpoints are prefixed with /api/v1/
Next version: /api/v2/ (introduced only for breaking changes)

## Compatibility Rules

- Additive changes (new fields, new optional params) → NO version bump → deployed transparently
- Breaking changes (remove fields, change types, restructure responses) → REQUIRE v2 endpoint
- v1 remains operational for minimum 12 months after v2 launch
- Deprecation communicated via Sunset response header

## Breaking Change Protocol

1. Document change in ARCHITECTURE_DECISIONS register (42_ARCHITECTURE_DECISIONS.md)
2. Implement change under /api/v2/ endpoint
3. Add Deprecation and Sunset headers to v1 endpoint
4. Communicate sunset date to all API consumers
5. After sunset date, return 410 Gone from v1 with migration hint

## Swagger

Available at /api/docs (dev/staging only, disabled in production unless explicitly enabled)
Auto-generated from @ApiTags, @ApiOperation, @ApiResponse decorators on all controllers
