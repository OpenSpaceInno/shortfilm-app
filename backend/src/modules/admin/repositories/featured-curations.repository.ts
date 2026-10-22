import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, sql, asc } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  featuredCurations,
  FeaturedCuration,
  CurationCollectionType,
} from '../../../database/schema/admin.schema';
import { stories } from '../../../database/schema/content.schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class FeaturedCurationsRepository {
  private readonly logger = new Logger(FeaturedCurationsRepository.name);

  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db(): MySql2Database {
    return this.dbService.getDb();
  }

  async create(data: {
    storyId: string;
    collectionType: CurationCollectionType;
    displayOrder?: number;
    badge?: string;
    customHeadline?: string;
    startsAt?: Date;
    endsAt?: Date;
    curatedBy: string;
  }): Promise<FeaturedCuration> {
    const id = generateUlid();

    await this.db.insert(featuredCurations).values({
      id,
      storyId: data.storyId,
      collectionType: data.collectionType,
      displayOrder: data.displayOrder ?? 0,
      badge: data.badge || null,
      customHeadline: data.customHeadline || null,
      isActive: true,
      startsAt: data.startsAt || null,
      endsAt: data.endsAt || null,
      curatedBy: data.curatedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const inserted = await this.findById(id);
    return inserted!;
  }

  async findById(id: string): Promise<FeaturedCuration | null> {
    const rows = await this.db
      .select()
      .from(featuredCurations)
      .where(eq(featuredCurations.id, id))
      .limit(1);

    return rows[0] || null;
  }

  async findByStoryAndCollection(
    storyId: string,
    collectionType: CurationCollectionType,
  ): Promise<FeaturedCuration | null> {
    const rows = await this.db
      .select()
      .from(featuredCurations)
      .where(
        and(
          eq(featuredCurations.storyId, storyId),
          eq(featuredCurations.collectionType, collectionType),
        ),
      )
      .limit(1);

    return rows[0] || null;
  }

  async findMany(options?: {
    collectionType?: CurationCollectionType;
    isActive?: boolean;
  }): Promise<
    Array<
      FeaturedCuration & {
        storyTitle?: string;
        storyThumbnailUrl?: string | null;
      }
    >
  > {
    const conditions = [];

    if (options?.collectionType) {
      conditions.push(eq(featuredCurations.collectionType, options.collectionType));
    }
    if (options?.isActive !== undefined) {
      conditions.push(eq(featuredCurations.isActive, options.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        curation: featuredCurations,
        storyTitle: stories.title,
        storyThumbnailUrl: stories.thumbnailUrl,
      })
      .from(featuredCurations)
      .innerJoin(stories, eq(featuredCurations.storyId, stories.id))
      .where(whereClause)
      .orderBy(asc(featuredCurations.displayOrder));

    return rows.map((r) => ({
      ...r.curation,
      storyTitle: r.storyTitle,
      storyThumbnailUrl: r.storyThumbnailUrl,
    }));
  }

  async update(
    id: string,
    data: {
      displayOrder?: number;
      badge?: string;
      customHeadline?: string;
      isActive?: boolean;
      startsAt?: Date;
      endsAt?: Date;
    },
  ): Promise<FeaturedCuration | null> {
    await this.db
      .update(featuredCurations)
      .set({
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.badge !== undefined && { badge: data.badge }),
        ...(data.customHeadline !== undefined && { customHeadline: data.customHeadline }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.startsAt !== undefined && { startsAt: data.startsAt }),
        ...(data.endsAt !== undefined && { endsAt: data.endsAt }),
        updatedAt: new Date(),
      })
      .where(eq(featuredCurations.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(featuredCurations).where(eq(featuredCurations.id, id));
    return (result[0] as any)?.affectedRows > 0;
  }

  async countActive(): Promise<number> {
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(featuredCurations)
      .where(eq(featuredCurations.isActive, true));

    return Number(countResult[0]?.count || 0);
  }
}
