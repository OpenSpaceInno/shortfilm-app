import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CACHE_PREFIXES } from '../constants/performance.constants';

@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Invalidates published story graph and feeds when story is updated or published.
   */
  async invalidateStory(storyId: string): Promise<void> {
    this.logger.log(`Invalidating cache for story ${storyId}`);
    await Promise.all([
      this.cacheService.del(`${CACHE_PREFIXES.STORY_PUBLISHED}:${storyId}`),
      this.cacheService.del(`${CACHE_PREFIXES.STORY_DETAIL}:${storyId}`),
      this.cacheService.delPattern('cache:feed:*'),
      this.cacheService.delPattern(`*story*${storyId}*`),
    ]);
  }

  /**
   * Invalidates home and trending feed caches.
   */
  async invalidateFeed(): Promise<number> {
    this.logger.log('Invalidating feed caches');
    return this.cacheService.delPattern('cache:feed:*');
  }

  /**
   * Invalidates search result caches.
   */
  async invalidateSearch(): Promise<number> {
    this.logger.log('Invalidating search caches');
    return this.cacheService.delPattern('cache:search:*');
  }

  /**
   * Invalidates user session and XP cache.
   */
  async invalidateUser(userId: string): Promise<void> {
    this.logger.log(`Invalidating cache for user ${userId}`);
    await Promise.all([
      this.cacheService.del(`${CACHE_PREFIXES.USER_SESSION}:${userId}`),
      this.cacheService.del(`${CACHE_PREFIXES.USER_XP}:${userId}`),
      this.cacheService.delPattern(`*:user:${userId}*`),
    ]);
  }

  /**
   * Purges all application cache namespaces.
   */
  async purgeAll(): Promise<number> {
    this.logger.warn('Purging all application caches');
    return this.cacheService.delPattern('cache:*');
  }
}
