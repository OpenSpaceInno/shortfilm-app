import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CACHE_TTLS, CACHE_PREFIXES } from '../constants/performance.constants';

interface MemoryCacheEntry {
  data: string;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRatio: number;
  sets: number;
  dels: number;
  backend: 'REDIS' | 'MEMORY';
  inMemoryKeyCount: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis | null = null;
  private isConnected = false;
  private readonly memoryCache = new Map<string, MemoryCacheEntry>();

  // Single-flight in-flight execution map to prevent cache stampedes (dogpile effect)
  private readonly inFlightRequests = new Map<string, Promise<unknown>>();

  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    dels: 0,
  };

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    try {
      this.redisClient = new Redis({
        host,
        port,
        password: password || undefined,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Gracefully fallback to in-memory cache in test/offline dev
          }
          return Math.min(times * 150, 1500);
        },
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`CacheService connected to Redis at ${host}:${port}`);
      });

      this.redisClient.on('ready', () => {
        this.isConnected = true;
      });

      this.redisClient.on('close', () => {
        this.isConnected = false;
      });

      this.redisClient.on('error', (err) => {
        this.isConnected = false;
        this.logger.debug?.(`Redis cache offline, operating in in-memory mode: ${err.message}`);
      });

      this.redisClient.connect().catch((err) => {
        this.isConnected = false;
        this.logger.debug?.(`Initial Redis connection skipped, using memory cache fallback: ${err.message}`);
      });
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(`Failed to initialize Redis client: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch {
        this.redisClient.disconnect();
      }
    }
    this.memoryCache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Retrieves a deserialized cached object by key.
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw) {
          this.stats.hits++;
          return JSON.parse(raw) as T;
        }
      } catch (err: any) {
        this.logger.debug?.(`Redis GET failed for ${key}: ${err.message}`);
      }
    }

    // In-memory fallback
    const entry = this.memoryCache.get(key);
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        this.stats.hits++;
        return JSON.parse(entry.data) as T;
      }
      this.memoryCache.delete(key);
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Sets a value in the cache with the given TTL in seconds.
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = CACHE_TTLS.DEFAULT_RESPONSE_TTL_SECONDS,
  ): Promise<void> {
    const serialized = JSON.stringify(value);
    this.stats.sets++;

    if (this.isConnected && this.redisClient) {
      try {
        await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (err: any) {
        this.logger.debug?.(`Redis SET failed for ${key}: ${err.message}`);
      }
    }

    // In-memory fallback
    this.memoryCache.set(key, {
      data: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Deletes a specific key from the cache.
   */
  async del(key: string): Promise<void> {
    this.stats.dels++;
    if (this.isConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err: any) {
        this.logger.debug?.(`Redis DEL failed for ${key}: ${err.message}`);
      }
    }
    this.memoryCache.delete(key);
  }

  /**
   * Deletes all keys matching a specific pattern (e.g. 'cache:feed:*').
   */
  async delPattern(pattern: string): Promise<number> {
    let deletedCount = 0;

    // In-memory pattern delete
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryCache.keys()) {
      if (regexPattern.test(key)) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }

    if (this.isConnected && this.redisClient) {
      try {
        let cursor = '0';
        do {
          const [nextCursor, keys] = await this.redisClient.scan(
            cursor,
            'MATCH',
            pattern,
            'COUNT',
            100,
          );
          cursor = nextCursor;
          if (keys.length > 0) {
            await this.redisClient.del(...keys);
            deletedCount += keys.length;
          }
        } while (cursor !== '0');
      } catch (err: any) {
        this.logger.debug?.(`Redis DEL pattern failed for ${pattern}: ${err.message}`);
      }
    }

    this.stats.dels += deletedCount;
    return deletedCount;
  }

  /**
   * Cache-aside pattern with Single-Flight dogpile stampede protection.
   * If the key is cold, concurrent callers share the same factory execution.
   */
  async remember<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    // 1. Check existing cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 2. Check if there is already an in-flight computation for this key
    const inFlight = this.inFlightRequests.get(key);
    if (inFlight) {
      return inFlight as Promise<T>;
    }

    // 3. Initiate single-flight computation
    const computation = (async () => {
      try {
        const fresh = await factory();
        await this.set(key, fresh, ttlSeconds);
        return fresh;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, computation);
    return computation;
  }

  /**
   * Atomically increments an integer key in cache.
   */
  async incr(key: string, delta = 1): Promise<number> {
    if (this.isConnected && this.redisClient) {
      try {
        return delta === 1
          ? await this.redisClient.incr(key)
          : await this.redisClient.incrby(key, delta);
      } catch (err: any) {
        this.logger.debug?.(`Redis INCR failed for ${key}: ${err.message}`);
      }
    }

    // In-memory fallback
    const entry = this.memoryCache.get(key);
    let current = 0;
    if (entry && Date.now() < entry.expiresAt) {
      current = parseInt(entry.data, 10) || 0;
    }

    const nextVal = current + delta;
    this.memoryCache.set(key, {
      data: String(nextVal),
      expiresAt: Date.now() + CACHE_TTLS.USER_XP_SECONDS * 1000,
    });
    return nextVal;
  }

  /**
   * P2-PERF-001 optimization: Fast Redis counter for total XP to avoid table scans on xp_ledger.
   */
  async getUserXp(
    userId: string,
    computeFallback: () => Promise<number>,
  ): Promise<number> {
    const key = `${CACHE_PREFIXES.USER_XP}:${userId}`;
    const cached = await this.get<number>(key);
    if (cached !== null) {
      return cached;
    }

    const totalXp = await computeFallback();
    await this.set(key, totalXp, CACHE_TTLS.USER_XP_SECONDS);
    return totalXp;
  }

  /**
   * Increments the user XP counter in cache on each XP gain.
   */
  async incrementUserXp(userId: string, points: number): Promise<number> {
    const key = `${CACHE_PREFIXES.USER_XP}:${userId}`;
    return this.incr(key, points);
  }

  /**
   * Returns live operational statistics of the cache layer.
   */
  getStats(): CacheStats {
    const totalOps = this.stats.hits + this.stats.misses;
    const hitRatio = totalOps > 0 ? Number((this.stats.hits / totalOps).toFixed(4)) : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRatio,
      sets: this.stats.sets,
      dels: this.stats.dels,
      backend: this.isConnected ? 'REDIS' : 'MEMORY',
      inMemoryKeyCount: this.memoryCache.size,
    };
  }

  /**
   * Clears all cache entries (primarily for test suite isolation).
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.inFlightRequests.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, dels: 0 };
    if (this.isConnected && this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch {}
    }
  }
}
