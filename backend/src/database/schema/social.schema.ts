import {
  mysqlTable,
  varchar,
  datetime,
  int,
  boolean,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { users } from './identity.schema';
import { stories, episodes } from './content.schema';
import { choices, choiceOptions } from './interactive.schema';

/**
 * Community Votes table - audience polls anchored to interactive story choice points
 */
export const votes = mysqlTable(
  'votes',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    choiceId: foreignUlid('choice_id')
      .notNull()
      .references(() => choices.id, { onDelete: 'cascade' }),
    choiceOptionId: foreignUlid('choice_option_id')
      .notNull()
      .references(() => choiceOptions.id, { onDelete: 'cascade' }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    uqVoteUserChoice: uniqueIndex('uq_vote_user_choice').on(table.userId, table.choiceId),
    idxVoteOption: index('idx_vote_option').on(table.choiceOptionId),
  }),
);

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;

export const PredictionStatusEnum = ['OPEN', 'RESOLVED', 'CANCELLED'] as const;
export type PredictionStatus = (typeof PredictionStatusEnum)[number];

/**
 * Predictions table - audience plot outcome prediction questions
 */
export const predictions = mysqlTable(
  'predictions',
  {
    id: primaryUlidKey('id'),
    storyId: foreignUlid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    question: varchar('question', { length: 500 }).notNull(),
    revealEpisodeId: foreignUlid('reveal_episode_id').references(() => episodes.id, {
      onDelete: 'set null',
    }),
    status: mysqlEnum('status', PredictionStatusEnum).default('OPEN').notNull(),
    winningOptionId: foreignUlid('winning_option_id'),
    closesAt: datetime('closes_at', { mode: 'date', fsp: 3 }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    idxPredictionStory: index('idx_prediction_story').on(table.storyId),
    idxPredictionStatus: index('idx_prediction_status').on(table.status),
  }),
);

export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;

/**
 * Prediction Options table - selectable outcome answers for a prediction
 */
export const predictionOptions = mysqlTable(
  'prediction_options',
  {
    id: primaryUlidKey('id'),
    predictionId: foreignUlid('prediction_id')
      .notNull()
      .references(() => predictions.id, { onDelete: 'cascade' }),
    optionText: varchar('option_text', { length: 255 }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    idxPredOptPred: index('idx_pred_opt_pred').on(table.predictionId),
  }),
);

export type PredictionOption = typeof predictionOptions.$inferSelect;
export type NewPredictionOption = typeof predictionOptions.$inferInsert;

/**
 * User Predictions table - user placed prediction wagers/votes
 */
export const userPredictions = mysqlTable(
  'user_predictions',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    predictionId: foreignUlid('prediction_id')
      .notNull()
      .references(() => predictions.id, { onDelete: 'cascade' }),
    predictionOptionId: foreignUlid('prediction_option_id')
      .notNull()
      .references(() => predictionOptions.id, { onDelete: 'cascade' }),
    isCorrect: boolean('is_correct'),
    xpAwarded: int('xp_awarded').default(0).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    uqUpUserPred: uniqueIndex('uq_up_user_pred').on(table.userId, table.predictionId),
    idxUpPred: index('idx_up_pred').on(table.predictionId),
  }),
);

export type UserPrediction = typeof userPredictions.$inferSelect;
export type NewUserPrediction = typeof userPredictions.$inferInsert;

export const FollowTargetTypeEnum = ['CREATOR', 'CHARACTER', 'STORY'] as const;
export type FollowTargetType = (typeof FollowTargetTypeEnum)[number];

/**
 * Follows table - user subscriptions to creators, characters, and stories
 */
export const follows = mysqlTable(
  'follows',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: mysqlEnum('target_type', FollowTargetTypeEnum).notNull(),
    targetId: foreignUlid('target_id').notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    uqFollowUserTarget: uniqueIndex('uq_follow_user_target').on(
      table.userId,
      table.targetType,
      table.targetId,
    ),
    idxFollowTarget: index('idx_follow_target').on(table.targetType, table.targetId),
    idxFollowUser: index('idx_follow_user').on(table.userId),
  }),
);

export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;
