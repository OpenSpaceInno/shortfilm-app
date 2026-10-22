import { ApiProperty } from '@nestjs/swagger';

export class EntitlementFeatureComparisonDto {
  @ApiProperty({ description: 'Feature key identifier', example: 'premium_episodes' })
  featureKey: string;

  @ApiProperty({ description: 'Display name of feature', example: 'Premium Episodes' })
  featureName: string;

  @ApiProperty({ description: 'Category grouping', example: 'Streaming & Playback' })
  category: string;

  @ApiProperty({ description: 'Detailed feature description' })
  description: string;

  @ApiProperty({ description: 'Value or capability granted in Free tier', example: 'First 2 episodes only' })
  freeTier: string;

  @ApiProperty({ description: 'Value or capability granted in VIP Monthly tier', example: 'Unlimited all episodes' })
  vipMonthlyTier: string;

  @ApiProperty({ description: 'Value or capability granted in VIP Annual tier', example: 'Unlimited all episodes' })
  vipAnnualTier: string;

  @ApiProperty({ description: 'Value or capability granted in Student tier', example: 'Unlimited all episodes' })
  studentTier: string;

  @ApiProperty({ description: 'Status of this entitlement rule', enum: ['Active', 'Draft'] })
  status: 'Active' | 'Draft';
}

export class EntitlementMatrixResponseDto {
  @ApiProperty({ description: 'List of entitlement feature comparison rows', type: [EntitlementFeatureComparisonDto] })
  features: EntitlementFeatureComparisonDto[];

  @ApiProperty({ description: 'Total active entitlement features tracked' })
  totalFeatures: number;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}
