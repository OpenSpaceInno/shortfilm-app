-- ShortReel Interactive Schema Migration
-- Database: MySQL 8.x (InnoDB)
-- Collation: utf8mb4_0900_ai_ci

CREATE TABLE IF NOT EXISTS story_versions (
  id              BINARY(16)   NOT NULL,
  story_id        BINARY(16)   NOT NULL,
  version_number  INT          NOT NULL,
  status          ENUM('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  graph_snapshot  JSON         NULL,
  root_node_id    BINARY(16)   NULL,
  published_at    DATETIME(3)  NULL,
  archived_at     DATETIME(3)  NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_sv_version (story_id, version_number),
  KEY idx_sv_status (status),
  CONSTRAINT fk_sv_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS story_nodes (
  id                 BINARY(16)  NOT NULL,
  story_version_id   BINARY(16)  NOT NULL,
  episode_id         BINARY(16)  NOT NULL,
  node_type          ENUM('OPENING','STANDARD','CHOICE_POINT','ENDING') NOT NULL DEFAULT 'STANDARD',
  is_root            BOOLEAN     NOT NULL DEFAULT FALSE,
  sequence_order     INT         NOT NULL DEFAULT 0,
  voting_ends_at     DATETIME(3) NULL,
  fallback_option_id BINARY(16)  NULL,
  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_sn_version (story_version_id),
  CONSTRAINT fk_sn_version FOREIGN KEY (story_version_id) REFERENCES story_versions(id) ON DELETE CASCADE,
  CONSTRAINT fk_sn_episode FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS choices (
  id              BINARY(16)   NOT NULL,
  story_node_id   BINARY(16)   NOT NULL,
  prompt          TEXT         NOT NULL,
  voting_opens_at DATETIME(3)  NULL,
  voting_ends_at  DATETIME(3)  NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_choice_node (story_node_id),
  CONSTRAINT fk_choice_node FOREIGN KEY (story_node_id) REFERENCES story_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS choice_options (
  id                  BINARY(16)   NOT NULL,
  choice_id           BINARY(16)   NOT NULL,
  label               VARCHAR(255) NOT NULL,
  destination_node_id BINARY(16)   NOT NULL,
  vote_count          INT          NOT NULL DEFAULT 0,
  display_order       TINYINT      NOT NULL DEFAULT 1,
  created_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_co_choice (choice_id),
  CONSTRAINT fk_co_choice FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE CASCADE,
  CONSTRAINT fk_co_dest FOREIGN KEY (destination_node_id) REFERENCES story_nodes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
