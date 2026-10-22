# 34. SHORTREEL — MIGRATION STRATEGY

## Tooling: Drizzle ORM Migrations

All schema changes managed as versioned SQL migration files.
Migration files stored in: src/database/migrations/

## Naming Convention

{4-digit-sequence}_{domain}_{description}.sql
Examples:
- 0001_identity_initial_schema.sql
- 0002_content_stories_seasons_episodes.sql
- 0003_interactive_story_versions_nodes.sql
- 0004_engagement_watch_progress_xp.sql

## Rules

1. Never edit an existing migration file — always create a new one
2. Every migration must be forward-only (reversals handled by a new migration)
3. Multi-step schema changes use two migrations + two releases
4. Data migrations (backfill) are separate from schema migrations
5. All migrations tested against a MySQL 8.x container in CI before merge
6. Never DROP a column/table in the same release that removes the code dependency (two-release rule)

## Two-Release Rule for Destructive Changes

Release 1: Deploy new code that no longer uses old_column. Migration: mark old_column as NULL-able (no-op for existing code).
Release 2: Deploy migration that DROPs old_column (code already not using it).

## Pre-Prod Validation

1. Run migrations against a snapshot of staging data (anonymized)
2. Record execution time — alert if any migration takes > 30 minutes
3. Migrations execute as a pre-deploy ECS task before new containers receive traffic
