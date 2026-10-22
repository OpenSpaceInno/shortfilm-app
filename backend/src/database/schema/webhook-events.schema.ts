import {
  mysqlTable,
  varchar,
  mysqlEnum,
  datetime,
  json,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { primaryUlidKey } from './custom-types';

export const WebhookEventStatusEnum = ['RECEIVED', 'PROCESSED', 'FAILED'] as const;
export type WebhookEventStatus = (typeof WebhookEventStatusEnum)[number];

/**
 * Webhook Events table - idempotent tracking of external callbacks (Cloudflare, Stripe, Razorpay)
 */
export const webhookEvents = mysqlTable(
  'webhook_events',
  {
    id: primaryUlidKey('id'),
    provider: varchar('provider', { length: 50 }).notNull(),
    eventId: varchar('event_id', { length: 255 }).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: json('payload').notNull(),
    status: mysqlEnum('status', WebhookEventStatusEnum).default('RECEIVED').notNull(),
    processedAt: datetime('processed_at', { mode: 'date', fsp: 3 }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    uqWebhookEvent: uniqueIndex('uq_webhook_event').on(table.provider, table.eventId),
  }),
);

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
