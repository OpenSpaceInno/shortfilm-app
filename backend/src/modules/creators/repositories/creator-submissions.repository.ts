import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql, like, or } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  creatorSubmissions,
  CreatorSubmission,
  NewCreatorSubmission,
  SubmissionStatus,
  SubmissionType,
  creators,
  users,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

export interface CreatorSubmissionWithMeta extends CreatorSubmission {
  creatorName?: string;
  reviewerName?: string | null;
}

@Injectable()
export class CreatorSubmissionsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(
    data: {
      creatorId: string;
      title: string;
      synopsis?: string | null;
      submissionType?: SubmissionType;
      storyId?: string | null;
      storyVersionId?: string | null;
      scriptUrl?: string | null;
      videoPreviewUrl?: string | null;
      status?: SubmissionStatus;
      storyInfo?: Record<string, any> | null;
      contentPreview?: Record<string, any> | null;
      checklist?: Record<string, any> | null;
      submittedAt?: Date | null;
    },
    tx?: any,
  ): Promise<CreatorSubmission> {
    const client = tx || this.db;
    const id = generateUlid();

    await client.insert(creatorSubmissions).values({
      id,
      creatorId: data.creatorId,
      title: data.title,
      synopsis: data.synopsis || null,
      submissionType: data.submissionType || 'FULL_SERIES',
      storyId: data.storyId || null,
      storyVersionId: data.storyVersionId || null,
      scriptUrl: data.scriptUrl || null,
      videoPreviewUrl: data.videoPreviewUrl || null,
      status: data.status || 'DRAFT',
      storyInfo: data.storyInfo || null,
      contentPreview: data.contentPreview || null,
      checklist: data.checklist || null,
      submittedAt: data.submittedAt || null,
    });

    const results = await client
      .select()
      .from(creatorSubmissions)
      .where(eq(creatorSubmissions.id, id))
      .limit(1);

    return results[0]!;
  }

  async findById(id: string): Promise<CreatorSubmissionWithMeta | null> {
    const rows = await this.db
      .select({
        submission: creatorSubmissions,
        creatorName: creators.displayName,
        reviewerName: users.displayName,
      })
      .from(creatorSubmissions)
      .innerJoin(creators, eq(creatorSubmissions.creatorId, creators.id))
      .leftJoin(users, eq(creatorSubmissions.reviewerId, users.id))
      .where(eq(creatorSubmissions.id, id))
      .limit(1);

    if (!rows || rows.length === 0) return null;
    const row = rows[0]!;
    return {
      ...row.submission,
      creatorName: row.creatorName,
      reviewerName: row.reviewerName,
    };
  }

  async findByCreatorId(
    creatorId: string,
    options: {
      status?: SubmissionStatus;
      submissionType?: SubmissionType;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ items: CreatorSubmissionWithMeta[]; total: number }> {
    const { status, submissionType, limit = 20, offset = 0 } = options;

    const conditions = [eq(creatorSubmissions.creatorId, creatorId)];
    if (status) conditions.push(eq(creatorSubmissions.status, status));
    if (submissionType) conditions.push(eq(creatorSubmissions.submissionType, submissionType));

    const whereClause = and(...conditions);

    const rows = await this.db
      .select({
        submission: creatorSubmissions,
        creatorName: creators.displayName,
        reviewerName: users.displayName,
      })
      .from(creatorSubmissions)
      .innerJoin(creators, eq(creatorSubmissions.creatorId, creators.id))
      .leftJoin(users, eq(creatorSubmissions.reviewerId, users.id))
      .where(whereClause)
      .orderBy(desc(creatorSubmissions.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(creatorSubmissions)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const items: CreatorSubmissionWithMeta[] = rows.map((r) => ({
      ...r.submission,
      creatorName: r.creatorName,
      reviewerName: r.reviewerName,
    }));

    return { items, total };
  }

  async findAll(options: {
    status?: SubmissionStatus;
    submissionType?: SubmissionType;
    creatorId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: CreatorSubmissionWithMeta[]; total: number }> {
    const { status, submissionType, creatorId, search, limit = 20, offset = 0 } = options;

    const conditions: any[] = [];
    if (status) conditions.push(eq(creatorSubmissions.status, status));
    if (submissionType) conditions.push(eq(creatorSubmissions.submissionType, submissionType));
    if (creatorId) conditions.push(eq(creatorSubmissions.creatorId, creatorId));
    if (search) {
      conditions.push(
        or(
          like(creatorSubmissions.title, `%${search}%`),
          like(creatorSubmissions.synopsis, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        submission: creatorSubmissions,
        creatorName: creators.displayName,
        reviewerName: users.displayName,
      })
      .from(creatorSubmissions)
      .innerJoin(creators, eq(creatorSubmissions.creatorId, creators.id))
      .leftJoin(users, eq(creatorSubmissions.reviewerId, users.id))
      .where(whereClause)
      .orderBy(desc(creatorSubmissions.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(creatorSubmissions)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    const items: CreatorSubmissionWithMeta[] = rows.map((r) => ({
      ...r.submission,
      creatorName: r.creatorName,
      reviewerName: r.reviewerName,
    }));

    return { items, total };
  }

  async update(
    id: string,
    updates: Partial<CreatorSubmission>,
    tx?: any,
  ): Promise<CreatorSubmissionWithMeta> {
    const client = tx || this.db;

    await client
      .update(creatorSubmissions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(creatorSubmissions.id, id));

    const refreshed = await this.findById(id);
    return refreshed!;
  }

  async delete(id: string, tx?: any): Promise<void> {
    const client = tx || this.db;
    await client.delete(creatorSubmissions).where(eq(creatorSubmissions.id, id));
  }
}
