import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { follows, Follow, FollowTargetType } from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class FollowsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
    tx?: any,
  ): Promise<Follow> {
    const client = tx || this.db;

    const existing = await client
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.userId, userId),
          eq(follows.targetType, targetType),
          eq(follows.targetId, targetId),
        ),
      )
      .limit(1);

    if (existing && existing.length > 0) {
      return existing[0]!;
    }

    const id = generateUlid();
    await client.insert(follows).values({
      id,
      userId,
      targetType,
      targetId,
    });

    const results = await client.select().from(follows).where(eq(follows.id, id)).limit(1);
    return results[0]!;
  }

  async delete(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
    tx?: any,
  ): Promise<boolean> {
    const client = tx || this.db;
    await client
      .delete(follows)
      .where(
        and(
          eq(follows.userId, userId),
          eq(follows.targetType, targetType),
          eq(follows.targetId, targetId),
        ),
      );

    return true;
  }

  async isFollowing(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
  ): Promise<boolean> {
    const results = await this.db
      .select({ id: follows.id })
      .from(follows)
      .where(
        and(
          eq(follows.userId, userId),
          eq(follows.targetType, targetType),
          eq(follows.targetId, targetId),
        ),
      )
      .limit(1);

    return results.length > 0;
  }

  async countByTarget(targetType: FollowTargetType, targetId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(and(eq(follows.targetType, targetType), eq(follows.targetId, targetId)));

    return Number(result[0]?.count || 0);
  }

  async findByUserId(userId: string): Promise<Follow[]> {
    return this.db
      .select()
      .from(follows)
      .where(eq(follows.userId, userId))
      .orderBy(desc(follows.createdAt));
  }
}
