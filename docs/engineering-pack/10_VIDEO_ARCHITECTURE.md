# 10. SHORTREEL — VIDEO ARCHITECTURE

> **Document:** `10_VIDEO_ARCHITECTURE.md`  
> **Status:** FROZEN  
> **Provider:** Cloudflare Stream  
> **Reference:** `docs/architecture/14_VIDEO_ARCHITECTURE.md`  

---

## 1. Core Rule

**MySQL stores video metadata only. Binary files are never stored in or proxied through NestJS or MySQL.**

---

## 2. Upload Pipeline

```
Creator Studio UI
     ↓ POST /api/v1/videos/direct-upload-url
     ↓ NestJS calls Cloudflare Stream API → gets TUS upload URL
     ↓ Returns { uploadUrl, videoId (internal ULID) } to client

Creator Browser
     ↓ Uploads binary directly to Cloudflare Stream via TUS protocol
     ↓ (NestJS is NOT in the upload data path)

Cloudflare Stream
     ↓ Receives upload
     ↓ Transcodes to 9:16 multi-bitrate HLS (1080p, 720p, 480p, 360p)
     ↓ POST /api/v1/videos/webhooks/cloudflare (status callback)

NestJS Webhook Handler
     ↓ Validates Cloudflare webhook signature
     ↓ Updates videos table: status=READY, provider_uid, playback_url, thumbnail_url, duration_seconds
     ↓ Emits VIDEO_READY domain event → triggers notifications
```

---

## 3. Video MySQL Schema Fields

| Field | Value |
| :--- | :--- |
| `provider` | `'CLOUDFLARE_STREAM'` |
| `provider_uid` | Cloudflare's UID for the video |
| `status` | `UPLOADING` → `PROCESSING` → `READY` / `FAILED` |
| `playback_url` | HLS manifest URL (requires signed token for access) |
| `duration_seconds` | Populated after transcoding |
| `width` | 1080 |
| `height` | 1920 |
| `thumbnail_url` | Cloudflare-generated thumbnail |

---

## 4. Secure Playback Token

Consumers do NOT receive the raw `playback_url`. They receive a signed JWT:
1. `GET /episodes/:id/stream` validates user entitlement.
2. NestJS calls Cloudflare Stream Signed URL API with RS256 private key.
3. Returns time-limited signed URL (valid 4 hours).
4. Client uses signed URL to stream HLS manifest.

---

## 5. Video Provider Abstraction

```typescript
export interface VideoProvider {
  getDirectUploadUrl(options: UploadOptions): Promise<{ uploadUrl: string; providerUid: string }>;
  generateSignedPlaybackUrl(providerUid: string, expiresInSeconds: number): Promise<string>;
  deleteVideo(providerUid: string): Promise<void>;
  getVideoMetadata(providerUid: string): Promise<VideoMetadata>;
}

export class CloudflareStreamProvider implements VideoProvider { ... }
```

This abstraction means switching to Mux or AWS Elemental requires only a new provider class.

---

## 6. Webhook Idempotency

Cloudflare may deliver the same webhook event multiple times.
Deduplicate using the Cloudflare event ID stored in `webhook_events` table.
Before processing: check `SELECT 1 FROM webhook_events WHERE provider='CLOUDFLARE_STREAM' AND event_id=?`.
If found → return 200 immediately (already processed).
If not found → insert, process, update status.

---

## 7. Video Lifecycle States

```
UPLOADING → (Cloudflare receives first chunk)
PROCESSING → (Cloudflare transcoding in progress)
READY → (HLS available, playback_url populated)
FAILED → (Transcoding failed — creator notified, re-upload required)
```
