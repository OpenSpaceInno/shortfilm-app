# 26. SHORTREEL — DATA RETENTION

## Retention Schedule

| Entity | Retention | Mechanism | Status |
| :--- | :--- | :--- | :--- |
| Raw Analytics Events | 90 days | Partition truncation | RATIFIED |
| Watch Progress | Lifetime of account | Manual reset only | RATIFIED |
| Watch History | 180 days accessible; older purged | Nightly BullMQ batch | OPEN — PRODUCT/LEGAL DECISION |
| Notifications (read) | 30 days | Nightly sweep | RATIFIED |
| Notifications (unread) | 60 days | Nightly sweep | RATIFIED |
| Audit Logs | 7 years minimum | Cold archive after 1yr | OPEN — LEGAL DECISION |
| Creator Earnings | 7–10 years | Never purged | RATIFIED |
| Subscription Events | Permanent | Cold partitioning | RATIFIED |
| GDPR User Deletion | 30d grace then anonymize | Anonymization worker | OPEN — LEGAL DECISION |
| Video Source Uploads | 14 days after transcode | Cloudflare R2 lifecycle | RATIFIED |

## Chunked Delete Pattern

`sql
REPEAT
  DELETE FROM notifications WHERE is_read=TRUE AND created_at < NOW()-INTERVAL 30 DAY LIMIT 5000;
  DO SLEEP(0.1);
UNTIL ROW_COUNT()=0
END REPEAT;
`
Prevents table lock during batch deletes.
