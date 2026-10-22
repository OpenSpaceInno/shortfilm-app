import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { DASHBOARD_CACHE_TTL_SECONDS, DASHBOARD_CACHE_PREFIX } from '../constants/business.constants';

interface MemoryCacheEntry {
  data: string;
  expiresAt: number;
}

@Injectable()
export class DashboardCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DashboardCacheService.name);
  private redisClient: Redis | null = null;
  private isConnected = false;
  private readonly memoryCache = new Map<string, MemoryCacheEntry>();

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
            return null; // Stop reconnecting after 3 tries in local/dev
          }
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`DashboardCache connected to Redis at ${host}:${port}`);
      });

      this.redisClient.on('ready', () => {
        this.isConnected = true;
      });

      this.redisClient.on('close', () => {
        this.isConnected = false;
      });

      this.redisClient.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis cache offline (${host}:${port}): ${err.message}. Using memory fallback.`);
      });

      this.redisClient.connect().catch((err) => {
        this.logger.warn(`Redis connection failed for dashboard cache (${host}:${port}): ${err.message}`);
      });
    } catch (err: any) {
      this.logger.warn(`Failed to initialize Redis client: ${err?.message || err}`);
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      try {
        if (typeof this.redisClient.quit === 'function') {
          await this.redisClient.quit();
        } else if (typeof this.redisClient.disconnect === 'function') {
          this.redisClient.disconnect();
        }
      } catch {
        // ignore
      }
      this.redisClient = null;
    }
    this.memoryCache.clear();
  }

  /**
   * Retrieves a cached value by key. Returns null if missing or expired.
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw) {
          return JSON.parse(raw) as T;
        }
        return null;
      } catch (err: any) {
        this.logger.warn(`Redis GET failed for key "${key}": ${err.message}. Checking memory cache.`);
      }
    }

    // In-memory fallback
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    try {
      return JSON.parse(entry.data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Stores a value in cache with a TTL (seconds).
   */
  async set<T>(key: string, value: T, ttlSeconds: number = DASHBOARD_CACHE_TTL_SECONDS): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isConnected && this.redisClient) {
      try {
        await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (err: any) {
        this.logger.warn(`Redis SET failed for key "${key}": ${err.message}. Writing to memory cache.`);
      }
    }

    // In-memory fallback
    this.memoryCache.set(key, {
      data: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Deletes a specific cache key.
   */
  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (this.isConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err: any) {
        this.logger.warn(`Redis DEL failed for key "${key}": ${err.message}`);
      }
    }
  }

  /**
   * Invalidates all keys matching a prefix namespace (default: cache:dashboard:*).
   */
  async invalidateNamespace(prefix: string = DASHBOARD_CACHE_PREFIX): Promise<number> {
    let clearedCount = 0;

    // Clear matching keys in memory
    for (const key of Array.from(this.memoryCache.keys())) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        clearedCount++;
      }
    }

    if (this.isConnected && this.redisClient) {
      try {
        const stream = this.redisClient.scanStream({
          match: `${prefix}*`,
          count: 100,
        });

        const keysToDelete: string[] = [];
        for await (const chunk of stream) {
          keysToDelete.push(...chunk);
        }

        if (keysToDelete.length > 0) {
          await this.redisClient.del(...keysToDelete);
          clearedCount = Math.max(clearedCount, keysToDelete.length);
        }
      } catch (err: any) {
        this.logger.warn(`Redis SCAN/DEL failed for prefix "${prefix}": ${err.message}`);
      }
    }

    this.logger.log(`Invalidated dashboard cache namespace "${prefix}*": ${clearedCount} keys purged`);
    return clearedCount;
  }

  /**
   * Atomic get-or-compute pattern for dashboard queries.
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlSeconds: number = DASHBOARD_CACHE_TTL_SECONDS,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await computeFn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}
