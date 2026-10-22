# 18. SHORTREEL — STORY LAB ARCHITECTURE

> **Document ID:** SR-ARCH-18  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Executive Summary & Core Principle

The **Story Lab** is ShortReel's intelligent content optimization and narrative discovery engine. It translates raw viewer engagement and transactional choice decisions into actionable creative intelligence for creators, editors, and platform executives.

> [!IMPORTANT]
> **Strict Non-Autonomous Operational Rule**:
> Story Lab is an **assistive advisory and experimental platform**. It **NEVER** autonomously publishes, updates, deletes, or mutates production stories, nodes, or episodes without explicit, authenticated human approval (`CONTENT_ADMIN` or authorized `CREATOR`).

```text
┌────────────────────────┐      ┌─────────────────────────┐
│   Transactional Data   │      │    Analytics Events     │
│ (UserChoices, Ratings) │      │ (Drop-offs, Watch-time) │
└───────────┬────────────┘      └────────────┬────────────┘
            │                                │
            └───────────────┬────────────────┘
                            ▼
             ┌──────────────────────────────┐
             │ Signal Processing Pipeline   │ (Scheduled BullMQ Rollup)
             └──────────────┬───────────────┘
                            ▼
             ┌──────────────────────────────┐
             │      Aggregated Signals      │ (`story_signals`, `character_signals`)
             └──────────────┬───────────────┘
                            ▼
             ┌──────────────────────────────┐
             │    Insight Generation        │ (Algorithmic / AI-Assisted)
             └──────────────┬───────────────┘
                            ▼
             ┌──────────────────────────────┐
             │    Opportunity Discovery     │ (`content_opportunities`)
             └──────────────┬───────────────┘
                            ▼
             ┌──────────────────────────────┐
             │    HUMAN EDITORIAL REVIEW    │ ◄── STRICT GATEWAY (No autonomous edits)
             └──────────────┬───────────────┘
                            ▼
             ┌──────────────────────────────┐
             │  Story Lab Experiments (A/B) │ (`story_experiments`, `experiment_variants`)
             └──────────────┬───────────────┘
                            ▼
             ┌──────────────────────────────┐
             │     Impact Measurement       │ (Lift in retention, completion rate)
             └──────────────────────────────┘
```

---

## 2. Signal Processing Pipeline

Signals represent quantifiable behavioral anomalies, trends, or narrative milestones computed across rolling time windows (24h, 7d, 30d).

### 2.1 Signal Types & Formulas

| Signal Category | Signal Name | Metric Formula | Narrative Significance |
| :--- | :--- | :--- | :--- |
| **Drop-off Signal** | `CHOICE_FRICTION_ANOMALY` | `(Exits within 5s of choice prompt) / (Total choice impressions) > 22%` | Choice dilemma is confusing, unappealing, or pacing is abrupt. |
| **Branch Imbalance** | `BRANCH_MONOPOLY_BIAS` | `Option_A_votes / (Total_votes) > 85%` | Branch lack meaningful tension; secondary branch content is underutilized. |
| **Character Affinity**| `CHARACTER_BREAKOUT_SCORE` | `(Character-focused choice clicks + Shares) / Total Story Views` | Supporting character has cult fan resonance; prime for spin-off. |
| **Rewatch Loop** | `REWATCH_LOOP_INTENSITY` | `Repeated node watches per user across sessions` | High narrative intrigue or viral twist. |
| **Cliffhanger Drag** | `EPISODE_BRIDGE_DROPOFF` | `1.0 - (Ep_N+1 Start within 48h / Ep_N Completion)` | Cliffhanger failed to compel audience to continue to the next chapter. |

### 2.2 Storage & Schema Representation

Signals are persisted in the `story_signals`, `character_signals`, and `interactive_signals` tables:
- `story_id`: Target story reference.
- `signal_type`: Enum string representing the metric.
- `strength_score`: Standardized normalized score (`0.00` to `100.00`).
- `confidence_score`: Statistical significance indicator based on sample size (`0.00` to `1.00`).
- `window_start` & `window_end`: UTC timestamp range of the evaluation cohort.
- `metadata`: JSON payload containing raw numerator, denominator, and contextual segment IDs.

---

## 3. Insight & Opportunity Generation

### 3.1 Insight Generation Layer
1. **Algorithmic Evaluation**: Periodic BullMQ worker (`story-lab:generate-insights`) evaluates signal clusters against heuristic threshold rules.
2. **AI-Assisted Narrative Synthesis**: Signals scoring `confidence_score >= 0.80` are enriched via the AI Orchestrator service to formulate human-readable narrative commentary (e.g., *"Viewers overwhelmingly reject Character X's betrayal in Episode 3, leading to a 34% drop-off before Episode 4"*).
3. **Persisted Record**: Written to `story_insights` with status `UNRESOLVED`.

### 3.2 Content Opportunity Formulation
High-impact insights automatically formulate strategic proposals stored in `content_opportunities`:
- **Opportunity Types**:
  - `BRANCH_REBALANCING`: Rewrite or re-shoot underperforming choice options.
  - `SPINOFF_CANDIDATE`: Character traction warrants a dedicated mini-series.
  - `PACING_RE-EDIT`: Tighten front-matter duration preceding high-friction choice nodes.
  - `ENDING_EXPANSION`: High viewer demand for an alternate, unlocked canonical conclusion.
- **Priority Tiering**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- **Review Workflow**: Exposed in the Story Lab UI for Creators and Editors. Requires status transition from `PROPOSED` to `IN_REVIEW`, `ACCEPTED`, or `DISMISSED`.

---

## 4. Human-in-the-Loop Governance & Editorial Review

To preserve narrative art and platform integrity:
1. **Immutable Boundary**: The Story Lab service possesses **zero write permissions** on `story_versions`, `story_nodes`, `choices`, or `episodes`.
2. **Draft Branch Creation**: When an editor accepts an opportunity, the system initiates an empty or scaffolded **DRAFT StoryVersion** (`vNext`).
3. **Audit Trail**: Every action (accepting an insight, drafting a branch, dismissing a signal) creates an immutable record in `audit_logs` capturing `user_id`, `opportunity_id`, `reason`, and timestamp.

---

## 5. Story Experiments Engine (A/B Testing)

Story Lab provides controlled runtime experimentation to validate narrative hypotheses before permanently modifying canonical story versions.

### 5.1 Experimentation Lifecycle

```text
DRAFT ──> SCHEDULED ──> ACTIVE ──> PAUSED ──> CONCLUDED ──> APPLIED / DISCARDED
```

### 5.2 Deterministic Audience Allocation
- Experiment variants are allocated deterministically using consistent hashing of the viewer's ID and experiment ID:
  ```typescript
  const bucket = murmurHash3(`${experimentId}:${userId}`) % 100;
  const variant = bucket < splitPercentage ? Variant.B : Variant.A;
  ```
- Ensures a user has a consistent, uninterrupted narrative experience across all viewing sessions and devices.

### 5.3 Experiment Targets & Variants
- **Variant A (Control)**: The existing canonical published node video/choice text.
- **Variant B (Candidate)**: Alternative choice prompt wording, preview thumbnail, or adjusted cliffhanger cutoff timing.
- **Measurement Metrics**: Primary retention, choice completion rate, 24-hour return rate, user ratings.
- **Automatic Failsafe**: If Variant B exhibits a statistically significant drop-off anomaly (> 15% drop compared to Control at 95% confidence interval), the experiment automatically enters `PAUSED` state and alerts editorial admins via Slack/in-app alert.
