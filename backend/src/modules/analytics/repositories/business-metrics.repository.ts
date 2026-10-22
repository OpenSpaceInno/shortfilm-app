import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  businessMetrics,
  BusinessMetric,
  NewBusinessMetric,
  TimeGranularity,
} from '../../../database/schema';

export interface MetricQueryFilter {
  metricName?: string;
  dimensionKey?: string;
  dimensionValue?: string;
  timeGranularity?: TimeGranularity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

@Injectable()
export class BusinessMetricsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  /**
   * Upserts a pre-aggregated metric record idempotently using composite unique constraint uq_bm_period.
   */
  async upsertMetric(data: NewBusinessMetric): Promise<void> {
    await this.db
      .insert(businessMetrics)
      .values(data)
      .onDuplicateKeyUpdate({
        set: {
          numericValue: sql`values(numeric_value)`,
          metadata: sql`values(metadata)`,
          periodEnd: sql`values(period_end)`,
          updatedAt: sql`CURRENT_TIMESTAMP(3)`,
        },
      });
  }

  /**
   * Upserts a batch of pre-aggregated metrics idempotently.
   */
  async upsertBatch(items: NewBusinessMetric[]): Promise<number> {
    if (!items || items.length === 0) return 0;

    await this.db
      .insert(businessMetrics)
      .values(items)
      .onDuplicateKeyUpdate({
        set: {
          numericValue: sql`values(numeric_value)`,
          metadata: sql`values(metadata)`,
          periodEnd: sql`values(period_end)`,
          updatedAt: sql`CURRENT_TIMESTAMP(3)`,
        },
      });

    return items.length;
  }

  /**
   * Queries pre-aggregated business metrics by dimensional filter and time window.
   */
  async queryMetrics(filter: MetricQueryFilter = {}): Promise<BusinessMetric[]> {
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
   * Finds the latest calculated value for a specific metric and dimension.
   */
  async findLatest(
    metricName: string,
    dimensionKey = 'GLOBAL',
    dimensionValue = 'ALL',
  ): Promise<BusinessMetric | null> {
    const results = await this.db
      .select()
      .from(businessMetrics)
      .where(
        and(
          eq(businessMetrics.metricName, metricName),
          eq(businessMetrics.dimensionKey, dimensionKey),
          eq(businessMetrics.dimensionValue, dimensionValue),
        ),
      )
      .orderBy(desc(businessMetrics.periodStart))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Executes a direct aggregate query on operational MySQL connection pool.
   */
  async executeRaw<T = any>(querySql: string, params: any[] = []): Promise<T[]> {
    const pool = this.dbService.getPool();
    const [rows] = await pool.query(querySql, params);
    return rows as T[];
  }
}
