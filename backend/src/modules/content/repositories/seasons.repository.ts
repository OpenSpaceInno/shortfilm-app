import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { seasons, Season, NewSeason } from '../../../database/schema';

@Injectable()
export class SeasonsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(data: NewSeason): Promise<Season> {
    await this.db.insert(seasons).values(data);
    const result = await this.findById(data.id!);
    return result!;
  }

  async findById(id: string): Promise<Season | null> {
    const results = await this.db.select().from(seasons).where(eq(seasons.id, id)).limit(1);
    return results[0] || null;
  }

  async findByStoryId(storyId: string): Promise<Season[]> {
    return this.db
      .select()
      .from(seasons)
      .where(eq(seasons.storyId, storyId))
      .orderBy(seasons.seasonNumber);
  }

  async countForStory(storyId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(seasons)
      .where(eq(seasons.storyId, storyId));
    return Number(results[0]?.count || 0);
  }
}
