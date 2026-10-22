# 12. SHORTREEL — VIDEO VALIDATION

> **Validation Status:** ⚠️ READY WITH CONDITIONS

## Architecture Pattern Validated

MySQL stores video metadata. MySQL does NOT store binaries. ✅
Video infrastructure (transcoding, storage, CDN) is external. ✅
Signed URLs for playback — server-side only. ✅

## Video Provider (ADR-004 — OPEN)

| Provider | TUS Upload | 9:16 Optimization | Signed URLs | Global CDN | NestJS Webhook |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Cloudflare Stream | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mux | ✅ | ✅ | ✅ | ✅ | ✅ |
| AWS S3 + CloudFront | Manual | Manual | ✅ | ✅ | Manual |

Engineering Pack assumes Cloudflare Stream. This is a reasonable default but must be confirmed (ADR-004).

VideoProvider abstraction interface is documented — vendor lock-in mitigated. ✅

## Video Processing Flow

Creator uploads → TUS direct upload → Provider processes → Webhook → NestJS VideoProcessingCompleted → videos.status = READY
Processing statuses: PENDING_UPLOAD → UPLOADING → PROCESSING → READY / FAILED
Validated: ✅

## Signed URL Security

Playback URLs generated server-side in NestJS before returning to client.
TTL: 4 hours (sufficient for a viewer session).
URL not stored in MySQL — generated on demand.
P1: Signing must complete within the 60ms choice resolution SLA window. Confirm async vs sync in flow.

## P1 Issue

**P1-VID-001:** ADR-004 (video provider) must be resolved before M07. Cloudflare Stream assumed — confirm.

## Validation Status: ⚠️ READY WITH CONDITIONS
