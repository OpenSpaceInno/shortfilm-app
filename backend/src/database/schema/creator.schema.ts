import {
  mysqlTable,
  varchar,
  mysqlEnum,
  datetime,
  text,
  json,
  boolean,
  decimal,
  date,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { primaryUlidKey, foreignUlid } from './custom-types';
import { timestamps } from './common';
import { users } from './identity.schema';
import { stories } from './content.schema';
import { storyVersions } from './interactive.schema';

export const CreatorTierEnum = ['EMERGING', 'VERIFIED', 'EXCLUSIVE', 'PARTNER'] as const;
export type CreatorTier = (typeof CreatorTierEnum)[number];

export const SubmissionTypeEnum = [
  'FULL_SERIES',
  'INTERACTIVE_PILOT',
  'SEASON_PITCH',
  'SPECIAL_EPISODE',
] as const;
export type SubmissionType = (typeof SubmissionTypeEnum)[number];

export const SubmissionStatusEnum = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
] as const;
export type SubmissionStatus = (typeof SubmissionStatusEnum)[number];

export const CreatorStatusEnum = [
  'APPLIED',
  'UNDER_REVIEW',
  'APPROVED',
  'VERIFIED',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED',
  'DEACTIVATED',
] as const;
export type CreatorStatus = (typeof CreatorStatusEnum)[number];

export const ApplicationStatusEnum = [
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED',
] as const;
export type ApplicationStatus = (typeof ApplicationStatusEnum)[number];

export const VerificationStatusEnum = [
  'NOT_VERIFIED',
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
] as const;
export type VerificationStatus = (typeof VerificationStatusEnum)[number];

/**
 * Creators table - creator profile, status, and verification
 */
export const creators = mysqlTable(
  'creators',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' })
      .unique('uq_creator_user'),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    bio: text('bio'),
    tier: mysqlEnum('tier', CreatorTierEnum).default('EMERGING').notNull(),
    status: mysqlEnum('status', CreatorStatusEnum).default('APPLIED').notNull(),
    verifiedAt: datetime('verified_at', { mode: 'date', fsp: 3 }),
    suspensionReason: text('suspension_reason'),
    suspensionDate: datetime('suspension_date', { mode: 'date', fsp: 3 }),
    ...timestamps,
  },
  (table) => ({
    idxCreatorStatus: index('idx_creator_status').on(table.status),
    idxCreatorTier: index('idx_creator_tier').on(table.tier),
  }),
);

export type Creator = typeof creators.$inferSelect;
export type NewCreator = typeof creators.$inferInsert;

/**
 * Creator Profiles table - extended branding, media, and social details
 */
export const creatorProfiles = mysqlTable(
  'creator_profiles',
  {
    id: primaryUlidKey('id'),
    creatorId: foreignUlid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' })
      .unique('uq_creator_profile_creator'),
    tagline: varchar('tagline', { length: 255 }),
    bio: text('bio'),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    coverImageUrl: varchar('cover_image_url', { length: 500 }),
    location: varchar('location', { length: 100 }),
    category: varchar('category', { length: 100 }),
    genres: json('genres').$type<string[]>(),
    languages: json('languages').$type<string[]>(),
    experience: text('experience'),
    portfolioUrl: varchar('portfolio_url', { length: 500 }),
    websiteUrl: varchar('website_url', { length: 500 }),
    socialLinks: json('social_links').$type<Record<string, string>>(),
    isFeatured: boolean('is_featured').notNull().default(false),
    isRising: boolean('is_rising').notNull().default(false),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    idxProfileCategory: index('idx_profile_category').on(table.category),
    idxProfileFeatured: index('idx_profile_featured').on(table.isFeatured),
  }),
);

export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type NewCreatorProfile = typeof creatorProfiles.$inferInsert;

/**
 * Creator Applications table - onboarding review pipeline
 */
export const creatorApplications = mysqlTable(
  'creator_applications',
  {
    id: primaryUlidKey('id'),
    userId: foreignUlid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    applicantName: varchar('applicant_name', { length: 100 }).notNull(),
    creatorName: varchar('creator_name', { length: 100 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    genres: json('genres').$type<string[]>(),
    languages: json('languages').$type<string[]>(),
    bio: text('bio'),
    location: varchar('location', { length: 100 }),
    experience: text('experience'),
    portfolioUrl: varchar('portfolio_url', { length: 500 }),
    proposedStory: json('proposed_story').$type<Record<string, any>>(),
    status: mysqlEnum('status', ApplicationStatusEnum).notNull().default('PENDING'),
    reviewerId: foreignUlid('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    reviewerNotes: text('reviewer_notes'),
    reviewedAt: datetime('reviewed_at', { mode: 'date', fsp: 3 }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    idxAppStatus: index('idx_app_status').on(table.status),
    idxAppUser: index('idx_app_user').on(table.userId),
  }),
);

export type CreatorApplication = typeof creatorApplications.$inferSelect;
export type NewCreatorApplication = typeof creatorApplications.$inferInsert;

/**
 * Creator Verifications table - official badge KYC verification requests
 */
export const creatorVerifications = mysqlTable(
  'creator_verifications',
  {
    id: primaryUlidKey('id'),
    creatorId: foreignUlid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' }),
    status: mysqlEnum('status', VerificationStatusEnum).notNull().default('PENDING'),
    documentType: varchar('document_type', { length: 50 }),
    documentUrl: varchar('document_url', { length: 500 }),
    verifiedBy: foreignUlid('verified_by').references(() => users.id, { onDelete: 'set null' }),
    reviewerNotes: text('reviewer_notes'),
    verifiedAt: datetime('verified_at', { mode: 'date', fsp: 3 }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    idxVerifStatus: index('idx_verif_status').on(table.status),
    idxVerifCreator: index('idx_verif_creator').on(table.creatorId),
  }),
);

export type CreatorVerification = typeof creatorVerifications.$inferSelect;
export type NewCreatorVerification = typeof creatorVerifications.$inferInsert;

/**
 * Creator Internal Notes table - internal administrative and moderation commentary
 */
export const creatorInternalNotes = mysqlTable(
  'creator_internal_notes',
  {
    id: primaryUlidKey('id'),
    creatorId: foreignUlid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' }),
    authorId: foreignUlid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    note: text('note').notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    idxNoteCreator: index('idx_note_creator').on(table.creatorId),
  }),
);

export type CreatorInternalNote = typeof creatorInternalNotes.$inferSelect;
export type NewCreatorInternalNote = typeof creatorInternalNotes.$inferInsert;

/**
 * Creator Submissions table - story submissions and version review queue
 */
export const creatorSubmissions = mysqlTable(
  'creator_submissions',
  {
    id: primaryUlidKey('id'),
    creatorId: foreignUlid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' }),
    storyId: foreignUlid('story_id').references(() => stories.id, { onDelete: 'set null' }),
    storyVersionId: foreignUlid('story_version_id').references(() => storyVersions.id, { onDelete: 'set null' }),
    submissionType: mysqlEnum('submission_type', SubmissionTypeEnum)
      .notNull()
      .default('FULL_SERIES'),
    title: varchar('title', { length: 255 }).notNull(),
    synopsis: text('synopsis'),
    scriptUrl: varchar('script_url', { length: 500 }),
    videoPreviewUrl: varchar('video_preview_url', { length: 500 }),
    status: mysqlEnum('status', SubmissionStatusEnum).notNull().default('DRAFT'),
    storyInfo: json('story_info').$type<Record<string, any>>(),
    contentPreview: json('content_preview').$type<Record<string, any>>(),
    checklist: json('checklist').$type<Record<string, any>>(),
    reviewerId: foreignUlid('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    reviewerNotes: text('reviewer_notes'),
    reviewedAt: datetime('reviewed_at', { mode: 'date', fsp: 3 }),
    submittedAt: datetime('submitted_at', { mode: 'date', fsp: 3 }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    idxSubCreator: index('idx_sub_creator').on(table.creatorId),
    idxSubStatus: index('idx_sub_status').on(table.status),
    idxSubStory: index('idx_sub_story').on(table.storyId),
    idxSubVersion: index('idx_sub_version').on(table.storyVersionId),
    idxSubType: index('idx_sub_type').on(table.submissionType),
  }),
);

export type CreatorSubmission = typeof creatorSubmissions.$inferSelect;
export type NewCreatorSubmission = typeof creatorSubmissions.$inferInsert;

export const CreatorEarningsStatusEnum = [
  'CALCULATED',
  'PENDING_PAYOUT',
  'PAID',
  'HELD',
] as const;
export type CreatorEarningsStatus = (typeof CreatorEarningsStatusEnum)[number];

/**
 * Creator Earnings table - monthly financial settlement ledger
 */
export const creatorEarnings = mysqlTable(
  'creator_earnings',
  {
    id: primaryUlidKey('id'),
    creatorId: foreignUlid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'restrict' }),
    periodMonth: date('period_month', { mode: 'string' }).notNull(),
    grossAmount: decimal('gross_amount', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    platformFee: decimal('platform_fee', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    taxWithheld: decimal('tax_withheld', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    netPayout: decimal('net_payout', { precision: 12, scale: 2 })
      .notNull()
      .default('0.00'),
    currency: varchar('currency', { length: 10 }).notNull().default('INR'),
    status: mysqlEnum('status', CreatorEarningsStatusEnum)
      .notNull()
      .default('CALCULATED'),
    holdReason: varchar('hold_reason', { length: 255 }),
    payoutReference: varchar('payout_reference', { length: 100 }),
    metadata: json('metadata').$type<Record<string, any>>(),
    paidAt: datetime('paid_at', { mode: 'date', fsp: 3 }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    uqEarningsPeriod: uniqueIndex('uq_earnings_period').on(
      table.creatorId,
      table.periodMonth,
    ),
    idxEarningsCreator: index('idx_ce_creator').on(table.creatorId),
    idxEarningsStatus: index('idx_ce_status').on(table.status),
    idxEarningsPeriod: index('idx_ce_period').on(table.periodMonth),
  }),
);

export type CreatorEarnings = typeof creatorEarnings.$inferSelect;
export type NewCreatorEarnings = typeof creatorEarnings.$inferInsert;

