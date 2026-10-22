#!/bin/sh
set -e

echo "========================================================"
echo "ShortReel Backend — Production Container Initialization"
echo "========================================================"

# Function to wait for MySQL readiness
wait_for_mysql() {
  echo "[Database] Waiting for MySQL ($DATABASE_HOST:$DATABASE_PORT) to be ready..."
  MAX_RETRIES=30
  COUNT=0
  until node -e "
    const mysql = require('mysql2/promise');
    mysql.createConnection({
      host: process.env.DATABASE_HOST || 'shortreel-mysql',
      port: Number(process.env.DATABASE_PORT) || 3306,
      user: process.env.DATABASE_USER || 'shortreel_user',
      password: process.env.DATABASE_PASSWORD || 'shortreel_password',
      connectTimeout: 3000
    }).then(conn => {
      conn.end();
      process.exit(0);
    }).catch(() => process.exit(1));
  " 2>/dev/null; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
      echo "[Database] Timed out waiting for MySQL after $MAX_RETRIES attempts. Proceeding anyway..."
      break
    fi
    echo "[Database] MySQL not reachable yet (attempt $COUNT/$MAX_RETRIES), waiting 2s..."
    sleep 2
  done
  echo "[Database] MySQL connection established or proceed flag set."
}

wait_for_mysql

# Run database schema migrations
echo "[Migration] Running schema migrations..."
if node dist/src/database/migrate.js; then
  echo "[Migration] Migrations applied successfully."
else
  echo "[Migration] Warning: Migration encountered an error or was already applied."
fi

# Optional automated database seeding
if [ "$AUTO_SEED" = "true" ]; then
  echo "[Seed] AUTO_SEED=true: Executing canonical database seeds..."
  node dist/src/database/seeds/roles-permissions.seed.js 2>/dev/null || echo "[Seed] Roles seed skipped or exists."
  node dist/src/database/seeds/subscription-plans.seed.js 2>/dev/null || echo "[Seed] Plans seed skipped or exists."
  node dist/src/database/seeds/content.seed.js 2>/dev/null || echo "[Seed] Content seed skipped or exists."
  node dist/src/database/seeds/system-settings.seed.js 2>/dev/null || echo "[Seed] Settings seed skipped or exists."
  echo "[Seed] Database seeding completed."
fi

echo "[Server] Launching ShortReel NestJS Backend on port ${PORT:-3000}..."
exec node dist/src/main.js "$@"
