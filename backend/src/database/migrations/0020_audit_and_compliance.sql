-- Migration: 0020_audit_and_compliance.sql
-- Description: Creates gdpr_requests table and compliance tracking indexes (M29)

CREATE TABLE IF NOT EXISTS `gdpr_requests` (
  `id` BINARY(16) NOT NULL,
  `user_id` BINARY(16) NOT NULL,
  `request_type` ENUM('ERASURE', 'EXPORT', 'RESTRICTION') NOT NULL,
  `status` ENUM('PENDING', 'IN_GRACE_PERIOD', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `grace_period_ends_at` DATETIME(3) NULL,
  `reason` TEXT NULL,
  `anonymized_email` VARCHAR(255) NULL,
  `export_url` VARCHAR(500) NULL,
  `metadata` JSON NULL,
  `processed_by` BINARY(16) NULL,
  `processed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_gdpr_user` (`user_id`),
  KEY `idx_gdpr_status` (`status`),
  KEY `idx_gdpr_created` (`created_at`),
  CONSTRAINT `fk_gdpr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gdpr_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
