# 39. SHORTREEL — CI/CD PIPELINE

## GitHub Actions Workflows

### PR Validation (every PR)
`
on: pull_request → develop, main

jobs:
  lint:       npm run lint (ESLint + Prettier check)
  typecheck:  npx tsc --noEmit
  unit-tests: npm run test:unit
  int-tests:  npm run test:integration  (Testcontainers MySQL + Redis)
  build:      npm run build (tsc compile)
`

### Development Deploy (merge to develop)
`
on: push → develop

jobs:
  test: (same as PR validation)
  build-image: docker build + push to ECR (dev tag)
  migrate: Run Drizzle migrations via ECS task in DEV
  deploy: Update ECS service in DEV cluster
  smoke-test: Curl /health/readiness in DEV
`

### Production Deploy (manual trigger with STAGING confirmation)
`
on: workflow_dispatch (with staging sha input)

jobs:
  validate-staging-sha: Confirm given sha is deployed to staging and passing
  build-image: Push to ECR (prod tag)
  migrate-staging: Run migrations in STAGING
  deploy-staging: Deploy to STAGING
  smoke-staging: Health + regression test against STAGING
  [PAUSE — Human approval required]
  migrate-prod: Run migrations in PROD
  deploy-prod: Rolling deploy to PROD
  smoke-prod: Health check + Datadog alert baseline
`

## Secrets in CI

Stored in GitHub Actions secrets → injected as environment variables in workflow.
Never echoed in logs. Pino serializers redact from output even if accidentally included.
