import {
  mysqlTable,
  varchar,
  mysqlEnum,
  datetime,
  text,
  bigint,
  int,
  boolean,
  primaryKey,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { timestamps, softDelete } from './common';
import { creators } from './creator.schema';

export const StoryStatusEnum = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'PUBLISHED',
  'ARCHIVED',
] as const;
export type StoryStatus = (typeof StoryStatusEnum)[number];

export const VideoStatusEnum = [
  'UPLOADING',
  'PROCESSING',
  'READY',
  'FAILED',
] as const;
export type VideoStatus = (typeof VideoStatusEnum)[number];

/**
 * Genres table - canonical story genres
 */
export const genres = mysqlTable('genres', {
  id: primaryUlidKey('id'),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique('uq_genre_slug'),
  icon: varchar('icon', { length: 100 }),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

/**
 * Tags table - flexible discovery tags
 */
export const tags = mysqlTable('tags', {
  id: primaryUlidKey('id'),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique('uq_tag_slug'),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

/**
 * Stories table - top-level interactive short series entity
 */
export const stories = mysqlTable(
  'stories',
  {
    id: primaryUlidKey('id'),
    creatorId: foreignUlid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 255 }).notNull(),
    synopsis: text('synopsis').notNull(),
    premise: text('premise'),
    status: mysqlEnum('status', StoryStatusEnum).default('DRAFT').notNull(),
    language: varchar('language', { length: 10 }).default('en').notNull(),
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    posterUrl: varchar('poster_url', { length: 500 }),
    contentRating: varchar('content_rating', { length: 20 }),
    targetAudience: varchar('target_audience', { length: 50 }),
    viewCount: bigint('view_count', { mode: 'number' }).default(0).notNull(),
    publishedAt: datetime('published_at', { mode: 'date', fsp: 3 }),
    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    idxStoriesCreator: index('idx_stories_creator').on(table.creatorId),
    idxStoriesStatus: index('idx_stories_status').on(table.status),
    idxStoriesPublished: index('idx_stories_published').on(table.publishedAt),
    idxStoriesStatusPublished: index('idx_stories_status_published').on(table.status, table.publishedAt),
  }),
);

/**
 * Story Genres junction table
 */
export const storyGenres = mysqlTable(
  'story_genres',
  {
    storyId: foreignUlid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    genreId: foreignUlid('genre_id')
      .notNull()
      .references(() => genres.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.storyId, table.genreId] }),
  }),
);

/**
 * Story Tags junction table
 */
export const storyTags = mysqlTable(
  'story_tags',
  {
    storyId: foreignUlid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    tagId: foreignUlid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.storyId, table.tagId] }),
  }),
);

/**
 * Seasons table - ordered grouping of episodes within a story
 */
export const seasons = mysqlTable(
  'seasons',
  {
    id: primaryUlidKey('id'),
    storyId: foreignUlid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    seasonNumber: int('season_number').notNull(),
    synopsis: text('synopsis'),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    idxSeasonStory: index('idx_season_story').on(table.storyId),
  }),
);

/**
 * Episodes table - individual video / interactive node unit
 */
export const episodes = mysqlTable(
  'episodes',
  {
    id: primaryUlidKey('id'),
    seasonId: foreignUlid('season_id')
      .notNull()
      .references(() => seasons.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    episodeNumber: int('episode_number').notNull(),
    synopsis: text('synopsis'),
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    isFree: boolean('is_free').default(false).notNull(),
    publishedAt: datetime('published_at', { mode: 'date', fsp: 3 }),
    ...timestamps,
  },
  (table) => ({
    idxEpisodeSeason: index('idx_episode_season').on(table.seasonId),
    idxEpisodeSeasonNumber: index('idx_episodes_season_number').on(table.seasonId, table.episodeNumber),
  }),
);

/**
 * Videos table - video delivery provider details (Cloudflare Stream)
 */
export const videos = mysqlTable('videos', {
  id: primaryUlidKey('id'),
  episodeId: foreignUlid('episode_id')
    .notNull()
    .references(() => episodes.id, { onDelete: 'cascade' })
    .unique('uq_video_episode'),
  provider: varchar('provider', { length: 50 }).default('CLOUDFLARE_STREAM').notNull(),
  providerUid: varchar('provider_uid', { length: 255 }),
  status: mysqlEnum('status', VideoStatusEnum).default('UPLOADING').notNull(),
  durationSeconds: int('duration_seconds'),
  width: int('width'),
  height: int('height'),
  playbackUrl: varchar('playback_url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  ...timestamps,
});

/**
 * Characters table - dramatis personae of a story
 */
export const characters = mysqlTable('characters', {
  id: primaryUlidKey('id'),
  storyId: foreignUlid('story_id')
    .notNull()
    .references(() => stories.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  bio: text('bio'),
  roleDesc: varchar('role_desc', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;
export type Episode = typeof episodes.$inferSelect;
export type NewEpisode = typeof episodes.$inferInsert;
export type Genre = typeof genres.$inferSelect;
export type NewGenre = typeof genres.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
