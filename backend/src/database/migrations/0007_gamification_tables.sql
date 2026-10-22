-- Migration 0007: Gamification Tables (Badges, User Badges, User Streaks)
-- Creates badges, user_badges, and user_streaks tables with relational integrity constraints

CREATE TABLE IF NOT EXISTS badges (
  id             BINARY(16)   NOT NULL,
  slug           VARCHAR(50)  NOT NULL,
  name           VARCHAR(100) NOT NULL,
  description    TEXT         NOT NULL,
  icon_url       VARCHAR(500) NULL,
  category       VARCHAR(50)  NOT NULL,
  criteria_type  VARCHAR(50)  NOT NULL,
  criteria_value INT          NOT NULL,
  xp_reward      INT          NOT NULL DEFAULT 0,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_badge_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_badges (
  id          BINARY(16)  NOT NULL,
  user_id     BINARY(16)  NOT NULL,
  badge_id    BINARY(16)  NOT NULL,
  unlocked_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_badge (user_id, badge_id),
  KEY idx_user_badges_user (user_id),
  CONSTRAINT fk_ub_user  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ub_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_streaks (
  id                 BINARY(16)  NOT NULL,
  user_id            BINARY(16)  NOT NULL,
  current_streak     INT         NOT NULL DEFAULT 0,
  longest_streak     INT         NOT NULL DEFAULT 0,
  last_activity_date DATE        NULL,
  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_us_user (user_id),
  KEY idx_streak_user (user_id),
  CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
