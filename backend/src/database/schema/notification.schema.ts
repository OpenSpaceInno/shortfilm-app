import {
  mysqlTable,
  varchar,
  datetime,
  boolean,
  text,
  json,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { users } from './identity.schema';

export const NotificationTypeEnum = [
  'STORY_PUBLISHED',
  'EPISODE_PUBLISHED',
  'CHOICE_REMINDER',
  'VOTE_RESULT',
  'PREDICTION_RESOLVED',
  'BADGE_UNLOCKED',
  'XP_MILESTONE',
  'STREAK_REMINDER',
  'SUBSCRIPTION_RENEWED',
  'SUBSCRIPTION_FAILED',
  'CREATOR_APPROVED',
  'SUBMISSION_STATUS_CHANGED',
  'SYSTEM_BROADCAST',
] as const;
export type NotificationType = (typeof NotificationTypeEnum)[number];

export const DevicePlatformEnum = ['WEB', 'ANDROID', 'IOS'] as const;
export type DevicePlatform = (typeof DevicePlatformEnum)[number];

/**
 * Notifications table - in-app user notifications ledger
 */
export const notifications = mysqlTable(
  'notifications',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body').notNull(),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: foreignUlid('reference_id'),
    data: json('data').$type<Record<string, any>>(),
    isRead: boolean('is_read').notNull().default(false),
    readAt: datetime('read_at', { mode: 'date', fsp: 3 }),
    sentPush: boolean('sent_push').notNull().default(false),
    sentEmail: boolean('sent_email').notNull().default(false),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    idxNotifUnread: index('idx_notif_unread').on(table.userId, table.isRead, table.createdAt),
    idxNotifUser: index('idx_notif_user').on(table.userId, table.createdAt),
  }),
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

/**
 * Device tokens table - push notification registration tokens for FCM / APNs
 */
export const deviceTokens = mysqlTable(
  'device_tokens',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 512 }).notNull(),
    platform: mysqlEnum('platform', DevicePlatformEnum).notNull().default('WEB'),
    lastUsedAt: datetime('last_used_at', { mode: 'date', fsp: 3 }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    uqUserToken: uniqueIndex('uq_user_device_token').on(table.userId, table.token),
    idxTokenUser: index('idx_device_token_user').on(table.userId),
  }),
);

export type DeviceToken = typeof deviceTokens.$inferSelect;
export type NewDeviceToken = typeof deviceTokens.$inferInsert;

/**
 * User notification settings / preferences table
 */
export const userNotificationSettings = mysqlTable(
  'user_notification_settings',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    inAppEnabled: boolean('in_app_enabled').notNull().default(true),
    pushEnabled: boolean('push_enabled').notNull().default(true),
    emailEnabled: boolean('email_enabled').notNull().default(true),
    episodesEnabled: boolean('episodes_enabled').notNull().default(true),
    votingEnabled: boolean('voting_enabled').notNull().default(true),
    streaksEnabled: boolean('streaks_enabled').notNull().default(true),
    rewardsEnabled: boolean('rewards_enabled').notNull().default(true),
    marketingEnabled: boolean('marketing_enabled').notNull().default(false),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    uqUserSettings: uniqueIndex('uq_user_notification_settings').on(table.userId),
  }),
);

export type UserNotificationSettings = typeof userNotificationSettings.$inferSelect;
export type NewUserNotificationSettings = typeof userNotificationSettings.$inferInsert;
