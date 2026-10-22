-- ShortReel Webhook Events Schema Migration
-- Database: MySQL 8.x (InnoDB)
-- Collation: utf8mb4_0900_ai_ci

CREATE TABLE IF NOT EXISTS webhook_events (
  id           BINARY(16)   NOT NULL,
  provider     VARCHAR(50)  NOT NULL,
  event_id     VARCHAR(255) NOT NULL,
  event_type   VARCHAR(100) NOT NULL,
  payload      JSON         NOT NULL,
  status       ENUM('RECEIVED','PROCESSED','FAILED') NOT NULL DEFAULT 'RECEIVED',
  processed_at DATETIME(3)  NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_webhook_event (provider, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
