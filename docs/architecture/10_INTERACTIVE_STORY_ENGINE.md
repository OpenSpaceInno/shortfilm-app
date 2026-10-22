# 10. SHORTREEL — INTERACTIVE STORY ENGINE

> **Document ID:** SR-ARCH-10  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Engine Architecture & Graph Model

The Interactive Story Engine is the core narrative differentiator of ShortReel. It models interactive series as **Deterministic Directed Acyclic Graphs (DAGs)**.

```text
               ┌───────────────────────┐
               │     StoryVersion      │ (Immutable Published Graph)
               └───────────┬───────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │       Root Node       │ (Initial Episode Entry Point)
               └───────────┬───────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │    Decision Point     │ (Choice Moment at timestamp T)
               └───────────┬───────────┘
                           │
               ┌───────────┴───────────┐
               ▼                       ▼
       ┌───────────────┐       ┌───────────────┐
       │ Choice Option │       │ Choice Option │
       │       A       │       │       B       │
       └───────┬───────┘       └───────┬───────┘
               │                       │
               ▼                       ▼
       ┌───────────────┐       ┌───────────────┐
       │  Dest. Node A │       │  Dest. Node B │ (Continuation Episode/Scene)
       └───────┬───────┘       └───────┬───────┘
               │                       │
               ▼                       ▼
       ┌───────────────┐       ┌───────────────┐
       │   Ending 1    │       │   Ending 2    │ (Terminal Leaf Nodes)
       └───────────────┘       └───────────────┘
```

---

## 2. Graph Node & Choice Resolution

### 2.1 Node Traversal Protocol
1. **Entry:** Client requests playback entry via `GET /api/v1/interactive/stories/:slug/node/root`. The engine resolves the currently active `PUBLISHED` version of the story and returns the root `StoryNode` with associated video playback metadata.
2. **Choice Trigger:** When playback reaches `trigger_sec`, the client displays the interactive decision overlay.
3. **Choice Submission:** Client posts the selected option key to `POST /api/v1/interactive/choices`:
   ```json
   {
     "storyId": "01HTXYZ...",
     "choiceId": "01HTCHOICE...",
     "optionKey": "A"
   }
   ```
4. **Validation Pipeline:**
   - **Version Lock Check:** Ensures the choice belongs to the active `PUBLISHED` `StoryVersion`.
   - **Option Existence Check:** Verifies `optionKey` is an allowed option on `choiceId`.
   - **Window Check:** If `voting_type = 'COMMUNITY_VOTE'`, verifies `NOW() <= window_closes_at`.
   - **Idempotency / Single-Vote Guard:** Queries `user_choices` with `(user_id, choice_id, story_version_id)`. If an entry exists, returns the previously recorded choice without duplicate XP or vote inflation.
5. **Destination Resolution:**
   - For `INDIVIDUAL_BRANCH`: Instantly resolves `destination_node_id` from the selected `choice_option`.
   - For `COMMUNITY_VOTE`: If window is closed, resolves the winning option's destination; if window is open, returns community voting telemetry and queues the user's progress until window resolution.
6. **Atomic Transaction:**
   ```sql
   START TRANSACTION;
   -- 1. Insert user choice record
   INSERT INTO user_choices (id, user_id, choice_id, option_id, story_version_id, created_at)
   VALUES (:ulid, :userId, :choiceId, :optionId, :versionId, NOW(3));
   
   -- 2. Increment atomic vote tally on option
   UPDATE choice_options SET vote_count = vote_count + 1 WHERE id = :optionId;
   
   -- 3. Update user watch progress pointer to destination node
   INSERT INTO watch_progress (id, user_id, episode_id, progress_pct, last_second, updated_at)
   VALUES (:wpId, :userId, :destinationEpId, 0.0, 0, NOW(3))
   ON DUPLICATE KEY UPDATE progress_pct = 0.0, last_second = 0, updated_at = NOW(3);
   
   COMMIT;
   ```
7. **Response Payload:** The engine responds with the destination node, video streaming credentials, and narrative metadata.

---

## 3. High-Concurrency Voting & Aggregation

For popular episodes with massive concurrent viewers (e.g. 100,000 users voting within a 60-second window):
- **Redis In-Memory Buffering:** Votes are written to Redis using an atomic HyperLogLog or Redis counter:
  `HINCRBY choice:votes:<choiceId> <optionId> 1`
- **Asynchronous Sync Worker:** A BullMQ background worker synchronizes aggregated tallies from Redis to MySQL `choice_options.vote_count` every 5 seconds, offloading row locks from the transactional database.

---

## 4. Fallback Handling & Resilience

1. **Missing Destination (Dead End):** If an authored draft node inadvertently points to a null or corrupt destination, the engine triggers an automatic fallback:
   - Returns the default chronological next episode in the season.
   - Logs a high-priority warning to Story Lab and Admin alerts.
2. **Voting Window Expiration:** If a user submits a vote after a community poll has closed, the response safely returns the final community winning path with an informative banner.
3. **Graph Integrity Checks on Publish:** Before any `StoryVersion` can transition from `IN_REVIEW` to `PUBLISHED`, an automated graph validator runs:
   - Asserts the graph is a connected DAG (no orphan nodes, no unreachable sub-branches).
   - Asserts all choice options resolve to a valid destination node or terminal ending.
   - Rejects publication if any broken links are detected.
