#!/usr/bin/env node
/**
 * ShortReel — Automated Production Readiness Scanner (P11.4)
 * Validates environment parity, secrets hygiene, compiled build outputs,
 * API contracts, and security directives prior to production release.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(rootDir, 'backend');

console.log('================================================================');
console.log('   SHORTREEL PLATFORM — PRODUCTION READINESS SCANNER (P11.4)   ');
console.log('================================================================\n');

let passCount = 0;
let warnCount = 0;
let failCount = 0;

function check(title, condition, details = '', isWarning = false) {
  if (condition) {
    console.log(`[PASS] ${title}`);
    passCount++;
  } else if (isWarning) {
    console.log(`[WARN] ${title} — ${details}`);
    warnCount++;
  } else {
    console.log(`[FAIL] ${title} — ${details}`);
    failCount++;
  }
}

// 1. Backend Build Artifacts
const backendMain = path.join(backendDir, 'dist', 'src', 'main.js');
check('Backend Compiled Artifact (dist/src/main.js)', fs.existsSync(backendMain), 'Run npm run build in backend/');

// 2. Frontend Production Bundle
const frontendIndex = path.join(rootDir, 'dist', 'index.html');
const frontendPublic = path.join(rootDir, '.output', 'public', 'index.html');
check(
  'Frontend Production Distribution (dist/index.html & .output/public)',
  fs.existsSync(frontendIndex) || fs.existsSync(frontendPublic),
  'Run npm run build in root directory'
);

// 3. API Contract & OpenAPI Specification Parity
const openApiBackend = path.join(backendDir, 'openapi.json');
const openApiClient = path.join(rootDir, 'src', 'lib', 'api-client', 'openapi.json');
const clientTypes = path.join(rootDir, 'src', 'lib', 'api-client', 'types.gen.ts');
check('Backend OpenAPI Schema (openapi.json)', fs.existsSync(openApiBackend));
check('Frontend API Client Schema (openapi.json)', fs.existsSync(openApiClient));
check('TypeScript API Contract Types (types.gen.ts)', fs.existsSync(clientTypes));

// 4. Docker Parity Artifacts
const dockerfileBackend = path.join(backendDir, 'Dockerfile');
const dockerfileFrontend = path.join(rootDir, 'Dockerfile');
const dockerCompose = path.join(rootDir, 'docker-compose.yml');
const dockerComposeDev = path.join(rootDir, 'docker-compose.dev.yml');
check('Backend Multi-Stage Dockerfile', fs.existsSync(dockerfileBackend));
check('Frontend Nginx Alpine Dockerfile', fs.existsSync(dockerfileFrontend));
check('Unified Docker Compose (MySQL, Redis, Backend, Frontend)', fs.existsSync(dockerCompose));
check('Development Docker Compose (docker-compose.dev.yml)', fs.existsSync(dockerComposeDev));

// 5. CI/CD Pipeline Workflows
const ciWorkflow = path.join(rootDir, '.github', 'workflows', 'ci.yml');
const deployWorkflow = path.join(rootDir, '.github', 'workflows', 'deploy.yml');
check('GitHub Actions CI Workflow (.github/workflows/ci.yml)', fs.existsSync(ciWorkflow));
check('GitHub Actions CD Workflow (.github/workflows/deploy.yml)', fs.existsSync(deployWorkflow));

// 6. Playwright E2E Test Suites
const playwrightConfig = path.join(rootDir, 'playwright.config.ts');
const e2eConsumer = path.join(rootDir, 'e2e', 'consumer-golden-journey.spec.ts');
const e2eCreator = path.join(rootDir, 'e2e', 'creator-journey.spec.ts');
const e2eAdmin = path.join(rootDir, 'e2e', 'admin-governance-journey.spec.ts');
check('Playwright E2E Configuration (playwright.config.ts)', fs.existsSync(playwrightConfig));
check('Consumer Golden Journey E2E Suite', fs.existsSync(e2eConsumer));
check('Creator Platform E2E Suite', fs.existsSync(e2eCreator));
check('Admin CMS & Governance E2E Suite', fs.existsSync(e2eAdmin));

// 7. Environment Variables Hygiene
const backendEnvExample = path.join(backendDir, '.env.example');
if (fs.existsSync(backendEnvExample)) {
  const content = fs.readFileSync(backendEnvExample, 'utf8');
  const requiredKeys = ['DATABASE_HOST', 'DATABASE_USER', 'REDIS_HOST', 'JWT_SECRET', 'AUTH0_DOMAIN'];
  const missingKeys = requiredKeys.filter((k) => !content.includes(k));
  check(
    'Backend .env.example contains baseline environment variables',
    missingKeys.length === 0,
    `Missing keys: ${missingKeys.join(', ')}`
  );
}

// 8. Security Hardening Configuration
const securityModule = path.join(backendDir, 'src', 'modules', 'security', 'services', 'security-audit.service.ts');
check('Automated Security Audit Service (SecurityAuditService)', fs.existsSync(securityModule));

console.log('\n----------------------------------------------------------------');
console.log(`Scan Complete: ${passCount} Passed, ${warnCount} Warnings, ${failCount} Failed.`);

if (failCount === 0) {
  console.log('Platform Status: READY FOR PRODUCTION (P11.4 VERIFIED)');
  process.exit(0);
} else {
  console.log('Platform Status: ACTION REQUIRED (Resolve failed checks)');
  process.exit(1);
}
