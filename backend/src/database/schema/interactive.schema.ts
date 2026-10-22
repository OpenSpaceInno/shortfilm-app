import {
  mysqlTable,
  varchar,
  mysqlEnum,
  datetime,
  text,
  int,
  boolean,
  json,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { timestamps } from './common';
import { stories, episodes } from './content.schema';
import { users } from './identity.schema';

export const StoryVersionStatusEnum = [
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'ARCHIVED',
] as const;
export type StoryVersionStatus = (typeof StoryVersionStatusEnum)[number];

export const StoryNodeTypeEnum = [
  'OPENING',
  'STANDARD',
  'CHOICE_POINT',
  'ENDING',
] as const;
export type StoryNodeType = (typeof StoryNodeTypeEnum)[number];

/**
 * Story Versions table - version lifecycle and immutable snapshot container
 */
export const storyVersions = mysqlTable(
  'story_versions',
  {
    id: primaryUlidKey('id'),
    storyId: foreignUlid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    versionNumber: int('version_number').notNull(),
    status: mysqlEnum('status', StoryVersionStatusEnum).default('DRAFT').notNull(),
    graphSnapshot: json('graph_snapshot'),
    rootNodeId: foreignUlid('root_node_id'),
    publishedAt: datetime('published_at', { mode: 'date', fsp: 3 }),
    archivedAt: datetime('archived_at', { mode: 'date', fsp: 3 }),
    ...timestamps,
  },
  (table) => ({
    uqSvVersion: index('uq_sv_version').on(table.storyId, table.versionNumber),
    idxSvStatus: index('idx_sv_status').on(table.status),
    idxSvStoryStatus: index('idx_sv_story_status').on(table.storyId, table.status),
  }),
);

/**
 * Story Nodes table - DAG vertices representing an episode viewing state
 */
export const storyNodes = mysqlTable(
  'story_nodes',
  {
    id: primaryUlidKey('id'),
    storyVersionId: foreignUlid('story_version_id')
      .notNull()
      .references(() => storyVersions.id, { onDelete: 'cascade' }),
    episodeId: foreignUlid('episode_id')
      .notNull()
      .references(() => episodes.id, { onDelete: 'restrict' }),
    nodeType: mysqlEnum('node_type', StoryNodeTypeEnum).default('STANDARD').notNull(),
    isRoot: boolean('is_root').default(false).notNull(),
    sequenceOrder: int('sequence_order').default(0).notNull(),
    votingEndsAt: datetime('voting_ends_at', { mode: 'date', fsp: 3 }),
    fallbackOptionId: foreignUlid('fallback_option_id'),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    idxSnVersion: index('idx_sn_version').on(table.storyVersionId),
  }),
);

/**
 * Choices table - branching dilemma prompt anchored to a CHOICE_POINT node
 */
export const choices = mysqlTable('choices', {
  id: primaryUlidKey('id'),
  storyNodeId: foreignUlid('story_node_id')
    .notNull()
    .references(() => storyNodes.id, { onDelete: 'cascade' })
    .unique('uq_choice_node'),
  prompt: text('prompt').notNull(),
  votingOpensAt: datetime('voting_opens_at', { mode: 'date', fsp: 3 }),
  votingEndsAt: datetime('voting_ends_at', { mode: 'date', fsp: 3 }),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

/**
 * Choice Options table - individual branch selections pointing to next destination node
 */
export const choiceOptions = mysqlTable(
  'choice_options',
  {
    id: primaryUlidKey('id'),
    choiceId: foreignUlid('choice_id')
      .notNull()
      .references(() => choices.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 255 }).notNull(),
    destinationNodeId: foreignUlid('destination_node_id')
      .notNull()
      .references(() => storyNodes.id, { onDelete: 'restrict' }),
    voteCount: int('vote_count').default(0).notNull(),
    displayOrder: int('display_order').default(1).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    idxCoChoice: index('idx_co_choice').on(table.choiceId),
  }),
);

export type StoryVersion = typeof storyVersions.$inferSelect;
export type NewStoryVersion = typeof storyVersions.$inferInsert;
export type StoryNode = typeof storyNodes.$inferSelect;
export type NewStoryNode = typeof storyNodes.$inferInsert;
export type Choice = typeof choices.$inferSelect;
export type NewChoice = typeof choices.$inferInsert;
export type ChoiceOption = typeof choiceOptions.$inferSelect;
export type NewChoiceOption = typeof choiceOptions.$inferInsert;

/**
 * User Choices table - individual viewer decision recording anchored to user, choice and version
 */
export const userChoices = mysqlTable(
  'user_choices',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    choiceId: foreignUlid('choice_id')
      .notNull()
      .references(() => choices.id, { onDelete: 'restrict' }),
    choiceOptionId: foreignUlid('choice_option_id')
      .notNull()
      .references(() => choiceOptions.id, { onDelete: 'restrict' }),
    storyVersionId: foreignUlid('story_version_id')
      .notNull()
      .references(() => storyVersions.id, { onDelete: 'cascade' }),
    isFallback: boolean('is_fallback').default(false).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    uqUcUserChoice: uniqueIndex('uq_uc_user_choice').on(table.userId, table.choiceId),
    idxUcUser: index('idx_uc_user').on(table.userId),
    idxUcVersion: index('idx_uc_version').on(table.storyVersionId),
  }),
);

export type UserChoice = typeof userChoices.$inferSelect;
export type NewUserChoice = typeof userChoices.$inferInsert;

