import {
  mysqlTable,
  varchar,
  mysqlEnum,
  datetime,
  decimal,
  json,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { timestamps } from './common';

export const TimeGranularityEnum = ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'] as const;
export type TimeGranularity = (typeof TimeGranularityEnum)[number];

export const BusinessMetricNameEnum = [
  'DAU',
  'MAU',
  'STICKINESS',
  'WATCH_HOURS',
  'COMPLETION_RATE',
  'CHOICE_RATE',
  'SHARE_RATE',
  'ACTIVE_SUBS',
  'MRR',
  'CHURN_RATE',
  'NET_SUBS',
] as const;
export type BusinessMetricName = (typeof BusinessMetricNameEnum)[number];

/**
 * business_metrics Table
 * Pre-aggregated operational metrics rollups adhering to SR-ARCH-19 and 21_BUSINESS_INTELLIGENCE.md
 */
export const businessMetrics = mysqlTable(
  'business_metrics',
  {
    id: primaryUlidKey('id'),
    metricName: varchar('metric_name', { length: 64 }).notNull(),
    dimensionKey: varchar('dimension_key', { length: 64 }).notNull().default('GLOBAL'),
    dimensionValue: varchar('dimension_value', { length: 128 }).notNull().default('ALL'),
    timeGranularity: mysqlEnum('time_granularity', TimeGranularityEnum).notNull(),
    periodStart: datetime('period_start', { mode: 'date', fsp: 3 }).notNull(),
    periodEnd: datetime('period_end', { mode: 'date', fsp: 3 }).notNull(),
    numericValue: decimal('numeric_value', { precision: 16, scale: 4 }).notNull(),
    metadata: json('metadata'),
    ...timestamps,
  },
  (table) => ({
    uqBmPeriod: uniqueIndex('uq_bm_period').on(
      table.metricName,
      table.dimensionKey,
      table.dimensionValue,
      table.timeGranularity,
      table.periodStart,
    ),
    idxBmLookup: index('idx_bm_lookup').on(
      table.metricName,
      table.dimensionKey,
      table.periodStart,
      table.timeGranularity,
    ),
  }),
);

export type BusinessMetric = typeof businessMetrics.$inferSelect;
export type NewBusinessMetric = typeof businessMetrics.$inferInsert;

export const SignalCategoryEnum = [
  'AUDIENCE',
  'ENGAGEMENT',
  'SUBSCRIPTION',
  'CONTENT',
  'CREATOR',
  'REVENUE',
] as const;
export type SignalCategory = (typeof SignalCategoryEnum)[number];

export const SignalStrengthEnum = ['EMERGING', 'MODERATE', 'STRONG'] as const;
export type SignalStrength = (typeof SignalStrengthEnum)[number];

export const SignalSeverityEnum = ['INFO', 'REVIEW', 'ATTENTION', 'CRITICAL'] as const;
export type SignalSeverity = (typeof SignalSeverityEnum)[number];

export const SignalStatusEnum = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'] as const;
export type SignalStatus = (typeof SignalStatusEnum)[number];

/**
 * business_signals Table
 * Operational anomalies, performance surges, and executive trajectory alerts (SR-ARCH-19)
 */
export const businessSignals = mysqlTable(
  'business_signals',
  {
    id: primaryUlidKey('id'),
    category: mysqlEnum('category', SignalCategoryEnum).notNull(),
    signalType: varchar('signal_type', { length: 64 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    observation: text('observation').notNull(),
    supportingData: json('supporting_data'),
    signalStrength: mysqlEnum('signal_strength', SignalStrengthEnum).notNull().default('MODERATE'),
    severity: mysqlEnum('severity', SignalSeverityEnum).notNull().default('INFO'),
    status: mysqlEnum('status', SignalStatusEnum).notNull().default('ACTIVE'),
    detectedAt: datetime('detected_at', { mode: 'date', fsp: 3 }).notNull(),
    ...timestamps,
  },
  (table) => ({
    idxBsCategoryStatus: index('idx_bs_category_status').on(table.category, table.status),
    idxBsDetectedAt: index('idx_bs_detected_at').on(table.detectedAt),
  }),
);

export type BusinessSignal = typeof businessSignals.$inferSelect;
export type NewBusinessSignal = typeof businessSignals.$inferInsert;

export const ReportCadenceEnum = [
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'ANNUAL',
  'ADHOC',
] as const;
export type ReportCadence = (typeof ReportCadenceEnum)[number];

export const ReportStatusEnum = ['DRAFT', 'GENERATED', 'APPROVED', 'ARCHIVED'] as const;
export type ReportStatus = (typeof ReportStatusEnum)[number];

/**
 * business_reports Table
 * Frozen immutable financial & executive reconciliation reports (SR-ARCH-19 & 21_BI)
 */
export const businessReports = mysqlTable(
  'business_reports',
  {
    id: primaryUlidKey('id'),
    reportType: varchar('report_type', { length: 64 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    cadence: mysqlEnum('cadence', ReportCadenceEnum).notNull().default('MONTHLY'),
    periodStart: datetime('period_start', { mode: 'date', fsp: 3 }).notNull(),
    periodEnd: datetime('period_end', { mode: 'date', fsp: 3 }).notNull(),
    status: mysqlEnum('status', ReportStatusEnum).notNull().default('GENERATED'),
    summary: text('summary'),
    keyStat: varchar('key_stat', { length: 255 }),
    data: json('data').notNull(),
    metadata: json('metadata'),
    generatedBy: foreignUlid('generated_by'),
    approvedBy: foreignUlid('approved_by'),
    approvedAt: datetime('approved_at', { mode: 'date', fsp: 3 }),
    ...timestamps,
  },
  (table) => ({
    idxBrPeriod: index('idx_br_period').on(table.periodStart, table.periodEnd),
    idxBrStatus: index('idx_br_status').on(table.status),
    idxBrType: index('idx_br_type').on(table.reportType),
  }),
);

export type BusinessReport = typeof businessReports.$inferSelect;
export type NewBusinessReport = typeof businessReports.$inferInsert;

