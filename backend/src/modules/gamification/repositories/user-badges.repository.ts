import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { userBadges, UserBadge, badges, Badge } from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class UserBadgesRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(userId: string, badgeId: string, tx?: any): Promise<UserBadge> {
    const client = tx || this.db;
    const id = generateUlid();

    await client.insert(userBadges).values({
      id,
      userId,
      badgeId,
    });

    const results = await client
      .select()
      .from(userBadges)
      .where(eq(userBadges.id, id))
      .limit(1);

    return results[0]!;
  }

  async findByUserId(userId: string): Promise<UserBadge[]> {
    return this.db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.unlockedAt));
  }

  async hasBadge(userId: string, badgeId: string, tx?: any): Promise<boolean> {
    const client = tx || this.db;
    const results = await client
      .select({ id: userBadges.id })
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
      .limit(1);

    return results.length > 0;
  }

  async findUserBadgesWithDetails(userId: string): Promise<Array<{ badge: Badge; unlockedAt: Date }>> {
    const rows = await this.db
      .select({
        badgeId: badges.id,
        slug: badges.slug,
        name: badges.name,
        description: badges.description,
        iconUrl: badges.iconUrl,
        category: badges.category,
        criteriaType: badges.criteriaType,
        criteriaValue: badges.criteriaValue,
        xpReward: badges.xpReward,
        createdAt: badges.createdAt,
        unlockedAt: userBadges.unlockedAt,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.unlockedAt));

    return rows.map((r) => ({
      badge: {
        id: r.badgeId,
        slug: r.slug,
        name: r.name,
        description: r.description,
        iconUrl: r.iconUrl,
        category: r.category,
        criteriaType: r.criteriaType,
        criteriaValue: r.criteriaValue,
        xpReward: r.xpReward,
        createdAt: r.createdAt,
      },
      unlockedAt: r.unlockedAt,
    }));
  }
}
