# 12. SHORTREEL — ENGAGEMENT & WATCH PROGRESS ENGINE

> **Document ID:** SR-ARCH-12  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Engine Scope & Core Mechanics

The Engagement Engine powers consumer interaction, viewing retention, and gamified viewer motivation:
1. **Playback Tracking & Resume:** Instant resumable state across mobile PWA and desktop.
2. **Interactive Choices & Narrative Stakes:** Immediate branch execution with instant XP feedback.
3. **Community Voting & Narrative Predictions:** Time-gated audience polls and outcome predictions.
4. **Gamification & Social Graph:** XP progression, streak tracking, badge unlocks, and character follows.

---

## 2. Watch State Separation: Progress vs. History

A fundamental architectural rule of ShortReel is the clean decoupling of **authoritative current playback position** from **historical viewing audit logs**:

```text
                                 Client Video Player
                                         │
                  POST /api/v1/watch/progress (Every 5-10s)
                                         │
                                         ▼
                                 Engagement Service
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
         `watch_progress`                                `watch_history`
     (Mutable Current Pointer)                       (Append-Only Session Log)
  - Key: (user_id, episode_id)                    - Immutable session record
  - Stores: last_second, progress_pct             - Stores: session_id, duration, device
  - Powers: "Continue Watching" shelf             - Powers: Viewing analytics, watch time
```

### 2.1 `watch_progress` (Current State)
- **Granularity:** One record per `(user_id, episode_id)`.
- **Update Frequency:** Throttled to every 5–10 seconds from the client video player.
- **Completion Rule:** When `progress_pct >= 0.90` (or user reaches within 5 seconds of episode end), `is_completed = 1`.
- **Query Optimization:** Indexed on `(user_id, is_completed, updated_at DESC)` for sub-millisecond retrieval of the user's home screen "Continue Watching" carousel.

### 2.2 `watch_history` (Historical Ledger)
- **Granularity:** One record per distinct viewing session.
- **Purpose:** Retention tracking, user watch-time auditing, creator royalty metrics.
- **Write Path:** Buffered asynchronously through Redis to prevent database lock contention under peak traffic spikes.

---

## 3. Gamification & Progression Model

Viewer actions award Experience Points (XP) according to deterministic platform rules:

| Action Code | Trigger Event | Base XP Awarded | Idempotency Rule |
| :--- | :--- | :--- | :--- |
| `WATCH_EPISODE` | Stream reaches 10 seconds of episode | **10 XP** | Once per episode per user |
| `COMPLETE_EPISODE` | Episode completion (`progress_pct >= 0.90`) | **25 XP** | Once per episode per user |
| `VOTE` | Community poll vote cast | **30 XP** | Once per choice point |
| `PREDICTION` | Narrative outcome prediction placed | **20 XP** | Once per prediction window |
| `PREDICTION_CORRECT`| Episode resolves prediction as correct | **50 XP** | Once per resolved prediction |
| `FOLLOW_CHARACTER` | User follows character profile | **15 XP** | Once per character |
| `LIKE_EPISODE` | Viewer likes episode in right rail | **10 XP** | Once per episode |
| `SHARE_STORY` | Verified story link shared | **20 XP** | Max 3 times per calendar day |
| `COMPLETE_SERIES` | All season episodes completed | **50 XP** | Once per season |

### 3.1 Badge Unlock Pipeline
- After any XP update, the `GamificationService` evaluates earned badge criteria (e.g. 7-day watch streak, 3 correct predictions, 5 followed characters).
- When a threshold is met, the system inserts into `user_badges` and publishes `BADGE_UNLOCKED`, triggering an in-app celebratory modal and push notification.
