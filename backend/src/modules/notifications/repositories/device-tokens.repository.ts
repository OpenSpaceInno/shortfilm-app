import { Injectable, Inject } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { deviceTokens, DeviceToken, DevicePlatform } from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class DeviceTokensRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async upsertToken(
    userId: string,
    token: string,
    platform: DevicePlatform = 'WEB',
  ): Promise<DeviceToken> {
    const existing = await this.db
      .select()
      .from(deviceTokens)
      .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token)))
      .limit(1);

    if (existing && existing.length > 0) {
      await this.db
        .update(deviceTokens)
        .set({
          platform,
          lastUsedAt: new Date(),
        })
        .where(eq(deviceTokens.id, existing[0]!.id));

      const updated = await this.db
        .select()
        .from(deviceTokens)
        .where(eq(deviceTokens.id, existing[0]!.id))
        .limit(1);

      return updated[0]!;
    }

    const id = generateUlid();
    await this.db.insert(deviceTokens).values({
      id,
      userId,
      token,
      platform,
      lastUsedAt: new Date(),
    });

    const created = await this.db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.id, id))
      .limit(1);

    return created[0]!;
  }

  async removeToken(userId: string, token: string): Promise<boolean> {
    const result = await this.db
      .delete(deviceTokens)
      .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token)));

    const affected = (result as any)?.[0]?.affectedRows ?? 1;
    return affected > 0;
  }

  async findTokensByUserId(userId: string): Promise<string[]> {
    const records = await this.db
      .select({ token: deviceTokens.token })
      .from(deviceTokens)
      .where(eq(deviceTokens.userId, userId));

    return records.map((r) => r.token);
  }

  async findTokensByUserIds(userIds: string[]): Promise<string[]> {
    if (!userIds || userIds.length === 0) return [];

    const records = await this.db
      .select({ token: deviceTokens.token })
      .from(deviceTokens)
      .where(inArray(deviceTokens.userId, userIds));

    return records.map((r) => r.token);
  }
}
