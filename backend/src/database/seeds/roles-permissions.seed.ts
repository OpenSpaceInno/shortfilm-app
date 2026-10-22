import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { generateUlid, ulidToBinary } from '../utils/ulid.util';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Complete system access across all tenants and configurations' },
  { name: 'CONTENT_ADMIN', description: 'Review, approve, publish, and moderate stories and episodes' },
  { name: 'EDITOR', description: 'Edit stories, episodes, and interactive branching graphs' },
  { name: 'CREATOR_MANAGER', description: 'Review creator applications, manage creator payouts and verification' },
  { name: 'ANALYST', description: 'Read-only access to platform analytics, retention, and drop-off reports' },
  { name: 'FINANCE', description: 'Access to subscription MRR, revenue ledgers, and creator payout batches' },
  { name: 'CREATOR', description: 'Create stories, upload reels, author interactive branches, and view own analytics' },
  { name: 'USER', description: 'Standard consumer: watch episodes, make branch choices, subscribe, vote' },
];

const PERMISSIONS = [
  { name: 'story:create', description: 'Create new stories' },
  { name: 'story:read', description: 'Read stories' },
  { name: 'story:update', description: 'Update stories' },
  { name: 'story:delete', description: 'Delete or archive stories' },
  { name: 'story:publish', description: 'Publish story versions' },
  { name: 'episode:create', description: 'Create new episodes' },
  { name: 'episode:read', description: 'Read episode details and playback tickets' },
  { name: 'episode:update', description: 'Update episode metadata' },
  { name: 'choice:submit', description: 'Submit interactive choices in stories' },
  { name: 'progress:write', description: 'Update watch progress and history' },
  { name: 'creator:apply', description: 'Submit creator application' },
  { name: 'creator:manage', description: 'Approve or suspend creators' },
  { name: 'subscription:manage', description: 'Manage plans and subscriptions' },
  { name: 'admin:access', description: 'Access the admin console' },
];

export async function seedRolesAndPermissions() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = Number(process.env.DATABASE_PORT) || 3306;
  const user = process.env.DATABASE_USER || 'shortreel_user';
  const password = process.env.DATABASE_PASSWORD || 'shortreel_password';
  const database = process.env.DATABASE_NAME || 'shortreel_dev';

  console.log(`[Seed] Connecting to MySQL at ${host}:${port}/${database}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    console.log('[Seed] Seeding canonical platform roles...');
    for (const role of ROLES) {
      const id = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO roles (id, name, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [id, role.name, role.description],
      );
    }

    console.log('[Seed] Seeding canonical permissions...');
    for (const perm of PERMISSIONS) {
      const id = ulidToBinary(generateUlid());
      await connection.query(
        `INSERT INTO permissions (id, name, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [id, perm.name, perm.description],
      );
    }

    console.log('[Seed] Roles and permissions seeded successfully.');
  } catch (error) {
    console.error('[Seed] Seeding failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedRolesAndPermissions();
}
