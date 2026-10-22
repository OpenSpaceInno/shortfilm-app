# 27. SHORTREEL — BACKUP & DISASTER RECOVERY

## RPO/RTO Targets (Proposed — Executive Sign-off Required)

- RPO: <= 15 minutes (continuous binary log replication)
- RTO: <= 60 minutes (cross-region snapshot restore + ECS deploy)

## MySQL Backup Strategy

- Daily automated full snapshots (02:00 UTC) — 35-day retention
- Continuous binary logging → Aurora PITR to any second within 35 days
- Cross-region snapshot replication: ap-south-1 (Mumbai) → ap-southeast-1 (Singapore)
- Quarterly automated restore drills to isolated staging cluster

## Object Storage Backup

- Cloudflare R2: versioning enabled, 30d prior version retention
- Cross-region replication to AWS S3 as secondary
- DB snapshots → S3 Glacier after 35 days

## DR Playbook (Regional Failure)

1. Declare incident if primary region down > 15 min
2. Restore Aurora from latest cross-region PITR snapshot (~30 min)
3. Deploy NestJS ECS tasks from ECR image in DR region
4. Update Cloudflare origin to DR ALB endpoint
5. Validate /health/readiness and run smoke tests
6. Lift maintenance banners
