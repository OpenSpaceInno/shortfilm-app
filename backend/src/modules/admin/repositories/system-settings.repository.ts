import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  systemSettings,
  SystemSetting,
  SettingCategory,
  SettingValueType,
} from '../../../database/schema/admin.schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class SystemSettingsRepository {
  private readonly logger = new Logger(SystemSettingsRepository.name);

  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db(): MySql2Database {
    return this.dbService.getDb();
  }

  async findAll(options?: {
    category?: SettingCategory;
    isPublicOnly?: boolean;
  }): Promise<SystemSetting[]> {
    const conditions = [];

    if (options?.category) {
      conditions.push(eq(systemSettings.category, options.category));
    }
    if (options?.isPublicOnly) {
      conditions.push(eq(systemSettings.isPublic, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(systemSettings)
      .where(whereClause)
      .orderBy(systemSettings.category, systemSettings.key);
  }

  async findByKey(key: string): Promise<SystemSetting | null> {
    const rows = await this.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    return rows[0] || null;
  }

  async upsert(
    key: string,
    data: {
      value: any;
      category?: SettingCategory;
      valueType?: SettingValueType;
      description?: string;
      isPublic?: boolean;
    },
    updatedBy?: string,
  ): Promise<SystemSetting> {
    const existing = await this.findByKey(key);

    const inferredValueType: SettingValueType =
      data.valueType ||
      (typeof data.value === 'boolean'
        ? 'BOOLEAN'
        : typeof data.value === 'number'
          ? 'NUMBER'
          : Array.isArray(data.value)
            ? 'ARRAY'
            : typeof data.value === 'object'
              ? 'JSON'
              : 'STRING');

    if (existing) {
      await this.db
        .update(systemSettings)
        .set({
          value: data.value,
          ...(data.category && { category: data.category }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
          valueType: inferredValueType,
          updatedBy: updatedBy || null,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.key, key));

      const updated = await this.findByKey(key);
      return updated!;
    } else {
      const id = generateUlid();
      await this.db.insert(systemSettings).values({
        id,
        key,
        value: data.value,
        category: data.category || 'GENERAL',
        valueType: inferredValueType,
        description: data.description || null,
        isPublic: data.isPublic ?? false,
        updatedBy: updatedBy || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const inserted = await this.findByKey(key);
      return inserted!;
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.db.delete(systemSettings).where(eq(systemSettings.key, key));
    return (result[0] as any)?.affectedRows > 0;
  }
}
