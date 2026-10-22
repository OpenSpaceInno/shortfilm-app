# 37. SHORTREEL — DATA SEEDING

## Seed Categories

1. Reference Data (required for app to function)
2. Development Data (rich sample content for local dev)
3. Staging Data (anonymized subset of production patterns)

## Reference Data Seed (always applied)

- Roles: SUPER_ADMIN, CONTENT_ADMIN, EDITOR, CREATOR_MANAGER, ANALYST, FINANCE, CREATOR, USER
- Permissions: 18 permissions × role mappings
- Genres: Drama, Thriller, Romance, Crime, Comedy, Sci-Fi, Horror, Mystery
- Subscription plans: FREE (0.00), BASIC (99.00 INR), PREMIUM (199.00 INR)
- Default language: en

## Development Data Seed

Seeder: npm run seed:dev

Creates:
- 1 SUPER_ADMIN user (admin@shortreel.local / Test1234!)
- 3 CREATOR users (creator1-3@shortreel.local / Test1234!)
- 5 regular USERs with active subscriptions
- 1 complete interactive story: 'The Missing Phone' (see 38_TEST_DATA.md)
- 2 partial draft stories in different genres
- Sample creator earnings, watch history, XP ledger entries

## Reset Command

npm run seed:reset → drops and recreates schema, applies reference seed, applies dev seed
For local only — NEVER run in staging or production.
