# 01. SHORTREEL — PRODUCT OVERVIEW

> **Document:** `01_PRODUCT_OVERVIEW.md`  
> **Status:** FROZEN  

---

## 1. Vision

**ShortReel** is a next-generation interactive vertical short-series entertainment platform.

Brand Positioning:  
> *"Watch it. Choose it. Shape it."*

ShortReel fuses the addictive consumption mechanics of vertical short-form video (TikTok/Reels) with interactive branching narratives (choose-your-own-adventure) into high-production-value episodic short dramas.

---

## 2. Target Users

### Consumer
- Mobile-first audience aged 18–35.
- Viewers who want short, high-impact entertainment with agency.
- Fans of drama, thriller, romance with unexpected plot branches.
- Engaged participants who vote, predict, and replay for alternate endings.

### Creator
- Independent storytellers, filmmakers, and writers.
- Production studios seeking interactive IP development.
- Creators seeking a platform that compensates based on audience engagement.

### Admin / Platform Operator
- Content editors and reviewers.
- Creator relations managers.
- Finance and analytics teams.
- Platform administrators.

---

## 3. Consumer Experience

The consumer journey:

```text
HOME FEED (Trending + Recommended)
         ↓
STORY DISCOVERY (Browse, Search, Genre)
         ↓
STORY DETAIL (Characters, Seasons, Synopsis)
         ↓
EPISODE PLAYBACK (Vertical 9:16, fullscreen)
         ↓
MID-EPISODE CHOICE OVERLAY (Binary decision point)
         ↓
BRANCH RESOLUTION (Viewer-chosen path)
         ↓
EPISODE COMPLETION → XP AWARD
         ↓
CLIFFHANGER → NEXT EPISODE HOOK
         ↓
COMMUNITY VOTE (Collective outcome shaping)
         ↓
AUDIENCE PREDICTION (Bet on what happens next)
         ↓
SUBSCRIPTION GATE (Premium content access)
         ↓
PROFILE & GAMIFICATION (Badges, streaks, XP leaderboard)
```

---

## 4. Creator Experience

```text
APPLY AS CREATOR
         ↓
VERIFICATION & APPROVAL
         ↓
CREATOR STUDIO (Dashboard, analytics, earnings)
         ↓
STORY CREATION (Title, genre, synopsis, characters)
         ↓
INTERACTIVE NODE GRAPH (Define branching paths)
         ↓
AI STORY STUDIO (Concept expansion, character forge, cliffhangers)
         ↓
VIDEO UPLOAD (Direct to Cloudflare Stream)
         ↓
SUBMISSION FOR REVIEW
         ↓
EDITORIAL REVIEW (Admin)
         ↓
APPROVAL + PUBLICATION
         ↓
AUDIENCE ANALYTICS (Views, choices, completion rates)
         ↓
MONTHLY EARNINGS ATTRIBUTION
         ↓
PAYOUT
```

---

## 5. Admin / CMS Experience

```text
ADMIN CONSOLE
         ↓
CONTENT MANAGEMENT (Stories, Episodes, Videos)
         ↓
INTERACTIVE STORY REVIEW (DAG validation, branch approval)
         ↓
CREATOR MANAGEMENT (Applications, verification, notes)
         ↓
USER MANAGEMENT (Profiles, roles, suspensions)
         ↓
SUBSCRIPTION MANAGEMENT (Plans, overrides, refunds)
         ↓
STORY LAB (Signals, Insights, Opportunities, Experiments)
         ↓
BUSINESS DASHBOARD (DAU, MAU, MRR, Retention, Churn)
         ↓
AUDIT TRAIL (Every admin action logged)
```

---

## 6. Interactive Storytelling

ShortReel's primary product differentiator is the **Interactive Story Engine**.

Core mechanics:
- Stories are composed of **StoryNodes** (individual 1–3 minute video segments).
- At specific points, viewers encounter a **Choice** between 2 **ChoiceOptions**.
- The selected option routes the viewer to a specific **destination StoryNode**.
- This forms a **Directed Acyclic Graph (DAG)** of narrative paths.
- Multiple endings (canonical and alternate) are possible per story.

Rules:
- A viewer's journey is permanently anchored to the published **StoryVersion** at time of first watch.
- Published story versions are **immutable** — edits require a new draft version.
- A story graph must have no cycles (DAG invariant enforced at publish time).
- Every path through the graph must reach a terminal `ENDING` node.

---

## 7. Engagement System

| Feature | Purpose |
| :--- | :--- |
| **Watch Progress** | Resume mid-episode; one row per user-episode (mutable) |
| **Watch History** | Append-only audit log of completed nodes |
| **XP Ledger** | Point accumulation for engagement actions |
| **Badges** | Achievement unlocks for milestones |
| **Streaks** | Daily engagement tracking |
| **Votes** | Community-driven choice outcomes |
| **Predictions** | Bet on future plot outcomes |
| **Follows** | Follow creators and characters |
| **Shares** | Share episodes and story branches |
| **Notifications** | In-app, push, and email alerts |

---

## 8. Creator Economy

| Concept | Detail |
| :--- | :--- |
| **Creator Tiers** | EMERGING → VERIFIED → EXCLUSIVE → PARTNER |
| **Revenue Attribution** | Monthly subscription pool split by engagement metrics |
| **Earnings State Machine** | CALCULATED → PENDING_PAYOUT → PAID / HELD |
| **Platform Fee** | `OPEN — BUSINESS RULE REQUIRED` (recommended 30%) |
| **Minimum Payout** | `OPEN — BUSINESS RULE REQUIRED` (recommended ₹2,000) |
| **Tax Withholding** | `OPEN — LEGAL DECISION REQUIRED` |

---

## 9. Story Lab

An intelligence platform for editorial and creator teams. It is:
- **Read-only** in terms of content production — it generates insights, not stories.
- **Human-gated** — no autonomous publishing or content modification.

Pipeline:
```text
DATA (choices, watch-time, drop-offs)
     ↓
SIGNALS (quantified behavioral anomalies)
     ↓
INSIGHTS (AI-enriched narrative commentary)
     ↓
OPPORTUNITIES (rebalancing, spinoffs, re-edits)
     ↓
HUMAN EDITORIAL REVIEW (REQUIRED)
     ↓
EXPERIMENTS (A/B test narrative hypotheses)
     ↓
MEASUREMENT (lift in retention, completion rate)
```

---

## 10. Business Dashboard

Executive-level metrics aggregated from transactional data:
- **Audience**: DAU, MAU, Stickiness Ratio, D1/D7/D30 Retention.
- **Engagement**: Watch Hours, Episode Completion Rate, Choice Rate.
- **Subscriptions**: Active Subscribers, MRR, Churn Rate, Net Adds.
- **Content Economics**: Top Stories by Completion, Top Choice Paths.
- **Creator Economics**: Payout Liability, Top Earners.

---

## 11. Monetisation

| Model | Detail |
| :--- | :--- |
| **Subscription Plans** | FREE (limited), BASIC, PREMIUM (tiers TBD) |
| **Entitlements** | Plan-based content gating |
| **Free Trial** | `OPEN — PRODUCT DECISION REQUIRED` |
| **Payment Providers** | Razorpay (India) + Stripe (Global) via abstraction |
| **Webhook Processing** | Idempotent, signature-validated |
| **Grace Period** | 3 days recommended on payment failure |

---

## 12. The Core Loop

```text
CONTENT (creator authors interactive story)
     ↓
WATCH (consumer streams vertical video)
     ↓
CLIFFHANGER (episode ends on tension)
     ↓
CHOICE (viewer decides branch path)
     ↓
ENGAGEMENT (XP, votes, predictions, shares)
     ↓
DATA (signals, watch-time, drop-off analysis)
     ↓
PERSONALISATION (feed ranking, recommendations)
     ↓
RETENTION (streaks, badge rewards, social proof)
     ↓
BREAKOUT IP (character spinoffs, expanded universes)
     ↓
CREATOR SUCCESS (audience, earnings, platform tier)
     ↓
MORE CONTENT (creator invests in next story)
     ↓
(REPEAT)
```
