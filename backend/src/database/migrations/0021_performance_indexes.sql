-- Migration 0021: Performance and High-Read Query Composite Indexes
-- M31 — Performance & Caching
-- Indexes matching SLA targets and P2 performance optimization specifications

-- 1. Stories feed query optimization: WHERE status = 'PUBLISHED' ORDER BY published_at DESC
CREATE INDEX `idx_stories_status_published` ON `stories` (`status`, `published_at`);

-- 2. Episodes ordered query optimization: WHERE season_id = ? ORDER BY episode_number ASC
CREATE INDEX `idx_episodes_season_number` ON `episodes` (`season_id`, `episode_number`);

-- 3. XP ledger covering index for SUM aggregate queries: SELECT SUM(points) WHERE user_id = ? (P2-PERF-001)
CREATE INDEX `idx_xp_ledger_user_points` ON `xp_ledger` (`user_id`, `points`, `created_at`);

-- 4. Story versions published version lookup: WHERE story_id = ? AND status = 'PUBLISHED'
CREATE INDEX `idx_sv_story_status` ON `story_versions` (`story_id`, `status`);
