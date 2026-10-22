-- Migration: 0017_business_reports_and_signals.sql
-- Description: Creates business_signals and business_reports tables (SR-ARCH-19 & M26)

CREATE TABLE IF NOT EXISTS `business_signals` (
  `id` BINARY(16) NOT NULL,
  `category` ENUM('AUDIENCE', 'ENGAGEMENT', 'SUBSCRIPTION', 'CONTENT', 'CREATOR', 'REVENUE') NOT NULL,
  `signal_type` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `observation` TEXT NOT NULL,
  `supporting_data` JSON NULL,
  `signal_strength` ENUM('EMERGING', 'MODERATE', 'STRONG') NOT NULL DEFAULT 'MODERATE',
  `severity` ENUM('INFO', 'REVIEW', 'ATTENTION', 'CRITICAL') NOT NULL DEFAULT 'INFO',
  `status` ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'ACTIVE',
  `detected_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_bs_category_status` (`category`, `status`),
  KEY `idx_bs_detected_at` (`detected_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `business_reports` (
  `id` BINARY(16) NOT NULL,
  `report_type` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `cadence` ENUM('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ADHOC') NOT NULL DEFAULT 'MONTHLY',
  `period_start` DATETIME(3) NOT NULL,
  `period_end` DATETIME(3) NOT NULL,
  `status` ENUM('DRAFT', 'GENERATED', 'APPROVED', 'ARCHIVED') NOT NULL DEFAULT 'GENERATED',
  `summary` TEXT NULL,
  `key_stat` VARCHAR(255) NULL,
  `data` JSON NOT NULL,
  `metadata` JSON NULL,
  `generated_by` BINARY(16) NULL,
  `approved_by` BINARY(16) NULL,
  `approved_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_br_period` (`period_start`, `period_end`),
  KEY `idx_br_status` (`status`),
  KEY `idx_br_type` (`report_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
