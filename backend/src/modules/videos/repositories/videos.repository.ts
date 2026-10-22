import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { videos, Video, NewVideo } from '../../../database/schema';

@Injectable()
export class VideosRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: NewVideo): Promise<Video> {
    await this.db.insert(videos).values(data);
    const created = await this.findById(data.id!);
    return created!;
  }

  async findById(id: string): Promise<Video | null> {
    const results = await this.db.select().from(videos).where(eq(videos.id, id)).limit(1);
    return results[0] || null;
  }

  async findByEpisodeId(episodeId: string): Promise<Video | null> {
    const results = await this.db.select().from(videos).where(eq(videos.episodeId, episodeId)).limit(1);
    return results[0] || null;
  }

  async findByProviderUid(providerUid: string): Promise<Video | null> {
    const results = await this.db.select().from(videos).where(eq(videos.providerUid, providerUid)).limit(1);
    return results[0] || null;
  }

  async update(id: string, data: Partial<NewVideo>): Promise<Video> {
    await this.db
      .update(videos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(videos.id, id));

    const updated = await this.findById(id);
    return updated!;
  }

  async updateByProviderUid(providerUid: string, data: Partial<NewVideo>): Promise<Video | null> {
    const existing = await this.findByProviderUid(providerUid);
    if (!existing) return null;

    await this.db
      .update(videos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(videos.providerUid, providerUid));

    return this.findByProviderUid(providerUid);
  }

  async upsertForEpisode(episodeId: string, data: NewVideo): Promise<Video> {
    const existing = await this.findByEpisodeId(episodeId);
    if (existing) {
      return this.update(existing.id, data);
    }
    return this.create(data);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(videos).where(eq(videos.id, id));
  }
}
