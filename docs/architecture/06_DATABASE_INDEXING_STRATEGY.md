# 06. SHORTREEL — DATABASE INDEXING STRATEGY

> **Document ID:** SR-ARCH-06  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  
> **Target:** MySQL 8.x InnoDB B-Tree & Full-Text Indexes  

---

## 1. Indexing Philosophy & Rules

1. **Covering Indexes for Read Hotspots:** For performance-critical consumer queries (e.g. Continue Watching, Feed Browsing, Stream Authentication), composite indexes are structured so MySQL can resolve the query directly from the B-Tree index without accessing the table data heap.
2. **Leftmost Prefix Optimization:** Multi-column indexes arrange equality filters first, range/sort columns second (e.g., `(user_id, status, created_at DESC)`).
3. **No Redundant Single-Column Indexes:** If a composite index begins with `(user_id, ...)`, an isolated index on `user_id` alone is not created.
4. **Foreign Key Indexing:** Every foreign key column has an index to prevent full table locks during parent updates or cascading deletes.

---

## 2. High-Frequency Index Specifications

| Table | Index Name | Columns | Type | Purpose / Query Optimization |
| :--- | :--- | :--- | :--- | :--- |
| **`users`** | `idx_users_email` | `(email)` | UNIQUE | User login lookups |
| **`profiles`** | `idx_profiles_handle` | `(handle)` | UNIQUE | User handle `@mention` searches |
| **`stories`** | `idx_stories_slug` | `(slug)` | UNIQUE | Public routing by slug |
| **`stories`** | `idx_stories_feed` | `(status, deleted_at, created_at DESC)` | COMPOSITE | Consumer homepage & trending catalog |
| **`stories`** | `ft_stories_search` | `(title, tagline, synopsis)` | FULLTEXT | Natural language catalog search |
| **`seasons`** | `idx_seasons_story_no`| `(story_id, number)` | UNIQUE | Season lookup in story |
| **`episodes`** | `idx_episodes_seq` | `(season_id, number)` | UNIQUE | Linear episode sequence retrieval |
| **`episodes`** | `idx_episodes_status`| `(status, is_premium)` | COMPOSITE | Filtering free vs VIP episodes |
| **`videos`** | `idx_videos_episode` | `(episode_id)` | UNIQUE | Video stream playback resolution |
| **`story_versions`** | `idx_versions_lookup`| `(story_id, status)` | COMPOSITE | Finding currently published version |
| **`story_nodes`** | `idx_nodes_version` | `(version_id, node_key)` | UNIQUE | Graph node resolution |
| **`choices`** | `idx_choices_node` | `(story_node_id, status)` | COMPOSITE | Choice resolution for player node |
| **`choice_options`** | `idx_options_choice` | `(choice_id, option_key)` | UNIQUE | Choice button rendering and voting |
| **`watch_progress`** | `idx_wp_user_ep` | `(user_id, episode_id)` | UNIQUE | Syncing playback pointer |
| **`watch_progress`** | `idx_wp_continue` | `(user_id, is_completed, updated_at DESC)` | COMPOSITE | **Continue Watching shelf** on home screen |
| **`watch_history`** | `idx_wh_user_time` | `(user_id, started_at DESC)` | COMPOSITE | User viewing history audit |
| **`user_choices`** | `idx_uc_user_node` | `(user_id, story_version_id, choice_id)` | UNIQUE | Checking if user already made choice |
| **`votes`** | `idx_votes_choice` | `(choice_id, option_key)` | COMPOSITE | Vote tallying and live result sharing |
| **`follows`** | `idx_follows_lookup` | `(user_id, target_type, target_id)` | UNIQUE | Follow status verification |
| **`follows`** | `idx_follows_counts` | `(target_type, target_id)` | COMPOSITE | Public follower count aggregation |
| **`subscriptions`** | `idx_sub_user_status`| `(user_id, status, current_period_end)` | COMPOSITE | **Instant VIP access check in watch player** |
| **`subscriptions`** | `idx_sub_external` | `(external_sub_id)` | UNIQUE | Stripe/Payment webhook idempotency |
| **`notifications`** | `idx_notif_unread` | `(user_id, is_read, created_at DESC)` | COMPOSITE | Unread notification bell indicator |
| **`creator_earnings`**| `idx_ce_creator_mo` | `(creator_id, period_month)` | COMPOSITE | Creator monthly payout dashboard |
| **`audit_logs`** | `idx_audit_resource` | `(resource_type, resource_id, created_at DESC)` | COMPOSITE | Entity change history audit trail |

---

## 3. Query Performance Guarantees

1. **VIP Entitlement Check:** Resolved in `<2ms` via index `idx_sub_user_status`.
2. **Continue Watching Query:**
   ```sql
   SELECT episode_id, progress_pct, last_second, updated_at 
   FROM watch_progress 
   WHERE user_id = :userId AND is_completed = 0 
   ORDER BY updated_at DESC 
   LIMIT 10;
   ```
   Resolved with **Index-Only Scan** using `idx_wp_continue`.
3. **Choice Duplication Guard:** Fast constraint check using `idx_uc_user_node` ensures atomic single-choice submissions.
