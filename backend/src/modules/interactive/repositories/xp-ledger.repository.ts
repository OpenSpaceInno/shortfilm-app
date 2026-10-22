import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { xpLedger, XpLedger, NewXpLedger } from '../../../database/schema';

@Injectable()
export class XpLedgerRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: NewXpLedger, tx?: any): Promise<XpLedger> {
    const client = tx || this.db;
    await client.insert(xpLedger).values(data);
    const results = await client
      .select()
      .from(xpLedger)
      .where(eq(xpLedger.id, data.id!))
      .limit(1);

    return results[0]!;
  }

  async findByUserId(userId: string, limit = 50): Promise<XpLedger[]> {
    return this.db
      .select()
      .from(xpLedger)
      .where(eq(xpLedger.userId, userId))
      .orderBy(desc(xpLedger.createdAt))
      .limit(limit);
  }

  async findByUserActionAndReference(
    userId: string,
    action: string,
    referenceId: string,
    tx?: any,
  ): Promise<XpLedger | null> {
    const client = tx || this.db;
    const results = await client
      .select()
      .from(xpLedger)
      .where(
        and(
          eq(xpLedger.userId, userId),
          eq(xpLedger.action, action),
          eq(xpLedger.referenceId, referenceId),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  async hasAwarded(
    userId: string,
    action: string,
    referenceId: string,
    tx?: any,
  ): Promise<boolean> {
    const record = await this.findByUserActionAndReference(userId, action, referenceId, tx);
    return record !== null;
  }

  async getTotalXp(userId: string): Promise<number> {
    const result = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${xpLedger.points}), 0)` })
      .from(xpLedger)
      .where(eq(xpLedger.userId, userId));

    return Number(result[0]?.total || 0);
  }
}

