-- ShortReel Content & Creator Schema Migration
-- Database: MySQL 8.x (InnoDB)
-- Collation: utf8mb4_0900_ai_ci

CREATE TABLE IF NOT EXISTS creators (
  id           BINARY(16)   NOT NULL,
  user_id      BINARY(16)   NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio          TEXT         NULL,
  tier         ENUM('EMERGING','VERIFIED','EXCLUSIVE','PARTNER') NOT NULL DEFAULT 'EMERGING',
  status       ENUM('APPLIED','UNDER_REVIEW','APPROVED','VERIFIED','ACTIVE','SUSPENDED','REJECTED','DEACTIVATED') NOT NULL DEFAULT 'APPLIED',
  verified_at  DATETIME(3)  NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_creator_user (user_id),
  KEY idx_creator_status (status),
  KEY idx_creator_tier (tier),
  CONSTRAINT fk_creator_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS genres (
  id         BINARY(16)   NOT NULL,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) NOT NULL,
  icon       VARCHAR(100) NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_genre_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tags (
  id         BINARY(16)   NOT NULL,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) NOT NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_tag_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS stories (
  id               BINARY(16)   NOT NULL,
  creator_id       BINARY(16)   NOT NULL,
  title            VARCHAR(255) NOT NULL,
  synopsis         TEXT         NOT NULL,
  premise          TEXT         NULL,
  status           ENUM('DRAFT','SUBMITTED','APPROVED','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  language         VARCHAR(10)  NOT NULL DEFAULT 'en',
  thumbnail_url    VARCHAR(500) NULL,
  poster_url       VARCHAR(500) NULL,
  content_rating   VARCHAR(20)  NULL,
  target_audience  VARCHAR(50)  NULL,
  view_count       BIGINT       NOT NULL DEFAULT 0,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  published_at     DATETIME(3)  NULL,
  deleted_at       DATETIME(3)  NULL,
  PRIMARY KEY (id),
  KEY idx_stories_creator (creator_id),
  KEY idx_stories_status (status),
  KEY idx_stories_published (published_at),
  CONSTRAINT fk_story_creator FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS story_genres (
  story_id BINARY(16) NOT NULL,
  genre_id BINARY(16) NOT NULL,
  PRIMARY KEY (story_id, genre_id),
  CONSTRAINT fk_sg_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_sg_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS story_tags (
  story_id BINARY(16) NOT NULL,
  tag_id   BINARY(16) NOT NULL,
  PRIMARY KEY (story_id, tag_id),
  CONSTRAINT fk_st_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_st_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS seasons (
  id             BINARY(16)   NOT NULL,
  story_id       BINARY(16)   NOT NULL,
  title          VARCHAR(255) NOT NULL,
  season_number  INT          NOT NULL,
  synopsis       TEXT         NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_season_number (story_id, season_number),
  KEY idx_season_story (story_id),
  CONSTRAINT fk_season_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS episodes (
  id              BINARY(16)   NOT NULL,
  season_id       BINARY(16)   NOT NULL,
  title           VARCHAR(255) NOT NULL,
  episode_number  INT          NOT NULL,
  synopsis        TEXT         NULL,
  thumbnail_url   VARCHAR(500) NULL,
  is_free         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  published_at    DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_episode_number (season_id, episode_number),
  KEY idx_episode_season (season_id),
  CONSTRAINT fk_episode_season FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS videos (
  id              BINARY(16)   NOT NULL,
  episode_id      BINARY(16)   NOT NULL,
  provider        VARCHAR(50)  NOT NULL DEFAULT 'CLOUDFLARE_STREAM',
  provider_uid    VARCHAR(255) NULL,
  status          ENUM('UPLOADING','PROCESSING','READY','FAILED') NOT NULL DEFAULT 'UPLOADING',
  duration_seconds INT         NULL,
  width           INT          NULL,
  height          INT          NULL,
  playback_url    VARCHAR(500) NULL,
  thumbnail_url   VARCHAR(500) NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_video_episode (episode_id),
  KEY idx_video_provider_uid (provider_uid),
  CONSTRAINT fk_video_episode FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS characters (
  id          BINARY(16)   NOT NULL,
  story_id    BINARY(16)   NOT NULL,
  name        VARCHAR(100) NOT NULL,
  bio         TEXT         NULL,
  role_desc   VARCHAR(255) NULL,
  avatar_url  VARCHAR(500) NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_char_story (story_id),
  CONSTRAINT fk_char_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
