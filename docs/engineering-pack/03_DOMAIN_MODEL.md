# 03. SHORTREEL — DOMAIN MODEL v1

> **Document:** `03_DOMAIN_MODEL.md`  
> **Status:** FROZEN (Phase 3)  
> **Source:** Domain Model v1 ratified in Phase 3  

---

## Domain Boundary Overview

```
IDENTITY          CONTENT           INTERACTIVE
User              Story             StoryVersion
Profile           Season            StoryNode
Role              Episode           Choice
Permission        Video             ChoiceOption
UserRole          Genre             StoryBranch
                  Language
                  Tag               CREATOR
                  Character         Creator
                                    CreatorProfile
ENGAGEMENT                          CreatorApplication
WatchHistory      MONETISATION      CreatorVerification
WatchProgress     SubscriptionPlan  CreatorSubmission
UserChoice        Subscription      CreatorNote
Vote              Entitlement       CreatorActivity
Prediction        SubscriptionEvent CreatorEarning
Follow
XP               ANALYTICS         INTELLIGENCE
Badge            AnalyticsEvent    StorySignal
UserBadge                          StoryInsight
Notification      BUSINESS          ContentOpportunity
Share             BusinessMetric    StoryExperiment
                  BusinessSignal    ExperimentVariant
GOVERNANCE        BusinessReport    ExperimentMetric
AuditLog                           CharacterSignal
                                   CreatorSignal
                                   InteractiveSignal
```

---

## Identity Domain

### User
The primary account entity for all platform participants.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | ULID (BINARY 16) | Primary key |
| email | VARCHAR(255) | Unique, indexed |
| phone | VARCHAR(20) | Optional, indexed |
| password_hash | VARCHAR(255) | Argon2id |
| display_name | VARCHAR(100) | Public name |
| avatar_url | VARCHAR(500) | Object storage URL |
| status | ENUM | ACTIVE, SUSPENDED, DELETED |
| email_verified_at | DATETIME | Null if unverified |
| last_login_at | DATETIME | UTC |
| created_at | DATETIME | UTC |
| updated_at | DATETIME | UTC |
| deleted_at | DATETIME | Soft delete |

### Profile
Extended user profile attributes.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | ULID | PK |
| user_id | BINARY(16) | FK → users.id |
| bio | TEXT | Optional |
| language_preference | VARCHAR(10) | Default 'en' |
| genre_preferences | JSON | Array of genre IDs |
| notification_preferences | JSON | Channel preferences |

### Role
Platform roles for RBAC.

Values: `SUPER_ADMIN`, `CONTENT_ADMIN`, `EDITOR`, `CREATOR_MANAGER`, `ANALYST`, `FINANCE`, `CREATOR`, `USER`

### Permission
Granular action permissions (18 total).

Examples: `story:publish`, `creator:verify`, `analytics:read`, `finance:approve_payout`

### UserRole
Junction: user → role (many-to-many with audit fields).

---

## Content Domain

### Story
Top-level content unit representing an interactive short series.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | ULID | PK |
| creator_id | BINARY(16) | FK → creators.id |
| title | VARCHAR(255) | |
| synopsis | TEXT | |
| premise | TEXT | Short elevator pitch |
| status | ENUM | DRAFT, SUBMITTED, APPROVED, PUBLISHED, ARCHIVED |
| language | VARCHAR(10) | Primary language |
| thumbnail_url | VARCHAR(500) | |
| poster_url | VARCHAR(500) | |
| target_audience | VARCHAR(50) | |
| content_rating | VARCHAR(20) | |
| view_count | BIGINT | Denormalized for feed ranking |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| published_at | DATETIME | Null if not yet published |
| deleted_at | DATETIME | Soft delete |

### Season
A story is divided into seasons (ordered grouping of episodes/nodes).

### Episode
A single viewable video unit within a season. Maps to a StoryNode in interactive stories.

### Video
The media asset backing an episode.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | ULID | PK |
| episode_id | BINARY(16) | FK → episodes.id |
| provider | VARCHAR(50) | 'CLOUDFLARE_STREAM' |
| provider_uid | VARCHAR(255) | Cloudflare Stream UID |
| status | ENUM | UPLOADING, PROCESSING, READY, FAILED |
| duration_seconds | INT | |
| width | INT | Expected: 1080 |
| height | INT | Expected: 1920 (9:16) |
| playback_url | VARCHAR(500) | HLS manifest URL |
| thumbnail_url | VARCHAR(500) | |
| created_at | DATETIME | |

### Genre, Language, Tag, Character
Metadata and classification entities. See database schema for full definition.

---

## Interactive Domain

### StoryVersion
An immutable snapshot of a story's complete interactive graph at a point in time.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | ULID | PK |
| story_id | BINARY(16) | FK → stories.id |
| version_number | INT | Increments with each new draft |
| status | ENUM | DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED |
| graph_snapshot | JSON | Full DAG snapshot (immutable post-publish) |
| published_at | DATETIME | Set once; never changed |
| archived_at | DATETIME | |

### StoryNode
A single narrative video unit within a StoryVersion graph.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | ULID | PK |
| story_version_id | BINARY(16) | FK → story_versions.id |
| episode_id | BINARY(16) | FK → episodes.id |
| node_type | ENUM | OPENING, STANDARD, CHOICE_POINT, ENDING |
| is_root | BOOLEAN | True for the first node |
| sequence_order | INT | Linear position hint |
| voting_ends_at | DATETIME | When choice window closes |
| fallback_option_id | BINARY(16) | FK → choice_options.id (for timed fallback) |

### Choice
A decision moment attached to a StoryNode.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | ULID | PK |
| story_node_id | BINARY(16) | FK → story_nodes.id |
| prompt | TEXT | The question shown to viewer |
| voting_opens_at | DATETIME | |
| voting_ends_at | DATETIME | |

### ChoiceOption
One of the available answers for a Choice.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | ULID | PK |
| choice_id | BINARY(16) | FK → choices.id |
| label | VARCHAR(255) | The visible option text |
| destination_node_id | BINARY(16) | FK → story_nodes.id |
| vote_count | INT | Denormalized counter |
| display_order | TINYINT | 1 or 2 |

---

## Creator Domain

### Creator
Platform creator account extending a User.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | ULID | PK |
| user_id | BINARY(16) | FK → users.id, UNIQUE |
| display_name | VARCHAR(100) | |
| bio | TEXT | |
| tier | ENUM | EMERGING, VERIFIED, EXCLUSIVE, PARTNER |
| status | ENUM | APPLIED, UNDER_REVIEW, APPROVED, VERIFIED, ACTIVE, SUSPENDED, REJECTED, DEACTIVATED |
| verified_at | DATETIME | |

### CreatorEarning
Monthly earnings record per creator.

| Field | Type | Notes |
| :--- | :--- | :--- |
| id | ULID | PK |
| creator_id | BINARY(16) | FK → creators.id |
| period_month | DATE | First day of earning month |
| gross_amount | DECIMAL(12,2) | Before platform fee |
| platform_fee | DECIMAL(12,2) | |
| tax_withheld | DECIMAL(12,2) | |
| net_payout | DECIMAL(12,2) | |
| status | ENUM | CALCULATED, PENDING_PAYOUT, PAID, HELD |

---

## Engagement Domain

### WatchProgress
Mutable resume pointer. One row per (user, episode) pair.

### WatchHistory
Append-only log of completed episodes / nodes.

### UserChoice
Permanent record of a viewer's branch decision.

Unique constraint: `(user_id, choice_id)` — one choice per user per decision point.

### XP Ledger
Append-only ledger of XP credit events (choice, completion, streak).

### Badge + UserBadge
Achievement definitions and user-specific unlocks.

### Vote, Prediction, Follow, Share
Community engagement entities. See database schema.

### Notification
In-app, push, and email notification record.

---

## Monetisation Domain

### SubscriptionPlan
Defines available plans (FREE, BASIC, PREMIUM) with pricing.

### Subscription
Active subscription record per user. One active subscription per user.

State machine: `TRIAL` → `ACTIVE` → `PAST_DUE` → `CANCELLED` / `EXPIRED`

### Entitlement
Content access rights derived from subscription. Checked before playback.

### SubscriptionEvent
Append-only webhook event log for payment processor callbacks.

---

## Analytics Domain

### AnalyticsEvent
High-volume telemetry event. Processed asynchronously via Redis Streams.

Events: `VIDEO_STARTED`, `VIDEO_25_PERCENT`, `VIDEO_50_PERCENT`, `VIDEO_COMPLETED`, `CHOICE_SHOWN`, `CHOICE_SELECTED`, `VOTE_CAST`, `PREDICTION_CREATED`, `CHARACTER_FOLLOWED`, `CREATOR_FOLLOWED`, `STORY_SHARED`, `EPISODE_COMPLETED`, `SUBSCRIPTION_STARTED`, `SUBSCRIPTION_CANCELLED`

---

## Intelligence Domain (Story Lab)

| Entity | Purpose |
| :--- | :--- |
| StorySignal | Quantified behavioral pattern for a story |
| CharacterSignal | Character affinity and breakout detection |
| InteractiveSignal | Choice friction and branch imbalance metrics |
| CreatorSignal | Creator performance patterns |
| StoryInsight | Human-readable narrative commentary derived from signals |
| ContentOpportunity | Actionable editorial proposal |
| StoryExperiment | A/B test configuration |
| ExperimentVariant | Variant A vs B definition |
| ExperimentMetric | Measurement results |

---

## Business Domain

| Entity | Purpose |
| :--- | :--- |
| BusinessMetric | Pre-aggregated KPI time-series (DAU, MRR, Churn) |
| BusinessSignal | Executive alert on anomalous metric movement |
| BusinessReport | Immutable end-of-month financial snapshot |

---

## Governance Domain

### AuditLog
Immutable record of every privileged action.

| Field | Notes |
| :--- | :--- |
| actor_id | Who performed the action |
| actor_role | Role at time of action |
| action | e.g. `STORY_PUBLISHED`, `CREATOR_VERIFIED` |
| entity_type | e.g. `Story`, `Creator` |
| entity_id | Target entity |
| previous_state | JSON snapshot before change |
| new_state | JSON snapshot after change |
| ip_address | Client IP |
| created_at | UTC timestamp |
