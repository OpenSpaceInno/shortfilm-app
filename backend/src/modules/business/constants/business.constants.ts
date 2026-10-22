/**
 * Business Intelligence & Executive Dashboard Constants
 * Adheres to SR-ARCH-19 and 21_BUSINESS_INTELLIGENCE.md
 */

export const DASHBOARD_CACHE_TTL_SECONDS = 300; // 5-minute cache TTL for read-heavy executive dashboards

export const DASHBOARD_CACHE_PREFIX = 'cache:dashboard';
export const CACHE_KEY_OVERVIEW = `${DASHBOARD_CACHE_PREFIX}:overview`;
export const CACHE_KEY_REVENUE = `${DASHBOARD_CACHE_PREFIX}:revenue`;
export const CACHE_KEY_AUDIENCE = `${DASHBOARD_CACHE_PREFIX}:audience`;
export const CACHE_KEY_COHORTS = `${DASHBOARD_CACHE_PREFIX}:cohorts`;
export const CACHE_KEY_SIGNALS = `${DASHBOARD_CACHE_PREFIX}:signals`;
export const CACHE_KEY_METRICS_PREFIX = `${DASHBOARD_CACHE_PREFIX}:metrics:`;

export const EXECUTIVE_METRICS = [
  'DAU',
  'MAU',
  'STICKINESS',
  'WATCH_HOURS',
  'COMPLETION_RATE',
  'CHOICE_RATE',
  'SHARE_RATE',
  'ACTIVE_SUBS',
  'MRR',
  'CHURN_RATE',
  'NET_SUBS',
] as const;

export const REVENUE_METRIC_CURRENCY = 'INR';
