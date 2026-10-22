# 40. SHORTREEL — CODE STANDARDS

## TypeScript Configuration

`json
{
  strict: true,
  noImplicitAny: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  target: 'ES2022',
  module: 'CommonJS'
}
`

## Naming Conventions

| Construct | Convention | Example |
| :--- | :--- | :--- |
| Files | kebab-case | interactive-engine.service.ts |
| Classes | PascalCase | InteractiveEngineService |
| Methods | camelCase | esolveChoice() |
| Constants | SCREAMING_SNAKE | MAX_CHOICE_OPTIONS = 2 |
| Env Variables | SCREAMING_SNAKE | CLOUDFLARE_STREAM_KEY |
| DB Tables | snake_case | user_choices |
| API Routes | kebab-case | /interactive/choices |
| Redis Keys | colon:namespaced | cache:story:published:{id} |

## Module Structure (per NestJS module)

`
src/modules/{domain}/
  {domain}.module.ts
  {domain}.controller.ts
  {domain}.service.ts
  {domain}.repository.ts
  dto/
    create-{entity}.dto.ts
    update-{entity}.dto.ts
    {entity}-response.dto.ts
  entities/
    {entity}.entity.ts
  guards/
  decorators/
  events/
  exceptions/
`

## Required JSDoc

Every service method with business logic must have:
`	ypescript
/**
 * Resolves a viewer's branch choice for an interactive story node.
 * Enforces: voting window open, no duplicate choice, destination valid.
 * Transaction: Writes user_choice + xp_ledger + increments vote_count atomically.
 */
async resolveChoice(...) { ... }
`
"@

"41_GIT_WORKFLOW.md" = @"
# 41. SHORTREEL — GIT WORKFLOW

## Branch Strategy (Trunk-Based, Simplified)

`
main           ← Production. Protected. Only deployable code.
develop        ← Integration. Protected. PRs merge here first.
feature/{name} ← Feature branches (from develop, merged to develop)
fix/{name}     ← Bug fix branches
hotfix/{name}  ← Critical production fixes (from main, merged to both main and develop)
`

## Commit Convention (Conventional Commits)

`
feat(auth): implement refresh token rotation with reuse detection
fix(interactive): resolve UNIQUE constraint error on concurrent choice submission
perf(feed): add Redis caching to story feed endpoint
chore(deps): update NestJS to 10.4.1
docs(api): add OpenAPI annotations to creator endpoints
test(engine): add invariant tests ENG-001 through ENG-010
`

## PR Rules

- Minimum 1 approval required
- All CI checks must pass (lint, typecheck, unit, integration)
- No force pushes to develop or main (per AGENTS.md rule)
- PR title must follow Conventional Commits format
- Each PR should represent one logical module or fix

## Lovable Sync

This project is connected to Lovable. Avoid rewriting pushed git history.
Do NOT force-push, rebase, or squash already-pushed commits.
