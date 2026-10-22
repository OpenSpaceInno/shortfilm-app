-- Migration 0011: Creator Submissions Table
-- Resolves P1-CRE-001: Provides creator_submissions table linking creators, pitches, and story versions for review queue

CREATE TABLE IF NOT EXISTS creator_submissions (
  id                BINARY(16)   NOT NULL,
  creator_id        BINARY(16)   NOT NULL,
  story_id          BINARY(16)   NULL,
  story_version_id  BINARY(16)   NULL,
  submission_type   ENUM('FULL_SERIES','INTERACTIVE_PILOT','SEASON_PITCH','SPECIAL_EPISODE') NOT NULL DEFAULT 'FULL_SERIES',
  title             VARCHAR(255) NOT NULL,
  synopsis          TEXT         NULL,
  script_url        VARCHAR(500) NULL,
  video_preview_url VARCHAR(500) NULL,
  status            ENUM('DRAFT','SUBMITTED','UNDER_REVIEW','CHANGES_REQUESTED','APPROVED','REJECTED','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  story_info        JSON         NULL,
  content_preview   JSON         NULL,
  checklist         JSON         NULL,
  reviewer_id       BINARY(16)   NULL,
  reviewer_notes    TEXT         NULL,
  reviewed_at       DATETIME(3)  NULL,
  submitted_at      DATETIME(3)  NULL,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_sub_creator (creator_id),
  KEY idx_sub_status (status),
  KEY idx_sub_story (story_id),
  KEY idx_sub_version (story_version_id),
  KEY idx_sub_type (submission_type),
  CONSTRAINT fk_sub_creator FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_story   FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL,
  CONSTRAINT fk_sub_version FOREIGN KEY (story_version_id) REFERENCES story_versions(id) ON DELETE SET NULL,
  CONSTRAINT fk_sub_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
