import { Injectable, Inject } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { genres, storyGenres, Genre, NewGenre } from '../../../database/schema';

@Injectable()
export class GenresRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async findAll(): Promise<Genre[]> {
    return this.db.select().from(genres).orderBy(genres.name);
  }

  async findById(id: string): Promise<Genre | null> {
    const results = await this.db.select().from(genres).where(eq(genres.id, id)).limit(1);
    return results[0] || null;
  }

  async findBySlug(slug: string): Promise<Genre | null> {
    const results = await this.db.select().from(genres).where(eq(genres.slug, slug)).limit(1);
    return results[0] || null;
  }

  async findForStory(storyId: string): Promise<Genre[]> {
    const links = await this.db
      .select({ genre: genres })
      .from(storyGenres)
      .innerJoin(genres, eq(storyGenres.genreId, genres.id))
      .where(eq(storyGenres.storyId, storyId));

    return links.map((l) => l.genre);
  }

  async linkStoryGenres(storyId: string, genreIds: string[]): Promise<void> {
    if (genreIds.length === 0) return;
    const values = genreIds.map((genreId) => ({
      storyId,
      genreId,
    }));
    await this.db.insert(storyGenres).values(values);
  }
}
