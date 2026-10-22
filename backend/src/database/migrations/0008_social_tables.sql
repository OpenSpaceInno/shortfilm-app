-- Migration 0008: Social Features (Community Votes, Narrative Predictions, Follows)
-- Creates votes, predictions, prediction_options, user_predictions, and follows tables

CREATE TABLE IF NOT EXISTS votes (
  id               BINARY(16)  NOT NULL,
  user_id          BINARY(16)  NOT NULL,
  choice_id        BINARY(16)  NOT NULL,
  choice_option_id BINARY(16)  NOT NULL,
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_vote_user_choice (user_id, choice_id),
  KEY idx_vote_option (choice_option_id),
  CONSTRAINT fk_vote_user   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_vote_choice FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE CASCADE,
  CONSTRAINT fk_vote_option FOREIGN KEY (choice_option_id) REFERENCES choice_options(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS predictions (
  id                 BINARY(16)   NOT NULL,
  story_id           BINARY(16)   NOT NULL,
  question           VARCHAR(500) NOT NULL,
  reveal_episode_id  BINARY(16)   NULL,
  status             ENUM('OPEN','RESOLVED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  winning_option_id  BINARY(16)   NULL,
  closes_at          DATETIME(3)  NOT NULL,
  created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_prediction_story (story_id),
  KEY idx_prediction_status (status),
  CONSTRAINT fk_pred_story   FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_pred_episode FOREIGN KEY (reveal_episode_id) REFERENCES episodes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS prediction_options (
  id            BINARY(16)   NOT NULL,
  prediction_id BINARY(16)   NOT NULL,
  option_text   VARCHAR(255) NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_pred_opt_pred (prediction_id),
  CONSTRAINT fk_pred_opt_pred FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_predictions (
  id                   BINARY(16)  NOT NULL,
  user_id              BINARY(16)  NOT NULL,
  prediction_id        BINARY(16)  NOT NULL,
  prediction_option_id BINARY(16)  NOT NULL,
  is_correct           BOOLEAN     NULL,
  xp_awarded           INT         NOT NULL DEFAULT 0,
  created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_up_user_pred (user_id, prediction_id),
  KEY idx_up_pred (prediction_id),
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_up_pred FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE,
  CONSTRAINT fk_up_opt  FOREIGN KEY (prediction_option_id) REFERENCES prediction_options(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS follows (
  id          BINARY(16) NOT NULL,
  user_id     BINARY(16) NOT NULL,
  target_type ENUM('CREATOR','CHARACTER','STORY') NOT NULL,
  target_id   BINARY(16) NOT NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_follow_user_target (user_id, target_type, target_id),
  KEY idx_follow_target (target_type, target_id),
  KEY idx_follow_user (user_id),
  CONSTRAINT fk_follow_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
