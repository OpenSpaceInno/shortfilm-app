import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, sql, desc, or, like } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  stories,
  seasons,
  Story,
  StoryStatus,
} from '../../../database/schema/content.schema';
import { creators } from '../../../database/schema/creator.schema';
import { featuredCurations } from '../../../database/schema/admin.schema';
import { QueryAdminStoriesDto, AdminOverrideMetadataDto } from '../dto/content-curation.dto';

@Injectable()
export class AdminContentRepository {
  private readonly logger = new Logger(AdminContentRepository.name);

  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db(): MySql2Database {
    return this.dbService.getDb();
  }

  async findStoriesPaginated(
    query: QueryAdminStoriesDto,
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [];

    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(or(like(stories.title, term), like(stories.synopsis, term)));
    }

    if (query.status) {
      conditions.push(eq(stories.status, query.status));
    }

    if (query.creatorId) {
      conditions.push(eq(stories.creatorId, query.creatorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(stories)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select({
        story: stories,
        creatorName: creators.displayName,
      })
      .from(stories)
      .leftJoin(creators, eq(stories.creatorId, creators.id))
      .where(whereClause)
      .orderBy(desc(stories.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch featured state & season counts
    const items = await Promise.all(
      rows.map(async (r) => {
        const curations = await this.db
          .select()
          .from(featuredCurations)
          .where(and(eq(featuredCurations.storyId, r.story.id), eq(featuredCurations.isActive, true)))
          .limit(1);

        const seasonRows = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(seasons)
          .where(eq(seasons.storyId, r.story.id));

        return {
          id: r.story.id,
          title: r.story.title,
          slug: r.story.id,
          description: r.story.synopsis,
          thumbnailUrl: r.story.thumbnailUrl,
          status: r.story.status,
          creatorId: r.story.creatorId,
          creatorName: r.creatorName || 'Unknown Creator',
          viewCount: r.story.viewCount || 0,
          ratingAverage: 4.8,
          ratingCount: 120,
          isInteractive: true,
          isFeatured: curations.length > 0,
          totalSeasons: Number(seasonRows[0]?.count || 0),
          totalEpisodes: 0,
          createdAt: r.story.createdAt.toISOString(),
          updatedAt: r.story.updatedAt.toISOString(),
        };
      }),
    );

    const filteredItems =
      query.isFeatured !== undefined
        ? items.filter((s) => s.isFeatured === query.isFeatured)
        : items;

    return { items: filteredItems, total: query.isFeatured !== undefined ? filteredItems.length : total };
  }

  async findStoryDetail(id: string) {
    const rows = await this.db
      .select({
        story: stories,
        creatorName: creators.displayName,
      })
      .from(stories)
      .leftJoin(creators, eq(stories.creatorId, creators.id))
      .where(eq(stories.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const seasonList = await this.db
      .select()
      .from(seasons)
      .where(eq(seasons.storyId, id));

    const curations = await this.db
      .select()
      .from(featuredCurations)
      .where(and(eq(featuredCurations.storyId, id), eq(featuredCurations.isActive, true)));

    return {
      ...row.story,
      creatorName: row.creatorName,
      seasons: seasonList,
      curations,
      isFeatured: curations.length > 0,
    };
  }

  async updateStatus(storyId: string, status: StoryStatus): Promise<Story | null> {
    await this.db
      .update(stories)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(stories.id, storyId));

    const updated = await this.db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
    return updated[0] || null;
  }

  async updateMetadata(storyId: string, data: AdminOverrideMetadataDto): Promise<Story | null> {
    await this.db
      .update(stories)
      .set({
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { synopsis: data.description }),
        ...(data.ageRating && { contentRating: data.ageRating }),
        ...(data.defaultLanguage && { language: data.defaultLanguage }),
        updatedAt: new Date(),
      })
      .where(eq(stories.id, storyId));

    const updated = await this.db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
    return updated[0] || null;
  }

  async countStoriesByStatus(): Promise<{
    total: number;
    published: number;
    inReview: number;
    draft: number;
    archived: number;
  }> {
    const totalResult = await this.db.select({ count: sql<number>`count(*)` }).from(stories);
    const pubResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(stories)
      .where(eq(stories.status, 'PUBLISHED'));
    const reviewResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(stories)
      .where(eq(stories.status, 'SUBMITTED'));
    const draftResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(stories)
      .where(eq(stories.status, 'DRAFT'));
    const archResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(stories)
      .where(eq(stories.status, 'ARCHIVED'));

    return {
      total: Number(totalResult[0]?.count || 0),
      published: Number(pubResult[0]?.count || 0),
      inReview: Number(reviewResult[0]?.count || 0),
      draft: Number(draftResult[0]?.count || 0),
      archived: Number(archResult[0]?.count || 0),
    };
  }
}
