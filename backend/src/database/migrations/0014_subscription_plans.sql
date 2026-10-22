-- Migration: 0014_subscription_plans.sql
-- Description: Creates subscription_plans catalog, user subscriptions, and feature entitlements tables

CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` BINARY(16) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `tier` ENUM('FREE','VIP','STUDENT','LIFETIME') NOT NULL DEFAULT 'VIP',
  `description` TEXT NULL,
  `price_monthly` DECIMAL(12,2) NOT NULL DEFAULT '0.00',
  `price_annually` DECIMAL(12,2) NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
  `billing_interval` ENUM('MONTHLY','ANNUAL','LIFETIME','FREE') NOT NULL DEFAULT 'MONTHLY',
  `trial_days` INT NOT NULL DEFAULT 0,
  `features` JSON NULL,
  `entitlement_matrix` JSON NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_popular` BOOLEAN NOT NULL DEFAULT FALSE,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_plan_slug` (`slug`),
  KEY `idx_sp_tier` (`tier`),
  KEY `idx_sp_active` (`is_active`),
  KEY `idx_sp_interval` (`billing_interval`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` BINARY(16) NOT NULL,
  `user_id` BINARY(16) NOT NULL,
  `plan_id` BINARY(16) NOT NULL,
  `status` ENUM('TRIAL','ACTIVE','PAST_DUE','CANCELLED','EXPIRED') NOT NULL DEFAULT 'TRIAL',
  `billing_interval` ENUM('MONTHLY','ANNUAL','LIFETIME','FREE') NOT NULL DEFAULT 'MONTHLY',
  `provider` VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
  `provider_sub_id` VARCHAR(255) NULL,
  `current_period_start` DATETIME(3) NULL,
  `current_period_end` DATETIME(3) NULL,
  `grace_period_end` DATETIME(3) NULL,
  `cancelled_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_sub_user_status` (`user_id`, `status`),
  KEY `idx_sub_plan` (`plan_id`),
  KEY `idx_sub_period_end` (`current_period_end`),
  CONSTRAINT `fk_sub_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `entitlements` (
  `id` BINARY(16) NOT NULL,
  `user_id` BINARY(16) NOT NULL,
  `plan_id` BINARY(16) NULL,
  `entitlement_code` VARCHAR(50) NOT NULL,
  `source` VARCHAR(50) NOT NULL DEFAULT 'SUBSCRIPTION',
  `expires_at` DATETIME(3) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_ent_user_code_active` (`user_id`, `entitlement_code`, `is_active`),
  KEY `idx_ent_expires` (`expires_at`),
  CONSTRAINT `fk_ent_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ent_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
