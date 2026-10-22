-- Migration 0012: AI Studio Module (ai_usage_logs and ai_jobs)
-- Provides token usage logging, latency/cost attribution, and asynchronous multi-part story generation jobs

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id                 BINARY(16)    NOT NULL,
  user_id            BINARY(16)    NOT NULL,
  creator_id         BINARY(16)    NULL,
  feature            ENUM('CONCEPT_EXPAND','CHARACTER_FORGE','BRANCH_DILEMMA','CLIFFHANGER','PRODUCTION_PACK','STORY_INSIGHT') NOT NULL,
  provider           VARCHAR(50)   NOT NULL,
  model              VARCHAR(100)  NOT NULL,
  prompt_tokens      INT           NOT NULL DEFAULT 0,
  completion_tokens  INT           NOT NULL DEFAULT 0,
  total_tokens       INT           NOT NULL DEFAULT 0,
  estimated_cost_usd VARCHAR(20)   NOT NULL DEFAULT '0.000000',
  status             ENUM('SUCCESS','FAILED','RATE_LIMITED','FALLBACK') NOT NULL DEFAULT 'SUCCESS',
  latency_ms         INT           NOT NULL DEFAULT 0,
  metadata           JSON          NULL,
  created_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_ai_user (user_id),
  KEY idx_ai_creator (creator_id),
  KEY idx_ai_feature (feature),
  KEY idx_ai_created (created_at),
  CONSTRAINT fk_ai_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_ai_creator FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ai_jobs (
  id               BINARY(16)   NOT NULL,
  user_id          BINARY(16)   NOT NULL,
  job_type         VARCHAR(50)  NOT NULL DEFAULT 'PRODUCTION_PACK',
  status           ENUM('QUEUED','PROCESSING','COMPLETE','FAILED') NOT NULL DEFAULT 'QUEUED',
  input_payload    JSON         NOT NULL,
  result_data      JSON         NULL,
  error_message    TEXT         NULL,
  progress_percent INT          NOT NULL DEFAULT 0,
  started_at       DATETIME(3)  NULL,
  completed_at     DATETIME(3)  NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_ai_job_user (user_id),
  KEY idx_ai_job_status (status),
  CONSTRAINT fk_ai_job_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
