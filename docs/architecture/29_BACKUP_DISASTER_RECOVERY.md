# 29. SHORTREEL — BACKUP & DISASTER RECOVERY ARCHITECTURE

> **Document ID:** SR-ARCH-29  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Objectives & Target Resilience SLA

The ShortReel backup and disaster recovery architecture safeguards consumer watch state, creator IP, and financial transactions against catastrophic failure, regional cloud outages, and malicious data corruption.

### Proposed Target Recovery Objectives (Subject to Executive Sign-off)

| Target Metric | Proposed Target | Operational Definition | Status |
| :--- | :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | **<= 15 Minutes** | Maximum acceptable data loss window during catastrophic total infrastructure loss. Supported by continuous binlog replication. | **PROPOSED TARGET — EXECUTIVE SIGN-OFF REQUIRED** |
| **RTO (Recovery Time Objective)** | **<= 60 Minutes** | Maximum allowable downtime before secondary environment restored and live traffic routed. | **PROPOSED TARGET — EXECUTIVE SIGN-OFF REQUIRED** |

---

## 2. MySQL Database Backup & Point-in-Time Recovery (PITR)

### 2.1 Automated Snapshotting
- **Daily Automated Full Snapshots**: AWS RDS Aurora creates daily full snapshots at 02:00 UTC (lowest global viewer traffic window), retained for 35 days.
- **Continuous Binary Logging (PITR)**: Aurora writes MySQL binary logs to S3 continuously. Enables restoration to **any specific second** within the 35-day backup retention window.
- **Cross-Region Snapshot Replication**: Daily snapshots are encrypted and replicated asynchronously to a secondary disaster recovery region (e.g., Primary: `ap-south-1` Mumbai -> DR: `ap-southeast-1` Singapore).

### 2.2 Quarterly Automated Restore Drills
A recurring automated workflow spins up an isolated staging RDS cluster from a random 7-day-old PITR timestamp, executes integrity check queries against `users`, `stories`, and `subscriptions`, verifies row counts, and tears down the test cluster, recording results in an audit compliance log.

---

## 3. Object Storage & Media Replication

| Asset Tier | Storage Provider | Backup Strategy | Disaster Recovery Mechanism |
| :--- | :--- | :--- | :--- |
| **Video Streams (HLS/DASH)** | Cloudflare Stream | Encoded master copies distributed across Cloudflare's global multi-datacenter network. | Multi-datacenter edge caching. Origin metadata backed up to MySQL. |
| **Images & Posters** | Cloudflare R2 | Object Versioning enabled. Lifecycle rule preserves prior version for 30 days. | Cross-region bucket replication to secondary cloud storage (AWS S3). |
| **Database Dumps & Binlogs** | Amazon S3 | S3 Glacier Flexible Archive for snapshots older than 35 days. | S3 Cross-Region Replication (CRR) with KMS customer-managed key. |

---

## 4. Disaster Recovery Scenarios & Playbooks

```text
                  CATASTROPHIC REGIONAL FAILURE (Primary Region Down)
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │   1. Declare Disaster Event     │
                         │   (Engineering Incident Lead)   │
                         └────────────────┬────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
   ┌─────────────────────────────┐                 ┌─────────────────────────────┐
   │ 2. Restore DB in DR Region  │                 │ 3. Deploy ECS Tasks in DR   │
   │ (Spin up Aurora from latest │                 │ (Spin up NestJS containers  │
   │ cross-region PITR snapshot) │                 │ from ECR image registry)    │
   └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │ 4. Route Edge DNS at Cloudflare │
                         │ (Update origin to DR Load Bal.) │
                         └────────────────┬────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │ 5. Validate Health Checks       │
                         │ (Execute /health/readiness)     │
                         └─────────────────────────────────┘
```

### 4.1 Playbook Execution Steps
1. **Incident Declaration**: Triggered when primary cloud region is completely unreachable for > 15 minutes.
2. **Database Provisioning**: Aurora restores from latest cross-region snapshot in DR region (~25–35 min).
3. **Application Deployment**: ECS task service launched using pre-built Docker images mirrored in multi-region ECR.
4. **Traffic Cutover**: Cloudflare load balancer pool switches origin endpoints to DR Application Load Balancer.
5. **Post-Recovery Verification**: Automated smoke tests verify consumer login, video streaming, and choice resolution before lifting maintenance banners.
