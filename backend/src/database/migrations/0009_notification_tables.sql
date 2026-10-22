-- Migration 0009: Notification Engine (In-App Ledger, Device Tokens, User Settings)
-- Creates notifications, device_tokens, and user_notification_settings tables

CREATE TABLE IF NOT EXISTS notifications (
  id             BINARY(16)   NOT NULL,
  user_id        BINARY(16)   NOT NULL,
  type           VARCHAR(100) NOT NULL,
  title          VARCHAR(255) NOT NULL,
  body           TEXT         NOT NULL,
  reference_type VARCHAR(50)  NULL,
  reference_id   BINARY(16)   NULL,
  data           JSON         NULL,
  is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
  read_at        DATETIME(3)  NULL,
  sent_push      BOOLEAN      NOT NULL DEFAULT FALSE,
  sent_email     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_notif_unread (user_id, is_read, created_at DESC),
  KEY idx_notif_user (user_id, created_at DESC),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS device_tokens (
  id           BINARY(16)   NOT NULL,
  user_id      BINARY(16)   NOT NULL,
  token        VARCHAR(512) NOT NULL,
  platform     ENUM('WEB','ANDROID','IOS') NOT NULL DEFAULT 'WEB',
  last_used_at DATETIME(3)  NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_device_token (user_id, token),
  KEY idx_device_token_user (user_id),
  CONSTRAINT fk_device_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_notification_settings (
  id                 BINARY(16)  NOT NULL,
  user_id            BINARY(16)  NOT NULL,
  in_app_enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  push_enabled       BOOLEAN     NOT NULL DEFAULT TRUE,
  email_enabled      BOOLEAN     NOT NULL DEFAULT TRUE,
  episodes_enabled   BOOLEAN     NOT NULL DEFAULT TRUE,
  voting_enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  streaks_enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
  rewards_enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
  marketing_enabled  BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_notification_settings (user_id),
  CONSTRAINT fk_user_notif_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
