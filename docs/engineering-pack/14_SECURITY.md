# 14. SHORTREEL — SECURITY

> **Document:** 14_SECURITY.md
> **Reference:** docs/architecture/23_SECURITY_ARCHITECTURE.md

## 1. Threat Mitigations

| Threat | Mitigation |
| :--- | :--- |
| SQL Injection | Drizzle ORM parameterized queries only. No raw string concatenation. |
| Broken Auth | Argon2id, RS256 JWT 15min TTL, Redis refresh rotation with reuse detection |
| IDOR/BOLA | ResourceOwnerGuard on all owner-scoped endpoints |
| XSS | Input sanitization via class-validator, strict CSP headers |
| CSRF | SameSite=Strict cookie + Bearer header requirement for mutations |
| DDoS | Cloudflare WAF + Redis sliding-window ThrottlerGuard |
| Sensitive Exposure | @Exclude() on all sensitive DTO fields, no stack traces in API errors |

## 2. Password Security

- Algorithm: Argon2id
- Parameters: m=65536, t=3, p=4
- Min password length: 8 characters
- Breach detection: OPEN — PRODUCT DECISION (HaveIBeenPwned API integration recommended)

## 3. Secrets Management

- Zero secrets in Git repository
- All secrets via environment variables or AWS Secrets Manager
- JWT RS256 private key rotated annually
- Webhook secrets rotated on any suspected exposure

## 4. Encryption at Rest

- MySQL volumes: AES-256 (AWS KMS)
- Object storage: SSE-KMS
- Sensitive columns (bank account, tax IDs): AES-256-GCM at application layer before DB insert

## 5. CORS Policy

`	ypescript
CorsOptions = {
  origin: ['https://shortreel.io', 'https://www.shortreel.io'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}
`

## 6. Rate Limiting

| Endpoint | Limit | Window |
| :--- | :--- | :--- |
| POST /auth/login | 10 requests | 15 minutes per IP |
| POST /auth/refresh | 30 requests | 1 minute per user |
| POST /ai-studio/* | 5 requests | 1 minute per user |
| POST /analytics/events | 500 requests | 1 minute per session |
| General API | 300 requests | 1 minute per user |

## 7. PII Handling

- Email, phone, IP address are PII
- Pino serializers redact PII from logs
- User deletion anonymizes PII (email → anon_hash, name → 'Deleted User')
- Analytics events anonymize user IDs for GDPR compliance
