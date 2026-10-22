import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { notifications, Notification, NewNotification } from '../../../database/schema';
import { generateUlid } from '../../../database/utils/ulid.util';

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async create(
    data: {
      userId: string;
      type: string;
      title: string;
      body: string;
      referenceType?: string | null;
      referenceId?: string | null;
      data?: Record<string, any> | null;
      sentPush?: boolean;
      sentEmail?: boolean;
    },
    tx?: any,
  ): Promise<Notification> {
    const client = tx || this.db;
    const id = generateUlid();

    await client.insert(notifications).values({
      id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      referenceType: data.referenceType || null,
      referenceId: data.referenceId || null,
      data: data.data || null,
      isRead: false,
      sentPush: data.sentPush ?? false,
      sentEmail: data.sentEmail ?? false,
    });

    const results = await client
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return results[0]!;
  }

  async findById(id: string): Promise<Notification | null> {
    const results = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByUserId(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number; offset?: number } = {},
  ): Promise<{ items: Notification[]; total: number }> {
    const { unreadOnly = false, limit = 20, offset = 0 } = options;

    const condition = unreadOnly
      ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      : eq(notifications.userId, userId);

    const items = await this.db
      .select()
      .from(notifications)
      .where(condition)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(condition);

    const total = Number(countResult[0]?.count || 0);

    return { items, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return Number(result[0]?.count || 0);
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    const affected = (result as any)?.[0]?.affectedRows ?? 1;
    return affected > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return Number((result as any)?.[0]?.affectedRows || 0);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    const affected = (result as any)?.[0]?.affectedRows ?? 1;
    return affected > 0;
  }

  async createBatch(
    items: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      referenceType?: string | null;
      referenceId?: string | null;
      data?: Record<string, any> | null;
      sentPush?: boolean;
      sentEmail?: boolean;
    }>,
  ): Promise<number> {
    if (!items || items.length === 0) return 0;

    const values = items.map((item) => ({
      id: generateUlid(),
      userId: item.userId,
      type: item.type,
      title: item.title,
      body: item.body,
      referenceType: item.referenceType || null,
      referenceId: item.referenceId || null,
      data: item.data || null,
      isRead: false,
      sentPush: item.sentPush ?? false,
      sentEmail: item.sentEmail ?? false,
    }));

    await this.db.insert(notifications).values(values);
    return values.length;
  }
}
