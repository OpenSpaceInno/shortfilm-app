import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';
import { webhookEvents, WebhookEvent, NewWebhookEvent } from '../../../database/schema';

@Injectable()
export class WebhookEventsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly dbService: DatabaseService) {}

  private get db() {
    return this.dbService.getDb();
  }

  async findByEventId(provider: string, eventId: string): Promise<WebhookEvent | null> {
    const results = await this.db
      .select()
      .from(webhookEvents)
      .where(and(eq(webhookEvents.provider, provider), eq(webhookEvents.eventId, eventId)))
      .limit(1);

    return results[0] || null;
  }

  async create(data: NewWebhookEvent): Promise<WebhookEvent> {
    await this.db.insert(webhookEvents).values(data);
    const created = await this.findByEventId(data.provider, data.eventId);
    return created!;
  }

  async markProcessed(id: string): Promise<void> {
    await this.db
      .update(webhookEvents)
      .set({ status: 'PROCESSED', processedAt: new Date() })
      .where(eq(webhookEvents.id, id));
  }

  async markFailed(id: string): Promise<void> {
    await this.db
      .update(webhookEvents)
      .set({ status: 'FAILED' })
      .where(eq(webhookEvents.id, id));
  }
}
