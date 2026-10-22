import {
  mysqlTable,
  varchar,
  mysqlEnum,
  datetime,
  decimal,
  int,
  json,
  text,
  index,
} from 'drizzle-orm/mysql-core';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { timestamps } from './common';
import { stories } from './content.schema';
import { users } from './identity.schema';
import { storyVersions, storyNodes } from './interactive.schema';

export const StorySignalTypeEnum = [
  'CHOICE_FRICTION_ANOMALY',
  'BRANCH_MONOPOLY_BIAS',
  'CHARACTER_BREAKOUT_SCORE',
  'REWATCH_LOOP_INTENSITY',
  'EPISODE_BRIDGE_DROPOFF',
  'DROP_OFF',
  'CHOICE_DOMINANCE',
  'VIRAL_SHARE',
  'MOMENTUM_SURGE',
  'RETENTION_CHURN',
] as const;
export type StorySignalType = (typeof StorySignalTypeEnum)[number];

export const StorySignalStrengthEnum = ['EMERGING', 'MODERATE', 'STRONG'] as const;
export type StorySignalStrength = (typeof StorySignalStrengthEnum)[number];

export const InsightStatusEnum = [
  'UNRESOLVED',
  'REVIEWED',
  'APPLIED',
  'DISMISSED',
] as const;
export type InsightStatus = (typeof InsightStatusEnum)[number];

export const OpportunityTypeEnum = [
  'BRANCH_REBALANCING',
  'SPINOFF_CANDIDATE',
  'PACING_RE_EDIT',
  'ENDING_EXPANSION',
  'STORY_EXPANSION',
  'CHARACTER_OPPORTUNITY',
  'INTERACTIVE_OPPORTUNITY',
  'GENRE_OPPORTUNITY',
  'DISCOVERY_OPPORTUNITY',
  'RETENTION_OPPORTUNITY',
] as const;
export type OpportunityType = (typeof OpportunityTypeEnum)[number];

export const OpportunityStatusEnum = [
  'PROPOSED',
  'IN_REVIEW',
  'ACCEPTED',
  'DISMISSED',
] as const;
export type OpportunityStatus = (typeof OpportunityStatusEnum)[number];

export const OpportunityPriorityEnum = [
  'ROUTINE',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;
export type OpportunityPriority = (typeof OpportunityPriorityEnum)[number];

export const ExperimentStatusEnum = [
  'DRAFT',
  'SCHEDULED',
  'RUNNING',
  'PAUSED',
  'CONCLUDED',
  'APPLIED',
  'DISCARDED',
] as const;
export type ExperimentStatus = (typeof ExperimentStatusEnum)[number];

/**
 * story_signals Table
 * Behavioral anomalies, friction detection, branch dominance, and drop-off signals
 */
export const storySignals = mysqlTable(
  'story_signals',
  {
    id: primaryUlidKey('id'),
    storyId: foreignUlid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    signalType: mysqlEnum('signal_type', StorySignalTypeEnum).notNull(),
    strength: mysqlEnum('strength', StorySignalStrengthEnum).notNull().default('MODERATE'),
    strengthScore: decimal('strength_score', { precision: 5, scale: 2 }).notNull().default('0.00'),
    confidenceScore: decimal('confidence_score', { precision: 4, scale: 3 }).notNull().default('0.000'),
    title: varchar('title', { length: 255 }).notNull(),
    observation: text('observation').notNull(),
    possibleInterpretation: text('possible_interpretation'),
    suggestedInvestigation: text('suggested_investigation'),
    metricsJson: json('metrics_json'),
    windowStart: datetime('window_start', { mode: 'date', fsp: 3 }),
    windowEnd: datetime('window_end', { mode: 'date', fsp: 3 }),
    detectedAt: datetime('detected_at', { mode: 'date', fsp: 3 }).notNull(),
    ...timestamps,
  },
  (table) => ({
    idxSigStoryId: index('idx_sig_story_id').on(table.storyId),
    idxSigType: index('idx_sig_type').on(table.signalType),
    idxSigDetectedAt: index('idx_sig_detected_at').on(table.detectedAt),
  }),
);

/**
 * story_insights Table
 * Human-readable creative insights synthesized algorithmically or via AI
 */
export const storyInsights = mysqlTable(
  'story_insights',
  {
    id: primaryUlidKey('id'),
    storyId: foreignUlid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    signalId: foreignUlid('signal_id').references(() => storySignals.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    summary: text('summary').notNull(),
    narrativeCommentary: text('narrative_commentary'),
    confidenceScore: decimal('confidence_score', { precision: 4, scale: 3 }).notNull().default('0.800'),
    status: mysqlEnum('status', InsightStatusEnum).notNull().default('UNRESOLVED'),
    actionPlan: text('action_plan'),
    ...timestamps,
  },
  (table) => ({
    idxInsStoryId: index('idx_ins_story_id').on(table.storyId),
    idxInsStatus: index('idx_ins_status').on(table.status),
  }),
);

/**
 * content_opportunities Table
 * Strategic narrative opportunities proposed for human editorial review
 */
export const contentOpportunities = mysqlTable(
  'content_opportunities',
  {
    id: primaryUlidKey('id'),
    storyId: foreignUlid('story_id').references(() => stories.id, { onDelete: 'cascade' }),
    insightId: foreignUlid('insight_id').references(() => storyInsights.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    opportunityType: mysqlEnum('opportunity_type', OpportunityTypeEnum).notNull(),
    status: mysqlEnum('status', OpportunityStatusEnum).notNull().default('PROPOSED'),
    priority: mysqlEnum('priority', OpportunityPriorityEnum).notNull().default('MEDIUM'),
    priorityScore: decimal('priority_score', { precision: 5, scale: 2 }).notNull().default('50.00'),
    observation: text('observation').notNull(),
    possibleOpportunity: text('possible_opportunity').notNull(),
    evidenceJson: json('evidence_json'),
    reviewerNotes: text('reviewer_notes'),
    ...timestamps,
  },
  (table) => ({
    idxOppStoryId: index('idx_opp_story_id').on(table.storyId),
    idxOppStatus: index('idx_opp_status').on(table.status),
    idxOppType: index('idx_opp_type').on(table.opportunityType),
  }),
);

/**
 * story_experiments Table
 * Controlled A/B narrative experiments targeting branching, cliffhangers, and titles
 */
export const storyExperiments = mysqlTable(
  'story_experiments',
  {
    id: primaryUlidKey('id'),
    storyId: foreignUlid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    hypothesis: text('hypothesis').notNull(),
    targetMetric: varchar('target_metric', { length: 100 }).notNull().default('completion_rate'),
    status: mysqlEnum('status', ExperimentStatusEnum).notNull().default('DRAFT'),
    splitPercentage: int('split_percentage').notNull().default(50),
    startedAt: datetime('started_at', { mode: 'date', fsp: 3 }),
    concludedAt: datetime('concluded_at', { mode: 'date', fsp: 3 }),
    createdBy: foreignUlid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (table) => ({
    idxExpStoryId: index('idx_exp_story_id').on(table.storyId),
    idxExpStatus: index('idx_exp_status').on(table.status),
  }),
);

/**
 * experiment_variants Table
 * Control (A) and Candidate (B) branches, configurations, and observed metrics
 */
export const experimentVariants = mysqlTable(
  'experiment_variants',
  {
    id: primaryUlidKey('id'),
    experimentId: foreignUlid('experiment_id')
      .notNull()
      .references(() => storyExperiments.id, { onDelete: 'cascade' }),
    variantKey: varchar('variant_key', { length: 10 }).notNull(), // 'A' or 'B'
    versionId: foreignUlid('version_id').references(() => storyVersions.id, { onDelete: 'set null' }),
    nodeId: foreignUlid('node_id').references(() => storyNodes.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    configJson: json('config_json'),
    trafficAllocationPct: int('traffic_allocation_pct').notNull().default(50),
    impressionsCount: int('impressions_count').notNull().default(0),
    completionsCount: int('completions_count').notNull().default(0),
    conversionRate: decimal('conversion_rate', { precision: 5, scale: 4 }).notNull().default('0.0000'),
    metricsJson: json('metrics_json'),
    ...timestamps,
  },
  (table) => ({
    idxVarExpId: index('idx_var_exp_id').on(table.experimentId),
  }),
);

export type StorySignal = typeof storySignals.$inferSelect;
export type NewStorySignal = typeof storySignals.$inferInsert;

export type StoryInsight = typeof storyInsights.$inferSelect;
export type NewStoryInsight = typeof storyInsights.$inferInsert;

export type ContentOpportunity = typeof contentOpportunities.$inferSelect;
export type NewContentOpportunity = typeof contentOpportunities.$inferInsert;

export type StoryExperiment = typeof storyExperiments.$inferSelect;
export type NewStoryExperiment = typeof storyExperiments.$inferInsert;

export type ExperimentVariant = typeof experimentVariants.$inferSelect;
export type NewExperimentVariant = typeof experimentVariants.$inferInsert;
