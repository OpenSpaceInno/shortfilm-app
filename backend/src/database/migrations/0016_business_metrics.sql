-- Migration: 0016_business_metrics.sql
-- Description: Creates business_metrics table for pre-aggregated operational rollups (SR-ARCH-19 & M25)

CREATE TABLE IF NOT EXISTS `business_metrics` (
  `id` BINARY(16) NOT NULL,
  `metric_name` VARCHAR(64) NOT NULL,
  `dimension_key` VARCHAR(64) NOT NULL DEFAULT 'GLOBAL',
  `dimension_value` VARCHAR(128) NOT NULL DEFAULT 'ALL',
  `time_granularity` ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
  `period_start` DATETIME(3) NOT NULL,
  `period_end` DATETIME(3) NOT NULL,
  `numeric_value` DECIMAL(16,4) NOT NULL DEFAULT '0.0000',
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bm_period` (`metric_name`, `dimension_key`, `dimension_value`, `time_granularity`, `period_start`),
  KEY `idx_bm_lookup` (`metric_name`, `dimension_key`, `period_start`, `time_granularity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
