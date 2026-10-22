import {
  mysqlTable,
  varchar,
  mysqlEnum,
  datetime,
  text,
  decimal,
  int,
  boolean,
  json,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { timestamps } from './common';
import { users } from './identity.schema';

export const PlanTierEnum = ['FREE', 'VIP', 'STUDENT', 'LIFETIME'] as const;
export type PlanTier = (typeof PlanTierEnum)[number];

export const BillingIntervalEnum = ['MONTHLY', 'ANNUAL', 'LIFETIME', 'FREE'] as const;
export type BillingInterval = (typeof BillingIntervalEnum)[number];

export const SubscriptionStatusEnum = [
  'TRIAL',
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
  'EXPIRED',
] as const;
export type SubscriptionStatus = (typeof SubscriptionStatusEnum)[number];

export const PaymentProviderEnum = ['MANUAL', 'RAZORPAY', 'STRIPE', 'APPLE_IAP', 'GOOGLE_PLAY'] as const;
export type PaymentProvider = (typeof PaymentProviderEnum)[number];

/**
 * Feature Entitlement Matrix Definition
 */
export interface FeatureEntitlementMatrix {
  unlimitedEpisodes: boolean;
  adFree: boolean;
  maxResolution: '720p' | '1080p' | '4K';
  earlyAccessHours: number;
  exclusiveChoices: boolean;
  predictionXpMultiplier: number;
  maxConcurrentDevices: number;
  offlineDownloads: boolean;
  bonusFeatures?: string[];
}

/**
 * Subscription Plans Catalog Table
 */
export const subscriptionPlans = mysqlTable(
  'subscription_plans',
  {
    id: primaryUlidKey('id'),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique('uq_plan_slug'),
    tier: mysqlEnum('tier', PlanTierEnum).notNull().default('VIP'),
    description: text('description'),
    priceMonthly: decimal('price_monthly', { precision: 12, scale: 2 }).notNull().default('0.00'),
    priceAnnually: decimal('price_annually', { precision: 12, scale: 2 }),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    billingInterval: mysqlEnum('billing_interval', BillingIntervalEnum).notNull().default('MONTHLY'),
    trialDays: int('trial_days').notNull().default(0),
    features: json('features').$type<string[]>(),
    entitlementMatrix: json('entitlement_matrix').$type<FeatureEntitlementMatrix>(),
    isActive: boolean('is_active').notNull().default(true),
    isPopular: boolean('is_popular').notNull().default(false),
    sortOrder: int('sort_order').notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    tierIdx: index('idx_sp_tier').on(table.tier),
    activeIdx: index('idx_sp_active').on(table.isActive),
    intervalIdx: index('idx_sp_interval').on(table.billingInterval),
  }),
);

/**
 * User Subscriptions Table
 */
export const subscriptions = mysqlTable(
  'subscriptions',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    planId: foreignUlid('plan_id')
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: 'restrict' }),
    status: mysqlEnum('status', SubscriptionStatusEnum).notNull().default('TRIAL'),
    billingInterval: mysqlEnum('billing_interval', BillingIntervalEnum).notNull().default('MONTHLY'),
    provider: varchar('provider', { length: 50 }).notNull().default('MANUAL'),
    providerSubId: varchar('provider_sub_id', { length: 255 }),
    currentPeriodStart: datetime('current_period_start', { mode: 'date', fsp: 3 }),
    currentPeriodEnd: datetime('current_period_end', { mode: 'date', fsp: 3 }),
    gracePeriodEnd: datetime('grace_period_end', { mode: 'date', fsp: 3 }),
    cancelledAt: datetime('cancelled_at', { mode: 'date', fsp: 3 }),
    ...timestamps,
  },
  (table) => ({
    userStatusIdx: index('idx_sub_user_status').on(table.userId, table.status),
    planIdx: index('idx_sub_plan').on(table.planId),
    periodEndIdx: index('idx_sub_period_end').on(table.currentPeriodEnd),
  }),
);

/**
 * Entitlements Table (Derived & auditable user access rights)
 */
export const entitlements = mysqlTable(
  'entitlements',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    planId: foreignUlid('plan_id').references(() => subscriptionPlans.id, { onDelete: 'set null' }),
    entitlementCode: varchar('entitlement_code', { length: 50 }).notNull(),
    source: varchar('source', { length: 50 }).notNull().default('SUBSCRIPTION'),
    expiresAt: datetime('expires_at', { mode: 'date', fsp: 3 }),
    isActive: boolean('is_active').notNull().default(true),
    metadata: json('metadata').$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => ({
    userCodeActiveIdx: index('idx_ent_user_code_active').on(
      table.userId,
      table.entitlementCode,
      table.isActive,
    ),
    expiresIdx: index('idx_ent_expires').on(table.expiresAt),
  }),
);

export const PaymentTransactionStatusEnum = ['PENDING', 'PROCESSED', 'FAILED', 'REFUNDED'] as const;
export type PaymentTransactionStatus = (typeof PaymentTransactionStatusEnum)[number];

/**
 * Payment Transactions Ledger Table
 */
export const paymentTransactions = mysqlTable(
  'payment_transactions',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    subscriptionId: foreignUlid('subscription_id').references(() => subscriptions.id, {
      onDelete: 'set null',
    }),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).unique('uq_pt_idempotency'),
    provider: varchar('provider', { length: 50 }).notNull().default('MANUAL'),
    externalTransactionId: varchar('external_transaction_id', { length: 255 }),
    externalEventId: varchar('external_event_id', { length: 255 }),
    eventType: varchar('event_type', { length: 100 }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    status: mysqlEnum('status', PaymentTransactionStatusEnum).notNull().default('PENDING'),
    payloadJson: json('payload_json').$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (table) => ({
    userIdx: index('idx_pt_user').on(table.userId),
    subIdx: index('idx_pt_sub').on(table.subscriptionId),
    statusIdx: index('idx_pt_status').on(table.status),
    providerIdx: index('idx_pt_provider').on(table.provider),
  }),
);

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Entitlement = typeof entitlements.$inferSelect;
export type NewEntitlement = typeof entitlements.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;
