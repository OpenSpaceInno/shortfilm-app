import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql, like, or, isNull } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  creators,
  Creator,
  NewCreator,
  creatorProfiles,
  CreatorProfile,
  stories,
  follows,
  CreatorTier,
  CreatorStatus,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class CreatorsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(
    data: {
      userId: string;
      displayName: string;
      bio?: string | null;
      tier?: CreatorTier;
      status?: CreatorStatus;
    },
    tx?: any,
  ): Promise<Creator> {
    const client = tx || this.db;
    const id = generateUlid();

    await client.insert(creators).values({
      id,
      userId: data.userId,
      displayName: data.displayName,
      bio: data.bio || null,
      tier: data.tier || 'EMERGING',
      status: data.status || 'APPLIED',
    });

    const results = await client
      .select()
      .from(creators)
      .where(eq(creators.id, id))
      .limit(1);

    return results[0]!;
  }

  async findById(id: string): Promise<Creator | null> {
    const results = await this.db
      .select()
      .from(creators)
      .where(eq(creators.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByUserId(userId: string): Promise<Creator | null> {
    const results = await this.db
      .select()
      .from(creators)
      .where(eq(creators.userId, userId))
      .limit(1);

    return results[0] || null;
  }

  async findAll(options: {
    tier?: CreatorTier;
    status?: CreatorStatus;
    category?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Array<{ creator: Creator; profile: CreatorProfile | null }>; total: number }> {
    const {
      tier,
      status,
      category,
      featured,
      search,
      limit = 20,
      offset = 0,
    } = options;

    const conditions: any[] = [];

    if (tier) conditions.push(eq(creators.tier, tier));
    if (status) conditions.push(eq(creators.status, status));
    if (category) conditions.push(eq(creatorProfiles.category, category));
    if (featured !== undefined) conditions.push(eq(creatorProfiles.isFeatured, featured));
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(creators.displayName, term),
          like(creators.bio, term),
          like(creatorProfiles.tagline, term),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        creator: creators,
        profile: creatorProfiles,
      })
      .from(creators)
      .leftJoin(creatorProfiles, eq(creators.id, creatorProfiles.creatorId))
      .where(whereClause)
      .orderBy(desc(creators.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(creators)
      .leftJoin(creatorProfiles, eq(creators.id, creatorProfiles.creatorId))
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    return { items: rows, total };
  }

  async update(id: string, updates: Partial<Creator>, tx?: any): Promise<Creator> {
    const client = tx || this.db;

    await client
      .update(creators)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, id));

    const results = await client
      .select()
      .from(creators)
      .where(eq(creators.id, id))
      .limit(1);

    return results[0]!;
  }

  async getProfileByCreatorId(creatorId: string): Promise<CreatorProfile | null> {
    const results = await this.db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.creatorId, creatorId))
      .limit(1);

    return results[0] || null;
  }

  async upsertProfile(
    creatorId: string,
    profileData: Partial<{
      tagline?: string;
      bio?: string;
      avatarUrl?: string;
      coverImageUrl?: string;
      location?: string;
      category?: string;
      genres?: string[];
      languages?: string[];
      experience?: string;
      portfolioUrl?: string;
      websiteUrl?: string;
      socialLinks?: Record<string, string>;
      isFeatured?: boolean;
      isRising?: boolean;
    }>,
    tx?: any,
  ): Promise<CreatorProfile> {
    const client = tx || this.db;
    const existing = await client
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.creatorId, creatorId))
      .limit(1);

    if (existing && existing.length > 0) {
      await client
        .update(creatorProfiles)
        .set({
          ...profileData,
          updatedAt: new Date(),
        })
        .where(eq(creatorProfiles.id, existing[0]!.id));

      const updated = await client
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.id, existing[0]!.id))
        .limit(1);

      return updated[0]!;
    }

    const id = generateUlid();
    await client.insert(creatorProfiles).values({
      id,
      creatorId,
      ...profileData,
    });

    const created = await client
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, id))
      .limit(1);

    return created[0]!;
  }

  async countStories(creatorId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(stories)
      .where(eq(stories.creatorId, creatorId));

    return Number(result[0]?.count || 0);
  }

  async countFollowers(creatorId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(and(eq(follows.targetType, 'CREATOR'), eq(follows.targetId, creatorId)));

    return Number(result[0]?.count || 0);
  }

  async findStoriesByCreatorId(
    creatorId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<any[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    return this.db
      .select()
      .from(stories)
      .where(and(eq(stories.creatorId, creatorId), isNull(stories.deletedAt)))
      .orderBy(desc(stories.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
