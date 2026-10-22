import { Injectable, Inject } from '@nestjs/common';
import { eq, and, or, isNull, gt, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  entitlements,
  Entitlement,
  NewEntitlement,
} from '../../../database/schema';

@Injectable()
export class EntitlementsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async findActiveByUserId(userId: string): Promise<Entitlement[]> {
    const now = new Date();
    return this.db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.isActive, true),
          or(isNull(entitlements.expiresAt), gt(entitlements.expiresAt, now)),
        ),
      );
  }

  async hasEntitlement(userId: string, code: string): Promise<boolean> {
    const now = new Date();
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.entitlementCode, code),
          eq(entitlements.isActive, true),
          or(isNull(entitlements.expiresAt), gt(entitlements.expiresAt, now)),
        ),
      );

    return Number(results[0]?.count || 0) > 0;
  }

  async create(data: NewEntitlement): Promise<Entitlement> {
    await this.db.insert(entitlements).values(data);
    const results = await this.db
      .select()
      .from(entitlements)
      .where(eq(entitlements.id, data.id!))
      .limit(1);

    return results[0];
  }

  async revoke(id: string): Promise<boolean> {
    await this.db
      .update(entitlements)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(entitlements.id, id));

    return true;
  }

  async revokeAllForUser(userId: string): Promise<boolean> {
    await this.db
      .update(entitlements)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(entitlements.userId, userId));

    return true;
  }

  async updateExpirationForUser(userId: string, newExpiresAt: Date): Promise<void> {
    await this.db
      .update(entitlements)
      .set({
        expiresAt: newExpiresAt,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(entitlements.userId, userId));
  }
}
