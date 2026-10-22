import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  stories,
  storyGenres,
  genres,
  creators,
  Story,
  NewStory,
  Creator,
} from '../../../database/schema';

export interface StoryWithCreator extends Story {
  creator: Creator;
}

export interface StoryFeedFilter {
  genreSlug?: string;
  language?: string;
  sort?: 'trending' | 'newest';
  limit?: number;
  offset?: number;
}

@Injectable()
export class StoriesRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: NewStory): Promise<Story> {
    await this.db.insert(stories).values(data);
    const result = await this.findById(data.id!);
    return result!;
  }

  async findById(id: string, includeDeleted = false): Promise<Story | null> {
    const conditions = [eq(stories.id, id)];
    if (!includeDeleted) {
      conditions.push(isNull(stories.deletedAt));
    }
    const results = await this.db
      .select()
      .from(stories)
      .where(and(...conditions))
      .limit(1);

    return results[0] || null;
  }

  async findByIdWithCreator(id: string): Promise<StoryWithCreator | null> {
    const results = await this.db
      .select({
        story: stories,
        creator: creators,
      })
      .from(stories)
      .innerJoin(creators, eq(stories.creatorId, creators.id))
      .where(and(eq(stories.id, id), isNull(stories.deletedAt)))
      .limit(1);

    if (results.length === 0) return null;
    return {
      ...results[0].story,
      creator: results[0].creator,
    };
  }

  async findPublished(filters: StoryFeedFilter = {}): Promise<{ items: StoryWithCreator[]; total: number }> {
    const limit = Math.min(filters.limit || 20, 50);
    const offset = filters.offset || 0;

    let query = this.db
      .select({
        story: stories,
        creator: creators,
      })
      .from(stories)
      .innerJoin(creators, eq(stories.creatorId, creators.id))
      .$dynamic();

    const conditions = [
      eq(stories.status, 'PUBLISHED'),
      isNull(stories.deletedAt),
    ];

    if (filters.language) {
      conditions.push(eq(stories.language, filters.language));
    }

    if (filters.genreSlug) {
      query = query
        .innerJoin(storyGenres, eq(stories.id, storyGenres.storyId))
        .innerJoin(genres, eq(storyGenres.genreId, genres.id));
      conditions.push(eq(genres.slug, filters.genreSlug));
    }

    const sortOrder =
      filters.sort === 'trending'
        ? [desc(stories.viewCount), desc(stories.publishedAt)]
        : [desc(stories.publishedAt)];

    const rows = await query
      .where(and(...conditions))
      .orderBy(...sortOrder)
      .limit(limit)
      .offset(offset);

    const items = rows.map((r) => ({
      ...r.story,
      creator: r.creator,
    }));

    // Count query
    let countQuery = this.db
      .select({ count: sql<number>`count(distinct ${stories.id})` })
      .from(stories)
      .$dynamic();

    if (filters.genreSlug) {
      countQuery = countQuery
        .innerJoin(storyGenres, eq(stories.id, storyGenres.storyId))
        .innerJoin(genres, eq(storyGenres.genreId, genres.id));
    }

    const countResult = await countQuery.where(and(...conditions));
    const total = Number(countResult[0]?.count || 0);

    return { items, total };
  }

  async findFeatured(limit = 5): Promise<StoryWithCreator[]> {
    const rows = await this.db
      .select({
        story: stories,
        creator: creators,
      })
      .from(stories)
      .innerJoin(creators, eq(stories.creatorId, creators.id))
      .where(and(eq(stories.status, 'PUBLISHED'), isNull(stories.deletedAt)))
      .orderBy(desc(stories.viewCount), desc(stories.publishedAt))
      .limit(limit);

    return rows.map((r) => ({
      ...r.story,
      creator: r.creator,
    }));
  }

  async findByCreatorId(creatorId: string): Promise<Story[]> {
    return this.db
      .select()
      .from(stories)
      .where(and(eq(stories.creatorId, creatorId), isNull(stories.deletedAt)))
      .orderBy(desc(stories.createdAt));
  }

  async update(id: string, data: Partial<NewStory>): Promise<Story> {
    await this.db
      .update(stories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(stories.id, id));

    const updated = await this.findById(id);
    return updated!;
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(stories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(stories.id, id));
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.db
      .update(stories)
      .set({ viewCount: sql`${stories.viewCount} + 1` })
      .where(eq(stories.id, id));
  }
}
