import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CacheService } from '../services/cache.service';
import {
  CACHE_RESPONSE_METADATA_KEY,
  CacheResponseOptions,
} from '../decorators/cache-response.decorator';

@Injectable()
export class ResponseCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next.handle();
    }

    const options = this.reflector.get<CacheResponseOptions | undefined>(
      CACHE_RESPONSE_METADATA_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const cacheKey = this.buildCacheKey(req, options);

    // 1. Check cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached !== null) {
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', String(options.ttlSeconds));
      }
      return of(cached);
    }

    // 2. Cache miss: pass to handler and cache output
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('X-Cache', 'MISS');
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Avoid caching null or error responses
          if (data !== undefined && data !== null) {
            this.cacheService
              .set(cacheKey, data, options.ttlSeconds)
              .catch(() => {});
          }
        },
      }),
    );
  }

  /**
   * Builds a deterministic cache key based on route path, query params, and optional user scope.
   */
  public buildCacheKey(req: Request, options: CacheResponseOptions): string {
    const prefix = options.keyPrefix || 'cache:route';
    const path = req.path || req.url?.split('?')[0] || '/';

    // Sort query keys deterministically to avoid duplicate keys for differently ordered query strings
    const queryEntries = Object.entries(req.query || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${String(v)}`)
      .join('&');

    const queryString = queryEntries.length > 0 ? `?${queryEntries}` : '';

    let userPart = '';
    if (options.userScope) {
      const userId = (req as any).user?.id || (req as any).user?.sub || 'anon';
      userPart = `:user:${userId}`;
    }

    return `${prefix}${userPart}:${path}${queryString}`;
  }
}
