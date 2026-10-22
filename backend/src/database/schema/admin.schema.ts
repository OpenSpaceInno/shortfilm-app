import {
  mysqlTable,
  varchar,
  text,
  json,
  boolean,
  int,
  datetime,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { timestamps } from './common';
import { users } from './identity.schema';
import { stories } from './content.schema';

/**
 * ============================================================================
 * 1. SYSTEM SETTINGS TABLE
 * Centralized dynamic platform configuration and feature flags
 * ============================================================================
 */
export const settingCategoryEnum = [
  'GENERAL',
  'CONTENT_DEFAULTS',
  'FEATURE_FLAGS',
  'SECURITY',
  'MONETIZATION',
  'NOTIFICATIONS',
  'MODERATION',
] as const;
export type SettingCategory = (typeof settingCategoryEnum)[number];

export const settingValueTypeEnum = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY'] as const;
export type SettingValueType = (typeof settingValueTypeEnum)[number];

export const systemSettings = mysqlTable(
  'system_settings',
  {
    id: primaryUlidKey('id'),
    category: mysqlEnum('category', settingCategoryEnum).notNull().default('GENERAL'),
    key: varchar('key', { length: 128 }).notNull().unique(),
    value: json('value').notNull(),
    valueType: mysqlEnum('value_type', settingValueTypeEnum).notNull().default('STRING'),
    description: text('description'),
    isPublic: boolean('is_public').notNull().default(false),
    updatedBy: foreignUlid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (table) => ({
    idxCategory: index('idx_settings_category').on(table.category),
    idxKey: uniqueIndex('idx_settings_key').on(table.key),
    idxIsPublic: index('idx_settings_is_public').on(table.isPublic),
  }),
);

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

/**
 * ============================================================================
 * 2. MODERATION REPORTS TABLE
 * User moderation and flagged content/violation reporting queue
 * ============================================================================
 */
export const reportTargetTypeEnum = ['STORY', 'EPISODE', 'USER', 'COMMENT', 'VIDEO'] as const;
export type ModerationReportTargetType = (typeof reportTargetTypeEnum)[number];

export const reportReasonEnum = [
  'SPAM',
  'HARASSMENT',
  'HATE_SPEECH',
  'EXPLICIT_CONTENT',
  'COPYRIGHT',
  'MISINFORMATION',
  'VIOLENCE',
  'OTHER',
] as const;
export type ModerationReportReason = (typeof reportReasonEnum)[number];

export const reportStatusEnum = ['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'] as const;
export type ModerationReportStatus = (typeof reportStatusEnum)[number];

export const resolutionActionEnum = [
  'NO_ACTION',
  'CONTENT_REMOVED',
  'CONTENT_WARNING',
  'USER_WARNED',
  'USER_SUSPENDED',
  'USER_BANNED',
  'DISMISSED',
] as const;
export type ResolutionAction = (typeof resolutionActionEnum)[number];

export const moderationReports = mysqlTable(
  'moderation_reports',
  {
    id: primaryUlidKey('id'),
    reporterUserId: foreignUlid('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
    targetType: mysqlEnum('target_type', reportTargetTypeEnum).notNull(),
    targetId: foreignUlid('target_id').notNull(),
    reason: mysqlEnum('reason', reportReasonEnum).notNull(),
    details: text('details'),
    status: mysqlEnum('status', reportStatusEnum).notNull().default('PENDING'),
    resolutionAction: mysqlEnum('resolution_action', resolutionActionEnum),
    resolutionNotes: text('resolution_notes'),
    resolvedBy: foreignUlid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: datetime('resolved_at', { mode: 'date', fsp: 3 }),
    ...timestamps,
  },
  (table) => ({
    idxTarget: index('idx_rep_target').on(table.targetType, table.targetId),
    idxStatus: index('idx_rep_status').on(table.status),
    idxCreatedAt: index('idx_rep_created_at').on(table.createdAt),
    idxReporter: index('idx_rep_reporter').on(table.reporterUserId),
  }),
);

export type ModerationReport = typeof moderationReports.$inferSelect;
export type InsertModerationReport = typeof moderationReports.$inferInsert;

/**
 * ============================================================================
 * 3. FEATURED CURATIONS TABLE
 * Editorial content curation, carousels, home highlights & staff picks
 * ============================================================================
 */
export const curationCollectionTypeEnum = [
  'HOME_HERO',
  'TRENDING_CURATED',
  'EDITOR_PICK',
  'TOP_10',
  'GENRE_SPOTLIGHT',
] as const;
export type CurationCollectionType = (typeof curationCollectionTypeEnum)[number];

export const featuredCurations = mysqlTable(
  'featured_curations',
  {
    id: primaryUlidKey('id'),
    storyId: foreignUlid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    collectionType: mysqlEnum('collection_type', curationCollectionTypeEnum)
      .notNull()
      .default('EDITOR_PICK'),
    displayOrder: int('display_order').notNull().default(0),
    badge: varchar('badge', { length: 64 }),
    customHeadline: varchar('custom_headline', { length: 255 }),
    isActive: boolean('is_active').notNull().default(true),
    startsAt: datetime('starts_at', { mode: 'date', fsp: 3 }),
    endsAt: datetime('ends_at', { mode: 'date', fsp: 3 }),
    curatedBy: foreignUlid('curated_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => ({
    idxCollection: index('idx_cur_collection').on(table.collectionType, table.isActive, table.displayOrder),
    idxStory: index('idx_cur_story').on(table.storyId),
  }),
);

export type FeaturedCuration = typeof featuredCurations.$inferSelect;
export type InsertFeaturedCuration = typeof featuredCurations.$inferInsert;

/**
 * ============================================================================
 * 4. AUDIT LOGS TABLE
 * Immutable governance audit trail of all administrative and privileged actions
 * Ref: 04_DATABASE_SCHEMA.md & 19_ADMIN_CMS.md
 * ============================================================================
 */
export const auditLogs = mysqlTable(
  'audit_logs',
  {
    id: primaryUlidKey('id'),
    actorId: foreignUlid('actor_id').notNull(),
    actorRole: varchar('actor_role', { length: 50 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: foreignUlid('entity_id'),
    previousState: json('previous_state'),
    newState: json('new_state'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    requestId: varchar('request_id', { length: 100 }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    idxActor: index('idx_audit_actor').on(table.actorId, table.createdAt),
    idxEntity: index('idx_audit_entity').on(table.entityType, table.entityId),
    idxAction: index('idx_audit_action').on(table.action),
  }),
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
