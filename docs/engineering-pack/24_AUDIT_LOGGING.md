# 24. SHORTREEL — AUDIT LOGGING

## Audited Actions

`
USER_REGISTERED        USER_SUSPENDED         USER_DELETED
ROLE_GRANTED           ROLE_REVOKED           PASSWORD_CHANGED
STORY_CREATED          STORY_PUBLISHED        STORY_ARCHIVED
STORY_REJECTED         EPISODE_PUBLISHED      VIDEO_DELETED
CREATOR_APPLIED        CREATOR_APPROVED       CREATOR_VERIFIED
CREATOR_SUSPENDED      CREATOR_REJECTED       SUBMISSION_APPROVED
SUBMISSION_REJECTED    PAYOUT_APPROVED        SUBSCRIPTION_OVERRIDDEN
EXPERIMENT_CREATED     EXPERIMENT_STARTED     INSIGHT_ACCEPTED
SETTINGS_CHANGED       ADMIN_LOGIN
`

## AuditService

`	ypescript
class AuditService {
  async log(params: {
    actorId: string;
    actorRole: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    requestId: string;
    ipAddress?: string;
  }): Promise<void>
}
`

Called via NestJS interceptor on all admin mutations, or explicitly in service methods for business-critical actions.

## Audit Log Retention

Minimum 7 years. Table uses monthly partitioning for efficient archival.
Records older than 1 year moved to cold storage (S3 Glacier).
