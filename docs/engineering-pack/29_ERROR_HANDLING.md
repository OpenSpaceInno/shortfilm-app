# 29. SHORTREEL — ERROR HANDLING

## Standard Error Envelope

`json
{
  "success": false,
  "error": {
    "code": "STORY_VERSION_NOT_PUBLISHED",
    "message": "The requested story version is not published.",
    "requestId": "req_01J8ABCDEF1234567890",
    "details": []
  }
}
`

Never expose: stack traces, SQL errors, internal IDs, raw exception messages.

## HTTP Status → Error Code Mapping

| Status | Code Pattern | Example |
| :--- | :--- | :--- |
| 400 | VALIDATION_ERROR, INVALID_INPUT | CHOICE_OPTION_INVALID |
| 401 | UNAUTHORIZED, TOKEN_EXPIRED | ACCESS_TOKEN_EXPIRED |
| 403 | FORBIDDEN, INSUFFICIENT_PERMISSIONS | SUBSCRIPTION_REQUIRED |
| 404 | NOT_FOUND | STORY_NOT_FOUND, EPISODE_NOT_FOUND |
| 409 | CONFLICT | CHOICE_ALREADY_MADE, EMAIL_ALREADY_EXISTS |
| 422 | UNPROCESSABLE | STORY_GRAPH_CYCLE_DETECTED |
| 429 | RATE_LIMITED | TOO_MANY_REQUESTS |
| 500 | INTERNAL_ERROR | INTERNAL_SERVER_ERROR |
| 503 | SERVICE_UNAVAILABLE | DATABASE_UNAVAILABLE |

## Global Exception Filter

NestJS @Catch() global filter:
- HttpException → map to standard envelope
- UnauthorizedException → 401 + TOKEN_EXPIRED or UNAUTHORIZED
- ForbiddenException → 403 + FORBIDDEN
- NotFoundException → 404 + {entity}_NOT_FOUND
- ConflictException → 409 + specific code
- All other errors → 500 + INTERNAL_ERROR (never expose message)
- All 500s → log to Pino with full stack trace (internal only)
