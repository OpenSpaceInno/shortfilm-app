-- Migration 0006: Engagement Tables (Watch Progress and Watch History)
-- Creates watch_progress and watch_history tables for viewing tracking and completion ledger

CREATE TABLE IF NOT EXISTS watch_progress (
  id               BINARY(16)   NOT NULL,
  user_id          BINARY(16)   NOT NULL,
  episode_id       BINARY(16)   NOT NULL,
  progress_seconds INT          NOT NULL DEFAULT 0,
  completed        BOOLEAN      NOT NULL DEFAULT FALSE,
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_wp_user_episode (user_id, episode_id),
  KEY idx_wp_continue (user_id, updated_at DESC),
  CONSTRAINT fk_wp_user    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wp_episode FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS watch_history (
  id                BINARY(16)  NOT NULL,
  user_id           BINARY(16)  NOT NULL,
  episode_id        BINARY(16)  NOT NULL,
  story_version_id  BINARY(16)  NULL,
  watched_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_wh_user (user_id, watched_at DESC),
  CONSTRAINT fk_wh_user    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wh_episode FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_wh_version FOREIGN KEY (story_version_id) REFERENCES story_versions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
