# 23. SHORTREEL — SECURITY & COMPLIANCE ARCHITECTURE

> **Document ID:** SR-ARCH-23  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Security Architecture Principles

Security is designed into ShortReel from the baseline, adhering to **defense-in-depth**, **least privilege**, and **zero-trust** principles.

> [!IMPORTANT]
> **Data Privacy & Redaction Mandate**:
> Passwords, refresh token secrets, payment card details, creator banking/tax data, and internal administrative audit trails must **NEVER** be exposed in API responses, error messages, or application logs.

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                EDGE PROTECTION & CDN (Cloudflare)           │
 │   - TLS 1.3 Strict       - WAF / DDoS Mitigation            │
 │   - IP Rate Limiting     - Bot Protection                   │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                 API GATEWAY & REVERSE PROXY                 │
 │   - CORS Policy          - Secure Headers (Helmet)          │
 │   - Content Security Policy (CSP)                           │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  APPLICATION LAYER (NestJS)                 │
 │   - JWT RS256 Validation - RBAC & Resource Ownership Guards │
 │   - Class-Validator DTOs - Parameterized ORM Queries (Drizzle)
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │               DATABASE & STORAGE (MySQL & S3)               │
 │   - TLS Encrypted Transit - AES-256 Encryption at Rest      │
 │   - VPC Private Subnets  - Strict Database User Permissions │
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. Threat Vector Mitigations & OWASP Alignment

| Threat Vector | Attack Scenario | Architectural Mitigation |
| :--- | :--- | :--- |
| **SQL Injection** | Attacker inserts SQL fragments into search or choice endpoints. | **100% Parameterized Queries**: Drizzle ORM uses prepared statements exclusively. Raw dynamic SQL string concatenation is strictly prohibited by lint rules. |
| **Broken Authentication** | Credential stuffing, brute-forcing, token replay. | **Argon2id Password Hashing** (`m=65536, t=3, p=4`). **JWT RS256** (15-min TTL) paired with **Single-Use Refresh Token Rotation** stored in Redis with reuse detection. |
| **Broken Object Level Auth (BOLA/IDOR)** | User attempts to update another user's choice or creator's story. | **Ownership Guards**: NestJS `@UseGuards(ResourceOwnerGuard)` asserts `request.user.id === resource.owner_id` or user possesses `SUPER_ADMIN` override. |
| **Cross-Site Scripting (XSS)** | Malicious HTML/JS injected into character bios or review comments. | **Strict Input Sanitization**: DTOs use `class-validator` and `DOMPurify`. Context-aware output encoding in React/Lovable. Strict CSP headers. |
| **Cross-Site Request Forgery (CSRF)** | Malicious site triggers state-changing actions via ambient cookies. | **SameSite=Strict Cookies**: Refresh tokens stored in `HttpOnly, Secure, SameSite=Strict` cookies. State-changing APIs require `Bearer` token in `Authorization` header. |
| **Sensitive Data Exposure** | Password hashes or bank credentials leaked in API output. | **Class-Transformer `@Exclude()`**: Entity-to-DTO transformation strips internal fields (`password_hash`, `payout_account_details`, `deleted_at`). |
| **DDoS & Resource Exhaustion** | Heavy traffic floods video upload or AI generation endpoints. | **Multi-tier Rate Limiting**: Global Cloudflare rate limiting + Redis sliding-window `ThrottlerGuard` in NestJS (e.g. max 5 AI generation calls/minute). |

---

## 3. Cryptography & Key Management

### 3.1 Encryption in Transit & at Rest
- **Transit**: TLS 1.3 enforced across all public endpoints and internal VPC network communications between NestJS, MySQL, and Redis.
- **At Rest**:
  - MySQL database volumes encrypted using **AES-256** (AWS KMS / Cloud KMS).
  - Object storage (S3 / R2) encrypted using server-side encryption with KMS-managed keys (`SSE-KMS`).
  - Sensitive columns (creator bank account numbers, tax identifiers) encrypted at the application level using **AES-GCM-256** before database insertion.

### 3.2 Secrets Management
- Zero secrets committed to Git repositories.
- Production secrets (DB credentials, JWT private keys, AI API keys, payment webhook secrets) injected at runtime via cloud secrets managers (AWS Secrets Manager / Vault / Doppler).

---

## 4. Audit Logging & Governance

All security-sensitive operations are durably written to the `audit_logs` table:
- **Tracked Actions**:
  - Authentication events: Login, Logout, Failed login (> 5 consecutive attempts triggers security alert).
  - Editorial actions: Story publish, story archive, branch deletion.
  - Creator actions: Submission, status change, tier change, payout account modification.
  - Financial actions: Payout batch approval, refund issuance, subscription override.
- **Audit Schema**:
  - `id`: ULID `BINARY(16)`
  - `actor_id`: `BINARY(16)` (ID of the initiating user)
  - `actor_role`: `VARCHAR(32)`
  - `action`: `VARCHAR(64)` (e.g. `STORY_PUBLISHED`, `PAYOUT_APPROVED`)
  - `entity_type`: `VARCHAR(64)`
  - `entity_id`: `BINARY(16)`
  - `previous_state`: `JSON`
  - `new_state`: `JSON`
  - `ip_address`: `VARCHAR(45)`
  - `user_agent`: `VARCHAR(255)`
  - `created_at`: `DATETIME` (UTC)
