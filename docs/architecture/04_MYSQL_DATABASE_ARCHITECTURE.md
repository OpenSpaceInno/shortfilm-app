# 04. SHORTREEL — MYSQL DATABASE ARCHITECTURE

> **Document ID:** SR-ARCH-04  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  
> **Database Engine:** MySQL 8.0.x / 8.4 LTS (InnoDB Storage Engine)  
> **Character Set:** `utf8mb4` | **Collation:** `utf8mb4_0900_ai_ci`  

---

## 1. Global Database Standards & Conventions

### 1.1 Storage Engine & ACID Transactions
- All tables strictly utilize the **InnoDB** storage engine.
- Foreign key constraints are enforced at the database level with explicit `ON DELETE` rules (`RESTRICT` for critical parent-child relations, `CASCADE` only for tightly owned sub-entities like `choice_options`).
- All multi-entity state mutations execute inside database transaction blocks (`START TRANSACTION ... COMMIT / ROLLBACK`).

### 1.2 Data Types & Precision
- **Primary Keys:** `BINARY(16)` storing 128-bit time-ordered **ULID / UUIDv7** values. Guarantees monotonic B-Tree insertion with zero page splits and complete unguessability.
- **Foreign Keys:** `BINARY(16)` matching parent primary keys.
- **Financial & Monetary Values:** `DECIMAL(12, 2)` (e.g., subscription prices, creator earnings). Float and double types are strictly prohibited for monetary values.
- **Timestamps:** `DATETIME(3)` stored in **UTC**. Columns use `created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)` and `updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`.
- **Soft Deletion:** `deleted_at DATETIME(3) NULL DEFAULT NULL`. Queries filter with `WHERE deleted_at IS NULL` unless explicitly requesting historical/archived data.
- **Booleans:** `TINYINT(1)` (`0` for false, `1` for true).
- **Enums:** Handled via `VARCHAR(32)` with application-level validation and optional database `CHECK` constraints to ensure zero-downtime additions without `ALTER TABLE` table locks.
- **Unstructured Metadata / Signals:** `JSON` with generated virtual columns when indexing is required.

---

## 2. Table Definitions by Domain

### 2.1 Identity & Access Domain

#### `users`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `email` | `VARCHAR(255)` | NO | Unique index, user login identifier |
| `password_hash`| `VARCHAR(255)` | YES | Argon2id hash (null for OAuth-only users) |
| `status` | `VARCHAR(32)` | NO | `ACTIVE`, `SUSPENDED`, `DELETED` |
| `is_verified` | `TINYINT(1)` | NO | Default 0 |
| `created_at` | `DATETIME(3)` | NO | UTC creation timestamp |
| `updated_at` | `DATETIME(3)` | NO | UTC update timestamp |
| `deleted_at` | `DATETIME(3)` | YES | Soft-delete timestamp |

#### `profiles`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `user_id` | `BINARY(16)` | NO | PK & FK -> `users.id` ON DELETE CASCADE |
| `display_name` | `VARCHAR(100)` | NO | User public name |
| `handle` | `VARCHAR(50)` | YES | Unique index (`@username`) |
| `avatar_url` | `VARCHAR(1024)`| YES | S3/R2 object storage URL |
| `bio` | `TEXT` | YES | User biography |
| `locale` | `VARCHAR(10)` | NO | Default `'en-IN'` |
| `updated_at` | `DATETIME(3)` | NO | UTC update timestamp |

#### `roles` & `permissions` & `user_roles`
- `roles` (`id`, `code` [e.g. `'SUPER_ADMIN'`, `'CREATOR'`], `name`, `description`).
- `permissions` (`id`, `code` [e.g. `'STORY:PUBLISH'`], `resource`, `action`).
- `role_permissions` (`role_id`, `permission_id` - Composite PK).
- `user_roles` (`user_id`, `role_id`, `assigned_at`, `assigned_by` - Composite PK).

---

### 2.2 Creator Domain

#### `creators`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `user_id` | `BINARY(16)` | NO | Unique FK -> `users.id` |
| `tier` | `VARCHAR(32)` | NO | `EMERGING`, `VERIFIED`, `EXCLUSIVE`, `PARTNER` |
| `status` | `VARCHAR(32)` | NO | `PENDING`, `APPROVED`, `SUSPENDED` |
| `rating` | `DECIMAL(3, 2)`| NO | Default `4.50` |
| `total_views` | `BIGINT` | NO | Default 0 |
| `created_at` | `DATETIME(3)` | NO | Creation timestamp |
| `updated_at` | `DATETIME(3)` | NO | Update timestamp |

#### `creator_profiles`
- `creator_id` (PK, FK -> `creators.id`), `bio`, `genres` (JSON), `website_url`, `social_links` (JSON), `preferred_language`.

#### `creator_applications`
- `id` (PK), `user_id` (FK), `portfolio_url`, `pitch_text`, `status` (`SUBMITTED`, `UNDER_REVIEW`, `ACCEPTED`, `REJECTED`), `reviewed_by` (FK -> `users.id`), `reviewed_at`.

#### `creator_submissions`
- `id` (PK), `creator_id` (FK), `story_id` (FK), `version_number` (INT), `title`, `synopsis`, `script_url`, `status` (`DRAFT`, `SUBMITTED`, `IN_REVIEW`, `REVISION_REQUESTED`, `APPROVED`, `REJECTED`), `created_at`, `updated_at`.

#### `creator_earnings`
- `id` (PK), `creator_id` (FK), `story_id` (FK, nullable), `period_month` (`CHAR(7)`, e.g. `'2026-09'`), `gross_amount` (`DECIMAL(12,2)`), `platform_fee` (`DECIMAL(12,2)`), `net_amount` (`DECIMAL(12,2)`), `payout_status` (`CALCULATED`, `PENDING_PAYOUT`, `PAID`, `HELD`), `payout_reference` (`VARCHAR(255)`), `paid_at`.

---

### 2.3 Content Domain

#### `stories`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `slug` | `VARCHAR(150)` | NO | Unique index, human-readable URL |
| `title` | `VARCHAR(255)` | NO | Story display title |
| `tagline` | `VARCHAR(500)` | YES | Short pitch |
| `synopsis` | `TEXT` | YES | Full story summary |
| `creator_id` | `BINARY(16)` | NO | FK -> `creators.id` |
| `is_interactive`| `TINYINT(1)` | NO | Default 0 |
| `age_rating` | `VARCHAR(10)` | NO | Default `'16+'` |
| `primary_language`| `VARCHAR(20)`| NO | Default `'Hindi'` |
| `poster_url` | `VARCHAR(1024)`| NO | Main key art URL |
| `status` | `VARCHAR(32)` | NO | `DRAFT`, `IN_REVIEW`, `PUBLISHED`, `ARCHIVED` |
| `created_at` | `DATETIME(3)` | NO | Creation timestamp |
| `updated_at` | `DATETIME(3)` | NO | Update timestamp |
| `deleted_at` | `DATETIME(3)` | YES | Soft-delete timestamp |

#### `seasons`
- `id` (PK), `story_id` (FK -> `stories.id`), `number` (INT), `title` (VARCHAR(150)), `synopsis` (TEXT), `created_at`. Unique index on (`story_id`, `number`).

#### `episodes`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `season_id` | `BINARY(16)` | NO | FK -> `seasons.id` |
| `number` | `INT` | NO | Episode sequence in season |
| `title` | `VARCHAR(255)` | NO | Episode title |
| `duration_sec` | `INT` | NO | Duration in seconds |
| `is_premium` | `TINYINT(1)` | NO | 0 = Free, 1 = VIP Entitlement Required |
| `thumbnail_url`| `VARCHAR(1024)`| YES | Episode scene thumbnail |
| `status` | `VARCHAR(32)` | NO | `DRAFT`, `PUBLISHED`, `UNAVAILABLE` |
| `created_at` | `DATETIME(3)` | NO | Creation timestamp |
Unique index on (`season_id`, `number`).

#### `videos`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `episode_id` | `BINARY(16)` | NO | Unique FK -> `episodes.id` |
| `stream_provider`| `VARCHAR(50)`| NO | Default `'CLOUDFLARE_STREAM'` |
| `external_id` | `VARCHAR(255)` | NO | Cloudflare Stream Video UID |
| `playback_hls` | `VARCHAR(1024)`| NO | Master `.m3u8` playlist URL |
| `playback_dash`| `VARCHAR(1024)`| YES | Master `.mpd` manifest URL |
| `aspect_ratio` | `VARCHAR(10)` | NO | Default `'9:16'` (Portrait) |
| `width` | `INT` | NO | e.g. 1080 |
| `height` | `INT` | NO | e.g. 1920 |
| `duration_sec` | `INT` | NO | Transcoded duration |
| `status` | `VARCHAR(32)` | NO | `PROCESSING`, `READY`, `ERROR` |
| `created_at` | `DATETIME(3)` | NO | Creation timestamp |

#### `characters`
- `id` (PK), `story_id` (FK -> `stories.id`), `name`, `role`, `avatar_url`, `bio`, `favourite_pct` (INT), `followers_count` (INT), `created_at`.

---

### 2.4 Interactive Story Domain

#### `story_versions`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `story_id` | `BINARY(16)` | NO | FK -> `stories.id` |
| `version_number`| `INT` | NO | Incremental version (1, 2, 3...) |
| `status` | `VARCHAR(32)` | NO | `DRAFT`, `IN_REVIEW`, `PUBLISHED`, `ARCHIVED` |
| `root_node_id` | `BINARY(16)` | YES | FK -> `story_nodes.id` |
| `published_at` | `DATETIME(3)` | YES | Immutable timestamp once set |
| `published_by` | `BINARY(16)` | YES | FK -> `users.id` |
| `snapshot_json`| `LONGTEXT` | YES | Complete frozen graph export for audit |
| `created_at` | `DATETIME(3)` | NO | Creation timestamp |
Unique index on (`story_id`, `version_number`).

#### `story_nodes`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `version_id` | `BINARY(16)` | NO | FK -> `story_versions.id` ON DELETE CASCADE |
| `node_key` | `VARCHAR(100)` | NO | Authoring identifier (e.g. `'ROOT'`, `'PATH_A'`) |
| `episode_id` | `BINARY(16)` | YES | FK -> `episodes.id` (associated media) |
| `node_type` | `VARCHAR(32)` | NO | `ROOT`, `DECISION_POINT`, `BRANCH`, `ENDING` |
| `title` | `VARCHAR(255)` | NO | Node title |
| `synopsis` | `TEXT` | YES | Narrative scene description |
| `position_x` | `INT` | NO | Builder visual X coordinate |
| `position_y` | `INT` | NO | Builder visual Y coordinate |
| `created_at` | `DATETIME(3)` | NO | Creation timestamp |
Unique index on (`version_id`, `node_key`).

#### `choices`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `story_node_id`| `BINARY(16)` | NO | FK -> `story_nodes.id` ON DELETE CASCADE |
| `prompt` | `VARCHAR(500)` | NO | Question shown to viewer |
| `trigger_sec` | `INT` | NO | Playback second at which choice triggers |
| `voting_type` | `VARCHAR(32)` | NO | `INDIVIDUAL_BRANCH`, `COMMUNITY_VOTE` |
| `window_closes`| `DATETIME(3)` | YES | Expiration for community polls |
| `status` | `VARCHAR(32)` | NO | `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `created_at` | `DATETIME(3)` | NO | Creation timestamp |

#### `choice_options`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `choice_id` | `BINARY(16)` | NO | FK -> `choices.id` ON DELETE CASCADE |
| `option_key` | `CHAR(1)` | NO | `'A'`, `'B'`, `'C'`, `'D'` |
| `label` | `VARCHAR(255)` | NO | Choice text shown on button |
| `destination_node_id`| `BINARY(16)`| YES | FK -> `story_nodes.id` |
| `vote_count` | `BIGINT` | NO | Default 0 (cached atomic count) |
| `created_at` | `DATETIME(3)` | NO | Creation timestamp |
Unique index on (`choice_id`, `option_key`).

---

### 2.5 Engagement & Gamification Domain

#### `watch_progress`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `user_id` | `BINARY(16)` | NO | FK -> `users.id` |
| `episode_id` | `BINARY(16)` | NO | FK -> `episodes.id` |
| `progress_pct` | `DECIMAL(5, 4)`| NO | 0.0000 to 1.0000 |
| `last_second` | `INT` | NO | Resumable position in seconds |
| `is_completed` | `TINYINT(1)` | NO | 1 if completed (>90%) |
| `updated_at` | `DATETIME(3)` | NO | High-frequency update timestamp |
Unique index on (`user_id`, `episode_id`).

#### `watch_history`
- `id` (PK), `user_id` (FK), `episode_id` (FK), `session_id` (VARCHAR(64)), `started_at` (DATETIME(3)), `ended_at` (DATETIME(3)), `seconds_watched` (INT), `device_type` (`MOBILE`, `DESKTOP`, `TABLET`). Append-only session log.

#### `user_choices`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `user_id` | `BINARY(16)` | NO | FK -> `users.id` |
| `choice_id` | `BINARY(16)` | NO | FK -> `choices.id` |
| `option_id` | `BINARY(16)` | NO | FK -> `choice_options.id` |
| `story_version_id`| `BINARY(16)`| NO | FK -> `story_versions.id` (preserves historical continuity) |
| `created_at` | `DATETIME(3)` | NO | Selection timestamp |
Unique index on (`user_id`, `choice_id`, `story_version_id`).

#### `votes`, `predictions`, `follows`
- `votes`: (`id`, `user_id`, `story_id`, `choice_id`, `option_key`, `created_at`).
- `predictions`: (`id`, `story_id`, `question`, `reveal_episode_id`, `status` [`OPEN`, `RESOLVED`, `CANCELLED`], `winning_option_id`, `closes_at`).
- `user_predictions`: (`id`, `user_id`, `prediction_id`, `option_id`, `is_correct` [TINYINT], `xp_awarded` [INT], `created_at`).
- `follows`: (`user_id`, `target_type` [`CREATOR`, `CHARACTER`, `STORY`], `target_id`, `created_at` - Composite PK).

#### `xp_ledger` & `badges`
- `xp_ledger`: (`id`, `user_id`, `action_code` [`WATCH_EPISODE`, `VOTE`, `CHOICE`, `FOLLOW`], `amount` [INT], `metadata_json` [JSON], `created_at`).
- `badges`: (`id`, `code` [VARCHAR(50) UNIQUE], `title`, `description`, `icon_url`, `xp_threshold`).
- `user_badges`: (`user_id`, `badge_id`, `unlocked_at` - Composite PK).

---

### 2.6 Monetisation Domain

#### `subscription_plans`
- `id` (PK), `code` (`MONTHLY`, `ANNUAL`, `LIFETIME`), `name`, `price_amount` (`DECIMAL(12,2)`), `currency` (`CHAR(3)` DEFAULT `'INR'`), `interval` (`MONTH`, `YEAR`, `ONCE`), `is_active` (`TINYINT(1)`).

#### `subscriptions`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `user_id` | `BINARY(16)` | NO | FK -> `users.id` |
| `plan_id` | `BINARY(16)` | NO | FK -> `subscription_plans.id` |
| `status` | `VARCHAR(32)` | NO | `TRIAL`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED` |
| `external_sub_id`| `VARCHAR(255)`| YES | Stripe / Payment Gateway ID |
| `current_period_start`| `DATETIME(3)`| NO | Period start |
| `current_period_end`| `DATETIME(3)`| NO | Period end |
| `cancelled_at` | `DATETIME(3)` | YES | Cancellation timestamp |
| `created_at` | `DATETIME(3)` | NO | Creation timestamp |
| `updated_at` | `DATETIME(3)` | NO | Update timestamp |

#### `entitlements`
- `id` (PK), `user_id` (FK), `entitlement_code` (`VIP_ACCESS`), `source` (`SUBSCRIPTION`, `PROMO`, `LIFETIME`), `expires_at` (DATETIME(3) NULL), `is_active` (TINYINT(1)).

---

### 2.7 Story Intelligence & Story Lab Domain

- `story_signals` (`id`, `story_id`, `signal_type` [`DROP_OFF`, `CHOICE_DOMINANCE`, `VIRAL_SHARE`], `confidence_score` [DECIMAL(4,3)], `metrics_json` [JSON], `detected_at`).
- `story_insights` (`id`, `story_id`, `title`, `summary`, `status` [`NEW`, `REVIEWED`, `APPLIED`, `DISMISSED`], `created_at`).
- `content_opportunities` (`id`, `title`, `genre`, `target_audience`, `evidence_json`, `priority_score`, `created_at`).
- `story_experiments` (`id`, `story_id`, `name`, `hypothesis`, `status` [`DRAFT`, `RUNNING`, `CONCLUDED`], `started_at`, `concluded_at`).
- `experiment_variants` (`id`, `experiment_id`, `variant_key` [`A`, `B`], `version_id` [FK -> `story_versions.id`], `traffic_allocation_pct` [INT]).

---

### 2.8 Governance Domain

#### `audit_logs`
| Column | Type | Nullable | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `BINARY(16)` | NO | Primary Key (ULID) |
| `actor_user_id`| `BINARY(16)` | NO | FK -> `users.id` |
| `action` | `VARCHAR(100)` | NO | e.g. `'STORY:PUBLISH'`, `'CREATOR:VERIFY'` |
| `resource_type`| `VARCHAR(50)` | NO | e.g. `'story'`, `'creator'`, `'subscription'` |
| `resource_id` | `BINARY(16)` | NO | Target entity ID |
| `ip_address` | `VARCHAR(45)` | YES | IPv4 / IPv6 of actor |
| `user_agent` | `VARCHAR(500)` | YES | Client user agent |
| `changes_json` | `JSON` | YES | Diff snapshot `{ before: {...}, after: {...} }` |
| `created_at` | `DATETIME(3)` | NO | Tamper-evident append timestamp |
