import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeatureEntitlementMatrix, PlanTier, BillingInterval } from '../../../database/schema';

export class FeatureEntitlementMatrixDto {
  @ApiProperty({ description: 'Whether all premium episodes are unlocked' })
  unlimitedEpisodes: boolean;

  @ApiProperty({ description: 'Whether ad-free uninterrupted playback is enabled' })
  adFree: boolean;

  @ApiProperty({ description: 'Maximum supported playback resolution', enum: ['720p', '1080p', '4K'] })
  maxResolution: '720p' | '1080p' | '4K';

  @ApiProperty({ description: 'Hours of early access before public drop' })
  earlyAccessHours: number;

  @ApiProperty({ description: 'Exclusive interactive choice branches & director cuts unlocked' })
  exclusiveChoices: boolean;

  @ApiProperty({ description: 'XP multiplier on community narrative predictions' })
  predictionXpMultiplier: number;

  @ApiProperty({ description: 'Maximum concurrent streaming devices' })
  maxConcurrentDevices: number;

  @ApiProperty({ description: 'Offline video downloads permitted' })
  offlineDownloads: boolean;

  @ApiPropertyOptional({ description: 'Additional bonus perks and perks list', type: [String] })
  bonusFeatures?: string[];
}

export class SubscriptionPlanResponseDto {
  @ApiProperty({ description: 'Unique ULID identifier of the plan' })
  id: string;

  @ApiProperty({ description: 'Display name of the subscription plan' })
  name: string;

  @ApiProperty({ description: 'Unique URL slug identifier of the plan' })
  slug: string;

  @ApiProperty({ description: 'Plan tier categorization', enum: ['FREE', 'VIP', 'STUDENT', 'LIFETIME'] })
  tier: PlanTier;

  @ApiPropertyOptional({ description: 'Plan description summary' })
  description?: string | null;

  @ApiProperty({ description: 'Monthly price in base currency decimal' })
  priceMonthly: number;

  @ApiPropertyOptional({ description: 'Annual upfront price in base currency decimal' })
  priceAnnually?: number | null;

  @ApiProperty({ description: 'ISO 4217 Currency code', default: 'INR' })
  currency: string;

  @ApiProperty({ description: 'Billing recurrence interval', enum: ['MONTHLY', 'ANNUAL', 'LIFETIME', 'FREE'] })
  billingInterval: BillingInterval;

  @ApiProperty({ description: 'Free trial duration in days' })
  trialDays: number;

  @ApiProperty({ description: 'Bullet perks visible on sales cards', type: [String] })
  features: string[];

  @ApiProperty({ description: 'Granular feature entitlement enforcement matrix', type: FeatureEntitlementMatrixDto })
  entitlementMatrix: FeatureEntitlementMatrixDto;

  @ApiProperty({ description: 'Whether plan is currently purchasable' })
  isActive: boolean;

  @ApiProperty({ description: 'Highlighted badge for recommended plan' })
  isPopular: boolean;

  @ApiProperty({ description: 'Catalog display sequence' })
  sortOrder: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
