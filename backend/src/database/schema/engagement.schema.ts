import {
  mysqlTable,
  varchar,
  text,
  datetime,
  date,
  int,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';

import { sql } from 'drizzle-orm';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { users } from './identity.schema';
import { episodes } from './content.schema';
import { storyVersions } from './interactive.schema';

/**
 * Watch Progress table - mutable current viewing state per (user, episode)
 */
export const watchProgress = mysqlTable(
  'watch_progress',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    episodeId: foreignUlid('episode_id')
      .notNull()
      .references(() => episodes.id, { onDelete: 'cascade' }),
    progressSeconds: int('progress_seconds').default(0).notNull(),
    completed: boolean('completed').default(false).notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    uqWpUserEpisode: uniqueIndex('uq_wp_user_episode').on(table.userId, table.episodeId),
    idxWpContinue: index('idx_wp_continue').on(table.userId, table.updatedAt),
  }),
);

export type WatchProgress = typeof watchProgress.$inferSelect;
export type NewWatchProgress = typeof watchProgress.$inferInsert;

/**
 * Watch History table - append-only completed viewing ledger
 */
export const watchHistory = mysqlTable(
  'watch_history',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    episodeId: foreignUlid('episode_id')
      .notNull()
      .references(() => episodes.id, { onDelete: 'restrict' }),
    storyVersionId: foreignUlid('story_version_id')
      .references(() => storyVersions.id, { onDelete: 'set null' }),
    watchedAt: datetime('watched_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    idxWhUser: index('idx_wh_user').on(table.userId, table.watchedAt),
  }),
);

export type WatchHistory = typeof watchHistory.$inferSelect;
export type NewWatchHistory = typeof watchHistory.$inferInsert;

/**
 * XP Ledger table - transaction ledger tracking gamification and engagement experience points
 */
export const xpLedger = mysqlTable(
  'xp_ledger',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 100 }).notNull(),
    points: int('points').notNull(),
    referenceId: foreignUlid('reference_id'),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    idxXpUser: index('idx_xp_user').on(table.userId),
    idxXpUserPoints: index('idx_xp_user_points').on(table.userId, table.points, table.createdAt),
  }),
);

export type XpLedger = typeof xpLedger.$inferSelect;
export type NewXpLedger = typeof xpLedger.$inferInsert;

/**
 * Badges table - definition of unlockable achievement badges
 */
export const badges = mysqlTable('badges', {
  id: primaryUlidKey('id'),
  slug: varchar('slug', { length: 50 }).notNull().unique('uq_badge_slug'),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  iconUrl: varchar('icon_url', { length: 500 }),
  category: varchar('category', { length: 50 }).notNull(),
  criteriaType: varchar('criteria_type', { length: 50 }).notNull(),
  criteriaValue: int('criteria_value').notNull(),
  xpReward: int('xp_reward').default(0).notNull(),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;

/**
 * User Badges table - earned achievement badge records per user
 */
export const userBadges = mysqlTable(
  'user_badges',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    badgeId: foreignUlid('badge_id')
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),
    unlockedAt: datetime('unlocked_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    uqUserBadge: uniqueIndex('uq_user_badge').on(table.userId, table.badgeId),
    idxUserBadgesUser: index('idx_user_badges_user').on(table.userId),
  }),
);

export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;

/**
 * User Streaks table - consecutive daily engagement activity tracking per user
 */
export const userStreaks = mysqlTable(
  'user_streaks',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique('uq_us_user'),
    currentStreak: int('current_streak').default(0).notNull(),
    longestStreak: int('longest_streak').default(0).notNull(),
    lastActivityDate: date('last_activity_date', { mode: 'string' }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    idxStreakUser: index('idx_streak_user').on(table.userId),
  }),
);

export type UserStreak = typeof userStreaks.$inferSelect;
export type NewUserStreak = typeof userStreaks.$inferInsert;


