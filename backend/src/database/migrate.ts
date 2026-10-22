import * as mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function runMigrations() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = Number(process.env.DATABASE_PORT) || 3306;
  const user = process.env.DATABASE_USER || 'shortreel_user';
  const password = process.env.DATABASE_PASSWORD || 'shortreel_password';
  const database = process.env.DATABASE_NAME || 'shortreel_dev';

  console.log(`[Migration] Connecting to MySQL server at ${host}:${port}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    console.log(`[Migration] Ensuring database '${database}' exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`,
    );
    await connection.query(`USE \`${database}\`;`);
    // Ensure migrations tracking table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS _drizzle_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log(`[Migration] No migrations directory found at ${migrationsDir}`);
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const [rows] = await connection.query<mysql.RowDataPacket[]>(
        'SELECT id FROM _drizzle_migrations WHERE name = ?',
        [file],
      );

      if (rows && rows.length > 0) {
        console.log(`[Migration] Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`[Migration] Applying ${file}...`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await connection.query(sqlContent);
      await connection.query('INSERT INTO _drizzle_migrations (name, hash) VALUES (?, ?)', [
        file,
        'sha256_mock_hash',
      ]);

      console.log(`[Migration] Successfully applied ${file}`);
    }

    console.log('[Migration] All migrations completed successfully.');
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };
