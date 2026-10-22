# 11. SHORTREEL — STORY VERSIONING & CONTINUITY ARCHITECTURE

> **Document ID:** SR-ARCH-11  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Version Lifecycle State Machine

To support ongoing narrative expansion, seasonal updates, and editorial curation without breaking existing audience journeys, ShortReel implements strict **Story Versioning**.

```text
 ┌─────────┐       Submit        ┌───────────┐       Approve       ┌────────────┐
 │  DRAFT  │ ──────────────────> │ IN_REVIEW │ ──────────────────> │  APPROVED  │
 └────┬────┘                     └─────┬─────┘                     └─────┬──────┘
      ▲                                │ Revision Requested              │ Publish
      │                                ▼                                 ▼
      └────────────────────────────────┘                           ┌────────────┐
                                                                   │ PUBLISHED  │ (IMMUTABLE)
                                                                   └─────┬──────┘
                                                                         │ Superseded by v(N+1)
                                                                         ▼
                                                                   ┌────────────┐
                                                                   │  ARCHIVED  │
                                                                   └────────────┘
```

### 1.1 State Definitions
- **`DRAFT`:** Fully editable by authoring creator. Nodes, choices, prompts, and media links can be added, mutated, or deleted. Cannot be streamed by general consumers.
- **`IN_REVIEW`:** Submitted to editorial queue. Creator editing is locked during editorial review.
- **`APPROVED`:** Editorial sign-off complete. Ready for scheduled publication.
- **`PUBLISHED`:** **STRICTLY IMMUTABLE.** General audience streams this version. Nodes and choices can never be modified.
- **`ARCHIVED`:** A historical version superseded by a newer published version. Retained permanently for viewer continuity and analytics history.

---

## 2. Immutability Enforcement & Graph Snapshotting

When a story version transitions to `PUBLISHED`:
1. **Database Lock:** `published_at` timestamp is written. An application interceptor and database trigger disallow any `UPDATE` or `DELETE` on `story_nodes` or `choices` where `version_id` equals the published ID.
2. **Canonical Graph Snapshot (`snapshot_json`):**
   - The entire graph (all nodes, choice prompts, options, coordinates, and episode bindings) is serialized into a standalone JSON document stored in `story_versions.snapshot_json`.
   - This guarantees that even in disaster recovery scenarios or major schema migrations, the exact authored structure remains readable and reproducible for eternity.

---

## 3. Viewer Historical Continuity

A critical challenge in interactive storytelling is preventing viewer journeys from breaking when a creator publishes edits to a story.

### 3.1 Version Anchoring
- Every user choice record (`user_choices`) explicitly stores `story_version_id`:
  ```sql
  user_choices (
    id,
    user_id,
    story_version_id, -- Anchors viewer journey to the exact version they played
    choice_id,
    option_id,
    created_at
  )
  ```
- When a viewer opens an interactive episode they previously engaged with, the engine resolves their existing path from their anchored `story_version_id`.

### 3.2 Transitioning to Newer Versions
- If a user starts a series on `Version 1`, and `Version 2` is subsequently published:
  1. **Non-Breaking Updates:** If the creator merely added new branch endings beyond Episode 5, the viewer seamlessly accesses the new nodes.
  2. **Breaking Story Overhauls:** If root nodes or earlier forks were fundamentally restructured in Version 2, the client displays a non-intrusive prompt:
     `"Story Updated: Creator has released an enhanced Director's Cut! [Restart on New Version] or [Finish Current Run]"`
  3. Viewer historical badges and XP earned on Version 1 are permanently retained and never revoked.
