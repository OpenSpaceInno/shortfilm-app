# 20. SHORTREEL — STORY LAB

## Cardinal Rule

Story Lab NEVER autonomously modifies or publishes content.
Every actionable opportunity requires human editorial acceptance.
Story Lab is read-and-recommend only.

## Signal → Insight → Opportunity → Experiment Pipeline

`
Analytics Data (choices, drop-offs, watch-time)
     ↓ BullMQ story-lab-queue (runs hourly)
     ↓ Signal computation (choice_friction_anomaly, branch_monopoly_bias, etc.)
     ↓ Stored in story_signals, character_signals, interactive_signals
     ↓ AI enrichment: confidence >= 0.80 → generate human-readable insight
     ↓ Stored in story_insights (status=UNRESOLVED)
     ↓ High-impact insights → content_opportunities (status=PROPOSED)
     ↓ EDITOR/CONTENT_ADMIN reviews in Story Lab UI
     ↓ If ACCEPTED → creates empty DRAFT StoryVersion (vNext) for creator
     ↓ If EXPERIMENT created → story_experiments with A/B config
     ↓ Experiment ACTIVE → deterministic bucket assignment (murmurHash3)
     ↓ Experiment CONCLUDED → measure lift → APPLIED or DISCARDED
`

## Signal Types

- CHOICE_FRICTION_ANOMALY: exits within 5s of choice prompt > 22%
- BRANCH_MONOPOLY_BIAS: one option > 85% of votes
- CHARACTER_BREAKOUT_SCORE: character-focused choices high across users
- EPISODE_BRIDGE_DROPOFF: < X% of EP_N completers start EP_N+1 within 48h

## Write Permissions

StoryLabModule has ZERO write permissions on: story_versions, story_nodes, choices, episodes, videos.
It only writes to: story_signals, story_insights, content_opportunities, story_experiments.
