import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { storyNodes, StoryNode, NewStoryNode } from '../../../database/schema';

@Injectable()
export class StoryNodesRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: NewStoryNode): Promise<StoryNode> {
    await this.db.insert(storyNodes).values(data);
    const created = await this.findById(data.id!);
    return created!;
  }

  async findById(id: string): Promise<StoryNode | null> {
    const results = await this.db
      .select()
      .from(storyNodes)
      .where(eq(storyNodes.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByVersionId(versionId: string): Promise<StoryNode[]> {
    return this.db
      .select()
      .from(storyNodes)
      .where(eq(storyNodes.storyVersionId, versionId))
      .orderBy(storyNodes.sequenceOrder);
  }

  async findRootNode(versionId: string): Promise<StoryNode | null> {
    const results = await this.db
      .select()
      .from(storyNodes)
      .where(and(eq(storyNodes.storyVersionId, versionId), eq(storyNodes.isRoot, true)))
      .limit(1);

    return results[0] || null;
  }

  async update(id: string, data: Partial<NewStoryNode>): Promise<StoryNode> {
    await this.db
      .update(storyNodes)
      .set(data)
      .where(eq(storyNodes.id, id));

    const updated = await this.findById(id);
    return updated!;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(storyNodes).where(eq(storyNodes.id, id));
  }

  async findByEpisodeId(episodeId: string): Promise<StoryNode | null> {
    const results = await this.db
      .select()
      .from(storyNodes)
      .where(eq(storyNodes.episodeId, episodeId))
      .limit(1);

    return results[0] || null;
  }
}

