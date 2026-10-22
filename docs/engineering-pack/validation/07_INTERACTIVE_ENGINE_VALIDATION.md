# 07. SHORTREEL — INTERACTIVE ENGINE VALIDATION

> **Document:** `validation/07_INTERACTIVE_ENGINE_VALIDATION.md`  
> **Validation Status:** ✅ READY  

---

## Summary

The Interactive Story Engine is the most technically complex part of ShortReel and has been thoroughly specified. The DAG model, versioning strategy, choice resolution ACID guarantees, and invariant test suite are well-designed. No P0 issues. Two P2 observations.

---

## Story Graph Model Validation

```
Story
 └── StoryVersion (1..*) — one PUBLISHED at a time
       └── StoryNode (1..*) — is_root flag, node_type
             └── Choice (0..1) — only CHOICE_POINT nodes
                   └── ChoiceOption (2..2) — exactly 2
                         └── destination_node_id → StoryNode
```

**Validated:**
- ✅ One Story may have many StoryVersions
- ✅ Only one PUBLISHED version per Story at any time (UNIQUE enforced by app-level rule + version state machine)
- ✅ DRAFT versions allow editing; PUBLISHED versions are immutable
- ✅ `is_root = true` flags the entry node (exactly 1 per version — enforced by application)
- ✅ CHOICE_POINT nodes have exactly 1 Choice; other nodes have 0 Choices
- ✅ Each Choice has exactly 2 ChoiceOptions
- ✅ Each ChoiceOption has a `destination_node_id` pointing to a valid node in the same version

---

## "The Missing Phone" — Full Flow Validation

```
Admin
 ↓
Create Story (status=DRAFT)
 ↓
Create Season, Episodes (EP1..EP5B)
 ↓
Register Videos (each episode → video_id)
 ↓
Create StoryVersion (status=DRAFT)
 ↓
Create StoryNodes:
  N1 (EP1, is_root=true, type=OPENING)
  N2 (EP2, type=STANDARD)
  N3 (EP3, type=CHOICE_POINT)
  N4A (EP4A, type=STANDARD)
  N4B (EP4B, type=STANDARD)
  N5A (EP5A, type=ENDING)
  N5B (EP5B, type=ENDING)
 ↓
Create Choice on N3: "Confront or Follow?"
 ↓
Create ChoiceOption A: label="Confront" → destination=N4A
Create ChoiceOption B: label="Follow" → destination=N4B
 ↓
Node N4A links to N5A (implicit next_node_id)
Node N4B links to N5B (implicit next_node_id)
 ↓
Validate Graph:
  ✅ 1 root node
  ✅ No cycles (DFS check)
  ✅ No orphan nodes
  ✅ All destinations valid within version
  ✅ ENDING nodes have no outgoing choices
 ↓
Submit for Review (version status=IN_REVIEW)
 ↓
CONTENT_ADMIN approves → status=APPROVED
 ↓
Publish → status=PUBLISHED
  Story.status → PUBLISHED (if first published version)
 ↓
Consumer
 ↓
GET /stories/:id/graph → returns published DAG
 ↓
Watch EP1 → POST /engagement/progress {episodeId, progressPct, completed}
Watch EP2 → progress
Watch EP3 (CHOICE_POINT) → client displays choice options
 ↓
POST /interactive/choices {choiceId, choiceOptionId="A_Confront"}
  NestJS:
    ✅ Validate JWT (Auth0)
    ✅ Validate choiceId exists in published version
    ✅ Validate voting window open
    ✅ Check UNIQUE(user_id, choice_id) — no duplicate
    ✅ Atomic transaction:
       INSERT user_choices (user_id, choice_id, choice_option_id, selected_at)
       UPDATE choice_options SET vote_count = vote_count + 1 WHERE id = option_A_id
       INSERT xp_ledger (user_id, amount=10, reason=CHOICE_MADE)
    ✅ Resolve destination node: N4A
    ✅ Return { nextEpisodeId: ep4A_id, playbackUrl: signed_HLS_url }
 ↓
Watch EP4A
Watch EP5A (ENDING) → WatchHistory entry created
 ↓
Analytics event fired: choice_selected {user_id, story_id, choice_option_id}
```

**Flow validated end-to-end. All steps have corresponding API + DB operation.**

---

## Graph Invariant Tests (ENG-001..ENG-010)

| ID | Test | Expected |
| :--- | :--- | :--- |
| ENG-001 | User submits valid choice A | 200 + next episode node |
| ENG-002 | User submits same choice again (duplicate) | 200 idempotent — same existing choice returned |
| ENG-003 | Admin closes voting window, user submits | 409 VOTING_WINDOW_CLOSED |
| ENG-004 | User submits invalid choiceOptionId | 404 CHOICE_OPTION_NOT_FOUND |
| ENG-005 | FREE user attempts paid content | 403 SUBSCRIPTION_REQUIRED |
| ENG-006 | Publish graph with cycle (N3 → N4A → N3) | 422 GRAPH_CYCLE_DETECTED |
| ENG-007 | Publish graph with orphan node | 422 ORPHAN_NODE_DETECTED |
| ENG-008 | Publish graph with 0 root nodes | 422 MISSING_ROOT_NODE |
| ENG-009 | Publish graph with 2 root nodes | 422 MULTIPLE_ROOT_NODES |
| ENG-010 | Mutate a PUBLISHED StoryVersion's node | 409 IMMUTABLE_VERSION |

**All 10 invariants are defined, testable, and have corresponding error codes.** ✅

---

## P2 Observations

**P2-ENG-001:** `next_node_id` on STANDARD nodes. The spec defines automatic progression for non-choice nodes. This requires a `next_node_id` FK on `story_nodes` that is NULL for ENDING and CHOICE_POINT nodes. Confirm this column exists in DDL (checked: present in `04_DATABASE_SCHEMA.md` as `next_node_id BINARY(16) NULL`). ✅

**P2-ENG-002:** Replay behavior (user changes their choice) is not fully specified. If a user previously chose A and wants to switch to B (in a re-watch context), the `user_choices` UNIQUE constraint prevents re-insertion. Clarify: is re-watching with a different choice allowed? If yes, an UPDATE is needed instead of INSERT. Document this edge case before M10.

## Validation Status: ✅ READY
