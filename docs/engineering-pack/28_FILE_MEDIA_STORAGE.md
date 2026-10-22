# 28. SHORTREEL — FILE & MEDIA STORAGE

## Storage Principles

- NEVER store production video binaries in MySQL BLOB columns
- NEVER proxy large files through NestJS API
- Use S3-compatible object storage (Cloudflare R2 or AWS S3)

## Asset Categories

| Asset Type | Storage | Upload Path | Access |
| :--- | :--- | :--- | :--- |
| Story thumbnails | Cloudflare R2 | Creator uploads via presigned URL | Public CDN |
| Story posters | Cloudflare R2 | Creator uploads via presigned URL | Public CDN |
| Creator avatars | Cloudflare R2 | Creator uploads via presigned URL | Public CDN |
| User profile images | Cloudflare R2 | User uploads via presigned URL | Public CDN |
| Video assets (HLS) | Cloudflare Stream | Creator TUS direct upload | Signed JWT |
| AI-generated assets | Cloudflare R2 | NestJS server uploads | Private / time-limited URL |
| Legal documents | Cloudflare R2 | Admin uploads | Private presigned URL |

## Upload Flow (Images/Files)

1. Client → POST /upload/presigned-url?type={thumbnail}&contentType=image/jpeg
2. NestJS validates file type and size, generates S3 presigned PUT URL
3. Client uploads directly to R2/S3 (NestJS not in data path)
4. Client → PATCH /stories/:id with { thumbnailUrl: 'https://cdn.shortreel.io/...' }

## Allowed File Types

- Images: image/jpeg, image/png, image/webp (max 10MB)
- Documents: application/pdf (max 20MB)
- Video: handled via Cloudflare Stream TUS only
