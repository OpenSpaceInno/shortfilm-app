import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { episodes, seasons, Episode, NewEpisode } from '../../../database/schema';

@Injectable()
export class EpisodesRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: NewEpisode): Promise<Episode> {
    await this.db.insert(episodes).values(data);
    const result = await this.findById(data.id!);
    return result!;
  }

  async findById(id: string): Promise<Episode | null> {
    const results = await this.db.select().from(episodes).where(eq(episodes.id, id)).limit(1);
    return results[0] || null;
  }

  async findBySeasonId(seasonId: string): Promise<Episode[]> {
    return this.db
      .select()
      .from(episodes)
      .where(eq(episodes.seasonId, seasonId))
      .orderBy(episodes.episodeNumber);
  }

  async countForSeason(seasonId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(episodes)
      .where(eq(episodes.seasonId, seasonId));
    return Number(results[0]?.count || 0);
  }

  async countForStory(storyId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(episodes)
      .innerJoin(seasons, eq(episodes.seasonId, seasons.id))
      .where(eq(seasons.storyId, storyId));

    return Number(results[0]?.count || 0);
  }
}
