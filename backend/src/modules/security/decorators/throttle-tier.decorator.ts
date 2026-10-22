import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { RATE_LIMIT_TIERS, RateLimitTier } from '../constants/security.constants';

/**
 * Decorator to apply a predefined rate limit tier (AUTH, AI, ANALYTICS, DEFAULT)
 * to a controller or individual route handler.
 *
 * Example:
 *   @ThrottleTier(RateLimitTier.AUTH)
 *   @Post('login')
 *   login(...) { ... }
 */
export const ThrottleTier = (tier: RateLimitTier) => {
  const config = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS[RateLimitTier.DEFAULT];
  return Throttle({
    default: {
      limit: config.limit,
      ttl: config.ttl,
    },
    [config.name]: {
      limit: config.limit,
      ttl: config.ttl,
    },
  });
};

/**
 * Re-export SkipThrottle for explicit bypasses (e.g., internal health probes, webhooks).
 */
export { SkipThrottle };
