import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus, BillingInterval, PlanTier } from '../../../database/schema';
import { SubscriptionPlanResponseDto } from './subscription-plan-response.dto';

export class UserEntitlementDto {
  @ApiProperty({ example: 'VIP_ACCESS' })
  code: string;

  @ApiProperty({ example: 'SUBSCRIPTION' })
  source: string;

  @ApiPropertyOptional({ example: '2026-11-10T00:00:00.000Z' })
  expiresAt?: Date | null;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class CurrentSubscriptionResponseDto {
  @ApiProperty({ description: 'Whether user currently possesses VIP access privileges' })
  isVip: boolean;

  @ApiProperty({ description: 'Overall subscription status', enum: ['NONE', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'] })
  status: SubscriptionStatus | 'NONE';

  @ApiPropertyOptional({ description: 'Active plan code or tier', enum: ['FREE', 'VIP', 'STUDENT', 'LIFETIME'] })
  tier?: PlanTier;

  @ApiPropertyOptional({ description: 'Active plan display name', example: 'VIP Annual' })
  planName?: string;

  @ApiPropertyOptional({ description: 'Active subscription ID' })
  subscriptionId?: string;

  @ApiPropertyOptional({ description: 'Active plan details', type: SubscriptionPlanResponseDto })
  plan?: SubscriptionPlanResponseDto;

  @ApiPropertyOptional({ description: 'Current billing interval', enum: ['MONTHLY', 'ANNUAL', 'LIFETIME', 'FREE'] })
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({ description: 'Period start timestamp' })
  currentPeriodStart?: Date | null;

  @ApiPropertyOptional({ description: 'Period end/renewal timestamp' })
  currentPeriodEnd?: Date | null;

  @ApiPropertyOptional({ description: 'Grace period end timestamp (if in PAST_DUE)' })
  gracePeriodEnd?: Date | null;

  @ApiPropertyOptional({ description: 'Whether cancellation has been scheduled' })
  isCancelled?: boolean;

  @ApiProperty({ description: 'Active list of granted feature entitlements', type: [UserEntitlementDto] })
  entitlements: UserEntitlementDto[];
}
