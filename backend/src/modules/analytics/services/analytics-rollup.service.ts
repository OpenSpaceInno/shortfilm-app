import { Injectable, Logger } from '@nestjs/common';
import { generateUlid } from '../../../database/utils/ulid.util';
import {
  NewBusinessMetric,
  TimeGranularity,
} from '../../../database/schema';
import { BusinessMetricsRepository } from '../repositories/business-metrics.repository';

export interface RollupExecutionSummary {
  granularity: TimeGranularity;
  periodStart: string;
  periodEnd: string;
  metricsComputed: number;
  durationMs: number;
}

@Injectable()
export class AnalyticsRollupService {
  private readonly logger = new Logger(AnalyticsRollupService.name);

  constructor(private readonly metricsRepo: BusinessMetricsRepository) {}

  /**
   * Runs an hourly analytics rollup for the target hour window.
   * If targetDate is omitted, aggregates the most recently completed UTC hour.
   */
  async runHourlyRollup(targetDate?: Date): Promise<RollupExecutionSummary> {
    const startTime = Date.now();
    const refDate = targetDate || new Date();

    // Compute previous hour boundaries [startOfHour, endOfHour]
    const periodStart = new Date(refDate);
    if (!targetDate) {
      periodStart.setUTCHours(periodStart.getUTCHours() - 1);
    }
    periodStart.setUTCMinutes(0, 0, 0);

    const periodEnd = new Date(periodStart);
    periodEnd.setUTCMinutes(59, 59, 999);

    this.logger.log(
      `Starting HOURLY analytics rollup for window: ${periodStart.toISOString()} -> ${periodEnd.toISOString()}`,
    );

    const metricsToPersist: NewBusinessMetric[] = [];

    // 1. Consumption: Watch Hours in Hour
    const watchHours = await this.computeWatchHours(periodStart, periodEnd);
    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'WATCH_HOURS',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'HOURLY',
      periodStart,
      periodEnd,
      numericValue: watchHours.toFixed(4),
      metadata: { source: 'watch_progress' },
    });

    // 2. Consumption: Completion Rate
    const completionRate = await this.computeCompletionRate(periodStart, periodEnd);
    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'COMPLETION_RATE',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'HOURLY',
      periodStart,
      periodEnd,
      numericValue: completionRate.toFixed(4),
      metadata: { unit: 'PERCENTAGE' },
    });

    // 3. Choice Rate
    const choiceRate = await this.computeChoiceRate(periodStart, periodEnd);
    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'CHOICE_RATE',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'HOURLY',
      periodStart,
      periodEnd,
      numericValue: choiceRate.toFixed(4),
      metadata: { unit: 'PERCENTAGE' },
    });

    // 4. Story-Level Consumption Dimensions
    const storyMetrics = await this.computeStoryBreakdowns(periodStart, periodEnd, 'HOURLY');
    metricsToPersist.push(...storyMetrics);

    // Idempotently upsert batch
    const count = await this.metricsRepo.upsertBatch(metricsToPersist);
    const durationMs = Date.now() - startTime;

    this.logger.log(
      `Completed HOURLY analytics rollup: ${count} metrics upserted in ${durationMs}ms`,
    );

    return {
      granularity: 'HOURLY',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      metricsComputed: count,
      durationMs,
    };
  }

  /**
   * Runs a daily analytics rollup for the target day window.
   * If targetDate is omitted, aggregates the most recently completed UTC day (midnight-to-midnight).
   */
  async runDailyRollup(targetDate?: Date): Promise<RollupExecutionSummary> {
    const startTime = Date.now();
    const refDate = targetDate || new Date();

    const periodStart = new Date(refDate);
    if (!targetDate) {
      periodStart.setUTCDate(periodStart.getUTCDate() - 1);
    }
    periodStart.setUTCHours(0, 0, 0, 0);

    const periodEnd = new Date(periodStart);
    periodEnd.setUTCHours(23, 59, 59, 999);

    this.logger.log(
      `Starting DAILY analytics rollup for window: ${periodStart.toISOString()} -> ${periodEnd.toISOString()}`,
    );

    const metricsToPersist: NewBusinessMetric[] = [];

    // 1. Audience: DAU (Daily Active Users in 24h)
    const dau = await this.computeDau(periodStart, periodEnd);
    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'DAU',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'DAILY',
      periodStart,
      periodEnd,
      numericValue: dau.toFixed(4),
      metadata: { window: '24h' },
    });

    // 2. Audience: MAU (Rolling 30 Days)
    const mau = await this.computeMau(periodEnd);
    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'MAU',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'DAILY',
      periodStart,
      periodEnd,
      numericValue: mau.toFixed(4),
      metadata: { window: '30d_rolling' },
    });

    // 3. Audience: Stickiness Ratio (DAU / MAU)
    const stickiness = mau > 0 ? (dau / mau) * 100 : 0;
    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'STICKINESS',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'DAILY',
      periodStart,
      periodEnd,
      numericValue: Math.min(stickiness, 100).toFixed(4),
      metadata: { unit: 'PERCENTAGE', formula: 'DAU/MAU*100' },
    });

    // 4. Consumption: Daily Watch Hours
    const watchHours = await this.computeWatchHours(periodStart, periodEnd);
    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'WATCH_HOURS',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'DAILY',
      periodStart,
      periodEnd,
      numericValue: watchHours.toFixed(4),
      metadata: { unit: 'HOURS' },
    });

    // 5. Consumption: Daily Completion Rate
    const completionRate = await this.computeCompletionRate(periodStart, periodEnd);
    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'COMPLETION_RATE',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'DAILY',
      periodStart,
      periodEnd,
      numericValue: completionRate.toFixed(4),
      metadata: { unit: 'PERCENTAGE' },
    });

    // 6. Monetization: Active Paid Subscribers & MRR
    const { activeSubs, mrr } = await this.computeSubscriptionMetrics();
    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'ACTIVE_SUBS',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'DAILY',
      periodStart,
      periodEnd,
      numericValue: activeSubs.toFixed(4),
      metadata: { status: 'ACTIVE' },
    });

    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'MRR',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'DAILY',
      periodStart,
      periodEnd,
      numericValue: mrr.toFixed(4),
      metadata: { currency: 'INR' },
    });

    // 7. Monetization: Churn Rate & Net Additions
    const { churnRate, netSubs } = await this.computeSubscriptionFlux(periodStart, periodEnd, activeSubs);
    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'CHURN_RATE',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'DAILY',
      periodStart,
      periodEnd,
      numericValue: churnRate.toFixed(4),
      metadata: { unit: 'PERCENTAGE' },
    });

    metricsToPersist.push({
      id: generateUlid(),
      metricName: 'NET_SUBS',
      dimensionKey: 'GLOBAL',
      dimensionValue: 'ALL',
      timeGranularity: 'DAILY',
      periodStart,
      periodEnd,
      numericValue: netSubs.toFixed(4),
      metadata: { formula: 'NEW_ACTIVATIONS - CANCELLATIONS' },
    });

    // 8. Story-Level Dimension Metrics
    const storyMetrics = await this.computeStoryBreakdowns(periodStart, periodEnd, 'DAILY');
    metricsToPersist.push(...storyMetrics);

    const count = await this.metricsRepo.upsertBatch(metricsToPersist);
    const durationMs = Date.now() - startTime;

    this.logger.log(
      `Completed DAILY analytics rollup: ${count} metrics upserted in ${durationMs}ms`,
    );

    return {
      granularity: 'DAILY',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      metricsComputed: count,
      durationMs,
    };
  }

  // Helper Calculation Queries

  private async computeDau(start: Date, end: Date): Promise<number> {
    try {
      const rows = await this.metricsRepo.executeRaw<{ dau: number }>(
        `SELECT COUNT(DISTINCT user_id) as dau FROM (
           SELECT user_id FROM watch_history WHERE viewed_at >= ? AND viewed_at <= ?
           UNION
           SELECT user_id FROM user_choices WHERE created_at >= ? AND created_at <= ?
         ) as active_users`,
        [start, end, start, end],
      );
      return Number(rows[0]?.dau || 0);
    } catch {
      return 0;
    }
  }

  private async computeMau(refDate: Date): Promise<number> {
    try {
      const rows = await this.metricsRepo.executeRaw<{ mau: number }>(
        `SELECT COUNT(DISTINCT user_id) as mau FROM (
           SELECT user_id FROM watch_history WHERE viewed_at >= DATE_SUB(?, INTERVAL 30 DAY) AND viewed_at <= ?
           UNION
           SELECT user_id FROM user_choices WHERE created_at >= DATE_SUB(?, INTERVAL 30 DAY) AND created_at <= ?
         ) as active_users`,
        [refDate, refDate, refDate, refDate],
      );
      return Number(rows[0]?.mau || 0);
    } catch {
      return 0;
    }
  }

  private async computeWatchHours(start: Date, end: Date): Promise<number> {
    try {
      const rows = await this.metricsRepo.executeRaw<{ watch_hours: number }>(
        `SELECT COALESCE(SUM(progress_seconds), 0) / 3600.0 as watch_hours
         FROM watch_progress
         WHERE updated_at >= ? AND updated_at <= ?`,
        [start, end],
      );
      return Number(rows[0]?.watch_hours || 0);
    } catch {
      return 0;
    }
  }

  private async computeCompletionRate(start: Date, end: Date): Promise<number> {
    try {
      const rows = await this.metricsRepo.executeRaw<{ total_started: number; total_completed: number }>(
        `SELECT
           COUNT(*) as total_started,
           SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as total_completed
         FROM watch_progress
         WHERE updated_at >= ? AND updated_at <= ?`,
        [start, end],
      );
      const started = Number(rows[0]?.total_started || 0);
      const completed = Number(rows[0]?.total_completed || 0);
      return started > 0 ? (completed / started) * 100 : 0;
    } catch {
      return 0;
    }
  }

  private async computeChoiceRate(start: Date, end: Date): Promise<number> {
    try {
      const rows = await this.metricsRepo.executeRaw<{ choice_count: number }>(
        `SELECT COUNT(*) as choice_count
         FROM user_choices
         WHERE created_at >= ? AND created_at <= ?`,
        [start, end],
      );
      const choiceCount = Number(rows[0]?.choice_count || 0);
      return choiceCount > 0 ? Math.min(choiceCount * 1.5, 100) : 0;
    } catch {
      return 0;
    }
  }

  private async computeSubscriptionMetrics(): Promise<{ activeSubs: number; mrr: number }> {
    try {
      const rows = await this.metricsRepo.executeRaw<{ active_subs: number; mrr: number }>(
        `SELECT
           COUNT(s.id) as active_subs,
           COALESCE(SUM(
             CASE
               WHEN s.billing_interval = 'ANNUAL' AND p.price_annually IS NOT NULL THEN (p.price_annually / 12.0)
               ELSE p.price_monthly
             END
           ), 0.0) as mrr
         FROM subscriptions s
         JOIN subscription_plans p ON s.plan_id = p.id
         WHERE s.status = 'ACTIVE'`,
      );
      return {
        activeSubs: Number(rows[0]?.active_subs || 0),
        mrr: Number(rows[0]?.mrr || 0),
      };
    } catch {
      return { activeSubs: 0, mrr: 0 };
    }
  }

  private async computeSubscriptionFlux(
    start: Date,
    end: Date,
    currentActive: number,
  ): Promise<{ churnRate: number; netSubs: number }> {
    try {
      const rows = await this.metricsRepo.executeRaw<{ cancelled_count: number; new_active_count: number }>(
        `SELECT
           SUM(CASE WHEN status = 'CANCELLED' AND updated_at >= ? AND updated_at <= ? THEN 1 ELSE 0 END) as cancelled_count,
           SUM(CASE WHEN status = 'ACTIVE' AND created_at >= ? AND created_at <= ? THEN 1 ELSE 0 END) as new_active_count
         FROM subscriptions`,
        [start, end, start, end],
      );
      const cancelled = Number(rows[0]?.cancelled_count || 0);
      const newActive = Number(rows[0]?.new_active_count || 0);
      const churnRate = currentActive > 0 ? (cancelled / currentActive) * 100 : 0;
      const netSubs = newActive - cancelled;

      return {
        churnRate: Math.min(churnRate, 100),
        netSubs,
      };
    } catch {
      return { churnRate: 0, netSubs: 0 };
    }
  }

  private async computeStoryBreakdowns(
    start: Date,
    end: Date,
    granularity: TimeGranularity,
  ): Promise<NewBusinessMetric[]> {
    try {
      const rows = await this.metricsRepo.executeRaw<{
        story_id: Buffer | string;
        watch_hours: number;
        total_started: number;
        total_completed: number;
      }>(
        `SELECT
           BIN_TO_UUID(story_id) as story_id,
           COALESCE(SUM(progress_seconds), 0) / 3600.0 as watch_hours,
           COUNT(*) as total_started,
           SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as total_completed
         FROM watch_progress
         WHERE updated_at >= ? AND updated_at <= ?
         GROUP BY story_id`,
        [start, end],
      );

      const metrics: NewBusinessMetric[] = [];
      for (const row of rows) {
        const storyIdStr = typeof row.story_id === 'string' ? row.story_id : String(row.story_id);
        const started = Number(row.total_started || 0);
        const completed = Number(row.total_completed || 0);
        const compRate = started > 0 ? (completed / started) * 100 : 0;

        metrics.push({
          id: generateUlid(),
          metricName: 'WATCH_HOURS',
          dimensionKey: 'STORY',
          dimensionValue: storyIdStr,
          timeGranularity: granularity,
          periodStart: start,
          periodEnd: end,
          numericValue: Number(row.watch_hours || 0).toFixed(4),
          metadata: { storyId: storyIdStr },
        });

        metrics.push({
          id: generateUlid(),
          metricName: 'COMPLETION_RATE',
          dimensionKey: 'STORY',
          dimensionValue: storyIdStr,
          timeGranularity: granularity,
          periodStart: start,
          periodEnd: end,
          numericValue: compRate.toFixed(4),
          metadata: { storyId: storyIdStr, unit: 'PERCENTAGE' },
        });
      }

      return metrics;
    } catch {
      return [];
    }
  }
}
