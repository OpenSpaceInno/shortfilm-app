import {
  systemSettings,
  moderationReports,
  featuredCurations,
  auditLogs,
  settingCategoryEnum,
  settingValueTypeEnum,
  reportTargetTypeEnum,
  reportReasonEnum,
  reportStatusEnum,
  resolutionActionEnum,
  curationCollectionTypeEnum,
} from './admin.schema';

describe('Admin CMS Schema Definitions (M28)', () => {
  it('should define systemSettings table with enums and columns', () => {
    expect(systemSettings).toBeDefined();
    expect(systemSettings.id).toBeDefined();
    expect(systemSettings.key).toBeDefined();
    expect(systemSettings.value).toBeDefined();
    expect(systemSettings.category).toBeDefined();
    expect(systemSettings.isPublic).toBeDefined();

    expect(settingCategoryEnum).toContain('GENERAL');
    expect(settingCategoryEnum).toContain('FEATURE_FLAGS');
    expect(settingCategoryEnum).toContain('CONTENT_DEFAULTS');
    expect(settingCategoryEnum).toContain('MODERATION');

    expect(settingValueTypeEnum).toContain('STRING');
    expect(settingValueTypeEnum).toContain('BOOLEAN');
    expect(settingValueTypeEnum).toContain('NUMBER');
  });

  it('should define moderationReports table with enums and target tracking', () => {
    expect(moderationReports).toBeDefined();
    expect(moderationReports.id).toBeDefined();
    expect(moderationReports.targetType).toBeDefined();
    expect(moderationReports.targetId).toBeDefined();
    expect(moderationReports.reason).toBeDefined();
    expect(moderationReports.status).toBeDefined();

    expect(reportTargetTypeEnum).toContain('STORY');
    expect(reportTargetTypeEnum).toContain('USER');
    expect(reportTargetTypeEnum).toContain('EPISODE');

    expect(reportReasonEnum).toContain('SPAM');
    expect(reportReasonEnum).toContain('HARASSMENT');
    expect(reportReasonEnum).toContain('EXPLICIT_CONTENT');

    expect(reportStatusEnum).toContain('PENDING');
    expect(reportStatusEnum).toContain('RESOLVED');
    expect(reportStatusEnum).toContain('DISMISSED');

    expect(resolutionActionEnum).toContain('USER_SUSPENDED');
    expect(resolutionActionEnum).toContain('CONTENT_REMOVED');
  });

  it('should define featuredCurations table with collection types and ordering', () => {
    expect(featuredCurations).toBeDefined();
    expect(featuredCurations.id).toBeDefined();
    expect(featuredCurations.storyId).toBeDefined();
    expect(featuredCurations.collectionType).toBeDefined();
    expect(featuredCurations.displayOrder).toBeDefined();
    expect(featuredCurations.isActive).toBeDefined();

    expect(curationCollectionTypeEnum).toContain('HOME_HERO');
    expect(curationCollectionTypeEnum).toContain('EDITOR_PICK');
    expect(curationCollectionTypeEnum).toContain('TRENDING_CURATED');
  });

  it('should define auditLogs table conforming to immutable governance architecture', () => {
    expect(auditLogs).toBeDefined();
    expect(auditLogs.id).toBeDefined();
    expect(auditLogs.actorId).toBeDefined();
    expect(auditLogs.actorRole).toBeDefined();
    expect(auditLogs.action).toBeDefined();
    expect(auditLogs.entityType).toBeDefined();
    expect(auditLogs.entityId).toBeDefined();
    expect(auditLogs.previousState).toBeDefined();
    expect(auditLogs.newState).toBeDefined();
    expect(auditLogs.createdAt).toBeDefined();
  });
});
