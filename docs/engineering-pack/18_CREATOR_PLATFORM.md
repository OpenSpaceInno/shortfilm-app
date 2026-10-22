# 18. SHORTREEL — CREATOR PLATFORM

## Creator Lifecycle

APPLIED → UNDER_REVIEW → APPROVED → VERIFIED → ACTIVE → SUSPENDED/REJECTED/DEACTIVATED

## Submission Lifecycle

DRAFT → SUBMITTED → UNDER_REVIEW → CHANGES_REQUESTED → APPROVED → REJECTED → PUBLISHED

## Creator Application Flow

1. User calls POST /creators/apply → creates creator record (status=APPLIED)
2. Creator completes profile (display_name, bio, portfolio_url)
3. Creator submits via PUT /creators/me/application
4. CREATOR_MANAGER reviews in admin panel
5. PATCH /admin/creators/:id/status → APPROVED
6. Creator role granted via user_roles
7. Creator can now create stories and use AI Studio

## Creator Dashboard APIs

GET /creators/me/dashboard → returns:
- Total stories, published stories
- Total views (30d), completions, choice rate
- Monthly earnings (last 3 months)
- Pending submissions

## Earnings Settlement (Monthly)

Runs as a BullMQ cron job on the 1st of each month:
1. Calculate gross_amount per creator (formula: OPEN — BUSINESS RULE REQUIRED)
2. Deduct platform_fee (default 30% — OPEN — BUSINESS RULE REQUIRED)
3. Deduct tax_withheld (OPEN — LEGAL DECISION REQUIRED)
4. Compute net_payout
5. Insert creator_earnings record (status=CALCULATED)
6. Finance reviews → PENDING_PAYOUT
7. Payout rail executes → PAID
8. KYC/tax issue → HELD
