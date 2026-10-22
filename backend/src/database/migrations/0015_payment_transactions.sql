-- Migration: 0015_payment_transactions.sql
-- Description: Creates payment_transactions ledger table for checkout and webhook auditing

CREATE TABLE IF NOT EXISTS `payment_transactions` (
  `id` BINARY(16) NOT NULL,
  `user_id` BINARY(16) NOT NULL,
  `subscription_id` BINARY(16) NULL,
  `idempotency_key` VARCHAR(255) NULL,
  `provider` VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
  `external_transaction_id` VARCHAR(255) NULL,
  `external_event_id` VARCHAR(255) NULL,
  `event_type` VARCHAR(100) NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT '0.00',
  `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
  `status` ENUM('PENDING','PROCESSED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `payload_json` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pt_idempotency` (`idempotency_key`),
  KEY `idx_pt_user` (`user_id`),
  KEY `idx_pt_sub` (`subscription_id`),
  KEY `idx_pt_status` (`status`),
  KEY `idx_pt_provider` (`provider`),
  CONSTRAINT `fk_pt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pt_sub` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
