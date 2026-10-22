import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';

export const DRIZZLE_DB = 'DRIZZLE_DB';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: mysql.Pool | null = null;
  public db: MySql2Database | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('DATABASE_HOST', 'localhost');
    const port = this.configService.get<number>('DATABASE_PORT', 3306);
    const user = this.configService.get<string>('DATABASE_USER', 'shortreel_user');
    const password = this.configService.get<string>('DATABASE_PASSWORD', 'shortreel_password');
    const database = this.configService.get<string>('DATABASE_NAME', 'shortreel_dev');
    const minPool = this.configService.get<number>('DATABASE_POOL_MIN', 2);
    const maxPool = this.configService.get<number>('DATABASE_POOL_MAX', 10);

    try {
      this.pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: maxPool,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });

      this.db = drizzle(this.pool);
      this.logger.log(`MySQL connection pool established to ${host}:${port}/${database} (min: ${minPool}, max: ${maxPool})`);
    } catch (error) {
      this.logger.error(`Failed to initialize MySQL pool: ${(error as Error).message}`, (error as Error).stack);
      // Graceful fallback during test/bootstrap when DB might not be actively running
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('MySQL connection pool closed.');
    }
  }

  getDb(): MySql2Database {
    if (!this.db) {
      throw new Error('Database service not initialized');
    }
    return this.db;
  }

  getPool(): mysql.Pool {
    if (!this.pool) {
      throw new Error('MySQL pool not initialized');
    }
    return this.pool;
  }
}
