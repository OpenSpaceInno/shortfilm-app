# 43. SHORTREEL — OPEN DECISIONS REGISTER

> All items marked OPEN must be resolved by product/business/legal owners before the relevant module can be fully implemented.
> Claude MUST NOT guess or invent values for OPEN items. Stop implementation and flag.

---

## BUSINESS RULES

| ID | Area | Question | Impact |
| :--- | :--- | :--- | :--- |
| BR-001 | Creator Economy | What % platform fee is deducted from creator gross earnings? (Recommended: 30%) | CreatorEarning settlement formula |
| BR-002 | Creator Economy | What is the minimum payout threshold? (Recommended: INR 2,000 / USD 25) | Payout worker logic |
| BR-003 | Creator Economy | What engagement metric weights determine creator revenue attribution? (Views? Completion rate? Choices?) | Settlement calculation formula |
| BR-004 | Subscription | How long is the free trial period? (Recommended: 7 days) | TRIAL state in subscription |
| BR-005 | Subscription | Grace period for payment failures (Recommended: 3 days) | PAST_DUE entitlement window |
| BR-006 | Choice Engine | Default voting window duration when none is set on a choice? | Fallback logic |
| BR-007 | Content | Is content browsing available to FREE users? Any limits? | Entitlement gating logic |
| BR-008 | Gamification | What are the defined streak reward milestones? | Badge unlock criteria |

---

## LEGAL / COMPLIANCE

| ID | Area | Question | Impact |
| :--- | :--- | :--- | :--- |
| LC-001 | Tax | Is TDS (Indian tax withholding) required on creator payouts? What rate? | creator_earnings.tax_withheld calculation |
| LC-002 | Privacy | GDPR data subject request (Right to Erasure) — SLA and scope | User anonymization worker |
| LC-003 | Privacy | Which analytics events qualify as PII under applicable jurisdiction? | Analytics event anonymization |
| LC-004 | Finance | What is the refund policy for cancelled subscriptions? | Subscription cancellation API |
| LC-005 | Content | COPPA compliance — do we allow users under 13? | Age gate / registration flow |
| LC-006 | Creator | Employment classification of creators (contractors vs employees)? | Tax document generation |

---

## PRODUCT DECISIONS

| ID | Area | Question | Impact |
| :--- | :--- | :--- | :--- |
| PD-001 | Onboarding | Is email verification required before first story watch? | Registration→Watch gating |
| PD-002 | Content | Multi-language support scope for V1? (English-only or multiple?) | Story language management |
| PD-003 | Creator | Can a user become a creator in the same session as registration? | Creator application UX flow |
| PD-004 | Community | Are community votes binding on the story narrative? Or just cosmetic? | Vote resolution vs interactive engine |
| PD-005 | Social | Comment system on episodes or characters — included in V1? | New entity: Comment |
| PD-006 | Search | Semantic/vector search included in V1, or textual FTS only? | SearchService implementation |

---

## SECURITY DECISIONS

| ID | Area | Question | Impact |
| :--- | :--- | :--- | :--- |
| SD-001 | Account | Account lockout after N failed logins — duration and threshold? (Recommended: 10 fails, 30 min) | Auth rate limit behavior |
| SD-002 | Session | Maximum active sessions per user? | Refresh token table management |
| SD-003 | Breach | HaveIBeenPwned API integration for password breach detection? | Registration and password change |

---

## RESOLUTION PROTOCOL

When a decision is made:
1. Update this document: change OPEN to DECIDED, add decision text
2. Update relevant spec document (e.g., 12_SUBSCRIPTION_SYSTEM.md)
3. Update 42_ARCHITECTURE_DECISIONS.md if architectural impact
4. Update implementation/05_PROGRESS_TRACKER.md if module was blocked
5. Claude may then proceed with implementation of blocked module
