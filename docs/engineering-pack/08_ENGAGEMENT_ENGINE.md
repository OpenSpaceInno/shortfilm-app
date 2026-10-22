# 08. SHORTREEL — ENGAGEMENT ENGINE

> **Document:** `08_ENGAGEMENT_ENGINE.md`  
> **Status:** FROZEN  
> **Reference:** `docs/architecture/12_ENGAGEMENT_ENGINE.md`  

---

## 1. Core Principle: Transactional State vs. Analytics Events

```
UserChoice (entity in MySQL)    ≠    CHOICE_SELECTED (analytics event in Redis Stream)
WatchProgress (mutable MySQL)   ≠    VIDEO_STARTED (analytics event)
```

Transactional entities are the system of record. Analytics events are decoupled asynchronous signals.

---

## 2. Watch Progress

**Table:** `watch_progress`  
**Semantics:** One row per (user, episode). UPSERT on every progress sync.

- Frontend sends progress sync every 30 seconds during playback.
- Fields: `user_id`, `episode_id`, `progress_seconds`, `completed`.
- When `completed = true` and `watch_history` does not already have a record for this (user, episode, version), insert into `watch_history`.
- This is an UPSERT — the endpoint is idempotent.

---

## 3. Watch History

**Table:** `watch_history`  
**Semantics:** Append-only log. One row per completed node viewing per user.

Never update or delete watch history rows outside of retention policy jobs.

---

## 4. XP Ledger & Gamification

**Table:** `xp_ledger`  
**Semantics:** Append-only credit log. Never negative entries in this table.

XP Award Rules:
| Action | XP Awarded |
| :--- | :--- |
| Episode Completed | 100 XP |
| Choice Made | 50 XP |
| Prediction Created | 30 XP |
| Vote Cast | 20 XP |
| Daily Streak (day 2+) | 25 XP × streak_multiplier |
| Share Story | 15 XP |

Total XP is computed as `SELECT SUM(points) FROM xp_ledger WHERE user_id = ?`.

---

## 5. Streak Tracking

- A streak is maintained as a user attribute (stored in `user_profiles.metadata` JSON or a dedicated `user_streaks` table — Claude to decide and document in ADR).
- Streak breaks if no engagement in 24 hours (UTC midnight boundary).
- Streak milestones trigger badge unlocks.

---

## 6. Badges

**Tables:** `badges` (definitions), `user_badges` (earned records)

Badge unlock evaluation runs as a BullMQ job after XP-earning events:
1. Load user's current XP and streak.
2. Load already-earned badge IDs for user.
3. Evaluate each unearned badge's unlock criteria.
4. Insert new `user_badges` records and send notification for each.

---

## 7. Votes & Predictions

**Votes:**
- Community-level mechanics with a `voting_ends_at` window.
- Each user can vote once per `choice_id` (if voting is community-mode).
- Vote counts are denormalized on `choice_options.vote_count`.

**Predictions:**
- User predicts a future story outcome before it happens.
- Outcome resolved by admin when the plot plays out.
- Correct predictions award XP.

---

## 8. Follows & Shares

**Follows:**
- A `follows` junction table: `(follower_id, followable_type, followable_id)`.
- Followable types: `CREATOR`, `CHARACTER`, `STORY`.
- Used for personalized feed ranking.

**Shares:**
- Track in `shares` table: `(user_id, episode_id, share_platform, created_at)`.
- Award XP on first share of an episode.
- Emit `STORY_SHARED` analytics event.

---

## 9. Notifications (Summary)

All XP awards, badge unlocks, new episode publications, vote results, and prediction resolutions trigger notifications. See `11_NOTIFICATION_SYSTEM.md` for full architecture.
