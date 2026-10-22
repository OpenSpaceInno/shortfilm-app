import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { generateUlid } from '../../../database/utils/ulid.util';
import {
  businessMetrics,
  BusinessMetric,
  businessSignals,
  BusinessSignal,
  NewBusinessSignal,
  businessReports,
  BusinessReport,
  NewBusinessReport,
  subscriptions,
  subscriptionPlans,
  users,
  SignalStatus,
  ReportStatus,
} from '../../../database/schema';

export interface MetricSeriesFilter {
  metricName?: string;
  dimensionKey?: string;
  dimensionValue?: string;
  timeGranularity?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

@Injectable()
export class BusinessRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  /**
   * Retrieves the latest values for a list of business metric names.
   */
  async getLatestMetrics(
    metricNames: string[],
    dimensionKey = 'GLOBAL',
    dimensionValue = 'ALL',
  ): Promise<Record<string, number | null>> {
    const results: Record<string, number | null> = {};

    await Promise.all(
      metricNames.map(async (name) => {
        try {
          const rows = await this.db
            .select()
            .from(businessMetrics)
            .where(
              and(
                eq(businessMetrics.metricName, name),
                eq(businessMetrics.dimensionKey, dimensionKey),
                eq(businessMetrics.dimensionValue, dimensionValue),
              ),
            )
            .orderBy(desc(businessMetrics.periodStart))
            .limit(1);

          results[name] = rows[0] ? Number(rows[0].numericValue) : null;
        } catch {
          results[name] = null;
        }
      }),
    );

    return results;
  }

  /**
   * Queries pre-aggregated business metric time series.
   */
  async queryMetricSeries(filter: MetricSeriesFilter): Promise<BusinessMetric[]> {
    const conditions: any[] = [];

    if (filter.metricName) {
      conditions.push(eq(businessMetrics.metricName, filter.metricName));
    }
    if (filter.dimensionKey) {
      conditions.push(eq(businessMetrics.dimensionKey, filter.dimensionKey));
    }
    if (filter.dimensionValue) {
      conditions.push(eq(businessMetrics.dimensionValue, filter.dimensionValue));
    }
    if (filter.timeGranularity) {
      conditions.push(eq(businessMetrics.timeGranularity, filter.timeGranularity));
    }
    if (filter.startDate) {
      conditions.push(gte(businessMetrics.periodStart, filter.startDate));
    }
    if (filter.endDate) {
      conditions.push(lte(businessMetrics.periodStart, filter.endDate));
    }

    let query = this.db
      .select()
      .from(businessMetrics)
      .orderBy(desc(businessMetrics.periodStart));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filter.limit && filter.limit > 0) {
      query = query.limit(filter.limit) as any;
    }

    return query;
  }

  /**
   * Retrieves active subscriptions joined with plan pricing and tiers.
   */
  async getActiveSubscriptionsWithPlans(): Promise<
    Array<{
      id: string;
      userId: string;
      planId: string;
      tier: string;
      name: string;
      priceMonthly: number;
      priceAnnually: number | null;
      billingInterval: string;
      status: string;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
      createdAt: Date;
    }>
  > {
    try {
      const rows = await this.db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          planId: subscriptions.planId,
          tier: subscriptionPlans.tier,
          name: subscriptionPlans.name,
          priceMonthly: subscriptionPlans.priceMonthly,
          priceAnnually: subscriptionPlans.priceAnnually,
          billingInterval: subscriptions.billingInterval,
          status: subscriptions.status,
          currentPeriodStart: subscriptions.currentPeriodStart,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          createdAt: subscriptions.createdAt,
        })
        .from(subscriptions)
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(eq(subscriptions.status, 'ACTIVE'));

      return rows.map((r) => ({
        ...r,
        priceMonthly: Number(r.priceMonthly || 0),
        priceAnnually: r.priceAnnually ? Number(r.priceAnnually) : null,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Retrieves raw subscription records for subscriber cohort and retention curve calculations.
   */
  async getSubscriptionCohortRawData(): Promise<
    Array<{
      userId: string;
      planTier: string;
      startMonth: string;
      status: string;
      createdAt: Date;
      cancelledAt: Date | null;
      priceMonthly: number;
    }>
  > {
    try {
      const rows = await this.db
        .select({
          userId: subscriptions.userId,
          planTier: subscriptionPlans.tier,
          status: subscriptions.status,
          createdAt: subscriptions.createdAt,
          cancelledAt: subscriptions.cancelledAt,
          priceMonthly: subscriptionPlans.priceMonthly,
        })
        .from(subscriptions)
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .orderBy(subscriptions.createdAt);

      return rows.map((r) => {
        const d = new Date(r.createdAt);
        const startMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        return {
          userId: r.userId,
          planTier: r.planTier,
          startMonth,
          status: r.status,
          createdAt: r.createdAt,
          cancelledAt: r.cancelledAt,
          priceMonthly: Number(r.priceMonthly || 0),
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Retrieves user registration metrics.
   */
  async getUserRegistrationStats(recentDays = 30): Promise<{ total: number; recent: number }> {
    try {
      const pool = this.dbService.getPool();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - recentDays);

      const [rows] = await pool.query<any[]>(
        `SELECT
           COUNT(*) as total_users,
           SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as recent_users
         FROM users WHERE deleted_at IS NULL`,
        [cutoff],
      );

      return {
        total: Number(rows[0]?.total_users || 0),
        recent: Number(rows[0]?.recent_users || 0),
      };
    } catch {
      return { total: 0, recent: 0 };
    }
  }

  /**
   * Retrieves active business signals.
   */
  async getSignals(filter?: { category?: string; status?: string; limit?: number }): Promise<BusinessSignal[]> {
    const conditions: any[] = [];

    if (filter?.category) {
      conditions.push(eq(businessSignals.category, filter.category as any));
    }
    if (filter?.status) {
      conditions.push(eq(businessSignals.status, filter.status as any));
    }

    let query = this.db
      .select()
      .from(businessSignals)
      .orderBy(desc(businessSignals.detectedAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filter?.limit && filter.limit > 0) {
      query = query.limit(filter.limit) as any;
    }

    return query;
  }

  /**
   * Persists a newly detected business signal.
   */
  async createSignal(data: NewBusinessSignal): Promise<BusinessSignal> {
    const id = data.id || generateUlid();
    const recordToInsert = { ...data, id };
    await this.db.insert(businessSignals).values(recordToInsert);
    const rows = await this.db.select().from(businessSignals).where(eq(businessSignals.id, id)).limit(1);
    return rows[0];
  }

  /**
   * Updates signal status (e.g. ACKNOWLEDGED, RESOLVED, DISMISSED).
   */
  async updateSignalStatus(id: string, status: SignalStatus): Promise<BusinessSignal | null> {
    await this.db
      .update(businessSignals)
      .set({
        status,
        updatedAt: sql`CURRENT_TIMESTAMP(3)`,
      })
      .where(eq(businessSignals.id, id));

    const rows = await this.db.select().from(businessSignals).where(eq(businessSignals.id, id)).limit(1);
    return rows[0] || null;
  }

  /**
   * Lists generated business reports.
   */
  async getReports(limit = 20): Promise<BusinessReport[]> {
    return this.db
      .select()
      .from(businessReports)
      .orderBy(desc(businessReports.periodEnd))
      .limit(limit);
  }

  /**
   * Finds a specific report by ULID.
   */
  async getReportById(id: string): Promise<BusinessReport | null> {
    const rows = await this.db.select().from(businessReports).where(eq(businessReports.id, id)).limit(1);
    return rows[0] || null;
  }

  /**
   * Saves a newly generated immutable report snapshot.
   */
  async createReport(data: NewBusinessReport): Promise<BusinessReport> {
    const id = data.id || generateUlid();
    const recordToInsert = { ...data, id };
    await this.db.insert(businessReports).values(recordToInsert);
    const rows = await this.db.select().from(businessReports).where(eq(businessReports.id, id)).limit(1);
    return rows[0];
  }

  /**
   * Executes arbitrary read query directly against MySQL connection pool.
   */
  async executeRaw<T = any>(querySql: string, params: any[] = []): Promise<T[]> {
    const pool = this.dbService.getPool();
    const [rows] = await pool.query(querySql, params);
    return rows as T[];
  }
}
