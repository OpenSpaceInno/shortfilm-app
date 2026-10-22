import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  watchProgress,
  WatchProgress,
  episodes,
  seasons,
  stories,
  videos,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';
import { ContinueWatchingItemDto } from '../dto/continue-watching.dto';

@Injectable()
export class WatchProgressRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async upsert(
    userId: string,
    episodeId: string,
    progressSeconds: number,
    completed: boolean,
    tx?: any,
  ): Promise<WatchProgress> {
    const client = tx || this.db;

    const existing = await client
      .select()
      .from(watchProgress)
      .where(and(eq(watchProgress.userId, userId), eq(watchProgress.episodeId, episodeId)))
      .limit(1);

    if (existing && existing.length > 0) {
      const recordId = existing[0].id;
      await client
        .update(watchProgress)
        .set({
          progressSeconds,
          completed,
          updatedAt: new Date(),
        })
        .where(eq(watchProgress.id, recordId));

      const updated = await client
        .select()
        .from(watchProgress)
        .where(eq(watchProgress.id, recordId))
        .limit(1);

      return updated[0]!;
    }

    const newId = generateUlid();
    await client.insert(watchProgress).values({
      id: newId,
      userId,
      episodeId,
      progressSeconds,
      completed,
    });

    const created = await client
      .select()
      .from(watchProgress)
      .where(eq(watchProgress.id, newId))
      .limit(1);

    return created[0]!;
  }

  async findByUserAndEpisode(
    userId: string,
    episodeId: string,
    tx?: any,
  ): Promise<WatchProgress | null> {
    const client = tx || this.db;
    const results = await client
      .select()
      .from(watchProgress)
      .where(and(eq(watchProgress.userId, userId), eq(watchProgress.episodeId, episodeId)))
      .limit(1);

    return results[0] || null;
  }

  async findContinueWatching(userId: string, limit: number = 10): Promise<ContinueWatchingItemDto[]> {
    const rows = await this.db
      .select({
        id: watchProgress.id,
        episodeId: watchProgress.episodeId,
        progressSeconds: watchProgress.progressSeconds,
        completed: watchProgress.completed,
        updatedAt: watchProgress.updatedAt,
        episodeTitle: episodes.title,
        episodeNumber: episodes.episodeNumber,
        episodeThumbnail: episodes.thumbnailUrl,
        seasonId: episodes.seasonId,
        seasonNumber: seasons.seasonNumber,
        seasonTitle: seasons.title,
        storyId: seasons.storyId,
        storyTitle: stories.title,
        storyCoverImageUrl: stories.posterUrl,
        videoDuration: videos.durationSeconds,
      })

      .from(watchProgress)
      .innerJoin(episodes, eq(watchProgress.episodeId, episodes.id))
      .innerJoin(seasons, eq(episodes.seasonId, seasons.id))
      .innerJoin(stories, eq(seasons.storyId, stories.id))
      .leftJoin(videos, eq(episodes.id, videos.episodeId))
      .where(and(eq(watchProgress.userId, userId), eq(watchProgress.completed, false)))
      .orderBy(desc(watchProgress.updatedAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      episodeId: row.episodeId,
      progressSeconds: row.progressSeconds,
      completed: row.completed,
      updatedAt: row.updatedAt,
      episode: {
        id: row.episodeId,
        title: row.episodeTitle,
        episodeNumber: row.episodeNumber,
        thumbnailUrl: row.episodeThumbnail,
        durationSeconds: row.videoDuration,
        seasonId: row.seasonId,
        seasonNumber: row.seasonNumber,
        seasonTitle: row.seasonTitle,
        storyId: row.storyId,
        storyTitle: row.storyTitle,
        storyCoverImageUrl: row.storyCoverImageUrl,
      },
    }));
  }

  async deleteByUserAndEpisode(userId: string, episodeId: string, tx?: any): Promise<boolean> {
    const client = tx || this.db;
    const result = await client
      .delete(watchProgress)
      .where(and(eq(watchProgress.userId, userId), eq(watchProgress.episodeId, episodeId)));

    return true;
  }
}
