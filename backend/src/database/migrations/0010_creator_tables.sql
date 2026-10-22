-- Migration 0010: Creator Module (Profiles, Applications, Verifications, Internal Notes)
-- Adds suspension fields to creators, and creates creator_profiles, creator_applications, creator_verifications, creator_internal_notes

ALTER TABLE creators ADD COLUMN suspension_reason TEXT NULL;
ALTER TABLE creators ADD COLUMN suspension_date DATETIME(3) NULL;

CREATE TABLE IF NOT EXISTS creator_profiles (
  id              BINARY(16)   NOT NULL,
  creator_id      BINARY(16)   NOT NULL,
  tagline         VARCHAR(255) NULL,
  bio             TEXT         NULL,
  avatar_url      VARCHAR(500) NULL,
  cover_image_url VARCHAR(500) NULL,
  location        VARCHAR(100) NULL,
  category        VARCHAR(100) NULL,
  genres          JSON         NULL,
  languages       JSON         NULL,
  experience      TEXT         NULL,
  portfolio_url   VARCHAR(500) NULL,
  website_url     VARCHAR(500) NULL,
  social_links    JSON         NULL,
  is_featured     BOOLEAN      NOT NULL DEFAULT FALSE,
  is_rising       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_creator_profile_creator (creator_id),
  KEY idx_profile_category (category),
  KEY idx_profile_featured (is_featured),
  CONSTRAINT fk_profile_creator FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS creator_applications (
  id              BINARY(16)   NOT NULL,
  user_id         BINARY(16)   NOT NULL,
  applicant_name  VARCHAR(100) NOT NULL,
  creator_name    VARCHAR(100) NOT NULL,
  category        VARCHAR(100) NOT NULL,
  genres          JSON         NULL,
  languages       JSON         NULL,
  bio             TEXT         NULL,
  location        VARCHAR(100) NULL,
  experience      TEXT         NULL,
  portfolio_url   VARCHAR(500) NULL,
  proposed_story  JSON         NULL,
  status          ENUM('PENDING','UNDER_REVIEW','APPROVED','REJECTED','CHANGES_REQUESTED') NOT NULL DEFAULT 'PENDING',
  reviewer_id     BINARY(16)   NULL,
  reviewer_notes  TEXT         NULL,
  reviewed_at     DATETIME(3)  NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_app_status (status),
  KEY idx_app_user (user_id),
  CONSTRAINT fk_app_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS creator_verifications (
  id             BINARY(16)   NOT NULL,
  creator_id     BINARY(16)   NOT NULL,
  status         ENUM('NOT_VERIFIED','PENDING','VERIFIED','REJECTED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  document_type  VARCHAR(50)  NULL,
  document_url   VARCHAR(500) NULL,
  verified_by    BINARY(16)   NULL,
  reviewer_notes TEXT         NULL,
  verified_at    DATETIME(3)  NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_verif_status (status),
  KEY idx_verif_creator (creator_id),
  CONSTRAINT fk_verif_creator  FOREIGN KEY (creator_id)  REFERENCES creators(id) ON DELETE CASCADE,
  CONSTRAINT fk_verif_reviewer FOREIGN KEY (verified_by) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS creator_internal_notes (
  id         BINARY(16)  NOT NULL,
  creator_id BINARY(16)  NOT NULL,
  author_id  BINARY(16)  NOT NULL,
  note       TEXT        NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_note_creator (creator_id),
  CONSTRAINT fk_note_creator FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_author  FOREIGN KEY (author_id)  REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
