-- Migration: 0018_story_lab_schema.sql
-- Description: Creates Story Lab schema: story_signals, story_insights, content_opportunities, story_experiments, experiment_variants (SR-ARCH-18 & M27)

CREATE TABLE IF NOT EXISTS `story_signals` (
  `id` BINARY(16) NOT NULL,
  `story_id` BINARY(16) NOT NULL,
  `signal_type` ENUM('CHOICE_FRICTION_ANOMALY', 'BRANCH_MONOPOLY_BIAS', 'CHARACTER_BREAKOUT_SCORE', 'REWATCH_LOOP_INTENSITY', 'EPISODE_BRIDGE_DROPOFF', 'DROP_OFF', 'CHOICE_DOMINANCE', 'VIRAL_SHARE', 'MOMENTUM_SURGE', 'RETENTION_CHURN') NOT NULL,
  `strength` ENUM('EMERGING', 'MODERATE', 'STRONG') NOT NULL DEFAULT 'MODERATE',
  `strength_score` DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `confidence_score` DECIMAL(4,3) NOT NULL DEFAULT '0.000',
  `title` VARCHAR(255) NOT NULL,
  `observation` TEXT NOT NULL,
  `possible_interpretation` TEXT NULL,
  `suggested_investigation` TEXT NULL,
  `metrics_json` JSON NULL,
  `window_start` DATETIME(3) NULL,
  `window_end` DATETIME(3) NULL,
  `detected_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_sig_story_id` (`story_id`),
  KEY `idx_sig_type` (`signal_type`),
  KEY `idx_sig_detected_at` (`detected_at`),
  CONSTRAINT `fk_sig_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `story_insights` (
  `id` BINARY(16) NOT NULL,
  `story_id` BINARY(16) NOT NULL,
  `signal_id` BINARY(16) NULL,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT NOT NULL,
  `narrative_commentary` TEXT NULL,
  `confidence_score` DECIMAL(4,3) NOT NULL DEFAULT '0.800',
  `status` ENUM('UNRESOLVED', 'REVIEWED', 'APPLIED', 'DISMISSED') NOT NULL DEFAULT 'UNRESOLVED',
  `action_plan` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_ins_story_id` (`story_id`),
  KEY `idx_ins_status` (`status`),
  CONSTRAINT `fk_ins_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ins_signal` FOREIGN KEY (`signal_id`) REFERENCES `story_signals` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `content_opportunities` (
  `id` BINARY(16) NOT NULL,
  `story_id` BINARY(16) NULL,
  `insight_id` BINARY(16) NULL,
  `title` VARCHAR(255) NOT NULL,
  `opportunity_type` ENUM('BRANCH_REBALANCING', 'SPINOFF_CANDIDATE', 'PACING_RE_EDIT', 'ENDING_EXPANSION', 'STORY_EXPANSION', 'CHARACTER_OPPORTUNITY', 'INTERACTIVE_OPPORTUNITY', 'GENRE_OPPORTUNITY', 'DISCOVERY_OPPORTUNITY', 'RETENTION_OPPORTUNITY') NOT NULL,
  `status` ENUM('PROPOSED', 'IN_REVIEW', 'ACCEPTED', 'DISMISSED') NOT NULL DEFAULT 'PROPOSED',
  `priority` ENUM('ROUTINE', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `priority_score` DECIMAL(5,2) NOT NULL DEFAULT '50.00',
  `observation` TEXT NOT NULL,
  `possible_opportunity` TEXT NOT NULL,
  `evidence_json` JSON NULL,
  `reviewer_notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_opp_story_id` (`story_id`),
  KEY `idx_opp_status` (`status`),
  KEY `idx_opp_type` (`opportunity_type`),
  CONSTRAINT `fk_opp_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opp_insight` FOREIGN KEY (`insight_id`) REFERENCES `story_insights` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `story_experiments` (
  `id` BINARY(16) NOT NULL,
  `story_id` BINARY(16) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `hypothesis` TEXT NOT NULL,
  `target_metric` VARCHAR(100) NOT NULL DEFAULT 'completion_rate',
  `status` ENUM('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'CONCLUDED', 'APPLIED', 'DISCARDED') NOT NULL DEFAULT 'DRAFT',
  `split_percentage` INT NOT NULL DEFAULT 50,
  `started_at` DATETIME(3) NULL,
  `concluded_at` DATETIME(3) NULL,
  `created_by` BINARY(16) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_exp_story_id` (`story_id`),
  KEY `idx_exp_status` (`status`),
  CONSTRAINT `fk_exp_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exp_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `experiment_variants` (
  `id` BINARY(16) NOT NULL,
  `experiment_id` BINARY(16) NOT NULL,
  `variant_key` VARCHAR(10) NOT NULL,
  `version_id` BINARY(16) NULL,
  `node_id` BINARY(16) NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `config_json` JSON NULL,
  `traffic_allocation_pct` INT NOT NULL DEFAULT 50,
  `impressions_count` INT NOT NULL DEFAULT 0,
  `completions_count` INT NOT NULL DEFAULT 0,
  `conversion_rate` DECIMAL(5,4) NOT NULL DEFAULT '0.0000',
  `metrics_json` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_var_exp_id` (`experiment_id`),
  CONSTRAINT `fk_var_experiment` FOREIGN KEY (`experiment_id`) REFERENCES `story_experiments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_var_version` FOREIGN KEY (`version_id`) REFERENCES `story_versions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_var_node` FOREIGN KEY (`node_id`) REFERENCES `story_nodes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
