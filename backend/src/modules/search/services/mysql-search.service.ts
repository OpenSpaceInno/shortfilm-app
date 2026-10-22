import { Injectable, Inject, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import * as crypto from 'crypto';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  SearchService,
  SearchFilters,
  PaginationDto,
  SearchResultsDto,
  StorySearchResultDto,
  CreatorSearchResultDto,
  GenreSearchResultDto,
} from '../interfaces/search.interface';
import { binaryToUlid } from '../../../database/utils/ulid.util';

interface CachedSearchEntry {
  data: SearchResultsDto;
  expiresAt: number;
}

@Injectable()
export class MysqlSearchService implements SearchService {
  private readonly logger = new Logger(MysqlSearchService.name);
  private readonly cache = new Map<string, CachedSearchEntry>();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL (from 22_SEARCH.md)

  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async search(
    query: string,
    filters: SearchFilters = {},
    pagination: PaginationDto = {},
  ): Promise<SearchResultsDto> {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        stories: [],
        creators: [],
        genres: [],
        totalStories: 0,
        totalCreators: 0,
      };
    }

    const type = filters.type || 'all';
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 50);
    const offset = (page - 1) * limit;

    // Check cache: search:query:{hash}
    const cacheKey = this.buildCacheKey(trimmed, filters, page, limit);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Build Boolean Mode FTS query expression: e.g. "quantum divergence" -> "+quantum* +divergence*"
    const booleanQuery = this.formatBooleanQuery(trimmed);
    const likePattern = `%${trimmed}%`;

    let stories: StorySearchResultDto[] = [];
    let creators: CreatorSearchResultDto[] = [];
    let matchedGenres: GenreSearchResultDto[] = [];
    let totalStories = 0;
    let totalCreators = 0;

    // 1. Search Stories (if type is 'all' or 'stories')
    if (type === 'all' || type === 'stories') {
      try {
        const rows = await this.db.execute(sql`
          SELECT
            s.id,
            s.title,
            s.synopsis,
            s.premise,
            s.language,
            s.thumbnail_url,
            s.poster_url,
            s.view_count,
            c.id AS creator_id,
            c.display_name AS creator_name,
            c.tier AS creator_tier,
            MATCH(s.title, s.synopsis, s.premise) AGAINST(${booleanQuery} IN BOOLEAN MODE) AS score
          FROM stories s
          INNER JOIN creators c ON s.creator_id = c.id
          WHERE s.status = 'PUBLISHED'
            AND s.deleted_at IS NULL
            AND (
              MATCH(s.title, s.synopsis, s.premise) AGAINST(${booleanQuery} IN BOOLEAN MODE)
              OR s.title LIKE ${likePattern}
              OR s.synopsis LIKE ${likePattern}
            )
          ORDER BY score DESC, s.view_count DESC
          LIMIT ${limit} OFFSET ${offset};
        `);

        const rawStories = (rows as any)[0] as any[];
        if (Array.isArray(rawStories)) {
          stories = await Promise.all(
            rawStories.map(async (row) => {
              const storyId = binaryToUlid(row.id);
              const creatorId = row.creator_id ? binaryToUlid(row.creator_id) : '';
              const genres = await this.fetchGenresForStory(row.id);

              return {
                id: storyId,
                title: row.title,
                synopsis: row.synopsis,
                premise: row.premise,
                language: row.language,
                thumbnailUrl: row.thumbnail_url,
                posterUrl: row.poster_url,
                viewCount: Number(row.view_count || 0),
                score: Number(row.score || 0),
                genres,
                creator: creatorId
                  ? {
                      id: creatorId,
                      displayName: row.creator_name,
                      tier: row.creator_tier,
                    }
                  : undefined,
              };
            }),
          );
        }

        // Count matching stories
        const countRows = await this.db.execute(sql`
          SELECT COUNT(*) as count
          FROM stories s
          WHERE s.status = 'PUBLISHED'
            AND s.deleted_at IS NULL
            AND (
              MATCH(s.title, s.synopsis, s.premise) AGAINST(${booleanQuery} IN BOOLEAN MODE)
              OR s.title LIKE ${likePattern}
              OR s.synopsis LIKE ${likePattern}
            );
        `);
        totalStories = Number((countRows as any)[0]?.[0]?.count || stories.length);
      } catch (err) {
        this.logger.warn(`Full-text search query on stories failed: ${err}`);
      }
    }

    // 2. Search Creators (if type is 'all' or 'creators')
    if (type === 'all' || type === 'creators') {
      try {
        const creatorRows = await this.db.execute(sql`
          SELECT
            id,
            display_name,
            bio,
            tier,
            MATCH(display_name, bio) AGAINST(${booleanQuery} IN BOOLEAN MODE) AS score
          FROM creators
          WHERE status = 'ACTIVE'
            AND (
              MATCH(display_name, bio) AGAINST(${booleanQuery} IN BOOLEAN MODE)
              OR display_name LIKE ${likePattern}
            )
          ORDER BY score DESC
          LIMIT 10;
        `);

        const rawCreators = (creatorRows as any)[0] as any[];
        if (Array.isArray(rawCreators)) {
          creators = rawCreators.map((row) => ({
            id: binaryToUlid(row.id),
            displayName: row.display_name,
            bio: row.bio,
            tier: row.tier,
            score: Number(row.score || 0),
          }));
          totalCreators = creators.length;
        }
      } catch (err) {
        this.logger.warn(`Full-text search query on creators failed: ${err}`);
      }
    }

    // 3. Search Matching Genres (if type is 'all')
    if (type === 'all') {
      try {
        const genreRows = await this.db.execute(sql`
          SELECT id, name, slug, icon
          FROM genres
          WHERE name LIKE ${likePattern} OR slug LIKE ${likePattern}
          LIMIT 5;
        `);

        const rawGenres = (genreRows as any)[0] as any[];
        if (Array.isArray(rawGenres)) {
          matchedGenres = rawGenres.map((row) => ({
            id: binaryToUlid(row.id),
            name: row.name,
            slug: row.slug,
            icon: row.icon,
          }));
        }
      } catch (err) {
        this.logger.warn(`Search genres query failed: ${err}`);
      }
    }

    const result: SearchResultsDto = {
      stories,
      creators,
      genres: matchedGenres,
      totalStories,
      totalCreators,
    };

    // Save to 15-minute cache
    this.saveToCache(cacheKey, result);

    return result;
  }

  private async fetchGenresForStory(
    binaryStoryId: Buffer,
  ): Promise<Array<{ id: string; name: string; slug: string; icon?: string | null }>> {
    try {
      const rows = await this.db.execute(sql`
        SELECT g.id, g.name, g.slug, g.icon
        FROM story_genres sg
        INNER JOIN genres g ON sg.genre_id = g.id
        WHERE sg.story_id = ${binaryStoryId};
      `);

      const list = (rows as any)[0] as any[];
      if (!Array.isArray(list)) return [];

      return list.map((g) => ({
        id: binaryToUlid(g.id),
        name: g.name,
        slug: g.slug,
        icon: g.icon,
      }));
    } catch {
      return [];
    }
  }

  private formatBooleanQuery(query: string): string {
    const tokens = query
      .replace(/[+\-><()~*"]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 0);

    if (tokens.length === 0) return '*';
    return tokens.map((token) => `+${token}*`).join(' ');
  }

  private buildCacheKey(
    query: string,
    filters: SearchFilters,
    page: number,
    limit: number,
  ): string {
    const raw = `${query.toLowerCase()}:${filters.type || 'all'}:${filters.genre || ''}:${filters.language || ''}:${page}:${limit}`;
    const hash = crypto.createHash('md5').update(raw).digest('hex');
    return `search:query:${hash}`;
  }

  private getFromCache(key: string): SearchResultsDto | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private saveToCache(key: string, data: SearchResultsDto): void {
    // Prevent unbounded memory growth by limiting cache entries to 1000
    if (this.cache.size >= 1000) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }
}
