# 38. SHORTREEL — TEST DATA

## Primary Test Fixture: 'The Missing Phone'

A complete interactive story used for all engine integration and API tests.

### Story Metadata
- Title: The Missing Phone
- Genre: Thriller
- Language: en
- Status: PUBLISHED
- Creator: creator1@shortreel.local

### Episode Graph (DAG)

`
[EP1 — Opening] is_root=true
       ↓ (automatic, no choice)
[EP2 — First Clue] STANDARD
       ↓ (automatic, no choice)
[EP3 — The Confrontation] CHOICE_POINT
       ↓ Choice: 'Do you confront the suspect or follow them?'
       ├── Option A: 'Confront' → [EP4A — Direct Showdown]
       └── Option B: 'Follow' → [EP4B — Shadow Mission]
[EP4A — Direct Showdown] STANDARD
       ↓ (automatic)
[EP5A — The Confession] ENDING
[EP4B — Shadow Mission] STANDARD
       ↓ (automatic)
[EP5B — The Escape] ENDING
`

### Users

| User | Email | Role | Subscription |
| :--- | :--- | :--- | :--- |
| Test Admin | admin@shortreel.local | SUPER_ADMIN | N/A |
| Creator 1 | creator1@shortreel.local | CREATOR | N/A |
| Free Viewer | user1@shortreel.local | USER | FREE |
| Premium Viewer | user2@shortreel.local | USER | PREMIUM |
| Suspended User | suspended@shortreel.local | USER | CANCELLED |

### Test Assertions Reference

ENG-001: user2 submits choice A → choiceOptionId for 'Confront' → expect 200 + EP4A node
ENG-002: user2 submits same choice again → expect 200 same choice (idempotent)
ENG-003: Admin closes voting window → user2 submits choice → expect 409 VOTING_WINDOW_CLOSED
ENG-004: user2 submits invalid choiceOptionId → expect 404 CHOICE_OPTION_NOT_FOUND
ENG-005: user1 (free) tries to access EP2 (paid) → expect 403 SUBSCRIPTION_REQUIRED
