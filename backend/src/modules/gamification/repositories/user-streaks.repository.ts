import { Injectable, Inject } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { userStreaks, UserStreak } from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class UserStreaksRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async findByUserId(userId: string, tx?: any): Promise<UserStreak | null> {
    const client = tx || this.db;
    const results = await client
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1);

    return results[0] || null;
  }

  async upsert(
    userId: string,
    currentStreak: number,
    longestStreak: number,
    lastActivityDate: string,
    tx?: any,
  ): Promise<UserStreak> {
    const client = tx || this.db;

    const existing = await client
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1);

    if (existing && existing.length > 0) {
      const recordId = existing[0].id;
      await client
        .update(userStreaks)
        .set({
          currentStreak,
          longestStreak,
          lastActivityDate,
          updatedAt: new Date(),
        })
        .where(eq(userStreaks.id, recordId));

      const updated = await client
        .select()
        .from(userStreaks)
        .where(eq(userStreaks.id, recordId))
        .limit(1);

      return updated[0]!;
    }

    const newId = generateUlid();
    await client.insert(userStreaks).values({
      id: newId,
      userId,
      currentStreak,
      longestStreak,
      lastActivityDate,
    });

    const created = await client
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.id, newId))
      .limit(1);

    return created[0]!;
  }

  async getTopStreaks(limit: number = 20): Promise<UserStreak[]> {
    return this.db
      .select()
      .from(userStreaks)
      .orderBy(desc(userStreaks.currentStreak))
      .limit(limit);
  }
}
