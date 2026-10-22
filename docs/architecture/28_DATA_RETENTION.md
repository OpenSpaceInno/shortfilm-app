# 28. SHORTREEL — DATA RETENTION & PURGING ARCHITECTURE

> **Document ID:** SR-ARCH-28  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Retention Policy Overview & Compliance Mandates

ShortReel's data retention architecture balances user experience (resuming progress, viewing historical choices), operational efficiency (preventing runaway MySQL storage costs), and legal compliance (GDPR, CCPA, local data privacy and tax regulations).

> [!IMPORTANT]
> **Open Legal & Compliance Boundaries**:
> Specific statutory periods for tax records and user deletion requests vary across global operating jurisdictions. Where final statutory or executive business policy has not been formally signed off by legal counsel, rules are explicitly documented as **`OPEN — PRODUCT / LEGAL DECISION REQUIRED`**.

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                SCHEDULED RETENTION ENGINE                   │
 │           (Nightly BullMQ Maintenance Workers)              │
 └──────────────────────────────┬──────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
 │  Hard Delete │        │  Soft Delete │        │ Cold Archive │
 │ Transient    │        │ PII Anonymize│        │ Deep Storage │
 │ (Caches/Logs)│        │ (User Deletes│        │ (Financials) │
 └──────────────┘        └──────────────┘        └──────────────┘
```

---

## 2. Entity Retention Schedule & Rules

| Domain Entity | Retention Baseline | Purging / Archival Mechanism | Decision Status |
| :--- | :--- | :--- | :--- |
| **Raw Analytics Events** | 90 Days in Redis/MySQL. Aggregated hourly rollups kept indefinitely in `business_metrics`. | Partition truncation or scheduled batch delete: `DELETE FROM analytics_events WHERE timestamp < NOW() - INTERVAL 90 DAY`. | **RATIFIED** |
| **User Watch Progress** (`watch_progress`) | Active as long as user account exists. Inactive accounts (> 2 years) subject to pruning. | 1 row per User-Episode. Reset upon user explicit action or account closure. | **RATIFIED** |
| **User Watch History** (`watch_history`) | Rolling 180 Days accessible to user in UI. Older records archived or purged. | Scheduled BullMQ worker running in batches during low-traffic windows. | **OPEN — PRODUCT / LEGAL DECISION REQUIRED** |
| **Notifications** (`notifications`) | 60 Days from creation. Read notifications auto-purged after 30 days. | Automated daily TTL sweep: `DELETE FROM notifications WHERE is_read = TRUE AND created_at < NOW() - INTERVAL 30 DAY`. | **RATIFIED** |
| **Audit Logs** (`audit_logs`) | Minimum 7 Years (Compliance & Fraud Investigation standard). | Immutable write-only table. Older records moved to cold Glacier/R2 archive after 1 year. | **OPEN — PRODUCT / LEGAL DECISION REQUIRED** |
| **Creator Earnings & Payouts** (`creator_earnings`) | Minimum 7 to 10 Years (Tax and corporate accounting regulations). | Never purged from primary database or financial cold archives. | **RATIFIED** |
| **Subscription Events** (`subscription_events`) | Permanent transactional record. Retained for duration of business operations. | Stored in MySQL with periodic cold table partitioning. | **RATIFIED** |
| **Deleted User Accounts (GDPR "Right to be Forgotten")** | 30-Day grace period upon request, followed by irreversible PII anonymization. | `email`, `name`, `phone` wiped/hashed (`anon_user_xxxx`). Historical choices and aggregated ratings retained anonymously to preserve story branch statistics. | **OPEN — PRODUCT / LEGAL DECISION REQUIRED** |
| **Raw Creator Video Source Uploads** | Retained for 14 days after transcoding validation; transcode output preserved indefinitely on Cloudflare Stream. | Cloudflare Stream manages transcoded HLS chunks; source temp files purged from R2 scratch bucket after transcode validation. | **RATIFIED** |

---

## 3. Database Purge Implementation Guardrails

To prevent table-level locking and replication lag during batch deletion:
1. **Chunked Deletions**: Deletions run in small batches with sleep intervals:
   ```sql
   REPEAT
     DELETE FROM notifications 
     WHERE is_read = TRUE AND created_at < NOW() - INTERVAL 30 DAY 
     LIMIT 5000;
     DO SLEEP(0.1);
   UNTIL ROW_COUNT() = 0
   END REPEAT;
   ```
2. **Partition Truncation**: High-volume telemetry tables utilize monthly range partitioning by `created_at`, allowing instantaneous drop of expired months (`ALTER TABLE analytics_events DROP PARTITION p_2026_01`) with zero disk I/O locking overhead.
