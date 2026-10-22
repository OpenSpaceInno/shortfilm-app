-- Migration 0005: Choice Engine & Gamification Ledger
-- Creates user_choices and xp_ledger tables with strict ACID constraints and indices

CREATE TABLE IF NOT EXISTS user_choices (
  id               BINARY(16)  NOT NULL,
  user_id          BINARY(16)  NOT NULL,
  choice_id        BINARY(16)  NOT NULL,
  choice_option_id BINARY(16)  NOT NULL,
  story_version_id BINARY(16)  NOT NULL,
  is_fallback      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_uc_user_choice (user_id, choice_id),
  KEY idx_uc_user (user_id),
  KEY idx_uc_version (story_version_id),
  CONSTRAINT fk_uc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uc_choice FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE RESTRICT,
  CONSTRAINT fk_uc_option FOREIGN KEY (choice_option_id) REFERENCES choice_options(id) ON DELETE RESTRICT,
  CONSTRAINT fk_uc_version FOREIGN KEY (story_version_id) REFERENCES story_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS xp_ledger (
  id           BINARY(16)   NOT NULL,
  user_id      BINARY(16)   NOT NULL,
  action       VARCHAR(100) NOT NULL,
  points       INT          NOT NULL,
  reference_id BINARY(16)   NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_xp_user (user_id),
  CONSTRAINT fk_xp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
