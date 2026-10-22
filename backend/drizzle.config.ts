import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

export default {
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  driver: 'mysql2',
  dbCredentials: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER || 'shortreel_user',
    password: process.env.DATABASE_PASSWORD || 'shortreel_password',
    database: process.env.DATABASE_NAME || 'shortreel_dev',
  },
  verbose: true,
  strict: true,
} satisfies Config;
