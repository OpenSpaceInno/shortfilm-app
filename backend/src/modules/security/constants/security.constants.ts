/**
 * ShortReel Security Constants & Configurations
 * Defines multi-tier rate limiting, CORS allowances, CSP rules, and security audit checklists.
 */

export enum RateLimitTier {
  DEFAULT = 'default',
  AUTH = 'auth',
  AI = 'ai',
  ANALYTICS = 'analytics',
}

export interface RateLimitConfig {
  name: string;
  ttl: number; // in milliseconds
  limit: number;
}

export const RATE_LIMIT_TIERS: Record<RateLimitTier, RateLimitConfig> = {
  [RateLimitTier.DEFAULT]: {
    name: RateLimitTier.DEFAULT,
    ttl: 60 * 1000, // 1 minute
    limit: 300, // 300 requests/min
  },
  [RateLimitTier.AUTH]: {
    name: RateLimitTier.AUTH,
    ttl: 15 * 60 * 1000, // 15 minutes
    limit: 10, // 10 requests/15min per IP/user
  },
  [RateLimitTier.AI]: {
    name: RateLimitTier.AI,
    ttl: 60 * 1000, // 1 minute
    limit: 5, // 5 requests/min per user
  },
  [RateLimitTier.ANALYTICS]: {
    name: RateLimitTier.ANALYTICS,
    ttl: 60 * 1000, // 1 minute
    limit: 500, // 500 events/min per session
  },
};

export const SECURITY_EXPOSED_HEADERS = [
  'X-Correlation-Id',
  'X-Cache',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'Retry-After',
];

export const SECURITY_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Correlation-Id',
  'X-Requested-With',
  'Accept',
  'Origin',
  'cf-ray',
  'X-Request-Id',
];

export const SECURITY_ALLOWED_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
];

export const DEFAULT_CORS_ORIGINS = [
  'https://shortreel.io',
  'https://www.shortreel.io',
  'http://localhost:5173',
  'http://localhost:3000',
];

export const SECURITY_PROBE_PATHS = ['/health', '/metrics'];

export interface SecurityAuditItem {
  id: string;
  category: 'HEADERS' | 'CORS' | 'THROTTLING' | 'VALIDATION' | 'DATA_PROTECTION';
  title: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  remediation?: string;
}
