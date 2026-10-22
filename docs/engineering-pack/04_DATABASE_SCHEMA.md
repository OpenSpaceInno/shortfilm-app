# 04. SHORTREEL — DATABASE SCHEMA

> **Document:** `04_DATABASE_SCHEMA.md`  
> **Status:** FROZEN  
> **Database:** MySQL 8.x (InnoDB)  
> **Collation:** `utf8mb4_0900_ai_ci`  
> **Reference:** `docs/architecture/04_MYSQL_DATABASE_ARCHITECTURE.md`  

---

## Global Conventions

| Convention | Rule |
| :--- | :--- |
| **Engine** | InnoDB (all tables) |
| **Identifiers** | `BINARY(16)` (ULID/UUIDv7, Base32 in API) |
| **Timestamps** | `DATETIME(3)` UTC, never local time |
| **Money** | `DECIMAL(12,2)` — floating point forbidden |
| **Soft Deletes** | `deleted_at DATETIME(3) NULL` where applicable |
| **Audit Fields** | `created_at`, `updated_at`, `created_by`, `updated_by` where meaningful |
| **Enums** | MySQL `ENUM` type for finite-state values |
| **JSON Columns** | Sparingly for flexible metadata only |
| **FK Constraints** | Strictly enforced — `ON DELETE RESTRICT` default |

---

## Database Name

```sql
CREATE DATABASE shortreel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

---

## IDENTITY SCHEMA

### `users`

```sql
CREATE TABLE users (
  id             BINARY(16)   NOT NULL,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(20)  NULL,
  password_hash  VARCHAR(255) NOT NULL,
  display_name   VARCHAR(100) NOT NULL,
  avatar_url     VARCHAR(500) NULL,
  status         ENUM('ACTIVE','SUSPENDED','DELETED') NOT NULL DEFAULT 'ACTIVE',
  email_verified_at DATETIME(3) NULL,
  last_login_at  DATETIME(3)  NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at     DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_phone (phone),
  KEY idx_users_status (status),
  KEY idx_users_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `user_profiles`

```sql
CREATE TABLE user_profiles (
  id                     BINARY(16)   NOT NULL,
  user_id                BINARY(16)   NOT NULL,
  bio                    TEXT         NULL,
  language_preference    VARCHAR(10)  NOT NULL DEFAULT 'en',
  genre_preferences      JSON         NULL,
  notification_preferences JSON       NULL,
  created_at             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_profile_user (user_id),
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `roles`

```sql
CREATE TABLE roles (
  id          BINARY(16)   NOT NULL,
  name        ENUM('SUPER_ADMIN','CONTENT_ADMIN','EDITOR','CREATOR_MANAGER','ANALYST','FINANCE','CREATOR','USER') NOT NULL,
  description VARCHAR(255) NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `permissions`

```sql
CREATE TABLE permissions (
  id          BINARY(16)   NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permission_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `user_roles` (junction)

```sql
CREATE TABLE user_roles (
  user_id    BINARY(16)  NOT NULL,
  role_id    BINARY(16)  NOT NULL,
  granted_by BINARY(16)  NULL,
  granted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `role_permissions` (junction)

```sql
CREATE TABLE role_permissions (
  role_id       BINARY(16) NOT NULL,
  permission_id BINARY(16) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id          BINARY(16)   NOT NULL,
  user_id     BINARY(16)   NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  device_info VARCHAR(255) NULL,
  expires_at  DATETIME(3)  NOT NULL,
  revoked_at  DATETIME(3)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_rt_user (user_id),
  KEY idx_rt_expires (expires_at),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

## CONTENT SCHEMA

### `genres`

```sql
CREATE TABLE genres (
  id         BINARY(16)   NOT NULL,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) NOT NULL,
  icon       VARCHAR(100) NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_genre_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `stories`

```sql
CREATE TABLE stories (
  id               BINARY(16)   NOT NULL,
  creator_id       BINARY(16)   NOT NULL,
  title            VARCHAR(255) NOT NULL,
  synopsis         TEXT         NOT NULL,
  premise          TEXT         NULL,
  status           ENUM('DRAFT','SUBMITTED','APPROVED','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  language         VARCHAR(10)  NOT NULL DEFAULT 'en',
  thumbnail_url    VARCHAR(500) NULL,
  poster_url       VARCHAR(500) NULL,
  content_rating   VARCHAR(20)  NULL,
  target_audience  VARCHAR(50)  NULL,
  view_count       BIGINT       NOT NULL DEFAULT 0,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  published_at     DATETIME(3)  NULL,
  deleted_at       DATETIME(3)  NULL,
  FULLTEXT INDEX ft_stories (title, synopsis, premise),
  PRIMARY KEY (id),
  KEY idx_stories_creator (creator_id),
  KEY idx_stories_status (status),
  KEY idx_stories_published (published_at),
  CONSTRAINT fk_story_creator FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `seasons`

```sql
CREATE TABLE seasons (
  id             BINARY(16)   NOT NULL,
  story_id       BINARY(16)   NOT NULL,
  title          VARCHAR(255) NOT NULL,
  season_number  INT          NOT NULL,
  synopsis       TEXT         NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_season_number (story_id, season_number),
  CONSTRAINT fk_season_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `episodes`

```sql
CREATE TABLE episodes (
  id              BINARY(16)   NOT NULL,
  season_id       BINARY(16)   NOT NULL,
  title           VARCHAR(255) NOT NULL,
  episode_number  INT          NOT NULL,
  synopsis        TEXT         NULL,
  thumbnail_url   VARCHAR(500) NULL,
  is_free         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  published_at    DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_episode_number (season_id, episode_number),
  CONSTRAINT fk_episode_season FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `videos`

```sql
CREATE TABLE videos (
  id              BINARY(16)   NOT NULL,
  episode_id      BINARY(16)   NOT NULL,
  provider        VARCHAR(50)  NOT NULL DEFAULT 'CLOUDFLARE_STREAM',
  provider_uid    VARCHAR(255) NULL,
  status          ENUM('UPLOADING','PROCESSING','READY','FAILED') NOT NULL DEFAULT 'UPLOADING',
  duration_seconds INT         NULL,
  width           INT          NULL,
  height          INT          NULL,
  playback_url    VARCHAR(500) NULL,
  thumbnail_url   VARCHAR(500) NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_video_episode (episode_id),
  KEY idx_video_provider_uid (provider_uid),
  CONSTRAINT fk_video_episode FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `characters`

```sql
CREATE TABLE characters (
  id          BINARY(16)   NOT NULL,
  story_id    BINARY(16)   NOT NULL,
  name        VARCHAR(100) NOT NULL,
  bio         TEXT         NULL,
  role_desc   VARCHAR(255) NULL,
  avatar_url  VARCHAR(500) NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FULLTEXT INDEX ft_characters (name, bio),
  PRIMARY KEY (id),
  CONSTRAINT fk_char_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

## INTERACTIVE SCHEMA

### `story_versions`

```sql
CREATE TABLE story_versions (
  id              BINARY(16)   NOT NULL,
  story_id        BINARY(16)   NOT NULL,
  version_number  INT          NOT NULL,
  status          ENUM('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  graph_snapshot  JSON         NULL,
  root_node_id    BINARY(16)   NULL,
  published_at    DATETIME(3)  NULL,
  archived_at     DATETIME(3)  NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_sv_version (story_id, version_number),
  KEY idx_sv_status (status),
  CONSTRAINT fk_sv_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `story_nodes`

```sql
CREATE TABLE story_nodes (
  id                 BINARY(16)  NOT NULL,
  story_version_id   BINARY(16)  NOT NULL,
  episode_id         BINARY(16)  NOT NULL,
  node_type          ENUM('OPENING','STANDARD','CHOICE_POINT','ENDING') NOT NULL DEFAULT 'STANDARD',
  is_root            BOOLEAN     NOT NULL DEFAULT FALSE,
  sequence_order     INT         NOT NULL DEFAULT 0,
  voting_ends_at     DATETIME(3) NULL,
  fallback_option_id BINARY(16)  NULL,
  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_sn_version (story_version_id),
  CONSTRAINT fk_sn_version FOREIGN KEY (story_version_id) REFERENCES story_versions(id) ON DELETE CASCADE,
  CONSTRAINT fk_sn_episode FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `choices`

```sql
CREATE TABLE choices (
  id              BINARY(16)   NOT NULL,
  story_node_id   BINARY(16)   NOT NULL,
  prompt          TEXT         NOT NULL,
  voting_opens_at DATETIME(3)  NULL,
  voting_ends_at  DATETIME(3)  NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_choice_node (story_node_id),
  CONSTRAINT fk_choice_node FOREIGN KEY (story_node_id) REFERENCES story_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `choice_options`

```sql
CREATE TABLE choice_options (
  id                  BINARY(16)   NOT NULL,
  choice_id           BINARY(16)   NOT NULL,
  label               VARCHAR(255) NOT NULL,
  destination_node_id BINARY(16)   NOT NULL,
  vote_count          INT          NOT NULL DEFAULT 0,
  display_order       TINYINT      NOT NULL DEFAULT 1,
  created_at          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_co_choice (choice_id),
  CONSTRAINT fk_co_choice FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE CASCADE,
  CONSTRAINT fk_co_dest FOREIGN KEY (destination_node_id) REFERENCES story_nodes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `user_choices`

```sql
CREATE TABLE user_choices (
  id               BINARY(16)  NOT NULL,
  user_id          BINARY(16)  NOT NULL,
  choice_id        BINARY(16)  NOT NULL,
  choice_option_id BINARY(16)  NOT NULL,
  story_version_id BINARY(16)  NOT NULL,
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_uc_user_choice (user_id, choice_id),
  KEY idx_uc_user (user_id),
  CONSTRAINT fk_uc_user   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uc_choice FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE RESTRICT,
  CONSTRAINT fk_uc_option FOREIGN KEY (choice_option_id) REFERENCES choice_options(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

## ENGAGEMENT SCHEMA

### `watch_progress`

```sql
CREATE TABLE watch_progress (
  id               BINARY(16)   NOT NULL,
  user_id          BINARY(16)   NOT NULL,
  episode_id       BINARY(16)   NOT NULL,
  progress_seconds INT          NOT NULL DEFAULT 0,
  completed        BOOLEAN      NOT NULL DEFAULT FALSE,
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_wp_user_episode (user_id, episode_id),
  KEY idx_wp_continue (user_id, updated_at DESC),
  CONSTRAINT fk_wp_user    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wp_episode FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `watch_history`

```sql
CREATE TABLE watch_history (
  id                BINARY(16)  NOT NULL,
  user_id           BINARY(16)  NOT NULL,
  episode_id        BINARY(16)  NOT NULL,
  story_version_id  BINARY(16)  NOT NULL,
  watched_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_wh_user (user_id, watched_at DESC),
  CONSTRAINT fk_wh_user    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wh_episode FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `xp_ledger`

```sql
CREATE TABLE xp_ledger (
  id           BINARY(16)   NOT NULL,
  user_id      BINARY(16)   NOT NULL,
  action       VARCHAR(100) NOT NULL,
  points       INT          NOT NULL,
  reference_id BINARY(16)   NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_xp_user (user_id),
  CONSTRAINT fk_xp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

## MONETISATION SCHEMA

### `subscription_plans`

```sql
CREATE TABLE subscription_plans (
  id               BINARY(16)      NOT NULL,
  name             VARCHAR(100)    NOT NULL,
  slug             VARCHAR(100)    NOT NULL,
  price_monthly    DECIMAL(12,2)   NOT NULL,
  price_annually   DECIMAL(12,2)   NULL,
  currency         VARCHAR(3)      NOT NULL DEFAULT 'INR',
  features         JSON            NULL,
  is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `subscriptions`

```sql
CREATE TABLE subscriptions (
  id               BINARY(16)   NOT NULL,
  user_id          BINARY(16)   NOT NULL,
  plan_id          BINARY(16)   NOT NULL,
  status           ENUM('TRIAL','ACTIVE','PAST_DUE','CANCELLED','EXPIRED') NOT NULL DEFAULT 'TRIAL',
  provider         VARCHAR(50)  NOT NULL,
  provider_sub_id  VARCHAR(255) NULL,
  current_period_start DATETIME(3) NULL,
  current_period_end   DATETIME(3) NULL,
  grace_period_end     DATETIME(3) NULL,
  cancelled_at     DATETIME(3)  NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_sub_user_status (user_id, status),
  CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `webhook_events`

```sql
CREATE TABLE webhook_events (
  id           BINARY(16)   NOT NULL,
  provider     VARCHAR(50)  NOT NULL,
  event_id     VARCHAR(255) NOT NULL,
  event_type   VARCHAR(100) NOT NULL,
  payload      JSON         NOT NULL,
  status       ENUM('RECEIVED','PROCESSED','FAILED') NOT NULL DEFAULT 'RECEIVED',
  processed_at DATETIME(3)  NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_webhook_event (provider, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

## CREATOR SCHEMA

### `creators`

```sql
CREATE TABLE creators (
  id           BINARY(16)   NOT NULL,
  user_id      BINARY(16)   NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio          TEXT         NULL,
  tier         ENUM('EMERGING','VERIFIED','EXCLUSIVE','PARTNER') NOT NULL DEFAULT 'EMERGING',
  status       ENUM('APPLIED','UNDER_REVIEW','APPROVED','VERIFIED','ACTIVE','SUSPENDED','REJECTED','DEACTIVATED') NOT NULL DEFAULT 'APPLIED',
  verified_at  DATETIME(3)  NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_creator_user (user_id),
  FULLTEXT INDEX ft_creators (display_name, bio),
  CONSTRAINT fk_creator_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### `creator_earnings`

```sql
CREATE TABLE creator_earnings (
  id            BINARY(16)     NOT NULL,
  creator_id    BINARY(16)     NOT NULL,
  period_month  DATE           NOT NULL,
  gross_amount  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  platform_fee  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  tax_withheld  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  net_payout    DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  status        ENUM('CALCULATED','PENDING_PAYOUT','PAID','HELD') NOT NULL DEFAULT 'CALCULATED',
  paid_at       DATETIME(3)    NULL,
  created_at    DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_earnings_period (creator_id, period_month),
  CONSTRAINT fk_earnings_creator FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

## GOVERNANCE SCHEMA

### `audit_logs`

```sql
CREATE TABLE audit_logs (
  id             BINARY(16)   NOT NULL,
  actor_id       BINARY(16)   NOT NULL,
  actor_role     VARCHAR(50)  NOT NULL,
  action         VARCHAR(100) NOT NULL,
  entity_type    VARCHAR(100) NOT NULL,
  entity_id      BINARY(16)   NULL,
  previous_state JSON         NULL,
  new_state      JSON         NULL,
  ip_address     VARCHAR(45)  NULL,
  user_agent     VARCHAR(500) NULL,
  request_id     VARCHAR(100) NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_audit_actor (actor_id, created_at DESC),
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

## Migration Strategy

- All schema changes via Drizzle ORM migration files.
- Migration files are numbered sequentially: `0001_initial_identity.sql`, `0002_content.sql`, etc.
- Never edit an existing migration — always create a new one.
- Migrations run as a pre-deploy ECS task before container traffic cutover.
- Backward-incompatible drops require a two-migration two-release cycle.
