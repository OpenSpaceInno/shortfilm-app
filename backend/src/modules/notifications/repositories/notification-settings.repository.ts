import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import {
  userNotificationSettings,
  UserNotificationSettings,
} from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class NotificationSettingsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async getSettings(userId: string): Promise<UserNotificationSettings> {
    const existing = await this.db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, userId))
      .limit(1);

    if (existing && existing.length > 0) {
      return existing[0]!;
    }

    const id = generateUlid();
    await this.db.insert(userNotificationSettings).values({
      id,
      userId,
      inAppEnabled: true,
      pushEnabled: true,
      emailEnabled: true,
      episodesEnabled: true,
      votingEnabled: true,
      streaksEnabled: true,
      rewardsEnabled: true,
      marketingEnabled: false,
    });

    const created = await this.db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.id, id))
      .limit(1);

    return created[0]!;
  }

  async updateSettings(
    userId: string,
    updates: Partial<{
      inAppEnabled: boolean;
      pushEnabled: boolean;
      emailEnabled: boolean;
      episodesEnabled: boolean;
      votingEnabled: boolean;
      streaksEnabled: boolean;
      rewardsEnabled: boolean;
      marketingEnabled: boolean;
    }>,
  ): Promise<UserNotificationSettings> {
    // Ensure settings record exists
    await this.getSettings(userId);

    await this.db
      .update(userNotificationSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userNotificationSettings.userId, userId));

    const updated = await this.db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, userId))
      .limit(1);

    return updated[0]!;
  }
}
