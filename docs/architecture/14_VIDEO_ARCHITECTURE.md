# 14. SHORTREEL — VIDEO & MEDIA INFRASTRUCTURE

> **Document ID:** SR-ARCH-14  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  
> **Primary Provider:** Cloudflare Stream (HLS/DASH Adaptive Vertical Video)  
> **Static Media Storage:** Cloudflare R2 / AWS S3  

---

## 1. End-to-End Video Lifecycle Pipeline

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CREATOR INGESTION FLOW                          │
│                                                                        │
│ 1. Creator Studio requests direct upload URL:                          │
│    POST /api/v1/creators/episodes/:id/upload-url                       │
│                           │                                            │
│                           ▼                                            │
│ 2. NestJS VideoService requests authenticated direct upload from       │
│    Cloudflare Stream API (TUS Resumable Protocol)                      │
│                           │                                            │
│                           ▼                                            │
│ 3. Client uploads MP4 directly to Cloudflare edge (zero server proxy) │
│                           │                                            │
│                           ▼                                            │
│ 4. Cloudflare encodes 9:16 Adaptive Bitrate HLS profiles               │
│                           │                                            │
│                           ▼                                            │
│ 5. Cloudflare sends webhook: POST /api/v1/webhooks/video/ready         │
│                           │                                            │
│                           ▼                                            │
│ 6. NestJS records video duration, dimensions, manifests in `videos`    │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        CONSUMER STREAMING FLOW                         │
│                                                                        │
│ 1. Consumer player requests episode playback:                          │
│    GET /api/v1/episodes/:id/stream                                     │
│                           │                                            │
│                           ▼                                            │
│ 2. NestJS evaluates entitlement: Is episode free OR user active VIP?   │
│                           │                                            │
│                           ▼                                            │
│ 3. NestJS mints signed, time-limited Playback Token (RS256 JWT, 2h)   │
│                           │                                            │
│                           ▼                                            │
│ 4. Client streams vertical video directly from Cloudflare Global CDN:  │
│    https://videodelivery.net/<TOKEN>/manifest/video.m3u8               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Encoding Profiles for Vertical Mobile (9:16)

Because ShortReel is consumed on mobile screens across varying network conditions (5G, 4G, congested Wi-Fi), every episode is encoded into 4 adaptive bitrate vertical renditions:

| Rendition | Resolution (Width × Height) | Video Bitrate | Audio Bitrate | Target Network Profile |
| :--- | :--- | :--- | :--- | :--- |
| **1080p Portrait** | `1080 × 1920` | `3,200 kbps` | `128 kbps AAC` | High-speed Wi-Fi / 5G |
| **720p Portrait** | `720 × 1280` | `1,800 kbps` | `128 kbps AAC` | Standard 4G / LTE |
| **480p Portrait** | `480 × 854` | `900 kbps` | `96 kbps AAC` | Moderate / Congested 4G |
| **360p Portrait** | `360 × 640` | `450 kbps` | `64 kbps AAC` | Weak cellular / 3G fallback |

- **Container & Codecs:** H.264 (AVC) baseline profile for 100% universal device playback; H.265/HEVC where hardware decoding is supported.
- **Audio Profile:** Stereo AAC-LC, normalized to **-14 LUFS** (standard mobile streaming loudness).

---

## 3. Security, Token Gating & Anti-Piracy

1. **Signed Playback Tokens:**
   - Raw video manifests (`.m3u8`) cannot be opened publicly without a valid cryptographic token.
   - The NestJS backend signs an HMAC/RS256 token encoding the `userId`, `videoId`, and `exp` (expiration timestamp).
   - If an unauthorized user attempts to play a VIP video directly, the CDN edge returns HTTP `403 Forbidden`.
2. **Domain & Referrer Locking:**
   - Cloudflare Stream is configured with strict CORS and Allowed Origins (`https://shortreel.tv`, `tv.shortreel.app`, Capacitor custom schemes), preventing embedding in third-party pirate websites.
3. **Dynamic Watermarking:**
   - For sensitive pre-release screener versions in the editorial submission queue, the player overlays a subtle semi-transparent watermark containing the reviewer's user ID.
