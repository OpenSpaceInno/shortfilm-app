import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql, like } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  creatorEarnings,
  CreatorEarnings,
  NewCreatorEarnings,
  CreatorEarningsStatus,
  creators,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

export interface CreatorEarningsWithMeta extends CreatorEarnings {
  creatorName?: string;
}

export interface UpsertEarningsDto {
  creatorId: string;
  periodMonth: string;
  grossAmount: string;
  platformFee: string;
  taxWithheld: string;
  netPayout: string;
  currency?: string;
  status?: CreatorEarningsStatus;
  holdReason?: string | null;
  payoutReference?: string | null;
  metadata?: Record<string, any> | null;
  paidAt?: Date | null;
}

@Injectable()
export class CreatorEarningsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async findById(id: string): Promise<CreatorEarningsWithMeta | null> {
    const rows = await this.db
      .select({
        earnings: creatorEarnings,
        creatorName: creators.displayName,
      })
      .from(creatorEarnings)
      .innerJoin(creators, eq(creatorEarnings.creatorId, creators.id))
      .where(eq(creatorEarnings.id, id))
      .limit(1);

    if (!rows.length) return null;

    return {
      ...rows[0].earnings,
      creatorName: rows[0].creatorName,
    };
  }

  async findByCreatorAndMonth(
    creatorId: string,
    periodMonth: string,
  ): Promise<CreatorEarnings | null> {
    const [row] = await this.db
      .select()
      .from(creatorEarnings)
      .where(
        and(
          eq(creatorEarnings.creatorId, creatorId),
          eq(creatorEarnings.periodMonth, periodMonth),
        ),
      )
      .limit(1);

    return row || null;
  }

  async upsertSettlement(data: UpsertEarningsDto, tx?: any): Promise<CreatorEarnings> {
    const client = tx || this.db;
    const existing = await this.findByCreatorAndMonth(data.creatorId, data.periodMonth);

    if (existing) {
      await client
        .update(creatorEarnings)
        .set({
          grossAmount: data.grossAmount,
          platformFee: data.platformFee,
          taxWithheld: data.taxWithheld,
          netPayout: data.netPayout,
          currency: data.currency || existing.currency,
          status: data.status || existing.status,
          holdReason: data.holdReason !== undefined ? data.holdReason : existing.holdReason,
          payoutReference:
            data.payoutReference !== undefined ? data.payoutReference : existing.payoutReference,
          metadata: data.metadata || existing.metadata,
          paidAt: data.paidAt !== undefined ? data.paidAt : existing.paidAt,
          updatedAt: new Date(),
        })
        .where(eq(creatorEarnings.id, existing.id));

      const [updated] = await client
        .select()
        .from(creatorEarnings)
        .where(eq(creatorEarnings.id, existing.id))
        .limit(1);

      return updated;
    }

    const id = generateUlid();
    const newRecord: NewCreatorEarnings = {
      id,
      creatorId: data.creatorId,
      periodMonth: data.periodMonth,
      grossAmount: data.grossAmount,
      platformFee: data.platformFee,
      taxWithheld: data.taxWithheld,
      netPayout: data.netPayout,
      currency: data.currency || 'INR',
      status: data.status || 'CALCULATED',
      holdReason: data.holdReason || null,
      payoutReference: data.payoutReference || null,
      metadata: data.metadata || null,
      paidAt: data.paidAt || null,
    };

    await client.insert(creatorEarnings).values(newRecord);

    const [created] = await client
      .select()
      .from(creatorEarnings)
      .where(eq(creatorEarnings.id, id))
      .limit(1);

    return created;
  }

  async findByCreatorId(
    creatorId: string,
    options: {
      page?: number;
      limit?: number;
      status?: CreatorEarningsStatus;
      periodMonth?: string;
    } = {},
  ): Promise<{ items: CreatorEarningsWithMeta[]; total: number }> {
    const { page = 1, limit = 20, status, periodMonth } = options;
    const offset = (page - 1) * limit;

    const conditions = [eq(creatorEarnings.creatorId, creatorId)];
    if (status) conditions.push(eq(creatorEarnings.status, status));
    if (periodMonth) conditions.push(like(creatorEarnings.periodMonth, `${periodMonth}%`));

    const whereClause = and(...conditions);

    const rows = await this.db
      .select({
        earnings: creatorEarnings,
        creatorName: creators.displayName,
      })
      .from(creatorEarnings)
      .innerJoin(creators, eq(creatorEarnings.creatorId, creators.id))
      .where(whereClause)
      .orderBy(desc(creatorEarnings.periodMonth))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(creatorEarnings)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const items: CreatorEarningsWithMeta[] = rows.map((r) => ({
      ...r.earnings,
      creatorName: r.creatorName,
    }));

    return { items, total };
  }

  async findAll(
    options: {
      page?: number;
      limit?: number;
      status?: CreatorEarningsStatus;
      periodMonth?: string;
      creatorId?: string;
    } = {},
  ): Promise<{ items: CreatorEarningsWithMeta[]; total: number }> {
    const { page = 1, limit = 20, status, periodMonth, creatorId } = options;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (creatorId) conditions.push(eq(creatorEarnings.creatorId, creatorId));
    if (status) conditions.push(eq(creatorEarnings.status, status));
    if (periodMonth) conditions.push(like(creatorEarnings.periodMonth, `${periodMonth}%`));

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const query = this.db
      .select({
        earnings: creatorEarnings,
        creatorName: creators.displayName,
      })
      .from(creatorEarnings)
      .innerJoin(creators, eq(creatorEarnings.creatorId, creators.id));

    if (whereClause) {
      query.where(whereClause);
    }

    const rows = await query
      .orderBy(desc(creatorEarnings.periodMonth), desc(creatorEarnings.createdAt))
      .limit(limit)
      .offset(offset);

    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(creatorEarnings);

    if (whereClause) {
      countQuery.where(whereClause);
    }

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count || 0);

    const items: CreatorEarningsWithMeta[] = rows.map((r) => ({
      ...r.earnings,
      creatorName: r.creatorName,
    }));

    return { items, total };
  }

  async updateStatus(
    id: string,
    data: {
      status: CreatorEarningsStatus;
      holdReason?: string | null;
      payoutReference?: string | null;
      paidAt?: Date | null;
    },
  ): Promise<CreatorEarningsWithMeta | null> {
    const updates: Partial<NewCreatorEarnings> = {
      status: data.status,
      updatedAt: new Date(),
    };

    if (data.holdReason !== undefined) updates.holdReason = data.holdReason;
    if (data.payoutReference !== undefined) updates.payoutReference = data.payoutReference;
    if (data.paidAt !== undefined) updates.paidAt = data.paidAt;

    await this.db
      .update(creatorEarnings)
      .set(updates)
      .where(eq(creatorEarnings.id, id));

    return this.findById(id);
  }

  async getEarningsSummary(creatorId: string): Promise<{
    totalGross: string;
    totalNet: string;
    totalPaid: string;
    pendingPayout: string;
    heldAmount: string;
    currency: string;
    lastSettlementMonth: string | null;
    lifetimePayoutsCount: number;
  }> {
    const rows = await this.db
      .select()
      .from(creatorEarnings)
      .where(eq(creatorEarnings.creatorId, creatorId))
      .orderBy(desc(creatorEarnings.periodMonth));

    let grossAcc = 0;
    let netAcc = 0;
    let paidAcc = 0;
    let pendingAcc = 0;
    let heldAcc = 0;
    let currency = 'INR';
    let lastMonth: string | null = null;
    let lifetimePayoutsCount = 0;

    for (const r of rows) {
      if (!lastMonth) lastMonth = r.periodMonth;
      currency = r.currency || 'INR';

      const gross = parseFloat(r.grossAmount || '0');
      const net = parseFloat(r.netPayout || '0');

      grossAcc += gross;
      netAcc += net;

      if (r.status === 'PAID') {
        paidAcc += net;
        lifetimePayoutsCount += 1;
      } else if (r.status === 'PENDING_PAYOUT') {
        pendingAcc += net;
      } else if (r.status === 'HELD') {
        heldAcc += net;
      }
    }

    return {
      totalGross: grossAcc.toFixed(2),
      totalNet: netAcc.toFixed(2),
      totalPaid: paidAcc.toFixed(2),
      pendingPayout: pendingAcc.toFixed(2),
      heldAmount: heldAcc.toFixed(2),
      currency,
      lastSettlementMonth: lastMonth,
      lifetimePayoutsCount,
    };
  }
}
