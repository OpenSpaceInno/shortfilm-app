-- Migration: 0019_admin_cms_schema.sql
-- Description: Creates Admin CMS schema: system_settings, moderation_reports, featured_curations, audit_logs (M28)

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` BINARY(16) NOT NULL,
  `category` ENUM('GENERAL', 'CONTENT_DEFAULTS', 'FEATURE_FLAGS', 'SECURITY', 'MONETIZATION', 'NOTIFICATIONS', 'MODERATION') NOT NULL DEFAULT 'GENERAL',
  `key` VARCHAR(128) NOT NULL,
  `value` JSON NOT NULL,
  `value_type` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY') NOT NULL DEFAULT 'STRING',
  `description` TEXT NULL,
  `is_public` BOOLEAN NOT NULL DEFAULT 0,
  `updated_by` BINARY(16) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_settings_key` (`key`),
  KEY `idx_settings_category` (`category`),
  KEY `idx_settings_is_public` (`is_public`),
  CONSTRAINT `fk_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `moderation_reports` (
  `id` BINARY(16) NOT NULL,
  `reporter_user_id` BINARY(16) NULL,
  `target_type` ENUM('STORY', 'EPISODE', 'USER', 'COMMENT', 'VIDEO') NOT NULL,
  `target_id` BINARY(16) NOT NULL,
  `reason` ENUM('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'EXPLICIT_CONTENT', 'COPYRIGHT', 'MISINFORMATION', 'VIOLENCE', 'OTHER') NOT NULL,
  `details` TEXT NULL,
  `status` ENUM('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
  `resolution_action` ENUM('NO_ACTION', 'CONTENT_REMOVED', 'CONTENT_WARNING', 'USER_WARNED', 'USER_SUSPENDED', 'USER_BANNED', 'DISMISSED') NULL,
  `resolution_notes` TEXT NULL,
  `resolved_by` BINARY(16) NULL,
  `resolved_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_rep_target` (`target_type`, `target_id`),
  KEY `idx_rep_status` (`status`),
  KEY `idx_rep_created_at` (`created_at`),
  KEY `idx_rep_reporter` (`reporter_user_id`),
  CONSTRAINT `fk_rep_reporter` FOREIGN KEY (`reporter_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rep_resolver` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `featured_curations` (
  `id` BINARY(16) NOT NULL,
  `story_id` BINARY(16) NOT NULL,
  `collection_type` ENUM('HOME_HERO', 'TRENDING_CURATED', 'EDITOR_PICK', 'TOP_10', 'GENRE_SPOTLIGHT') NOT NULL DEFAULT 'EDITOR_PICK',
  `display_order` INT NOT NULL DEFAULT 0,
  `badge` VARCHAR(64) NULL,
  `custom_headline` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT 1,
  `starts_at` DATETIME(3) NULL,
  `ends_at` DATETIME(3) NULL,
  `curated_by` BINARY(16) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_cur_collection` (`collection_type`, `is_active`, `display_order`),
  KEY `idx_cur_story` (`story_id`),
  CONSTRAINT `fk_cur_story` FOREIGN KEY (`story_id`) REFERENCES `stories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cur_curator` FOREIGN KEY (`curated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BINARY(16) NOT NULL,
  `actor_id` BINARY(16) NOT NULL,
  `actor_role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` BINARY(16) NULL,
  `previous_state` JSON NULL,
  `new_state` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `request_id` VARCHAR(100) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor` (`actor_id`, `created_at` DESC),
  KEY `idx_audit_entity` (`entity_type`, `entity_id`),
  KEY `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
