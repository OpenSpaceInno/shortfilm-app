# 07. SHORTREEL — INTERACTIVE STORY ENGINE

> **Document:** `07_INTERACTIVE_STORY_ENGINE.md`  
> **Status:** FROZEN  
> **Reference:** `docs/architecture/10_INTERACTIVE_STORY_ENGINE.md`, `11_STORY_VERSIONING.md`  

---

## 1. Data Model Hierarchy

```
Story
  └── StoryVersion (immutable once PUBLISHED)
        └── StoryNode (DAG vertices)
              └── Choice (one per CHOICE_POINT node)
                    └── ChoiceOption (2 per Choice, each points to a destination StoryNode)
```

Every `StoryNode` maps to an `Episode` which has a `Video`. The graph is a **Directed Acyclic Graph (DAG)** — no cycles, every path terminates at a node of type `ENDING`.

---

## 2. Version Lifecycle & Immutability

```
DRAFT ──> IN_REVIEW ──> APPROVED ──> PUBLISHED ──> ARCHIVED
```

**Critical Rules:**
- Once a `StoryVersion` is `PUBLISHED`, the database record is immutable.
- No UPDATE on `story_versions`, `story_nodes`, `choices`, or `choice_options` is permitted for PUBLISHED versions.
- This is enforced by:
  1. Application-layer guard: `PublishedVersionGuard` blocks any write to a published version.
  2. Database: `published_at` timestamp is set once and never changed.
- A `graph_snapshot` (JSON) is written atomically at publish time, providing a denormalized copy of the entire DAG for fast retrieval.
- Viewers' progress and choices are anchored to their `story_version_id`.

---

## 3. Choice Resolution Algorithm (ACID Transaction)

```
RECEIVE: POST /interactive/choices
  { choiceId, choiceOptionId, storyVersionId }

VALIDATE:
  1. Load choice from DB — verify it belongs to the viewer's storyVersionId
  2. Verify choiceOptionId is a valid option for this choice
  3. Verify voting_ends_at has NOT passed (or is null for individual choices)
  4. Verify no existing user_choice for (user_id, choice_id) — prevent duplicates

BEGIN TRANSACTION:
  INSERT INTO user_choices (id, user_id, choice_id, choice_option_id, story_version_id, ...)
  INSERT INTO xp_ledger (id, user_id, action='CHOICE_MADE', points=50, ...)
  UPDATE choice_options SET vote_count = vote_count + 1 WHERE id = choiceOptionId

COMMIT

POST-TRANSACTION (async, non-blocking):
  - Emit CHOICE_SELECTED analytics event to Redis Stream
  - Check if any badges should be unlocked (streak, milestone)

RETURN:
  {
    userChoice: { id, choiceOptionId, createdAt },
    destinationNode: {
      id, episodeId, nodeType,
      playbackUrl: <signed Cloudflare Stream HLS URL>,
      hasChoice: boolean
    },
    xpAwarded: 50
  }
```

---

## 4. Graph Validation at Publish Time

Before transitioning a StoryVersion from `APPROVED` to `PUBLISHED`, validate:

1. **DAG Cycle Check:** Perform DFS traversal from root node. If a node is visited twice on a single path → reject with `STORY_GRAPH_CYCLE_DETECTED`.
2. **Reachability Check:** Every node must be reachable from the root node.
3. **Ending Check:** Every leaf node (no outbound choices) must have `node_type = 'ENDING'`. Nodes with choices must have valid destination nodes.
4. **Video Readiness:** All episodes/videos in the graph must have status `READY`.
5. **Root Node:** Exactly one `is_root = TRUE` node must exist.

---

## 5. Community Voting vs. Individual Choice

| Concept | Entity | Behavior |
| :--- | :--- | :--- |
| **Individual Branch Choice** | `user_choices` | Each viewer picks their own path. Stored permanently. |
| **Community Vote** | `votes` | All viewers vote on a collective outcome. Timed window. The majority outcome becomes a community-canon result. |

Community votes are a separate engagement mechanic, not the same as individual branching. A community vote result may influence Story Lab signals but does not override individual user journeys.

---

## 6. Fallback Behavior

When a choice voting window closes before a user has made a selection:
- Use `choice.fallback_option_id` to auto-select the majority-voted (or default) option.
- Record the auto-selection in `user_choices` with a `is_fallback = TRUE` flag.
- No XP awarded for fallback auto-selections.

---

## 7. Story Engine Invariant Tests (Must Pass)

| Test ID | Scenario | Expected |
| :--- | :--- | :--- |
| ENG-001 | Valid choice on open window | Choice saved, XP awarded, destination node returned |
| ENG-002 | Duplicate choice submission | Returns existing choice (idempotent, no duplicate XP) |
| ENG-003 | Choice after window closed | Returns `VOTING_WINDOW_CLOSED` error |
| ENG-004 | Invalid destination node | Returns `DESTINATION_NODE_INVALID` error |
| ENG-005 | Access DRAFT version as consumer | Returns `403 STORY_VERSION_NOT_PUBLISHED` |
| ENG-006 | Access ARCHIVED version | Read-only playback allowed, no new choice writes |
| ENG-007 | Graph with cycle | Publish rejected with `STORY_GRAPH_CYCLE_DETECTED` |
| ENG-008 | Graph with dead-end (non-ENDING node) | Publish rejected |
| ENG-009 | Video not READY at publish time | Publish rejected |
| ENG-010 | Concurrent choice submission (race) | Only one succeeds due to UNIQUE KEY; second returns existing |
