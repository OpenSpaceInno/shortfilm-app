import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  watchHistory,
  WatchHistory,
  episodes,
  seasons,
  stories,
  videos,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';
import { WatchHistoryItemDto } from '../dto/watch-history.dto';

@Injectable()
export class WatchHistoryRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(
    data: {
      userId: string;
      episodeId: string;
      storyVersionId?: string | null;
    },
    tx?: any,
  ): Promise<WatchHistory> {
    const client = tx || this.db;
    const id = generateUlid();

    await client.insert(watchHistory).values({
      id,
      userId: data.userId,
      episodeId: data.episodeId,
      storyVersionId: data.storyVersionId || null,
    });

    const results = await client
      .select()
      .from(watchHistory)
      .where(eq(watchHistory.id, id))
      .limit(1);

    return results[0]!;
  }

  async hasCompleted(userId: string, episodeId: string, tx?: any): Promise<boolean> {
    const client = tx || this.db;
    const results = await client
      .select({ id: watchHistory.id })
      .from(watchHistory)
      .where(and(eq(watchHistory.userId, userId), eq(watchHistory.episodeId, episodeId)))
      .limit(1);

    return results.length > 0;
  }

  async countByUser(userId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId));

    return Number(results[0]?.count || 0);
  }


  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: WatchHistoryItemDto[]; total: number }> {
    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId));

    const total = Number(countResult?.count || 0);

    const rows = await this.db
      .select({
        id: watchHistory.id,
        userId: watchHistory.userId,
        episodeId: watchHistory.episodeId,
        storyVersionId: watchHistory.storyVersionId,
        watchedAt: watchHistory.watchedAt,
        episodeTitle: episodes.title,
        episodeNumber: episodes.episodeNumber,
        episodeThumbnail: episodes.thumbnailUrl,
        storyTitle: stories.title,
        videoDuration: videos.durationSeconds,
      })
      .from(watchHistory)
      .innerJoin(episodes, eq(watchHistory.episodeId, episodes.id))
      .leftJoin(seasons, eq(episodes.seasonId, seasons.id))
      .leftJoin(stories, eq(seasons.storyId, stories.id))
      .leftJoin(videos, eq(episodes.id, videos.episodeId))
      .where(eq(watchHistory.userId, userId))
      .orderBy(desc(watchHistory.watchedAt))
      .limit(limit)
      .offset(offset);

    const items: WatchHistoryItemDto[] = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      episodeId: row.episodeId,
      storyVersionId: row.storyVersionId,
      watchedAt: row.watchedAt,
      episode: {
        id: row.episodeId,
        title: row.episodeTitle,
        episodeNumber: row.episodeNumber,
        thumbnailUrl: row.episodeThumbnail,
        durationSeconds: row.videoDuration,
        storyTitle: row.storyTitle || undefined,
      },
    }));

    return { items, total };
  }
}
