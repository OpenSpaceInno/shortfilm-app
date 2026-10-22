export const CACHE_PREFIXES = {
  FEED_TRENDING: 'cache:feed:trending',
  FEED_HOME: 'cache:feed:home',
  STORY_PUBLISHED: 'cache:story:published',
  STORY_DETAIL: 'cache:story:detail',
  SEARCH: 'cache:search',
  BUSINESS_METRICS: 'cache:business:metrics',
  USER_SESSION: 'cache:user:session',
  USER_XP: 'user:xp',
  LOCK: 'lock',
  RATE_LIMIT: 'ratelimit',
} as const;

export const CACHE_TTLS: Record<string, number> = {
  FEED_TRENDING_SECONDS: 600, // 10 minutes
  FEED_HOME_SECONDS: 300, // 5 minutes
  STORY_PUBLISHED_SECONDS: 21600, // 6 hours
  STORY_DETAIL_SECONDS: 60, // 1 minute
  SEARCH_SECONDS: 900, // 15 minutes
  BUSINESS_METRICS_SECONDS: 3600, // 1 hour
  USER_SESSION_SECONDS: 300, // 5 minutes
  USER_XP_SECONDS: 86400, // 24 hours
  RATE_LIMIT_SECONDS: 60, // 1 minute
  LOCK_DEFAULT_SECONDS: 30, // 30 seconds
  DEFAULT_RESPONSE_TTL_SECONDS: 300, // 5 minutes default
};

export const PERFORMANCE_SLAS = {
  FEED_P95_MS: 80,
  STREAM_P95_MS: 120,
  CHOICE_P95_MS: 60,
  PROGRESS_P95_MS: 40,
  METRICS_P95_MS: 200,
  INDEXED_LOOKUP_MS: 5,
} as const;

export const CRITICAL_INDEX_AUDIT_CATALOG = [
  {
    table: 'stories',
    indexName: 'idx_stories_status_published',
    columns: ['status', 'published_at'],
    purpose: 'Home/Trending feed query: WHERE status = "PUBLISHED" ORDER BY published_at DESC',
    targetSlaMs: 80,
  },
  {
    table: 'episodes',
    indexName: 'idx_episodes_season_number',
    columns: ['season_id', 'episode_number'],
    purpose: 'Ordered episode catalog: WHERE season_id = ? ORDER BY episode_number ASC',
    targetSlaMs: 5,
  },
  {
    table: 'watch_progress',
    indexName: 'uq_wp_user_episode',
    columns: ['user_id', 'episode_id'],
    purpose: 'Unique progress upsert: WHERE user_id = ? AND episode_id = ?',
    targetSlaMs: 40,
  },
  {
    table: 'user_choices',
    indexName: 'uq_user_choices_user_choice',
    columns: ['user_id', 'choice_id'],
    purpose: 'Interactive choice deduplication: WHERE user_id = ? AND choice_id = ?',
    targetSlaMs: 60,
  },
  {
    table: 'xp_ledger',
    indexName: 'idx_xp_user_points',
    columns: ['user_id', 'points', 'created_at'],
    purpose: 'Covering index for total XP aggregation: SELECT SUM(points) WHERE user_id = ?',
    targetSlaMs: 5,
  },
  {
    table: 'story_versions',
    indexName: 'idx_sv_story_status',
    columns: ['story_id', 'status'],
    purpose: 'Published story version graph lookup: WHERE story_id = ? AND status = "PUBLISHED"',
    targetSlaMs: 5,
  },
  {
    table: 'subscriptions',
    indexName: 'idx_sub_user_status',
    columns: ['user_id', 'status'],
    purpose: 'Entitlement & active subscription check: WHERE user_id = ? AND status = "ACTIVE"',
    targetSlaMs: 5,
  },
] as const;
