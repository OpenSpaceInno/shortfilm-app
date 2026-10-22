# 05. SHORTREEL — ENTITY RELATIONSHIP (ER) MODEL

> **Document ID:** SR-ARCH-05  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Complete Core Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o| profiles : "has profile"
    users ||--o| creators : "may become"
    users ||--o{ user_roles : "assigned"
    roles ||--o{ user_roles : "contains"
    roles ||--o{ role_permissions : "grants"
    permissions ||--o{ role_permissions : "includes"
    
    users ||--o{ subscriptions : "purchases"
    subscription_plans ||--o{ subscriptions : "defines"
    users ||--o{ entitlements : "holds"
    
    creators ||--o{ stories : "authors"
    stories ||--o{ seasons : "contains"
    seasons ||--o{ episodes : "structures"
    episodes ||--o| videos : "streams via"
    
    stories ||--o{ characters : "features"
    stories ||--o{ story_genres : "categorized as"
    genres ||--o{ story_genres : "applies to"
    
    stories ||--o{ story_versions : "versions"
    story_versions ||--o{ story_nodes : "branches into"
    story_nodes ||--o{ choices : "presents"
    choices ||--o{ choice_options : "offers"
    choice_options ||--o| story_nodes : "routes to destination"
    
    users ||--o{ watch_progress : "tracks current"
    episodes ||--o{ watch_progress : "progress on"
    users ||--o{ watch_history : "logs session"
    episodes ||--o{ watch_history : "viewed in"
    
    users ||--o{ user_choices : "selects"
    choices ||--o{ user_choices : "evaluated in"
    choice_options ||--o{ user_choices : "picked"
    story_versions ||--o{ user_choices : "anchored to"
    
    users ||--o{ votes : "casts"
    choices ||--o{ votes : "voted in"
    
    users ||--o{ user_predictions : "wagers"
    predictions ||--o{ user_predictions : "answers"
    
    users ||--o{ follows : "subscribes"
    users ||--o{ xp_ledger : "accumulates"
    users ||--o{ user_badges : "earns"
    badges ||--o{ user_badges : "awarded"
    
    users ||--o{ notifications : "receives"
    
    stories ||--o{ story_signals : "generates"
    stories ||--o{ story_insights : "synthesizes"
    stories ||--o{ story_experiments : "tests"
    story_experiments ||--o{ experiment_variants : "splits traffic"
```

---

## 2. Interactive Narrative Graph Sub-Model

The interactive story engine represents a deterministic directed graph embedded directly within MySQL tables:

```mermaid
graph TD
    SV[StoryVersion: v1 Published] --> SN_Root[StoryNode: Root Episode 1]
    SN_Root --> C1[Choice: Unlock the Phone?]
    C1 --> |Option A: Open Phone| CO_A[ChoiceOption A]
    C1 --> |Option B: Leave Phone| CO_B[ChoiceOption B]
    
    CO_A --> SN_BranchA[StoryNode: Path A Episode 2 - Alleyway]
    CO_B --> SN_BranchB[StoryNode: Path B Episode 2 - Train Station]
    
    SN_BranchA --> C2[Choice: Trust Arjun?]
    C2 --> |Option A: Trust| CO_A2[ChoiceOption A]
    C2 --> |Option B: Lie| CO_B2[ChoiceOption B]
    
    CO_A2 --> SN_Ending1[StoryNode: Episode 3 - Safe House Ending]
    CO_B2 --> SN_Ending2[StoryNode: Episode 3 - Trap Ending]
    
    subgraph "Historical Immutability Anchor"
        UC[UserChoice: User 102] -.-> |Anchored To| SV
        UC -.-> |Selected| CO_A
    end
```

---

## 3. Many-to-Many Relationships & Junction Entities

| Entity A | Entity B | Conceptual Relation | Junction Table in MySQL | Foreign Key Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `roles` | Users have multiple roles | `user_roles` | `user_id` FK -> `users(id)`<br>`role_id` FK -> `roles(id)` |
| `roles` | `permissions` | Roles grant multiple permissions | `role_permissions` | `role_id` FK -> `roles(id)`<br>`permission_id` FK -> `permissions(id)` |
| `stories` | `genres` | Stories belong to multiple genres | `story_genres` | `story_id` FK -> `stories(id)`<br>`genre_id` FK -> `genres(id)` |
| `stories` | `tags` | Stories have multiple search tags | `story_tags` | `story_id` FK -> `stories(id)`<br>`tag_id` FK -> `tags(id)` |
| `users` | `badges` | Users unlock multiple achievements | `user_badges` | `user_id` FK -> `users(id)`<br>`badge_id` FK -> `badges(id)` |
| `users` | `targets` (Creator, Story, Character)| Users follow entities polymorphically | `follows` | `user_id` FK -> `users(id)`<br>`target_type` + `target_id` index |

---

## 4. Referential Integrity Rules

1. **Delete Cascades:**
   - Deleting a `StoryVersion` (in draft only) cascades to its `StoryNodes`, `Choices`, and `ChoiceOptions`.
   - Deleting a `User` cascades to `Profiles`, `UserRoles`, and `Follows`.
2. **Delete Restrictions:**
   - A `Story` cannot be deleted if active `Subscriptions`, `WatchProgress`, or `PublishedStoryVersions` reference it (`ON DELETE RESTRICT`). Soft deletion (`deleted_at`) is mandatory.
   - An `Episode` cannot be deleted if referenced by a `Video` or active `StoryNode`.
3. **Immutability Enforcement:**
   - A `StoryVersion` in status `PUBLISHED` disallows updates to `story_nodes` or `choices` via database triggers or application service guards.
