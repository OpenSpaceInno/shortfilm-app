import {
  mysqlTable,
  varchar,
  mysqlEnum,
  datetime,
  text,
  json,
  index,
} from 'drizzle-orm/mysql-core';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { timestamps } from './common';
import { users } from './identity.schema';

/**
 * GDPR Data Subject Request Types
 */
export const GdprRequestTypeEnum = ['ERASURE', 'EXPORT', 'RESTRICTION'] as const;
export type GdprRequestType = (typeof GdprRequestTypeEnum)[number];

/**
 * GDPR Data Subject Request Statuses
 */
export const GdprRequestStatusEnum = [
  'PENDING',
  'IN_GRACE_PERIOD',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
] as const;
export type GdprRequestStatus = (typeof GdprRequestStatusEnum)[number];

/**
 * ============================================================================
 * GDPR REQUESTS TABLE (M29)
 * Manages Article 17 (Right to Erasure) & Article 20 (Data Portability) compliance
 * Ref: 26_DATA_RETENTION.md & 28_DATA_RETENTION.md
 * ============================================================================
 */
export const gdprRequests = mysqlTable(
  'gdpr_requests',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    requestType: mysqlEnum('request_type', GdprRequestTypeEnum).notNull(),
    status: mysqlEnum('status', GdprRequestStatusEnum).notNull().default('PENDING'),
    gracePeriodEndsAt: datetime('grace_period_ends_at', { mode: 'date', fsp: 3 }),
    reason: text('reason'),
    anonymizedEmail: varchar('anonymized_email', { length: 255 }),
    exportUrl: varchar('export_url', { length: 500 }),
    metadata: json('metadata').$type<Record<string, any>>(),
    processedBy: foreignUlid('processed_by').references(() => users.id, { onDelete: 'set null' }),
    processedAt: datetime('processed_at', { mode: 'date', fsp: 3 }),
    ...timestamps,
  },
  (table) => ({
    idxGdprUser: index('idx_gdpr_user').on(table.userId),
    idxGdprStatus: index('idx_gdpr_status').on(table.status),
    idxGdprCreated: index('idx_gdpr_created').on(table.createdAt),
  }),
);

export type GdprRequest = typeof gdprRequests.$inferSelect;
export type InsertGdprRequest = typeof gdprRequests.$inferInsert;
