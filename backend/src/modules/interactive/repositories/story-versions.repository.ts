import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { storyVersions, StoryVersion, NewStoryVersion } from '../../../database/schema';

@Injectable()
export class StoryVersionsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: NewStoryVersion): Promise<StoryVersion> {
    await this.db.insert(storyVersions).values(data);
    const created = await this.findById(data.id!);
    return created!;
  }

  async findById(id: string): Promise<StoryVersion | null> {
    const results = await this.db
      .select()
      .from(storyVersions)
      .where(eq(storyVersions.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByStoryId(storyId: string): Promise<StoryVersion[]> {
    return this.db
      .select()
      .from(storyVersions)
      .where(eq(storyVersions.storyId, storyId))
      .orderBy(desc(storyVersions.versionNumber));
  }

  async findLatestVersion(storyId: string): Promise<StoryVersion | null> {
    const results = await this.db
      .select()
      .from(storyVersions)
      .where(eq(storyVersions.storyId, storyId))
      .orderBy(desc(storyVersions.versionNumber))
      .limit(1);

    return results[0] || null;
  }

  async findPublishedVersion(storyId: string): Promise<StoryVersion | null> {
    const results = await this.db
      .select()
      .from(storyVersions)
      .where(and(eq(storyVersions.storyId, storyId), eq(storyVersions.status, 'PUBLISHED')))
      .limit(1);

    return results[0] || null;
  }

  async update(id: string, data: Partial<NewStoryVersion>): Promise<StoryVersion> {
    await this.db
      .update(storyVersions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(storyVersions.id, id));

    const updated = await this.findById(id);
    return updated!;
  }

  async findByStatus(status: StoryVersion['status']): Promise<StoryVersion[]> {
    return this.db
      .select()
      .from(storyVersions)
      .where(eq(storyVersions.status, status))
      .orderBy(desc(storyVersions.updatedAt));
  }

  async archivePublishedForStory(storyId: string, excludeVersionId?: string): Promise<void> {
    const conditions = [
      eq(storyVersions.storyId, storyId),
      eq(storyVersions.status, 'PUBLISHED'),
    ];

    if (excludeVersionId) {
      conditions.push(sql`${storyVersions.id} != ${excludeVersionId}`);
    }

    await this.db
      .update(storyVersions)
      .set({
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(...conditions));
  }
}
