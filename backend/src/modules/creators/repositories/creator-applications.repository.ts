import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  creatorApplications,
  CreatorApplication,
  NewCreatorApplication,
  ApplicationStatus,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class CreatorApplicationsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(
    data: {
      userId: string;
      applicantName: string;
      creatorName: string;
      category: string;
      genres?: string[];
      languages?: string[];
      bio?: string;
      location?: string;
      experience?: string;
      portfolioUrl?: string;
      proposedStory?: Record<string, any>;
    },
    tx?: any,
  ): Promise<CreatorApplication> {
    const client = tx || this.db;
    const id = generateUlid();

    await client.insert(creatorApplications).values({
      id,
      userId: data.userId,
      applicantName: data.applicantName,
      creatorName: data.creatorName,
      category: data.category,
      genres: data.genres || null,
      languages: data.languages || null,
      bio: data.bio || null,
      location: data.location || null,
      experience: data.experience || null,
      portfolioUrl: data.portfolioUrl || null,
      proposedStory: data.proposedStory || null,
      status: 'PENDING',
    });

    const results = await client
      .select()
      .from(creatorApplications)
      .where(eq(creatorApplications.id, id))
      .limit(1);

    return results[0]!;
  }

  async findById(id: string): Promise<CreatorApplication | null> {
    const results = await this.db
      .select()
      .from(creatorApplications)
      .where(eq(creatorApplications.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByUserId(userId: string): Promise<CreatorApplication[]> {
    return this.db
      .select()
      .from(creatorApplications)
      .where(eq(creatorApplications.userId, userId))
      .orderBy(desc(creatorApplications.createdAt));
  }

  async findActiveByUserId(userId: string): Promise<CreatorApplication | null> {
    const results = await this.db
      .select()
      .from(creatorApplications)
      .where(
        and(
          eq(creatorApplications.userId, userId),
          inArray(creatorApplications.status, ['PENDING', 'UNDER_REVIEW']),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  async findAll(options: {
    status?: ApplicationStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ items: CreatorApplication[]; total: number }> {
    const { status, limit = 20, offset = 0 } = options;

    const condition = status ? eq(creatorApplications.status, status) : undefined;

    const items = await this.db
      .select()
      .from(creatorApplications)
      .where(condition)
      .orderBy(desc(creatorApplications.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(creatorApplications)
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    return { items, total };
  }

  async update(
    id: string,
    updates: Partial<CreatorApplication>,
    tx?: any,
  ): Promise<CreatorApplication> {
    const client = tx || this.db;

    await client
      .update(creatorApplications)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(creatorApplications.id, id));

    const results = await client
      .select()
      .from(creatorApplications)
      .where(eq(creatorApplications.id, id))
      .limit(1);

    return results[0]!;
  }
}
