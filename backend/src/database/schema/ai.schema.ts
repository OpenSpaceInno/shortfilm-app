import {
  mysqlTable,
  varchar,
  mysqlEnum,
  datetime,
  text,
  json,
  int,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { users } from './identity.schema';
import { creators } from './creator.schema';

export const AiFeatureEnum = [
  'CONCEPT_EXPAND',
  'CHARACTER_FORGE',
  'BRANCH_DILEMMA',
  'CLIFFHANGER',
  'PRODUCTION_PACK',
  'STORY_INSIGHT',
] as const;
export type AiFeature = (typeof AiFeatureEnum)[number];

export const AiJobStatusEnum = [
  'QUEUED',
  'PROCESSING',
  'COMPLETE',
  'FAILED',
] as const;
export type AiJobStatus = (typeof AiJobStatusEnum)[number];

export const AiUsageStatusEnum = [
  'SUCCESS',
  'FAILED',
  'RATE_LIMITED',
  'FALLBACK',
] as const;
export type AiUsageStatus = (typeof AiUsageStatusEnum)[number];

/**
 * AI Usage Logs table - records token usage, latency, and cost attribution per call
 */
export const aiUsageLogs = mysqlTable(
  'ai_usage_logs',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    creatorId: foreignUlid('creator_id').references(() => creators.id, { onDelete: 'set null' }),
    feature: mysqlEnum('feature', AiFeatureEnum).notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    promptTokens: int('prompt_tokens').notNull().default(0),
    completionTokens: int('completion_tokens').notNull().default(0),
    totalTokens: int('total_tokens').notNull().default(0),
    estimatedCostUsd: varchar('estimated_cost_usd', { length: 20 }).notNull().default('0.000000'),
    status: mysqlEnum('status', AiUsageStatusEnum).notNull().default('SUCCESS'),
    latencyMs: int('latency_ms').notNull().default(0),
    metadata: json('metadata').$type<Record<string, any>>(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    idxAiUser: index('idx_ai_user').on(table.userId),
    idxAiCreator: index('idx_ai_creator').on(table.creatorId),
    idxAiFeature: index('idx_ai_feature').on(table.feature),
    idxAiCreated: index('idx_ai_created').on(table.createdAt),
  }),
);

export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type NewAiUsageLog = typeof aiUsageLogs.$inferInsert;

/**
 * AI Jobs table - asynchronous execution state for multi-part creative generation
 */
export const aiJobs = mysqlTable(
  'ai_jobs',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobType: varchar('job_type', { length: 50 }).notNull().default('PRODUCTION_PACK'),
    status: mysqlEnum('status', AiJobStatusEnum).notNull().default('QUEUED'),
    inputPayload: json('input_payload').$type<Record<string, any>>().notNull(),
    resultData: json('result_data').$type<Record<string, any>>(),
    errorMessage: text('error_message'),
    progressPercent: int('progress_percent').notNull().default(0),
    startedAt: datetime('started_at', { mode: 'date', fsp: 3 }),
    completedAt: datetime('completed_at', { mode: 'date', fsp: 3 }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    idxAiJobUser: index('idx_ai_job_user').on(table.userId),
    idxAiJobStatus: index('idx_ai_job_status').on(table.status),
  }),
);

export type AiJob = typeof aiJobs.$inferSelect;
export type NewAiJob = typeof aiJobs.$inferInsert;
