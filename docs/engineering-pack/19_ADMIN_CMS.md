# 19. SHORTREEL — ADMIN CMS

## Admin Module Responsibilities

| Screen | Module | Key Operations |
| :--- | :--- | :--- |
| Submissions Queue | AdminModule | List, approve, reject, request changes |
| Story Management | StoriesModule | Archive, unpublish, override metadata |
| Creator Management | CreatorsModule | Verify, suspend, tier changes |
| User Management | UsersModule | View, suspend, role management |
| Video Management | VideosModule | Reprocess, delete failed uploads |
| Notifications | NotificationsModule | Create broadcast notifications |
| Analytics | AnalyticsModule | View aggregated metrics |
| Story Lab | StoryLabModule | View signals, manage experiments |
| Business Dashboard | BusinessModule | View KPI rollups |
| Audit Trail | AuditModule | Read-only audit log |

## Authorization

All admin endpoints require JWT + appropriate role guard.
No admin functionality is available without server-side role verification.

## Audit on Every Admin Action

Every admin endpoint that mutates state must call AuditService.log() with:
{ actor, action, entityType, entityId, previousState, newState, requestId }
