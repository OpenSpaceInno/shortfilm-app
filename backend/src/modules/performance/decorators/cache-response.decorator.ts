import { SetMetadata } from '@nestjs/common';
import { CACHE_TTLS } from '../constants/performance.constants';

export const CACHE_RESPONSE_METADATA_KEY = 'performance:cache_response';

export interface CacheResponseOptions {
  ttlSeconds?: number;
  keyPrefix?: string;
  userScope?: boolean;
  tags?: string[];
}

/**
 * Decorates a controller GET endpoint to be cached via the Redis Response Caching layer.
 */
export function CacheResponse(options?: CacheResponseOptions): MethodDecorator {
  const finalOptions: CacheResponseOptions = {
    ttlSeconds: options?.ttlSeconds ?? CACHE_TTLS.DEFAULT_RESPONSE_TTL_SECONDS,
    keyPrefix: options?.keyPrefix,
    userScope: options?.userScope ?? false,
    tags: options?.tags ?? [],
  };

  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(CACHE_RESPONSE_METADATA_KEY, finalOptions)(
      target,
      propertyKey,
      descriptor,
    );
    return descriptor;
  };
}
