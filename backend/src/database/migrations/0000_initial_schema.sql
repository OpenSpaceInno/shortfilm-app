-- ShortReel Initial Database Schema Migration
-- Database: MySQL 8.x (InnoDB)
-- Collation: utf8mb4_0900_ai_ci

CREATE TABLE IF NOT EXISTS users (
  id                      BINARY(16)   NOT NULL,
  external_auth_provider  VARCHAR(20)  NOT NULL DEFAULT 'AUTH0',
  external_subject_id     VARCHAR(255) NOT NULL,
  email                   VARCHAR(255) NOT NULL,
  phone                   VARCHAR(20)  NULL,
  display_name            VARCHAR(100) NOT NULL,
  avatar_url              VARCHAR(500) NULL,
  status                  ENUM('ACTIVE','SUSPENDED','DELETED') NOT NULL DEFAULT 'ACTIVE',
  email_verified_at       DATETIME(3)  NULL,
  last_login_at           DATETIME(3)  NULL,
  created_at              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at              DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_subject (external_subject_id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_phone (phone),
  KEY idx_users_status (status),
  KEY idx_users_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  id                       BINARY(16)   NOT NULL,
  user_id                  BINARY(16)   NOT NULL,
  bio                      TEXT         NULL,
  language_preference      VARCHAR(10)  NOT NULL DEFAULT 'en',
  genre_preferences        JSON         NULL,
  notification_preferences JSON         NULL,
  created_at               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_profile_user (user_id),
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS roles (
  id          BINARY(16)   NOT NULL,
  name        ENUM('SUPER_ADMIN','CONTENT_ADMIN','EDITOR','CREATOR_MANAGER','ANALYST','FINANCE','CREATOR','USER') NOT NULL,
  description VARCHAR(255) NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id          BINARY(16)   NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permission_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    BINARY(16)  NOT NULL,
  role_id    BINARY(16)  NOT NULL,
  granted_by BINARY(16)  NULL,
  granted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       BINARY(16) NOT NULL,
  permission_id BINARY(16) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
