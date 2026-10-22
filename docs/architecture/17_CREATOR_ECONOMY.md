# 17. SHORTREEL — CREATOR ECONOMY ARCHITECTURE

> **Document ID:** SR-ARCH-17  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Creator Domain Model & Lifecycle

The Creator Economy connects content creators with platform audiences and financial attribution:

```text
Creator Onboarding ──> Application ──> Verification ──> Story Authoring ──> Audience Engagement ──> Monthly Attribution ──> Payout
```

### 1.1 Creator Verification & Tiers
- **`EMERGING`:** Newly onboarded creator with basic authoring privileges.
- **`VERIFIED`:** Formally approved by Creator Relations team; entitled to rev-share.
- **`EXCLUSIVE`:** Signed platform originals with priority promotion and minimum guarantees.
- **`PARTNER`:** Studio-level publishing partners with custom financial terms.

---

## 2. Monthly Earnings Calculation & Payout State Machine

```text
                Monthly Settlement Job (1st of Month)
                               │
                               ▼
                        ┌──────────────┐
                        │  CALCULATED  │
                        └──────┬───────┘
                               │ Editorial / Finance Verification
                               ▼
                        ┌──────────────┐       Tax / KYC Issue
                        │PENDING_PAYOUT│ ─────────────────────> ┌──────────────┐
                        └──────┬───────┘                        │     HELD     │
                               │                                └──────────────┘
                               │ Payout Rail Transfer Success
                               ▼
                        ┌──────────────┐
                        │     PAID     │
                        └──────────────┘
```

---

## 3. Financial Attribution Engine & Open Decisions

The backend structure reserves database tables for `creator_earnings` and `creator_activities`, but core financial parameters must not be hardcoded without explicit business sign-off.

### Register of Open Creator Financial Rules

| Decision Item | Description & Options | Current Architectural Baseline | Status |
| :--- | :--- | :--- | :--- |
| **Revenue Attribution Model** | How subscription pool revenue is apportioned among creators.<br>- **Option A:** Watch-time minutes proportional share.<br>- **Option B:** Completed episodes count.<br>- **Option C:** Fixed licensing fee per season. | Base schema records `gross_amount` computed by modular worker. | **OPEN — BUSINESS RULE REQUIRED** |
| **Platform Revenue Split** | Percentage retained by ShortReel vs creator.<br>- Standard recommendation: 70% creator / 30% platform. | Configured via environment variable `DEFAULT_PLATFORM_FEE_PCT=30.00`. | **OPEN — BUSINESS RULE REQUIRED** |
| **Tax Withholding (TDS/GST)**| Legal tax deduction at source depending on creator country of residence. | Stored in `tax_withheld` column; calculations deferred to finance worker. | **OPEN — BUSINESS RULE REQUIRED** |
| **Chargeback & Refund Clawback** | Handling creator earnings when a subscriber refund occurs in a subsequent billing cycle. | Negative balance adjustment record in `creator_earnings`. | **OPEN — BUSINESS RULE REQUIRED** |
| **Minimum Payout Threshold** | Minimum accrued net balance before bank transfer is initiated (e.g. ₹2,000 or $50). | Unmet thresholds rollover to the next month's settlement batch. | **OPEN — BUSINESS RULE REQUIRED** |
