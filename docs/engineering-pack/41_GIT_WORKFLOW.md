# 41. SHORTREEL — GIT WORKFLOW

## Branch Strategy (Trunk-Based, Simplified)

`
main           <- Production. Protected. Only deployable code.
develop        <- Integration. Protected. PRs merge here first.
feature/{name} <- Feature branches (from develop, merged to develop)
fix/{name}     <- Bug fix branches
hotfix/{name}  <- Critical production fixes (from main, merged to both main and develop)
`

## Commit Convention (Conventional Commits)

`
feat(auth): implement refresh token rotation with reuse detection
fix(interactive): resolve race condition on concurrent choice submission
perf(feed): add Redis caching to story feed endpoint
chore(deps): update NestJS to 10.4.1
docs(api): add OpenAPI annotations to creator endpoints
test(engine): add invariant tests ENG-001 through ENG-010
`

## PR Rules

- Minimum 1 approval required
- All CI checks must pass
- No force pushes to develop or main (per AGENTS.md Lovable rule)
- PR title must follow Conventional Commits format

## Lovable Sync

This project is connected to Lovable.
NEVER force-push, rebase, or squash commits already pushed to connected branches.
