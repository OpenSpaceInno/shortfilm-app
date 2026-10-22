import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { SECURITY_PROBE_PATHS } from '../constants/security.constants';

/**
 * Custom Throttler Guard for ShortReel.
 *
 * Capabilities:
 * 1. Bypasses rate limiting for observability probes (/health, /metrics) to prevent orchestrator flapping.
 * 2. Identity-aware tracking: Uses authenticated user ID/sub when present, falling back to trusted IP (Cloudflare, X-Forwarded-For).
 * 3. Enforces RFC 6585 compliant 429 Too Many Requests response with Retry-After header.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const { req } = this.getRequestResponse(context);
    const url = req.originalUrl || req.url || '';

    // Bypass probe endpoints
    for (const probePath of SECURITY_PROBE_PATHS) {
      if (url.includes(probePath)) {
        return true;
      }
    }

    return super.shouldSkip(context);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Authenticated user tracking
    const userId = req.user?.id || req.user?.sub;
    if (userId) {
      return `user:${userId}`;
    }

    // IP resolution prioritizing Cloudflare and reverse proxy headers
    const cfIp = req.headers?.['cf-connecting-ip'];
    if (cfIp && typeof cfIp === 'string') {
      return `ip:${cfIp.trim()}`;
    }

    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (forwardedFor) {
      const rawIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : forwardedFor[0];
      if (rawIp) {
        return `ip:${rawIp.trim()}`;
      }
    }

    const realIp = req.headers?.['x-real-ip'];
    if (realIp && typeof realIp === 'string') {
      return `ip:${realIp.trim()}`;
    }

    const socketIp = req.ip || req.socket?.remoteAddress;
    if (socketIp) {
      return `ip:${socketIp.trim()}`;
    }

    return 'ip:127.0.0.1';
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { res } = this.getRequestResponse(context);
    const timeToBlockExpireSec = Math.max(1, Math.ceil(throttlerLimitDetail.timeToBlockExpire / 1000));

    if (res && typeof res.header === 'function') {
      res.header('Retry-After', timeToBlockExpireSec.toString());
      res.header('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + timeToBlockExpireSec).toString());
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please retry after ' + timeToBlockExpireSec + ' seconds.',
        retryAfter: timeToBlockExpireSec,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
